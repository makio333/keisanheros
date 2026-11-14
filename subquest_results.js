// Subquest attempts feed the ordinary gradebook without rewriting first attempts.
export function recordSubquestAttempt(game,{subject,questId,questionId,grade,skill,correct,timeMs=0,retry=false}){
 const all=game.subquestStats ||= {questions:{},quests:{}};all.questions||={};all.quests||={};
 const key=subject+':'+questionId,q=all.questions[key] ||= {subject,questId,questionId,grade,skill,attempts:[],retryCount:0,firstCorrect:null};
 const ms=Math.max(0,Math.round(Number(timeMs)||0)),entry={at:Date.now(),correct:correct==null?null:!!correct,timeMs:ms,retry:!!retry};
 if(q.firstCorrect===null&&!retry&&correct!=null)q.firstCorrect=!!correct;if(retry)q.retryCount++;q.attempts.push(entry);q.totalAttempts=(q.totalAttempts||0)+1;q.totalTimeMs=(q.totalTimeMs||0)+ms;if(q.attempts.length>100)q.attempts.shift();
 if(correct==null)return;
 const stats=game.studyStats ||= {totalAnswers:0,totalCorrect:0,units:{},stageHistory:{}};stats.units||={};stats.totalAnswers=(stats.totalAnswers||0)+1;stats.totalCorrect=(stats.totalCorrect||0)+(correct?1:0);
 const u=stats.units['subquest_'+subject+'_'+grade+'_'+skill] ||= {label:`${subject==='math'?'算数':'国語'} 小${grade}・${skill}`,total:0,correct:0,initialTotal:0,initialCorrect:0,totalTimeMs:0,timedAnswers:0,timeCount:0,assistUsed:0,retryCount:0,history:[]};
 u.total++;u.correct+=correct?1:0;u.totalTimeMs+=ms;u.timedAnswers++;u.timeCount++;if(!retry){u.initialTotal++;u.initialCorrect+=correct?1:0;}else{u.retryCount++;u.assistUsed++;}u.history.push({t:entry.at,ok:correct?1:0,ms,assist:retry?1:0});if(u.history.length>50)u.history.shift();
}
export function recordSubquestCompletion(game,subject,questId,firstTry){const all=game.subquestStats ||= {questions:{},quests:{}};all.quests||={};const q=all.quests[subject+':'+questId] ||= {completions:0,firstTryClears:0};q.completions++;if(firstTry)q.firstTryClears++;q.lastCompletedAt=Date.now();}
// Count active foreground time; tab-hidden time is excluded, including after returning.
export function startSubquestTimer(element){let total=0,last=performance.now(),hidden=document.hidden,stopped=false;const update=()=>{if(stopped)return;const now=performance.now();if(!hidden)total+=now-last;last=now;hidden=document.hidden;};const observer=element?new MutationObserver(()=>{if(!element.isConnected)stop();}):null;function stop(){update();stopped=true;document.removeEventListener('visibilitychange',update);observer?.disconnect();return Math.round(total);}document.addEventListener('visibilitychange',update);observer?.observe(document.body,{childList:true,subtree:true});return stop;}

export function renderSubquestSummary(game,root){
 const units=Object.entries(game.studyStats?.units||{}).filter(([k])=>k.startsWith('subquest_'));root.replaceChildren();if(!units.length)return;
 const title=document.createElement('h3');title.textContent='サブクエストの成績';const note=document.createElement('p');note.textContent='初回正答率で得意・苦手を確認できます。再挑戦の結果と回答時間も記録します。';root.append(title,note);
 const summary=document.createElement('p'),quests=Object.values(game.subquestStats?.quests||{});summary.textContent=`一発クリア ${quests.reduce((s,q)=>s+q.firstTryClears,0)}回 ／ 再挑戦 ${units.reduce((s,[,u])=>s+(u.retryCount||0),0)}回`;root.append(summary);
 const table=document.createElement('table');table.style.cssText='width:100%;font-size:13px;border-collapse:collapse';const add=(texts,head=false)=>{const row=document.createElement('tr');for(const text of texts){const cell=document.createElement(head?'th':'td');cell.textContent=text;cell.style.cssText='padding:7px;border-bottom:1px solid #756b81;text-align:left';row.append(cell);}table.append(row);};add(['単元','初回正答率','再挑戦','平均回答時間'],true);
 for(const [,u] of units.sort((a,b)=>(a[1].initialCorrect/Math.max(1,a[1].initialTotal))-(b[1].initialCorrect/Math.max(1,b[1].initialTotal))))add([u.label,u.initialTotal?`${Math.round(u.initialCorrect/u.initialTotal*100)}％ (${u.initialCorrect}/${u.initialTotal})`:'—',`${u.retryCount||0}回`,u.timedAnswers?`${(u.totalTimeMs/u.timedAnswers/1000).toFixed(1)}秒`:'—']);root.append(table);
}
