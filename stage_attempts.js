// Stage completion is separate from question accuracy: abandoning must never fabricate wrong answers.
export function beginStageAttempt(game,areaId,stageIndex,now=Date.now()){
 if(!game || game.isTestMode || !/^area\d+$/.test(areaId) || !Number.isInteger(stageIndex) || stageIndex<0)return false;
 const previous=game.pendingStageAttempt;if(previous?.areaId===areaId && previous.stageIndex===stageIndex)return false;
 if(previous)finishStageAttempt(game,'abandoned','stage-changed',now);
 game.stageAttemptSerial=(Number(game.stageAttemptSerial)||0)+1;
 game.pendingStageAttempt={id:`${now}-${game.stageAttemptSerial}`,areaId,stageIndex,startedAt:now};return true;
}
export function finishStageAttempt(game,outcome,reason,now=Date.now(),expected){
 const attempt=game?.pendingStageAttempt;if(!attempt || (expected && (attempt.areaId!==expected.areaId || attempt.stageIndex!==expected.stageIndex)))return false;
 delete game.pendingStageAttempt;
 if(!/^area\d+$/.test(attempt.areaId) || !Number.isInteger(attempt.stageIndex) || attempt.stageIndex<0)return false;
 game.studyStats ||= {totalAnswers:0,totalCorrect:0,units:{},stageHistory:{}};game.studyStats.stageHistory ||= {};
 const key=`${attempt.areaId}_${attempt.stageIndex}`;
 const stat=game.studyStats.stageHistory[key] ||= {label:key,total:0,correct:0,history:[]};stat.outcomes ||= [];
 if(stat.outcomes.some(entry=>entry.id===attempt.id))return false;
 stat.outcomes.push({id:attempt.id,t:now,startedAt:attempt.startedAt,outcome,reason});stat.outcomes=stat.outcomes.slice(-30);return true;
}
// A successful print can also resolve an earlier abandoned stage without an active battle.
export function clearStageAttemptFlag(game,areaId,stageIndex,now=Date.now()){
 const stat=game?.studyStats?.stageHistory?.[`${areaId}_${stageIndex}`];
 if(!['abandoned','failed'].includes(stat?.outcomes?.at(-1)?.outcome))return false;
 stat.outcomes.push({id:`clear-${now}`,t:now,outcome:'cleared',reason:'clear'});stat.outcomes=stat.outcomes.slice(-30);return true;
}
