# 最新ゲーム統合・引き継ぎ（2026-11-12）

GitHub専用ブランチ: `codex/latest-game-handoff-20261112`（既存main/workは更新しません）。

## 2026-11-13 装備バランスの採用確定

ユーザーが「おけ、なら最新版はこれでいこう」と承認。実装・比較表は `f18b5ca` 時点を採用する。今回の承認記録によるゲーム数値の追加変更はない。

- ★1〜5の要求コストは `ceil(基本コスト × レア度倍率)`。倍率は `1 / 1.5 / 2 / 3 / 4.2`。
- 総リソースは `要求コスト × 2 + レア度ボーナス`。ボーナスは `0 / 1 / 2 / 3 / 3 SP`。HP4＝SP1、他の能力1＝SP1。
- エンチャントのリソース分を差し引き、残りを元の能力配分比で割り振る。予算超過の効果は外し、全額を能力値へ配分する。
- ★6はマナレシオ計算と一括弱体化の対象外。従来の数値・コスト・固有效果・覚醒を維持する。
- 木の剣・布の服・はやての靴の★3〜4は、コスト1当たり3SPとなる現状を採用。効率を理由に自動で弱体化しない。
- 旧性能100％復元＋コスト逆算の試案は取り下げ済み。現在の実装と混同しない。
- 比較表は旧→最新の2つ。見出し固定、アイコン、増減色、ステータス/コスト効率/旧比率の並び替え、★6の初期除外を維持する。
- 割合効果のSP価格、HP吸収の過剰ダメージ分まで回復する処理は監査上の確認事項として残る。今回それらを修正したわけではない。
- これはローカル版と引き継ぎブランチの採用確定であり、公開デプロイを実施・承認したものではない。

## 統合元

- GitHub `work`: `defae4bd411a53edf45983d6e758d99422510eaf`。
- ローカル `codex/product-migration-ready`: `ba4d7dbb3df4bba327ac33372c4b4fba199bc561` と手元の未コミット変更。
- クリスマス試遊版の変更: `8ab48aa824756a9493ec10a9156b5c882b3610de` を共通比較に使用。
- 三者の差分を統合。最新版の幽霊王、部屋の装備UI、国語/算数/プリント等のローカル改修を維持し、workの文章問題イラストも組み込み。
- 旧Firebase系ブランチ `claude/chatgpt-dev-handoff-gdgi09` は現行版より17コミット分離した別系統です。そのバックエンドへ差し戻していません。

## 起動

```sh
npm ci
node scripts/preview-christmas-local.mjs
```

`http://127.0.0.1:5195/`。このプレビューではログインを省略し、仮プレイヤー・メモリ内のテストモードを使います。Firebase/アカウントAPI/実セーブ/実ランキングへは接続しません。再読み込みでリセット。拠点のレイドから幽霊王を試せます。公開環境へのデプロイは別作業です。

ローカルMacの現行ソースは `.local-previews/latest-game/`。元の作業ツリーの未コミット変更は保持しました。Macでは `node scripts/preview-christmas-local.mjs` がこの統合版を起動します。

## 今回の変更

- クリスマスは5戦、通常2〜4個/稀なブラックサンタ10〜15個のプレゼント、交換所とステージ進行を保持。
- 交換装備は3種類それぞれ★2レア/★3激レア/★4超激レアの計9枠。交換IDにレア度を持たせ、所持装備は共通equipId+選択したrarityで保存。既存★4のIDを維持。
- 交換スキン/背景/フレームは交換専用でガチャ対象外。装備交換は既存仕様どおり繰り返し可能。
- 限定ピックアップを両ガチャの通常ラインナップより上に表示。スキンの限定品は同じホログラム区分内で通常1種あたりの1.5倍の抽選重み。獲得済み品を除外して再配分。
- クリスマス限定のキャラ/背景のホログラム版を新規抽選から廃止。既存所持データは消さず、通常ガチャのホログラム版は継続。
- クリスマス装備の限定抽選枠は15%→20%。装備可能候補があるときに適用。レア度全体の確率は維持。交換専用品は抽選しない。
- ガチャ専用装備は、以前生成した未使用の氷剣・赤いマント・鈴の首飾りに変更。交換品とは画像/名前/性能を区別。旧ガチャIDはセーブ互換のため維持。素材の出典は assets/christmas/gacha-reused-art.json。
- 通常/クリスマスの装備ガチャとも、スキンと共通の魔法陣召喚から開始→装備結果→一覧。スキップと連打ガードあり。
- 装備のレア度枠/カテゴリ/星と背景の見本は、自分の部屋の共通描画を使用。ガチャ/交換所/獲得カードにも反映。
- 五十音は全行表示、通常入力併用、最小化/展開、角で等比拡縮、見出しドラッグで移動。見出しのダブルクリックで自動配置。画面外へ出さず、敵/問題の中央位置を維持。
- 最新版の共通CSSと五十音の競合、統合後の漢字回答時の未定義timeLimitを修正。

