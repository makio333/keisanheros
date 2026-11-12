// Presentation only. Pass the result of grantAwakeningExp, never saved snapshots.
export function createAncientExpToast({ root, nameOf = id => id, duration = 3600,
  schedule = setTimeout, unschedule = clearTimeout } = {}) {
  if (!root) throw new TypeError('A dedicated toast root is required');
  let queue = [], active = null, timer, revision = 0, destroyed = false;
  root.classList.add('ancient-exp-toast-v2');
  root.setAttribute('role', 'status'); root.setAttribute('aria-live', 'polite');
  root.setAttribute('aria-atomic', 'true'); root.hidden = true;
  const copy = c => ({ uid:String(c.uid), id:c.id, amount:c.amount,
    before:{...c.before}, after:{...c.after} });
  function clearTimer() { revision++; unschedule(timer); }
  function paint() {
    root.replaceChildren();
    if (!active) { root.hidden = true; return; }
    const doc = root.ownerDocument;
    const title = doc.createElement('strong'); title.textContent = '古代装備に経験値！'; root.append(title);
    const row = doc.createElement('div'); row.className = 'ancient-exp-toast-v2__row';
    const c = active;
    const name = doc.createElement('b'); name.textContent = String(nameOf(c.id, c.uid) || '古代装備');
    const gain = doc.createElement('span'); gain.textContent = `+${c.amount} EXP`;
    const state = doc.createElement('span');
    state.textContent = c.after.level >= 50 ? `覚醒 Lv${c.after.level}・完全覚醒 MAX` :
      `覚醒 Lv${c.after.level}・蓄積 ${c.after.exp} / ${c.after.next} EXP・次 Lv${c.after.level + 1}`;
    if (c.after.level > c.before.level) state.textContent += `（Lv${c.before.level} → ${c.after.level}）`;
    const bar = doc.createElement('progress'); bar.max = c.after.next || 1; bar.value = c.after.next ? c.after.exp : 1;
    bar.setAttribute('aria-label', '古代装備の蓄積経験値');
    row.append(name, gain, state, bar); root.append(row); root.hidden = false;
    clearTimer(); const token = revision;
    timer = schedule(() => { if (token !== revision || destroyed) return; active = queue.shift() || null; paint(); }, Math.max(3200, duration));
  }
  function valid(c) { return c && c.uid != null && Number.isFinite(c.amount) && c.amount > 0 &&
    c.before && c.after && ['level','exp','next'].every(k => Number.isFinite(c.after[k])) && Number.isFinite(c.before.level); }
  return {
    // Only call at the gain site. No load, repaint or save subscription exists.
    notify(changes = []) {
      if (destroyed) return;
      let changed = false;
      for (const raw of changes.filter(valid)) {
        const c = copy(raw), existing = active?.uid === c.uid ? active : queue.find(x => x.uid === c.uid);
        if (existing) { existing.amount += c.amount; existing.after = c.after; }
        else if (!active) active = c;
        else queue.push(c);
        changed = true;
      }
      if (changed) paint();
    },
    cancel() { clearTimer(); queue = []; active = null; root.replaceChildren(); root.hidden = true; },
    sceneChanged() { this.cancel(); },
    destroy() { this.cancel(); destroyed = true; },
    snapshot() { return { active:active && copy(active), queue:queue.map(copy) }; }
  };
}
