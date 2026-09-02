// ==========================================================
// iPad / iOS Safari file://環境向け localStorage 安全化ポリフィル
// ==========================================================

(function() {
  let isStorageSafe = false;
  try {
    const testKey = '__test_local_storage__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    isStorageSafe = true;
  } catch (e) {
    console.warn('localStorage is restricted (file:// or private mode). Activating in-memory storage fallback.', e);
  }

  if (!isStorageSafe) {
    const memoryStore = new Map();
    const fakeStorage = {
      getItem(key) {
        return memoryStore.has(key) ? memoryStore.get(key) : null;
      },
      setItem(key, value) {
        memoryStore.set(key, String(value));
      },
      removeItem(key) {
        memoryStore.delete(key);
      },
      clear() {
        memoryStore.clear();
      },
      key(index) {
        const keys = Array.from(memoryStore.keys());
        return keys[index] || null;
      },
      get length() {
        return memoryStore.size;
      }
    };

    try {
      Object.defineProperty(window, 'localStorage', {
        value: fakeStorage,
        configurable: true,
        enumerable: true,
        writable: true
      });
    } catch (err) {
      window._storageFallback = fakeStorage;
    }
  }

  // 画面上でのグローバルエラーキャッチ（iPadで何が起きているか即座に確認可能にする）
  window.addEventListener('error', function(e) {
    console.error('Global Error Caught:', e.error || e.message);
    const errBox = document.getElementById('debug-error-banner');
    if (errBox) {
      errBox.style.display = 'block';
      errBox.textContent = 'エラー: ' + (e.message || (e.error && e.error.message) || 'スクリプト実行時エラー');
    }
  });
})();