## 検証

- `node --test tests/christmas-presents.test.mjs tests/christmas-gacha-rules.test.mjs tests/ghost-raid-content.test.mjs tests/raid-run-rules.test.mjs`: 12件成功。
- `tests/latest-integration-browser.mjs`: 起動、交換14枠、限定先頭、クリスマスホログラムなし、2万抽選の限定枠、支払い、共通召喚、幽霊王メニュー/交換12枠/戦闘。
- `tests/christmas-presents-browser.mjs`: 5戦完走、ブラックサンタ、ステージ進行、回収/二重処理防止/交換/キャンセル。
- `tests/adventure-viewport-browser.mjs`: 9画面サイズ、スクロールなし、正方形キー、併用入力と最小化。
- `tests/kana-move-browser.mjs`: ドラッグ移動、端の制限、最小化中移動、元の配置への復帰。
- Vite build成功。標準ゲーム開発クライアントでも画面確認。

## 続きの作業

このブランチを取得して上記プレビューを起動してください。実セーブ/共有ランキング/公開環境での接続確認やデプロイは、このプレビューの検証とは別に行ってください。


## 2026-11-13 テストサイトへの公開完了

- 利用者指定の `https://legend-heroes-test.web.app/`（Firebase project `ailandgames-test` / Hosting site `legend-heroes-test`）へHostingのみ公開。データベースルール・製品サイトは変更していません。
- ソースはMacの `.local-previews/latest-game/`、採用確定済み `d505f61` / 装備実装 `f18b5ca` 相当。レアリティに応じたコストとSP予算、★6除外を維持。
- ログイン不要・ブラウザ内保存。開発プレビューの強制プレイヤー/所持金/QA操作は混入なし。
- `scripts/release-test-web.mjs` を統合版にも追加。PWAアイコンとmanifest/swの配布不足を修正。次回もこの統合版で `node scripts/release-test-web.mjs --deploy` を使用できます。
- ビルド、装備/古代装備11テスト成功。公開HTMLとビルドの一致、release-target.jsonの採用済み装備識別、公開画面の起動を確認。
- ビルド日時: 2026-11-13T02:19:52.257Z。タイトル内の既存パッチノート番号26.11.02.3は公開日時を示すものではありません。実配信はrelease-target.jsonのbuiltAt/sourceVersionで確認できます。


## 2026-11-13 アップデート画面と通常ロード

- 利用者の「初回更新中→通常ロードを分け、既存のスキンと背景で整える」依頼を実装。`asset_boot.js/.css` に制御/表示を分離し、既存の森の背景と3種の冒険者を使用。受信ファイル数・割合・実受信MBを表示。縦/横/高さ390pxの画面を検証。
- 全画像を毎回Imageでプリロードする旧処理を廃止。ビルドでハッシュ化された画像URL、音声ファイルの内容ハッシュでCache Storageを照合し、不足した素材だけをダウンロードする。成功レスポンスだけ保存し、HTMLの代替応答や中断データを完了扱いにしない。通信中断時は再試行で受信済み分を再利用。端末側で保存不可なら、その回の読み込みとして扱う。
- 更新完了後は通常の「冒険を準備中」へ移行して、開始ボタンを表示。2回目は素材が揃っていれば更新画面を省略。SWの初回制御開始で自動リロードしない。更新中の保存をSW activateが消さないよう、自アプリの古いSWキャッシュだけ削除。保存済み音声のRange要求にも対応。
- テスト: fixture browser10シナリオ、SW2テスト、実素材21ファイル約32.3MBの受信完了、標準ゲーム検証クライアント成功。ゲーム本体の模擬通信テストで初回534ファイル→再起動0、開始クリックでタイトル表示、実行エラー0を確認。
- 同じテストHosting `ailandgames-test / legend-heroes-test` のみ更新済み。製品・DBルールは変更なし。保存領域はセーブデータと別で、プレイヤー情報をキャッシュしない。
- 初回の総ダウンロード量そのものは残る。端末のキャッシュ削除/容量都合の追い出し後は不足分を再受信する。新規に生成した素材はありません。


