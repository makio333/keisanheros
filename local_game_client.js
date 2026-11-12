// Safe offline fallback for unprofiled local builds. It never initializes Firebase
// or sends save data to a remote project. Release profiles opt into their backend.
window.CloudSave = Object.freeze({
  onCloudUpdate() { return () => {}; },
  async saveSlot() { return false; },
  async fetchAllSlots() { return []; },
  async deleteSlot() {},
  flush() {},
});
