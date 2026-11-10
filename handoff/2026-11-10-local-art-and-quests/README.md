# ローカルからゲーム開発チャットへの引き継ぎ

2026年11月10日。ユーザーが「ゲーム開発」というクラウドチャットへ作業を引き継ぎ、引き継ぎ先のチャット内で「引き継ぎました」と報告するよう依頼しました。

このフォルダはローカル側のコードと素材を受け渡す資料です。snapshot内のgame.jsやindex.htmlをクラウド側へ丸ごと上書きしないでください。製品移行ブランチのローカルコードが混在するため、必要な変更を確認して統合してください。origin/workのクリスマスガチャ等の先行変更を維持してください。

## 最優先の未実装依頼

算数の文章問題サブクエストも、国語と同じ流れにしたいという依頼が最新です。

- 5問をまず最後まで答える。
- 1問ごとの正解表示をせず、最後に5問まとめて答え合わせする。
- どの問題を間違えたか分かる振り返りを表示する。
- 間違えた問題はヒント付きで再挑戦できる。
- これまでの国語と同じく、挑戦中に報酬が積み上がり、解き直して全問正解でも最終100%を受け取れる方向。今回ユーザーが直接依頼した中心は算数の答え合わせタイミングの統一なので、報酬変更は既存仕様を見て必要最小限にすること。

対象はmath_word_subquests.js。現在は各問で即時採点・即時正解表示してから次へ進む。groupQuestProblemsで5問にまとまる。getMathWordQuestsV2/scoreMathWordAnswerV2はmath_word_quests_v2.js。既存のstate.completedや受領済み報酬を維持し、再読込/再挑戦で二重報酬にならないようにする。国語のjapanese_reading_session_v2.js、japanese_reading_subquests_v2.jsを参照する。算数の旧型クエスト(game.js内)が別に表示されるため、適用範囲・導線も確認する。

## 絵柄の決定

作者本人の原画に基づく、非ピクセルの手描きイラスト。赤みのある茶色の揺れた鉛筆線、斜線の陰影、柔らかな色面、丸い形と表情を重視。CHARACTER_STYLE_GUIDE.mdに再利用プロンプト、参照の役割、戦闘用の追加指示を保存。原画の動物を人間に翻案する場合も、形と表情から読み取る。単に鉛筆テクスチャを掛けるだけにしない。

作者のDesktopにある原画はこのパッケージには含めていません。プロンプトの参照パスは制作記録であり、クラウドからそのまま読めません。生成済みの採用素材はsnapshot/assets/artist-*にすべて含めました。

## ローカルゲームへ反映済み

以下は元画像を保持し、既存IDと強さ・価格・コスト・入手条件を維持した画像参照の差し替えです。

キャラ6体：
- skin_fire_lancer_m → fire-lancer-handdrawn-v1.png
- skin_tide_cleric_f → tide-cleric-handdrawn-v1.png
- skin_forest_scout_m → forest-scout-handdrawn-v1.png
- ai_hero_alchemist → star-alchemist-handdrawn-v1.png
- halloween_festival_queen → halloween-queen-handdrawn-v1.png
- raid_star_guardian → star-guardian-handdrawn-v1.png

画像フォルダはassets/artist-skin-samples。

武器4種：
- w1 → assets/artist-weapon-samples/wood-sword-handdrawn-v1.png
- halloween_pumpkin_blade → pumpkin-blade-handdrawn-v1.png
- halloween_lantern_staff → lantern-staff-handdrawn-v1.png
- anc_w1 → ancient-dual-handdrawn-v1.png

game.jsのemoji参照のほか、同武器を使う特技/古代報酬、print_reward_icons.jsの古代アイコンも変更。

拠点：assets/artist-stage-samples/komorebi-village-aerial-v2.png。画像/home_town_v2.pngの元の俯瞰構図と施設配置を保った新しい手描き版。game.jsの固定クリスマス背景importとupdateHud内のPC/スマホ背景をこの画像へ変更。index.htmlの初期画像/alt、背景スキンquest_village、優先ダウンロード画像も更新。style.cssの拠点彩度フィルタを解除。施設ホットスポットは動かしていない。

BGM：public/assets_audio/bgm_area_boss.mp3（空中散歩）を通常エリアのボス戦へ。public/assets_audio/bgm_home_kaisei.mp3（快晴の街）を拠点へ。SoundManagerのパスと全音声ダウンロード一覧を更新。レイド/ハロウィンの専用曲を維持。

## 直前に追加した草原と敵

草原：assets/artist-stage-samples/komorebi-clearing-v1.png。game.jsのHANDDRAWN_GRASS_BG、battleBgForのtower、stageBattleBgの不明エリアfallback、bgImageが草原.jpgだったエリアのサムネイルを更新。他の沼/海/火山/ハロウィンの背景は一括置換していない。