## 2026-11-13 実通信確認で発見した起動待ちの修正（前節より優先）

- 利用者の動作確認依頼と「めっちゃ遅い」の指摘を受け、公開サイトで実通信テスト。旧版は534ファイルの一括受信が重く、一部ストリームの45秒待ちで中断することを確認。前節の全素材事前取得を撤回し、起動に必要な8ファイルだけに限定。他画面の画像・音声は必要時に取得しSWで保存する。オフラインですべての未訪問画面が使える保証はしない。
- 既存のタイトル/立ち絵/森背景を起動用WebPへ変換（デザイン変更なし、元画像保持）。合計実受信1,611,356バイト。再生成はPillowの scripts/build-startup-art.py。タイトル素材も同じ内容の軽量コピーへ解決。音声は起動時の取得から外し、既存の操作後オンデマンド再生を維持。
- 未使用の同期外部Chart.jsを削除（全JS内に利用箇所なし）。画像は小さい既存スプライトを先行表示、次の立ち絵をdecodeしてから差し替える。通信が全体として進んでいれば、待機中の一部ファイルを45秒だけで中断しない。
- fixture10シナリオ/小画像先行表示/標準クライアント/公開用ビルドの起動8件→再起動0件が成功。公開サイトの新規ブラウザ実通信で、初回8件完了を約17秒時点で確認、再起動約1秒・追加取得0。実UIから「動作確認」という架空の冒険者をブラウザ内にだけ作成し、拠点まで移動。HTTPエラー0/実行エラー0/再試行0。テスト用ブラウザの終了時にデータは破棄。
- 公開先は引き続き ailandgames-test / legend-heroes-test のHostingのみ。実測時間はこの確認環境での値で、端末・回線によって異なる。
- 公開ビルド: 4bb0d287690e9370 / 2026-11-13T02:56:04.885Z。

追記: HTMLとCSSのタイトル画像参照も軽量WebPを直接使用する形に統一。公開サイトの再確認では初回14秒時点で完了、再起動1秒・追加取得0。新規登録後、拠点背景の画像読込完了まで待って全面表示を目視確認済み（HTTP/実行エラー0）。


## 2026-11-13 開始を画像待ちから切り離す（前節より優先）

- 利用者が8素材の取得中でも遅いと指摘。開始前に待つ必須素材を小さい初期立ち絵1枚・27,154バイトに変更。背景/大きい立ち絵のdecodeと固定450ms待ちを開始条件から除外し、開始可能になってから装飾を低優先度で読む。更新UIは維持するが、背景やローテーション用画像を揃えるまでユーザーを止めない。
- 非表示画面の静的imgをlazyに変更し、起動オーバーレイ中はmainを表示しない。開始後の画面切替時はその画面の画像をeagerへ戻し、必要時に確実に読み込む。ワーカー新規登録と更新確認もlegend-heroes-readyイベント後へ移動（既存ワーカーのキャッシュ再利用は維持）。
- 通常拠点背景の軽量WebPコピーを追加（約472KB、原画は保持）、HTMLとアセット解決の参照を統一。クリスマス背景の選択ルールは変更していない。
- 検証: fixtureの再開/キャッシュ/小画像先行表示10シナリオ、本体統合テストで必須取得1件→再起動0件。装飾画像通信を止めたテストでも約1.1秒で開始でき、タイトルへ進めた。標準ゲーム検証クライアントで開始操作とタイトル画像を目視確認。
- 公開サイトの新規ブラウザ実測: 最終版は開始可能まで3,081ms（別計測2,264ms）、2回目100ms・追加受信0。架空の冒険者「起動確認」をブラウザ内だけで作成し、拠点の背景画像完了まで確認。実行エラー0。実測はこの確認環境の値で、端末/回線により変わる。公開はテストHostingのみ。
- 公開識別: af246ae89a683823 / 2026-11-13T03:14:40.970Z。


## 2026-11-13 起動とプレイ中の画像欠けをまとめて改善（前節より優先）

