# 会社の旧版とLINEログイン新版の使い分け

同じゲーム内容から、公開用のファイルを2種類作ります。Googleへのログインアカウントを変えただけでは、セーブの接続先は切り替わりません。

| | 旧版・会社用 | 新版・製品用 |
|---|---|---|
| セーブの保存先 | `treegames-ac5db` の共有Firestore | `ailandgames` のアカウント別保存 |
| 公開サイト | `keisan-heros` | `ailandgames` |
| ログイン | 不要 | LINEまたはGoogle |
| 引っ越し | 全員分のJSONを書き出す | 許可した施設LINEへJSONを取り込む |
| 出力フォルダー | `dist-legacy` | `dist-product` |
| 作成する操作 | `npm run build:legacy` | `npm run build:product` |
| 公開する操作 | `npm run deploy:legacy` | `npm run deploy:product` |

旧保存先・旧サイトはGitにあった既存設定に合わせています。施設で現在稼働中のサイトが同じ設定かは、施設PCで実際の設定と照合してから公開します。現在のFirebaseルールや実データには手を加えていません。

## 施設PCで行う順番

1. 旧版のソースと設定をバックアップします。現在利用しているFirebaseプロジェクトと公開サイトを確認します。
2. 通常どおりのゲーム更新を含む旧版を公開する場合は `npm run build:legacy` で作り、確認後 `npm run deploy:legacy` で公開します。旧保存先を維持し、JSON出力ボタンが追加されます。
3. 出力機能だけ追加したい場合は、別途用意した `output/legacy-export-only.patch` を旧版ソースへ適用します。これはFirebase接続設定を変えません。
4. 最後のゲームプレイを保存し、旧版の保護者設定→ツールで「全員分の引っ越しファイルを作る」を押します。保存先・人数・名前を確認してJSONを保存します。
5. 新版の公開準備ができてから `npm run deploy:product` でWeb画面を公開します。LINE・保存・移行を処理するサーバーの公開も別途必要です。
6. 施設LINEで新版へログインします。そのアカウントIDと旧FirebaseのプロジェクトIDを、サーバーの移行許可設定に指定します。JSONを選択し、人数・名前を確認して取り込みます。
7. 全員分のセーブを確認したら利用するリンクを新版へ統一し、移行受付を閉じます。施設の無料利用枠とセーブは残ります。

詳しい移行操作・制限は `LEGACY_SAVE_MIGRATION.md` を参照してください。旧版と新版は引っ越し後に自動同期しません。

Googleログインの設定と、既存LINEアカウントへGoogleを連携する手順は `GOOGLE_LOGIN_SETUP.md` を参照してください。Google側の登録情報をサーバーに設定するまで、Googleボタンは表示しません。

## 公開先を間違えないための設定

- 各公開操作は、プロジェクト・公開サイト・出力フォルダーを固定してからビルドします。Firebase CLIの現在の既定プロジェクトには依存しません。
- 旧版は `firebase.legacy.json`、新版は `firebase.product.json` を使います。両方の公開操作とも対象はHostingだけです。旧版公開で新版用のFirestoreルールを適用しません。
- `npm run deploy` だけでは公開しません。旧版か新版を明示して選びます。
- 通常の `firebase.json` も新版の `dist-product` を参照します。通常ビルドの `dist` を新版へ誤公開しないためです。
- 作った各フォルダーの `release-target.json` で接続先・公開先・版を確認できます。
- 両方を作った後 `node scripts/verify-release-targets.mjs` で、実際のビルド内に相手側の接続が混ざっていないことを検証できます。

## ローカルで確認

- 旧版: `npm run dev:legacy` → `http://127.0.0.1:5180/`
- 新版: `npm run dev:product` → `http://127.0.0.1:5181/`

旧版のローカル画面も、会社の既存Firestoreに接続する設定です。単にプレビューを開いても模擬データへ切り替わるわけではありません。新版はログイン用サーバーが必要です。実際の試験では模擬APIまたは既存のローカル接続確認環境を利用してください。