敵3体はassets/artist-monster-samples：
- tower配列key0「そらとぶスライム」 → flying-slime-handdrawn-v1.png
- tower配列key8「キノコやまあらし」 → mushroom-hedgehog-handdrawn-v1.png
- boss.tower5「くさはらのぬし」 → meadow-lord-handdrawn-v1.png

該当3定義のemojiだけ変更。通常敵の抽選や強さ・報酬は変更していない。

## 確認用UIと開発用入口

skin_art_review.html/.js/.css：既存キャラ全体と試作・武器・敵を画像で一覧。チェック選択、個別メモ、共通指示、コピー、JSON保存、拡大、フィルタ。ブラウザlocalStorageに選択とメモだけを保存。ゲームセーブと別。skin_art_samples.js、equipment_art_samples.js、monster_art_samples.jsが試作データ。virtual:skin-preview-catalogを提供するVite開発プラグイン（vite.config.ts、scripts/lib/skin-preview-catalog.mjs）も必要。

artist_adventure_preview.html：草原/手描き俯瞰拠点/元拠点の比較、新しい男女冒険者を単体か重ねて確認。これは試作確認ページ。

実ゲームの ?art-preview=1 は開発時限定。main.jsでこのクエリだけlocal_game_client.jsを使いFirebaseを初期化しない。game.jsでnewGameStateから確認用データを作り、saveが受け付けない非SAVE_PREFIXキーlocal-art-previewを使う。既存セーブの移行をスキップ。Lv12/6キャラ/4武器のインメモリ確認。通常のゲームセーブは変更しない。

local_art_game_preview.jsの上部ツールでキャラ/武器/敵、拠点/部屋/キャラ選択/戦闘を切替。追加したlocalArtEnemyRefによる敵指定はLOCAL_ART_PREVIEWのときだけ有効。敵key8は通常序盤の抽選外でもプレビューで直接試せるが、通常プレイの抽選には影響しない。

確認用URL（クラウドでは自分のローカルサーバーのホストへ置換）：
- /?art-preview=1
- /?art-preview=1&view=battle&enemy=slime
- /?art-preview=1&view=battle&enemy=hedgehog
- /?art-preview=1&view=battle&enemy=boss
- /skin_art_review.html?category=monster-sample

## 国語サブクエスト等の既存ローカル変更

国語は5問回答後にまとめて採点、誤答にヒント付き再挑戦、赤い鉛筆線で文脈を示す。1〜3年は選択、4年以上は記述/抜き出しも使い、口頭スキップなし。回答/正解ごとの報酬台帳で二重支払いを防ぎ、途中でも報酬が見える。

掲示板はコンパクトな張り紙、端末サイズを計測したページ切替（スクロール前提にしない）。紙の輪郭/めくれる角が違う4生成柄をクエストIDごとに安定して割当。メダルと限定交換品、手紙レイアウト、村人の絵を使用。対応コード・生成素材もsnapshotに含めた。

## 検証状況

- 6キャラの拠点/選択画面、4武器の装備アイコンを実ブラウザで確認。
- 差し替え前と比べて武器のID/name/slot/opTier/stat/cost/priceを維持。
- 手描き拠点をPC/スマホ390px/768pxで確認。
- 今回の敵3体を開発用入口から指定して実際の戦闘画面に表示。通常/ボス分岐、新しい草原背景、ページ例外なしを確認。敵のname/hp/atk/def/spd/exp/goldが元定義と同じことを検証。
- 確認用入口でFirebase要求ゼロ、fixtureの保存なしを確認。
- 敵3体の生成画像はRGBAで実alphaあり。screenshotsに戦闘3枚と拠点の確認画像。
- node scripts/release-test-web.mjs相当のテストビルドは最後の敵参照変更時に成功。その直後、virtual:regular-print-catalogに未定義定数が出ないよう、エリアのbgImageだけはHANDDRAWN_GRASS_BG定数ではなく同じ画像の文字列へ戻した。通常のビルドを引き継ぎ先でも一度実行すること。
- develop-web-game公式クライアントを使用。verification-scriptsはローカルの補助検証で、Playwright import絶対パスや一時ファイルのパスはクラウド用に調整が必要。
- 算数サブクエストの最終一括採点は未実装。

## 統合時の注意

ローカルの作業元はcodex/product-migration-ready、HEAD ba4d7db、未コミット変更が200件以上ある。会社PC向けの移行・認証・公開設定も同じ作業ツリーにあるため、製品ブランチの一括マージやgame.js丸ごと置換はしないこと。ここでは画像素材と対象機能のコードスナップショットだけを受け渡す。ゲーム本体のクリスマスガチャなどクラウド独自差分を保持し、機能単位で統合する。

環境ファイル、認証情報、Firebase設定ファイル、会社の保存データ、作者のDesktop原画は含めていない。manifest.jsonは受け渡しファイルのSHA256とサイズ一覧。既存画像を消さず、採用画像/試作/元画像の区別を保持する。

ユーザーが今回依頼したのはクラウドチャットへの引き継ぎ。デプロイの新しい承認ではない。承認済みの具体的な公開先が確認できるまでデプロイしないこと。