- 利用者が登録サムネイルと拠点背景・施設アイコンの欠けを再報告。27KBだけで開始させる方針を改め、最初に599素材の軽い共通プレビューシート約463KBを用意し、プレイ中はメモリー内プレビューから描画。高解像度画像は2並列で重複なく先読み・保存・decodeし、準備できた画像へ差し替える。通信停止でも確認対象の画面は空白にならない。回線不調時にプレビューが粗く見えることはあり、全高画質素材のオフライン利用を保証しない。
- 元の画像は保持。scripts/build-runtime-art.py（Pillow）が配信用WebPと共通プレビュー/manifestを生成。元599画像387.04MiB→配信用コピー49.06MiB。アトラス/エフェクトの座標前提を維持し、拡縮では縦横比を維持。新しい絵の生成や絵柄変更は行っていない。
- vite.config.mjsのruntime-art-pluginが画像import・HTML・CSS・new URLを軽量コピーへ解決。CSS画像にも初期プレビューを用意。runtime_media.jsが動的img/背景、バージョン付きURL、blob URLを追跡し、共通キャッシュを再利用。登録のサムネイルは詰め込み縮小を防ぐグリッドへ変更。エリア選択時にそのエリアの敵画像を先読み。
- 再生成: python3 scripts/build-runtime-art.py → node scripts/release-test-web.mjs。配信用生成物はGitに保存済みなので通常のViteビルドにPythonは不要。原画やCSS画像参照を変えたときに再生成する。release-test-webは原画のハッシュと生成物を照合し、古いコピーを黙って配布しない。
- 検証: 高解像度画像通信を止めたブラウザで、登録の11人、拠点、道具屋、部屋、ガチャ、通常戦闘の画像欠け0を確認。通信再開後の高解像度化と再起動時プレビュー再受信0を確認。標準ゲームクライアントでも画像58件の準備完了・エラー0を確認し、スクリーンショットを目視。起動再開10シナリオ、装備/古代装備/SWの13テスト成功。
- 公開サイト実通信の最終確認: 初回6077ms、再起動181ms、開始前474444バイト。登録・拠点・道具屋・部屋・ガチャ・戦闘の移動直後で画像欠け0、HTTPエラー0、実行エラー0。前回の『3秒で開始』より画像の準備範囲を増やし、ゲーム中に空白で待つ問題を優先して解消。時間は確認環境での実測。架空の冒険者だけで確認し、ブラウザ終了時に破棄。
- 公開先は ailandgames-test / legend-heroes-test のHostingのみ。製品サイト・Firebase接続・DBルール・セーブ仕様・装備バランスは変更していない。
- 公開識別: db5798b3351289e8 / 2026-11-13T04:22:19.533Z。

最終追記: 表示中の画像は高優先度で取得し、ステージ選択時はそのエリアの戦闘背景も先読み。登録の大きなキャラはプレビュー/高解像度とも同じ表示サイズを維持。最終公開版の実通信再確認は初回7303ms・2回目158ms、登録/拠点/道具屋/部屋/ガチャ/戦闘の画像欠け0、HTTP/実行エラー0。公開HTML/manifestとビルドの一致を確認済み。最終公開識別: 1b9518009cd9c29d / 2026-11-13T04:28:38.355Z。

## 2026-11-13 Original-quality correction (supersedes preview-atlas approach)

- User rejected the mosaic rendering and explicitly requires no image-quality reduction. `ed9215c` preview atlases and downsampled/lossy delivery copies must not be restored.
- Runtime now uses full-resolution original artwork only. Removed the preview canvas/atlas substitution and low-resolution `assets/boot` aliases from all live references. Existing original JPEG/WebP bytes are retained. PNG delivery copies are used only when lossless WebP is smaller AND every RGBA pixel (including transparent RGB) matches the original; no resizing, alpha loss, or lossy transcoding.
- Verified all 591 media entries: source/delivery dimensions match and decoded RGBA pixels are exact. Total mapped images: 385.07 MiB originals → 301.12 MiB delivery. This is lossless, not the former 49 MiB lossy set. Startup waits for three original-quality title images (3,576,496 bytes; home/navigation/roster prefetch after ready) and reuses cached files; remaining assets prefetch/on-demand. A cold uncached screen can still require network transfer; do not claim zero loading on every connection.
- Removed await Cache.put(response.clone()) before consuming response.blob(); read once and cache a new Response(blob), avoiding an unread tee branch. Kept media cache and local saves intact. Hashed `/assets/**` files have immutable one-year HTTP caching.
- Checked fresh/warm start, registration, home, item shop, equipment, Christmas skin/equipment gacha and battle in Chrome and WebKit. Original Christmas skin banner is 2116 × 743; visual inspection confirms sharp lettering/artwork. No runtime or HTTP errors. 13 equipment/ancient/SW unit tests remain passing.
- Tests: `python3 tests/runtime-art-quality.py`; `ENGINE=webkit PW_TEST_SCREENSHOT_NO_FONTS_READY=1 node tests/runtime-media-browser.mjs` (QUALITY_URL/QUALITY_OUT overrides). Browser test now asserts original banner dimensions and rejects data-URI substitutes instead of accepting tiny previews.
- Test-only deployment fingerprint: `42954688f1ac3e9f`; project `ailandgames-test`, site `legend-heroes-test`, hosting only. Company/product Firebase and database rules unchanged. Approved equipment balance unchanged.

