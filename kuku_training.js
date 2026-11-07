import './kuku_training.css';

export const KUKU_THREE = [
 ['サンイチガ','サン'],['サンニガ','ロク'],['サザンガ','キュウ'],
 ['サンシ','ジュウニ'],['サンゴ','ジュウゴ'],['サブロク','ジュウハチ'],
 ['サンシチ','ニジュウイチ'],['サンパ','ニジュウシ'],['サンク','ニジュウシチ']
].map(([name,reading],i)=>({id:i+1,power:3,hits:i+1,total:3*(i+1),name,reading}));
export function kukuMastered(state){
 const values=state?.kukuTraining?.three;
 if(!Array.isArray(values))return [];
 // Only a contiguous sequence can unlock the next lesson.
 let count=0;while(count<9&&values.includes(count+1))count++;
 return Array.from({length:count},(_,i)=>i+1);
}
export function learnKuku(state,id,answer){
 const lesson=KUKU_THREE.find(l=>l.id===id);
 if(!lesson||!/^\d+$/.test(String(answer).normalize('NFKC').trim())||Number(String(answer).normalize('NFKC').trim())!==lesson.total)return false;
 const mastered=kukuMastered(state);if(id>mastered.length+1)return false;
 if(!mastered.includes(id))mastered.push(id);
 state.kukuTraining={...state.kukuTraining,version:1,three:mastered};return true;
}

