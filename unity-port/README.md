# レジェンドヒーローズ — Web版と同じUIのUnity版

標準版は、現行WebゲームのHTML/CSS/JavaScriptをUnity内のWebKitで動かすmacOSアプリ。
拠点・冒険・戦闘・装備・イベント・プリント・保存などを、同じコードで表示・処理する。
Web版は引き続き残す。先行したC#版は比較用として分離する。

## 起動

Unityで `Assets/LegendHeroes/Scenes/LegendHeroesIdentical.unity` を開いてPlay。
メニュー `Tools > Legend Heroes > Open Game (same as Web)` でも開ける。
Macアプリは移植先の `Builds/macOS/LegendHeroes.app`。

## 構成

- `Assets/StreamingAssets/LegendHeroesWeb`：Web版から生成したゲーム一式。直接編集しない。
- `Assets/LegendHeroes/Runtime/Web`：localhost配信とWebKitホスト。
- `Native/macOS`：macOS用ホストのソース。Web表示、印刷、ファイル、ダウンロード。
- `Native/webkit-chromium-compat.css`：元のmacOS ChromeとWebKitの文字組みの差を補正。
- `Assets/LegendHeroes/Editor`：起動・ビルド・隔離試験。
- `Runtime/Domain・Content・Persistence・Services・Presentation`：先行C#比較版。標準ゲームには使用しない。
- `Tests`：本番通信を外した試験用。製品パッケージへ混ぜない。

## 再生成

Web版ルートから実行する。

```sh
node --test tests/*.test.mjs
python3 scripts/build-unity-web-plugin.py
node scripts/build-unity-web.mjs
node scripts/test-unity-web-package.mjs
python3 scripts/sync-unity-port.py '../レジェンドヒーローズUnity'
```

検証パッケージは `node scripts/build-unity-web.mjs --qa`。
Editorで隔離試験する場合だけ `scripts/unity-editor.py PROJECT web --value qa` を使い、
`scripts/test-unity-web-ui.py PROJECT` と `scripts/compare-unity-web-layout.mjs PROJECT` を実行する。
通常へ戻すには、stop後 `scripts/unity-editor.py PROJECT open-web`。

`Tools > Legend Heroes > Build macOS Preview` が標準版をビルドする。
C#比較版を標準シーンと取り違えないこと。

## 対応範囲

詳しくは `Docs/MIGRATION.md`。macOS版を対象に確認しており、スマホ実機・ストア署名・買い切り/月額課金の対応は別途必要。
漢字データの出典ページとEDRDGライセンス、Chart.jsのMITライセンスを同梱する。
