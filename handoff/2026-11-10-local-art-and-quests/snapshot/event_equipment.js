// Event equipment always has a special ability, including older owned copies.
export const EVENT_EQUIPMENT_ABILITIES = Object.freeze({
  quest_quill_blade: 'crit_up',
  quest_archivist_robe: 'guard',
  quest_wisdom_bookmark: 'mp_save',
  christmas_candy_cane_blade: 'crit_up',
  christmas_aurora_mantle: 'guard',
  christmas_winter_star_charm: 'mp_save',
  halloween_rank_blade: 'lifesteal',
  halloween_candy_saber: 'crit_up',
  halloween_light_cape: 'guard',
  halloween_moon_pin: 'mp_save',
  halloween_bat_buckler: 'guard',
  halloween_pumpkin_bell: 'mp_save',
  halloween_lantern_staff: 'mp_save',
  halloween_pumpkin_blade: 'crit_up',
  halloween_witch_mantle: 'guard',
  halloween_moon_charm: 'mp_save',
  raid_moon_blade: 'crit_up',
  raid_moon_mantle: 'guard',
  raid_moon_charm: 'mp_save',
  raid_star_blade: 'power',
  raid_ward_armor: 'guard',
  raid_focus_charm: 'mp_save',
});

export function eventEquipmentAbility(id) {
  return EVENT_EQUIPMENT_ABILITIES[id] || null;
}

export function ensureEventEquipmentAbilities(game) {
  let changed = false;
  for (const equipment of game?.ownedEquips || []) {
    const ability = eventEquipmentAbility(equipment.id);
    if (ability && !equipment.ability) {
      equipment.ability = ability;
      changed = true;
    }
  }
  return changed;
}
