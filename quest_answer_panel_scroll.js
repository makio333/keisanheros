function canScrollVertically(element, delta) {
  const overflowY = getComputedStyle(element).overflowY;
  if (!['auto', 'scroll', 'overlay'].includes(overflowY) || element.scrollHeight <= element.clientHeight + 1) return false;
  return delta > 0
    ? element.scrollTop + element.clientHeight < element.scrollHeight - 1
    : element.scrollTop > 1;
}

export function installQuestAnswerPanelWheelScroll(panel) {
  if (!(panel instanceof HTMLElement) || panel.dataset.questWheelFallback === 'true') return;
  panel.dataset.questWheelFallback = 'true';
  panel.addEventListener('wheel', event => {
    if (event.defaultPrevented || event.ctrlKey || event.shiftKey || event.deltaY === 0) return;

    const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? event.deltaY * 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? event.deltaY * panel.clientHeight
        : event.deltaY;
    if (!Number.isFinite(delta) || delta === 0) return;

    for (let element = event.target; element instanceof HTMLElement && element !== panel; element = element.parentElement) {
      if (canScrollVertically(element, delta)) return;
    }

    const maxScrollTop = Math.max(0, panel.scrollHeight - panel.clientHeight);
    const nextScrollTop = Math.max(0, Math.min(maxScrollTop, panel.scrollTop + delta));
    if (Math.abs(nextScrollTop - panel.scrollTop) < 1) return;

    event.preventDefault();
    panel.scrollTop = nextScrollTop;
  }, { passive: false });
}
