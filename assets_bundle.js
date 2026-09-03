// 実使用アセット（assets, BGM SE, 画像フォルダ内のステージ/スキル/エフェクト/タイトル等）を一括インポート
const assetModules = import.meta.glob([
  './assets/**/*',
  './BGM SE/SE/**/*',
  './BGM SE/BGM/**/*.m4a',
  './画像/ステージ/*.jpg',
  './画像/ステージ/戦闘背景/*.png',
  './画像/スキル/**/*',
  './画像/エフェクト/**/*',
  './画像/title_*.{png,jpg}',
  './画像/bg_*.jpg',
  './画像/training_dummy*.{png,jpg}',
  './画像/NPC/**/*',
  '!./画像/Gemini_*',
  '!./画像/モンスター/**/*',
  '!./画像/装備/**/*',
  '!./画像/UI/**/*',
  '!./画像/ステージ/*.png',
  '!./assets/monsters/**/*'
], { eager: true, query: '?url', import: 'default' });

const assetMap = {};
for (const [rawPath, url] of Object.entries(assetModules)) {
  // rawPath: './assets/monsters_new/monster_1.png'
  const cleanPath = rawPath.replace(/^\.\//, '');
  assetMap[cleanPath] = url;
  assetMap[rawPath] = url;
  assetMap[encodeURI(cleanPath)] = url;
  assetMap[decodeURI(cleanPath)] = url;
  assetMap[encodeURI(rawPath)] = url;
  assetMap[decodeURI(rawPath)] = url;
}

window.__ASSET_MAP__ = assetMap;

// HTML内の静的画像や背景画像の解決関数
export function resolveDOMAssets() {
  if (!window.__ASSET_MAP__) return;

  // 1. img要素のsrc解決
  document.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('data:') && !src.startsWith('http')) {
      const pure = src.split('?')[0];
      const match = window.__ASSET_MAP__[pure] ||
                    window.__ASSET_MAP__[decodeURI(pure)] ||
                    window.__ASSET_MAP__[encodeURI(pure)] ||
                    window.__ASSET_MAP__['./' + pure];
      if (match) {
        img.src = match;
      }
    }
  });

  // 2. インラインスタイルのbackground-image解決
  document.querySelectorAll('[style*="background-image"]').forEach(el => {
    const style = el.getAttribute('style');
    const match = style.match(/background-image:\s*url\((['"]?)(.*?)\1\)/i);
    if (match && match[2]) {
      const src = match[2];
      if (!src.startsWith('data:') && !src.startsWith('http')) {
        const pure = src.split('?')[0];
        const resolved = window.__ASSET_MAP__[pure] ||
                         window.__ASSET_MAP__[decodeURI(pure)] ||
                         window.__ASSET_MAP__[encodeURI(pure)] ||
                         window.__ASSET_MAP__['./' + pure];
        if (resolved) {
          el.style.backgroundImage = `url("${resolved}")`;
        }
      }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', resolveDOMAssets);
} else {
  resolveDOMAssets();
}