let current=null;
export function closeKukuTraining(){current?.();current=null;}
export function openKukuTraining({getState,onSave,playHit=()=>{},onChange=()=>{}}){
 closeKukuTraining();
 const owner=getState();if(!owner)return;
 const previouslyFocused=document.activeElement;
 const dialog=document.createElement('dialog');dialog.className='kuku-training';dialog.setAttribute('aria-labelledby','kuku-title');
 dialog.innerHTML=`<div class="kuku-shell"><header><div><small>師匠の九九道場</small><h2 id="kuku-title">3のだん・れんぞくぎり</h2></div><button class="btn kuku-close" type="button">× とじる</button></header><div class="kuku-scene"><img class="kuku-mentor" src="assets/lecture-mentor-candidates/01_sword_master.png" alt="白ひげの剣豪の師匠"><div class="kuku-words" aria-live="polite"></div><div class="kuku-target"><img src="画像/training_dummy_transparent.png" alt="しゅぎょう用の木人"><span class="kuku-slash" aria-hidden="true"></span><span class="kuku-impact" aria-hidden="true"></span></div></div><nav class="kuku-lessons" aria-label="おぼえる技"></nav><div class="kuku-play"><h3 class="kuku-name"></h3><p class="kuku-status" role="status"></p><div class="kuku-hits" aria-label="一撃ごとのダメージ"></div><form class="kuku-answer"><label for="kuku-input">ぜんぶで なんダメージ？</label><div><input id="kuku-input" inputmode="numeric" autocomplete="off" maxlength="3" aria-describedby="kuku-feedback"><button class="btn btn-primary" type="submit">こたえる</button></div></form><p id="kuku-feedback" role="status"></p><div class="kuku-actions"><button class="btn kuku-replay" type="button">技をみる</button><button class="btn btn-primary kuku-next" type="button">つぎの技へ</button></div><p class="kuku-progress"></p></div></div>`;
 document.body.append(dialog);
 const $=sel=>dialog.querySelector(sel);
 let lesson=KUKU_THREE[Math.min(kukuMastered(owner).length,8)],phase='ready',generation=0,timers=new Set(),closed=false;
 const valid=()=>!closed&&getState()===owner;
 const delay=(fn,ms)=>{const token=generation;const t=setTimeout(()=>{timers.delete(t);if(valid()&&token===generation)fn();},ms);timers.add(t);};
 function cancel(){generation++;for(const t of timers)clearTimeout(t);timers.clear();$('.kuku-target').classList.remove('hit');}
 function cleanup(){if(closed)return;closed=true;cancel();dialog.close();dialog.remove();if(current===cleanup)current=null;onChange();previouslyFocused?.focus?.();}
 current=cleanup;
 $('.kuku-close').onclick=cleanup;dialog.addEventListener('cancel',e=>{e.preventDefault();cleanup();});
 function progress(){const learned=kukuMastered(owner);$('.kuku-progress').textContent=`3のだんの技 ${learned.length} / 9 しゅうとく${learned.length===9?'　皆伝！ なんどでも おさらいできるよ':''}`;$('.kuku-lessons').replaceChildren(...KUKU_THREE.map(l=>{const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=`${learned.includes(l.id)?'✓ ':''}${l.id}連`;b.disabled=l.id>learned.length+1;b.setAttribute('aria-label',`${l.name} ${l.hits}れんぎり${learned.includes(l.id)?' しゅうとくずみ':''}`);b.setAttribute('aria-current',String(l.id===lesson.id));b.onclick=()=>select(l);return b;}));}
 function select(l){cancel();lesson=l;phase='ready';$('.kuku-name').textContent=l.name+'！';$('.kuku-words').textContent=`1げきは「3」。こんどは ${l.hits}れんぎりじゃ！`;
 $('.kuku-status').textContent=`3ダメージを ${l.hits}かい。まずは 技をみよう。`;
 $('.kuku-hits').replaceChildren();$('.kuku-answer').hidden=true;$('#kuku-feedback').textContent='';$('#kuku-input').value='';$('.kuku-next').hidden=true;$('.kuku-replay').disabled=false;$('.kuku-replay').textContent='技をみる';progress();}
 function replay(){if(!valid()||phase==='playing')return;cancel();phase='playing';$('.kuku-answer').hidden=true;$('.kuku-next').hidden=true;$('.kuku-replay').disabled=true;$('#kuku-feedback').textContent='';$('.kuku-hits').replaceChildren();$('.kuku-words').textContent=lesson.name+'！';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 for(let i=0;i<lesson.hits;i++)delay(()=>{const chip=document.createElement('span');chip.className='kuku-hit-chip';chip.textContent='3';chip.setAttribute('aria-label',`${i+1}げきめ 3ダメージ`);$('.kuku-hits').append(chip);$('.kuku-status').textContent=`${i+1} HIT ／ ${lesson.hits}れんぎり`;
 $('.kuku-target').classList.remove('hit');void $('.kuku-target').offsetWidth;$('.kuku-target').classList.add('hit');$('.kuku-impact').textContent='3';playHit();},i*(reduced?80:280)+80);
 delay(()=>{phase='answer';$('.kuku-target').classList.remove('hit');$('.kuku-answer').hidden=false;$('.kuku-replay').disabled=false;$('.kuku-replay').textContent='もういちど みる';$('.kuku-words').textContent='「3」が いくつあった？ ぜんぶで なんダメージじゃ？';$('#kuku-input').focus();},lesson.hits*(reduced?80:280)+200);}
 $('.kuku-replay').onclick=replay;
 $('.kuku-answer').onsubmit=e=>{e.preventDefault();if(!valid()||phase!=='answer')return;const raw=$('#kuku-input').value.normalize('NFKC').trim();
 if(!/^\d+$/.test(raw)){ $('#kuku-feedback').textContent='すうじで こたえてね。';return;}
 if(Number(raw)!==lesson.total){$('#kuku-feedback').textContent='おしい！ 「3」の札を もういちど 数えてみよう。';$('.kuku-words').textContent='あせらず もういちどじゃ。同じ技で ためしてみよう。';$('#kuku-input').select();return;}
 if(!learnKuku(owner,lesson.id,raw))return;phase='success';onSave();$('.kuku-answer').hidden=true;$('#kuku-feedback').textContent=`${lesson.name}、${lesson.reading}！　3 × ${lesson.hits} = ${lesson.total}`;$('.kuku-status').textContent=`合計 ${lesson.total} ダメージ！ 技をしゅうとく！`;
 $('.kuku-words').textContent=lesson.id===9?'3のだん、皆伝じゃ！ よくぞ おぼえた！':'みごと！ 次の技も やってみよう。';$('.kuku-next').hidden=lesson.id===9;progress();};
 $('.kuku-next').onclick=()=>{if(phase==='success'&&lesson.id<9)select(KUKU_THREE[lesson.id]);};
 dialog.showModal();select(lesson);$('.kuku-replay').focus();
 return cleanup;
}
