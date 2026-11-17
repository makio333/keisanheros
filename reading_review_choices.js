// Keep IDs and wording intact so grading and saved answers remain valid.
export function shuffleReviewChoices(previous,accepted,random=Math.random){
 const choices=[...previous];
 if(choices.length<2)return choices;
 for(let i=choices.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
 const before=previous.findIndex(option=>accepted.includes(option.id));
 const after=choices.findIndex(option=>accepted.includes(option.id));
 // Always move the correct choice, even if the random shuffle kept its position.
 if(before>=0&&before===after){const other=(after+1+Math.floor(random()*(choices.length-1)))%choices.length;[choices[after],choices[other]]=[choices[other],choices[after]];}
 else if(choices.every((option,i)=>option.id===previous[i].id))choices.push(choices.shift());
 return choices;
}
