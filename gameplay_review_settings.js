// Review settings: restore regularPrintQuestions to 10 and mathQuestQuestions to 1 to undo the print/group trial.
export const REVIEW_SETTINGS = Object.freeze({regularPrintQuestions:20, wordPrintLayout:'duplex-2-3', mathQuestQuestions:5, legacyMathQuestQuestions:5});
export function groupQuestProblems(problems,size=REVIEW_SETTINGS.mathQuestQuestions){
 const groups=[];for(let i=0;i<problems.length;i+=size)groups.push(problems.slice(i,i+size));return groups;
}
