import {READING_VILLAGERS} from './reading_villagers.js';
const portraits={
 fumi:new URL('./画像/NPC/npc_librarian_fumi.png',import.meta.url).href,
 reto:new URL('./画像/NPC/npc_postman_reto.png',import.meta.url).href,
 mina:new URL('./画像/NPC/npc_watch_mina.png',import.meta.url).href,
 nono:new URL('./画像/NPC/npc_child_nono.png',import.meta.url).href,
 tom:new URL('./画像/NPC/npc_farmer_tom_transparent_v2.png',import.meta.url).href,
 sara:new URL('./画像/NPC/npc_baker_sara_transparent_v2.png',import.meta.url).href,
 gondo:new URL('./画像/NPC/npc_wiseman_gondo_transparent_v2.png',import.meta.url).href,
 lina:new URL('./画像/NPC/npc_merchant_lina_transparent_v2.png',import.meta.url).href,
 ken:new URL('./画像/NPC/npc_blacksmith_ken_transparent_v2.png',import.meta.url).href,
 dan:new URL('./画像/NPC/npc_fisherman_dan_transparent_v2.png',import.meta.url).href,
};
const faceCrops={fumi:[420,35,340],reto:[410,45,360],mina:[440,25,320],nono:[385,45,390],tom:[390,50,445],sara:[450,40,310],gondo:[455,60,430],lina:[455,40,340],ken:[480,25,365],dan:[445,70,370]};
/** Same grade-local card order used by both subquest boards. */
export function printQuestVillager(index){
 if(index<0)return null;
 const villager=READING_VILLAGERS[index%READING_VILLAGERS.length];
 return {name:villager.name,image:portraits[villager.id],faceCrop:faceCrops[villager.id]};
}