- Final startup correction: do not rotate/download extra decoration skins during the update; critical fetches are high priority. Gacha collection portraits use native lazy loading; scene activation only promotes images inside the viewport, preserving original resolution while avoiding hidden-tab downloads. Live WebKit initial six-file build exceeded 60 seconds on this connection; local timing is not evidence of public-network startup speed. Recheck live three-file build.

- 最終更新: gachaは選択タブのみ描画、背景スウォッチも原画質のnative lazy imgにし、非表示コレクションの一括取得を抑止。公開fingerprint 1e025ca77e175906 / Git 0f085cc。metadataと原寸バナー2116×743は公開WebKitで確認。ローカルChrome/WebKit全4タブと戦闘確認、標準スキル起動確認。ゲーム開発チャットに受領報告依頼を通知済み。公開回線の初回ロード遅延は未解消（前版3ファイルで64.7秒）、低画質で隠す方式には戻さない。

## 2026-11-14 Pre-start readiness, durable media and abandoned stages

- User clarified: an initial loading screen is acceptable; priority is no blank artwork after entering the game, and only changed media downloaded on subsequent updates. Replaced the three-title-image gate with preparation of every unique game media URL, including content-versioned public audio. Current first preparation: 535 files / 332,612,838 bytes. Original pixels unchanged. Existing URL hashes stay unchanged by this code update.
- Every newly acquired image must decode successfully before committing. Retain completed files after failure; block start on missing/corrupt required data; retry only missing files. Require initial scene decode AND a Service Worker acknowledgement that it can access all prepared URLs before showing Start.
- WebKit automation reproducibly lost Cache Storage entries across reload, and storing Blob in IndexedDB failed with UnknownError. A minimal IndexedDB ArrayBuffer probe persisted correctly. Store exact public image/audio bytes in IndexedDB database `legend-heroes-media` / store `files`; use it as the durable source shared by the page and SW. Adopt valid existing Cache Storage responses without network download. No child/save/account data is stored in this database. Do not generalize the automation issue to every Safari version.
- Bundle media_store.js directly into dist-test/sw.js to avoid a secondary worker script dependency. Worker reads IndexedDB before legacy cache. Normalize known built asset URLs and legacy ?v=1 forms. Dynamic images are remapped to the correct hashed full-resolution URL. Fixed raw stat-node icon paths at source.
- Chrome and WebKit test results: full preparation, then STOP the test HTTP server; registration, home, item shop, room/status, normal/Christmas skin/equipment gacha, and battle all render original artwork with zero missing images, JS errors or HTTP errors. Warm restart downloads 0 files / 0 bytes. WebKit setOffline(true) yielded an internal network error despite readable stored data; the independent HTTP-server-stop test verifies real inability to contact the server. Local timings must not be presented as public network download timings.
- Delta fixture tests (Chrome and WebKit): cold 2 files, warm 0, one changed image 1, corrupt image blocks start, retry 1, old assets preserved. `tests/asset-boot-browser.mjs` now points to current delta tests. `STOP_MEDIA_SERVER=1 ENGINE=webkit PW_TEST_SCREENSHOT_NO_FONTS_READY=1 node tests/runtime-media-browser.mjs` exercises the complete offline game flow. 17 equipment/ancient/SW/stage-attempt tests pass.
- New stage_attempts.js writes a pending regular-stage marker on entry (not on each enemy). Returning home, saving to title, pagehide, or recovery after forced close records a separate abandoned outcome. Defeat records failed. Outcomes do NOT invent wrong answers or affect answer accuracy/rewards. Zero-answer abandonment becomes a recent weakness/review candidate. Successful battle or print clear resolves the flag. Current scope is regular curriculum stages, not raid/boss/event or reading-quest battles. Browser tests verify return-home and reload/close records; pure tests verify forced-close recovery and successful-clear resolution.
- Test-only Hosting published: project `ailandgames-test`, site `legend-heroes-test`; fingerprint `39f909e6848162a7`, mediaStorage `indexeddb-bytes-v1`, assetBoot `prestart-delta-v2`. No product deployment, database-rule or equipment-balance changes.

