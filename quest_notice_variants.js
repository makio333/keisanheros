export const QUEST_NOTICE_VARIANTS=Object.freeze(['fold-upper-left','fold-lower-right','fold-lower-left','torn-upper-right']);
// A quest ID seeds the draw, so paging, resizing and reopening keep its paper.
export function questNoticeVariant(key){
 let hash=2166136261;for(const char of String(key)+':paper-shape-178'){hash=Math.imul(hash^char.codePointAt(0),16777619);}
 hash=Math.imul(hash^(hash>>>16),0x85ebca6b);hash=Math.imul(hash^(hash>>>13),0xc2b2ae35);hash^=hash>>>16;
 return QUEST_NOTICE_VARIANTS[(hash>>>0)%QUEST_NOTICE_VARIANTS.length];
}
export function assignQuestNotice(card){
 const key=card.dataset.questNoticeKey||`${card.querySelector('.quest-card-name')?.textContent||''}:${card.querySelector('.quest-card-title')?.textContent||''}`;
 card.dataset.noticeVariant=questNoticeVariant(key);
}
