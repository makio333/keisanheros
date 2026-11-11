# クリスマスイベント・ローカルプレイ用引き継ぎ

2026-11-11。クリスマスイベントを画像見本ではなく、実際のゲーム画面で操作して遊ぶためのコード差分と必要素材です。受け渡し専用ブランチ `codex/local-art-quest-handoff-20261110` に保存します。製品ブランチへのマージ、デプロイ、DB変更は含みません。

## 入っているもの

- `christmas-stage.patch`: 9連戦のイベント導線、漢字ステージからの問題選択、雪景色の背景、1対1バトル進行、クリア画面の差分。デスクトップ幅で「開始」ボタンが説明欄を押しつぶすCSSも直しています。基準コミット `872b0516c1481baa3a3439c9ed964f246a61a1c6`（GitHub `main`）向け。
- `assets/christmas/`: 拠点・3か所の戦闘背景・8体の手先・ピクセル調ブラックサンタ。ゲーム内の参照パス `assets/christmas/` に配置してください。
- `preview-christmas-stage.mjs`: Viteでローカル起動し、確認用のテストデータでイベントメニューを開く開発用スクリプト。
- `manifest.json`: 各ファイルのサイズとSHA-256。

アセットはクリスマスイベントのピクセル調だけです。手描き試作キャラ、武器、拠点、敵は含みません。ガチャ関連の変更も含みません。

## Macで別プレビューを作る手順

既存の作業ツリーを上書きせず、空きパスに別worktreeを作ってください。GitHubの `main` が基準コミットより進んでいたら、まずこの専用ブランチのファイルだけを使って差分を読んでください。

```sh
git fetch origin main
git worktree add --detach /tmp/keisanheros-christmas-preview 872b0516c1481baa3a3439c9ed964f246a61a1c6
```

引き継ぎブランチの `handoff/2026-11-11-christmas-stage/` を別フォルダへ展開し、そこから次を実行します（展開フォルダを `$HANDOFF` とします）。

```sh
git -C /tmp/keisanheros-christmas-preview apply "$HANDOFF/christmas-stage.patch"
mkdir -p /tmp/keisanheros-christmas-preview/assets/christmas
cp "$HANDOFF"/assets/christmas/* /tmp/keisanheros-christmas-preview/assets/christmas/
node "$HANDOFF/preview-christmas-stage.mjs" /tmp/keisanheros-christmas-preview
```

そのMacのブラウザーで `http://127.0.0.1:5195/` を開くと、テストモードからイベント画面が開きます。メニューの「ラップランドへすすむ」から開始できます。問題は既存の漢字ステージから選び、8体の手先とブラックサンタの計9戦です。回答、バトル、報酬、クリア画面を操作できます。再読み込みすると最初からやり直せます。

終了はターミナルで `Ctrl-C`。worktreeを片付ける場合は、終了後に `git worktree remove /tmp/keisanheros-christmas-preview` を実行してください。

## 安全・依存関係

- ランチャーは `127.0.0.1:5195` のみにバインドします。
- `account_client.js` をメモリ内の空のモックに置き換え、Firebase初期化モジュールを読み込みません。
- `G.isTestMode` を有効にし、ゲーム本体のセーブ処理を無効化します。CloudSaveの `saveSlot` も何もしません。実セーブやFirebase、購入、児童情報は使用しません。
- 追加npm依存はありません。基準コミットの `package.json` が要求するNode.js、npm、既存のVite依存を使います。`node_modules` がない場合はプレビューworktree内で通常の `npm install` が必要です。
- 別worktreeのファイルだけを変更するため、元の未コミット変更には触れません。

## 実装確認の状況

このクラウド側ではパッチの基準をGitHub `main` の `872b0516c1481baa3a3439c9ed964f246a61a1c6` と照合しました。実際のMacでの表示・操作は、受け取った側のworktreeで確認してください。ここからMacのSafariやローカルディスクを操作・確認することはできません。
