import medalImage from './assets/quest-board/villager-medal.png?url';
export const QUEST_MEDAL_IMAGE=medalImage;
export function questMedalImage(size=24){
 const img=document.createElement('img');img.src=QUEST_MEDAL_IMAGE;img.alt='クエストメダル';img.width=size;img.height=size;img.className='quest-villager-medal';return img;
}