## 2026-11-14 Layout and print follow-up
- Source remains `.local-previews/latest-game`. Avatar confirm cancel stays inside `.confirm-actions`, preventing window_dismiss from hoisting it into an extra grid row.
- Generic kanji adventures now share Christmas viewport fitting. Restore moved nodes using comment anchors when returning to math. Pointer capture uses the stable battle screen; do not reset final drag coordinates from a not-yet-painted CSS value on pointerup.
- Common openPrintWindow drives adventure and subquest print popups. Bundle print CSS with `?inline`; execute imported pagination against the popup document. Never reference `/word_problem_print_layout_v2.js` or `.css` as source URLs from a built popup. Enabled print button means preparation completed.
- Kana print: 189mm sheet inside 190mm printable height; break-before subsequent sheets, no trailing break-after. PDF tests confirm 10/20/30 questions = 1/2/3 pages.
- Both legacy and V2 arithmetic quests use letter layout. V2 grades1–2 reuse all60 existing illustration plans. Full prompt appears only on left; right contains villager and answer controls. Legacy rewards/scoring unchanged.
- WebKit tests cover avatar4 sizes, print-button calls, normal-kanji drag and fit3 sizes; arithmetic/stage unit tests188 pass. Quality of media unchanged. Test release fingerprint `df8223eb03d16ff9`.

## 2026-11-14 Safari print pagination and one common print flow
- Reproduced the operator Safari print preview: regular arithmetic sheet produced a content page followed by an empty page. Saved its native Quartz PDF only under /private/tmp for QA. Physical printer not used.
- Root layout causes: fixed-height flex body for regular math; full-paper 297mm portrait sheets with forced break-after in word layouts; competing page-margin models. Print-only page geometry now fits 8mm margins with a 280mm portrait /193mm landscape sheet (1mm rounding reserve). Body stays block; flex lives inside the sheet. Force breaks before subsequent sheets only. Screen preview keeps its original full-paper presentation and inner text width.
- New print_document.css is the shared paper/preview/controls layer. Named pages in stage_print_layout use the same margins. Shared arithmetic header typography and existing japanesePrintHeader are retained across sources.
- All entry routes use the adventure print-choice modal, then the same popup preview and explicit Print/Close controls. Removed automatic native-print invocation. Legacy math quest sheets and ancient reviews also use this path. Question text, source answer fields, metadata and rewards remain source-owned.
- Ancient one-time consumption callback is deferred to the explicit Print action, never preview open; repeated printing in the same popup cannot consume twice. Test verifies 0 before Print /1 after two Print clicks.
- Fixed WebKit vertical-writing answer-space overflow: reserve the reading-answer margin on the question column, not the vertical prompt itself. No text clipping or lost source records.
- Native Safari checks: regular stage1 page, math word set2 pages, mixed ancient fixture3 pages, no intervening blank pages. Chromium PDF regression: stage1 /math word2 /reading2 /kanji1 /ancient3. WebKit same5 flows and physical sheet bounds pass. Kana regression10/20/30=1/2/3 pages. Context/ancient projection pure tests pass.
- Two older broad scripts have pre-existing stale assertions: final-materials expects ancient .wpp2-question although styled ancient now uses .sp-*; japanese-materials expects obsolete paragraph marker text. print-rewards expects6 entries although current source has7. Do not report these scripts as passing. Current focused regressions cover the changed pipeline.
- tests/print-common-flow-browser.mjs builds an isolated fixture via a Vite transform into a temp directory. The private fixture hook is never written into production game.js or the test release bundle.
- Published test fingerprint: ad32ba14ffb582ca. Project ailandgames-test /site legend-heroes-test only.

- Legacy quest print records carry showGrade:false: their data has no school grade, so do not invent a displayed first-grade label. Renderer still validates its numerical font-size grade. Legacy five-question print joins the same2-page math template and common flow; regression verifies2PDF pages.
