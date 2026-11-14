const folder='assets/quest-medal-limited/';
export const QUEST_MEDAL_SKIN={id:'quest_library_keeper',name:'星読みの司書',gender:'female',job:'司書',desc:'星の本を読み解き、物語の世界を守る司書。クエストメダル交換所限定。',image:folder+'skin.png',gachaOnly:true,rewardSource:'quest-medal'};
export const QUEST_MEDAL_BACKGROUND={id:'quest_star_library',name:'夜の星読み図書館',image:folder+'background.png',color:'#182a46',rewardSource:'quest-medal'};
export const QUEST_MEDAL_FRAME={id:'quest_book_quill_frame',name:'星の本と羽根ペンのフレーム',image:folder+'frame.png',source:'quest-medal'};
export const QUEST_MEDAL_EQUIPMENT=[
  {id:'quest_quill_blade',name:'星詠みの羽根剣',slot:'weapon',opTier:'add3',stat:{atk:7,spd:1},cost:4,fixedCost:true,emoji:folder+'weapon.png',ability:'crit_up'},
  {id:'quest_archivist_robe',name:'大司書のローブ',slot:'armor',opTier:'add3',stat:{def:6,hp:8},cost:4,fixedCost:true,emoji:folder+'armor.png',ability:'guard'},
  {id:'quest_wisdom_bookmark',name:'知恵のしおり',slot:'accessory',opTier:'add3',stat:{mp:8,spd:2},cost:4,fixedCost:true,emoji:folder+'accessory.png',ability:'mp_save'},
];
export const QUEST_MEDAL_EXCLUSIVE_PRIZES=[
  {key:'exclusive_book_frame',medals:160,kind:'decoration',id:QUEST_MEDAL_FRAME.id,label:QUEST_MEDAL_FRAME.name,image:QUEST_MEDAL_FRAME.image},
  {key:'exclusive_star_library',medals:320,kind:'background',id:QUEST_MEDAL_BACKGROUND.id,label:QUEST_MEDAL_BACKGROUND.name,image:QUEST_MEDAL_BACKGROUND.image},
  {key:'exclusive_library_keeper',medals:480,kind:'skin',id:QUEST_MEDAL_SKIN.id,label:QUEST_MEDAL_SKIN.name,image:QUEST_MEDAL_SKIN.image},
  ...QUEST_MEDAL_EQUIPMENT.map((e,i)=>({key:'exclusive_'+e.id,medals:[640,800,960][i],kind:'equip',id:e.id,label:e.name,image:e.emoji,rarity:5,ability:e.ability})),
].map(p=>Object.freeze({...p,exclusive:true}));

// Milestone exchange: medals are retained, and each reward can be received once.
export function claimQuestMedalExclusive(game,key){
  const prize=QUEST_MEDAL_EXCLUSIVE_PRIZES.find(p=>p.key===key);
  if(!game||!prize||!Number.isSafeInteger(Number(game.questMedals))||Number(game.questMedals)<prize.medals)return null;
  const claims=game.questMedalExchanged;
  if(claims!=null&&(typeof claims!=='object'||Array.isArray(claims)))return null;
  if(claims?.[key])return null;
  const field={skin:'unlockedSkins',background:'unlockedAvatarBackgrounds',decoration:'unlockedDecorations',equip:'ownedEquips'}[prize.kind];
  if(game[field]!=null&&!Array.isArray(game[field]))return null;
  if(prize.kind==='equip'&&(!Number.isSafeInteger(game.nextUid)||game.nextUid<1||game.nextUid>=Number.MAX_SAFE_INTEGER))return null;
  const existing=game[field]||[];
  if(prize.kind==='equip'){
    if(!existing.some(e=>e.id===prize.id&&e.rarity===prize.rarity))game[field]=[...existing,{uid:game.nextUid++,id:prize.id,rarity:prize.rarity,ability:prize.ability}];
  }else game[field]=[...new Set([...existing,prize.id])];
  game.questMedalExchanged={...(claims||{}),[key]:true};
  return {kind:prize.kind,name:prize.label,icon:prize.image,rarity:prize.rarity,ability:prize.ability};
}
