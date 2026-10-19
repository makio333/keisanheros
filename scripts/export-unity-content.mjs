// Read-only extraction of Web content. No browser, Firebase or player saves are used.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {getAcceptedKanjiReadings} from '../kanji_readings.js';
import {EVENT_RAID_RULES,EVENT_RAID_BONUSES} from '../event_raid.js';
import {eventEquipmentAbility} from '../event_equipment.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(process.argv[2]||path.join(root,'unity-port/Assets/LegendHeroes/Resources/LegendHeroes'));
const source=fs.readFileSync(path.join(root,'game.js'),'utf8');
// Sampling must be reproducible, including the order of kana distractors.
let sampleSeed=0x4c484552;
const sampleRandom=()=>{sampleSeed=(Math.imul(sampleSeed,1664525)+1013904223)>>>0;return sampleSeed/4294967296;};
const sampleMath=Object.create(Math);sampleMath.random=sampleRandom;
const context=vm.createContext({Math:sampleMath,console,window:{},rnd:(a,b)=>Math.floor(sampleRandom()*(b-a+1))+a,pick:a=>a[Math.floor(sampleRandom()*a.length)],clamp:(x,a,b)=>Math.max(a,Math.min(b,x))});
vm.runInContext(fs.readFileSync(path.join(root,'kanji_data.js'),'utf8'),context);
function declaration(name){const re=new RegExp('(?:const|let) '+name+'\\s*=');const m=re.exec(source);if(!m)throw Error('Missing '+name);let i=m.index+m[0].length;while(/\s/.test(source[i]))i++;const start=i;const open=source[i],close=open==='['?']':'}';let depth=0,quote='',escaped=false,line=false,block=false;for(;i<source.length;i++){const c=source[i],n=source[i+1];if(line){if(c==='\n')line=false;continue;}if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote='';continue;}if(c==='/'&&n==='/'){line=true;i++;continue;}if(c==='/'&&n==='*'){block=true;i++;continue;}if(['"',"'",'`'].includes(c)){quote=c;continue;}if(c===open)depth++;if(c===close&&!--depth)return source.slice(start,i+1);}throw Error('Unclosed '+name);}
// Functions remain in their original JS form during export, preserving all stage conditions.
vm.runInContext(source.slice(source.indexOf('function generateProblem(tier)'),source.indexOf('/* 1つの ステージ')),context);
for(const name of ['HERO_AVATARS','AVATAR_BACKGROUNDS','AVATAR_DECORATIONS','EQUIP_DB','ANCIENT_EQUIP_DB','LIMITED_EQUIP_DB','HALLOWEEN_EQUIP_DB','ITEM_DB','ENEMIES_TOWER','ENEMIES_DUNGEON','ENEMIES_CRYPT','ENEMIES_BANDIT','BOSSES','AREA_ENEMY_POOLS','SKILL_DB','SPECIAL_ABILITIES','HALLOWEEN_EVENT','HALLOWEEN_GACHA_PRIZES','HALLOWEEN_EXCHANGE_PRIZES','RAID_EXCHANGE_PRIZES','HALLOWEEN_MONSTERS','BLUEPRINT_DB','REWARD_SETTINGS_DEFAULTS','QUEST_NPCS','STORY_ARCS','QUEST_MEDAL_MILESTONES'])vm.runInContext('globalThis.'+name+'='+declaration(name),context);
vm.runInContext(source.slice(source.indexOf('function createSokuonChoiceProblem('),source.indexOf('function startChallenge(')),context);
const serial=o=>JSON.parse(JSON.stringify(o));
const problem=p=>({options:context.createKanaChoiceProblem(p)?.options||[],explanation:p.explanation||'',text:String(p.text??`${p.a} ${p.op} ${p.b}`),answer:String(p.answer),acceptedAnswers:[...getAcceptedKanjiReadings(p.text,String(p.answer),p.acceptedAnswers||[])],language:typeof p.answer==='string'&&/[\u3040-\u30ff\u3400-\u9fff]/u.test(String(p.answer)),tier:p.tier||'',remainder:p.remainder??-1,prompt:p.prompt||'',wrongAnswer:p.wrongAnswer||''});
const areas=vm.runInContext('AREA_STAGES',context);
const pools={tower:context.ENEMIES_TOWER,dungeon:context.ENEMIES_DUNGEON,crypt:context.ENEMIES_CRYPT,bandit:context.ENEMIES_BANDIT};
const enemy=(e,id)=>{if(!e)throw Error('Missing enemy '+id);return ({...serial(e),id,image:e.emoji?.includes('/')?e.emoji:'',goldMin:e.gold?.[0]||0,goldMax:e.gold?.[1]||0});};
const assetPaths=new Set();
const warnings=[];
const content={schemaVersion:1,sourceHash:crypto.createHash('sha256').update(source).digest('hex'),avatars:serial(context.HERO_AVATARS),backgrounds:serial(context.AVATAR_BACKGROUNDS),frames:serial(context.AVATAR_DECORATIONS),equipment:[...context.EQUIP_DB,...context.ANCIENT_EQUIP_DB,...context.LIMITED_EQUIP_DB,...context.HALLOWEEN_EQUIP_DB].map(e=>({...serial(e),pool:context.EQUIP_DB.includes(e)?"standard":context.LIMITED_EQUIP_DB.includes(e)?"limited":context.ANCIENT_EQUIP_DB.includes(e)?"ancient":"event",image:e.emoji,ability:e.ability||eventEquipmentAbility(e.id)||''})),items:serial([...context.ITEM_DB,...context.BLUEPRINT_DB]).map(e=>({...e,image:e.emoji,effect:e.blueprint?"blueprint":e.effect})),areas:Object.entries(areas).map(([id,a])=>({id,name:a.name,recLv:a.recLv,opLabel:a.opLabel,image:a.bgImage,stages:a.stages.map((s,index)=>{const unique=new Map();for(let i=0;i<512;i++){const p=problem(s.generateProblem());unique.set(p.text+'|'+p.answer,p);}const tier=[...unique.values()][0]?.tier||'';if(tier&&context.window.KANJI_POOLS[tier])for(const raw of context.window.KANJI_POOLS[tier]){const p=problem({...raw,tier});unique.set(p.text+'|'+p.answer,p);}return {index,name:s.name,timeLimit:s.timeLimit,tier,problems:[...unique.values()]};}),bossTimeLimit1:a.bossTimeLimit1,bossTimeLimit2:a.bossTimeLimit2,bossProblems:Array.from({length:128},()=>problem(a.bossPhase1Problem())),bossPhase2Problems:Array.from({length:128},()=>problem(a.bossPhase2Problem())),boss:enemy(context.BOSSES[a.bossKey],a.bossKey),enemies:(context.AREA_ENEMY_POOLS[id]||[{zone:a.enemyZone,key:0}]).filter(r=>{if(pools[r.zone]?.[r.key])return true;warnings.push(id+': invalid enemy reference '+r.zone+'_'+r.key);return false;}).map(r=>enemy(pools[r.zone][r.key],r.zone+'_'+r.key))})),kanjiPools:Object.entries(context.window.KANJI_POOLS).map(([tier,rows])=>({tier,problems:rows.map(p=>problem({...p,tier}))})),skills:serial(context.SKILL_DB).map(e=>({...e,image:e.emoji})),abilities:serial(context.SPECIAL_ABILITIES),halloween:serial(context.HALLOWEEN_EVENT),halloweenGacha:serial(context.HALLOWEEN_GACHA_PRIZES),halloweenExchange:serial(context.HALLOWEEN_EXCHANGE_PRIZES),raidExchange:serial(context.RAID_EXCHANGE_PRIZES),eventRules:EVENT_RAID_RULES,eventBonuses:EVENT_RAID_BONUSES,eventMonsters:serial(context.HALLOWEEN_MONSTERS).map((m,i)=>({...m,image:'assets/halloween/'+m.id+'.png'})),homeImage:'画像/ステージ/拠点.jpg'};
content.rewardSettings=serial(context.REWARD_SETTINGS_DEFAULTS);
content.questNpcs=serial(context.QUEST_NPCS);
content.storyArcs=Object.entries(context.STORY_ARCS).flatMap(([family,arcs])=>arcs.map(arc=>({family,title:arc.title,parts:arc.parts.map(template=>template('{a}','{b}'))})));
content.questMilestones=serial(context.QUEST_MEDAL_MILESTONES);
function collect(o){if(typeof o==='string'&&/\.(png|jpe?g|webp)$/i.test(o))assetPaths.add(o);else if(Array.isArray(o))o.forEach(collect);else if(o&&typeof o==='object')Object.values(o).forEach(collect);}
collect(content);
for(const relative of ['assets/halloween/gacha_logo.png','assets/ui/equipment_gacha_logo.png','assets/ui/background_skin_gacha_logo.png','assets/bg/item_shop.jpg','assets/bg/weapon_shop.jpg','assets/raid/raid_ticket_pixel.png','assets/raid/raid_bg_magma_pixel.jpg','assets/raid/raid_boss_dark_bahamut_blueflame_pixel_v2.png','assets/items/background_skin_ticket.png','assets/items/ancient_blueprint_v2.png'])assetPaths.add(relative);
fs.mkdirSync(path.join(output,'Data'),{recursive:true});
const missing=[];for(const relative of [...assetPaths].sort()){const src=path.join(root,relative);if(!fs.existsSync(src)){missing.push(relative);continue;}const dest=path.join(output,'Art',relative);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(src,dest);}
if(missing.length)throw Error('Missing art: '+missing.join(', '));
fs.writeFileSync(path.join(output,'Data/content.json'),JSON.stringify(content));
for(const name of ['bgm_home.m4a','bgm_title.m4a','bgm_stage1.m4a','bgm_room.m4a','bgm_training.m4a','se_gameover.m4a','se_type.mp3','se_slash.mp3','se_clear.mp3','se_decide.mp3','se_crit.mp3','se_gacha_result.mp3','se_gacha_result2.mp3','bgm_halloween_normal.mp3','bgm_halloween_boss.mp3','bgm_raid_boss.mp3']){const dest=path.join(output,'Audio',name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,'public/assets_audio',name),dest);}
for(const name of ['kanji-reading-sources.html','edrdg-licence.txt'])fs.copyFileSync(path.join(root,'public',name),path.join(output,'Data',name+'.txt'));
const report={schemaVersion:1,sourceHash:content.sourceHash,areas:content.areas.length,stages:content.areas.reduce((n,a)=>n+a.stages.length,0),equipment:content.equipment.length,avatars:content.avatars.length,frames:content.frames.length,kanjiPools:content.kanjiPools.length,images:assetPaths.size,missing,warnings};fs.writeFileSync(path.join(output,'Data/export-report.json'),JSON.stringify(report,null,2));console.log(report);
