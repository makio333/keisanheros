// Browser facilities supplied by the Unity host, never game/UI rules.
(() => {
  if (!window.webkit?.messageHandlers?.legendHost) return;
  const open = window.open;
  window.open = function (url = '', ...options) {
    // WKUIDelegate may receive an empty NSURL for '', unlike Chrome's about:blank.
    // Use the standard blank-document URL so document.write/printing stays in-app.
    return open.call(this, url === '' ? 'about:blank' : url, ...options);
  };
})();
