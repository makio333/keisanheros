import {READING_STORY_QUESTS} from './reading_story_quests.js';
import {READING_PURSUIT_QUESTS} from './reading_pursuit_quests.js';
export function readingProgress(game){
 const state=game.readingSubquests ||= {solved:{},letters:{},defeated:{}};
 state.parts ||= {};
 return state;
}
export function readingSolvedCount(game,id){
 const state=readingProgress(game);
 // Existing completed one-question quests remain completed; never repay them.
 return state.solved[id]?3:Math.max(0,Math.min(3,Number(state.parts[id])||0));
}
export function claimReadingReward(game,id,duel=false,partIndex=0){
 const state=readingProgress(game);
 if(duel){
  if(!READING_PURSUIT_QUESTS.some(q=>q.id===id)||state.letters[id]!==5||state.defeated[id])return null;
  state.defeated[id]=true;
 }else{
  if(!READING_STORY_QUESTS.some(q=>q.id===id)||!Number.isInteger(partIndex)||partIndex<0||partIndex>=3||readingSolvedCount(game,id)!==partIndex)return null;
  state.parts[id]=partIndex+1;
  if(state.parts[id]===3)state.solved[id]=true;
 }
 const reward=duel?{gold:1500,exp:100,medals:0}:{gold:300,exp:20,medals:1};
 game.player.gold+=reward.gold;game.questMedals=(game.questMedals||0)+reward.medals;
 return reward;
}
