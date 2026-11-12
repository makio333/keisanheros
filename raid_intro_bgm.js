export function createRaidIntroBgmTransition({ playBGM, getRestoreBGM }) {
  if (typeof playBGM !== 'function' || typeof getRestoreBGM !== 'function') {
    throw new TypeError('Raid intro BGM transition requires playBGM and getRestoreBGM callbacks.');
  }

  let activeTransition = null;
  return {
    begin() {
      if (activeTransition) return activeTransition;
      let settled = false;
      const finish = keepForBattle => {
        if (settled) return false;
        settled = true;
        if (activeTransition === transition) activeTransition = null;
        if (!keepForBattle) {
          const restoreKey = getRestoreBGM();
          if (restoreKey) playBGM(restoreKey);
        }
        return true;
      };
      const transition = {
        retainForBattle: () => finish(true),
        restore: () => finish(false),
      };
      activeTransition = transition;
      try {
        playBGM('bgm_raid_boss');
      } catch (error) {
        if (activeTransition === transition) activeTransition = null;
        settled = true;
        throw error;
      }
      return transition;
    },
    get active() { return activeTransition !== null; },
  };
}
