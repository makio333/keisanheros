import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {GHOST_RAID_EQUIPMENT} from '../../ghost_raid_content.js';
import {QUEST_MEDAL_EQUIPMENT} from '../../quest_medal_exclusives.js';
import {eventEquipmentAbility} from '../../event_equipment.js';
export function equipmentCatalog(){
 const source=readFileSync(new URL('../../game.js',import.meta.url),'utf8');
 const context={GHOST_RAID_EQUIPMENT,QUEST_MEDAL_EQUIPMENT};vm.createContext(context);
 const first=source.indexOf('const EQUIP_DB = [');const last=source.indexOf('function getEquipTemplate(',first);
 vm.runInContext(source.slice(first,last)+'\nthis.catalog=[...EQUIP_DB,...ANCIENT_EQUIP_DB,...LIMITED_EQUIP_DB,...HALLOWEEN_EQUIP_DB,...CHRISTMAS_EQUIP_DB,...QUEST_MEDAL_EQUIPMENT];',context);
 return context.catalog.map(db=>({...db,stat:{...db.stat},ability:db.ability || eventEquipmentAbility(db.id)}));
}
