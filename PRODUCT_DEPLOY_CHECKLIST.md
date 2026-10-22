# AIlandGames 製品版 公開準備

この手順は新しい `ailandgames` プロジェクト用です。旧ゲームや既存のセーブデータは移しません。ここに書かれた作業だけでは公開されず、実際の購入も発生しません。

## こちらで用意したもの

旧版・新版の操作は `RELEASE_VERSIONS.md` を参照してください。旧版は `npm run build:legacy` / `npm run deploy:legacy`、新版は `npm run build:product` / `npm run deploy:product` です。出力先は `dist-legacy` / `dist-product` に分かれています。

- Cloud Run用API: LINEログイン、購入者ごとのセーブ、ゲーム共有データ、Stripe決済通知を処理します。
- セーブ本体を圧縮して Firestore に保存します。大きすぎるセーブは保存時に拒否し、画面にはサイズエラーを返します。
- `Dockerfile`: APIをGoogle Cloudへ載せる箱の作り方。Cloud Runのソース自動ビルドでも標準名で認識されます。
- Hosting `/api/**` 転送先: `legend-heroes-api`（東京）。
- `npm run build:product`: 製品向けWeb版を作る設定。
- Firestoreのブラウザー直接アクセスは禁止。サーバーが本人確認して読み書きします。

## 公開前に必要な設定

### 少人数テスト用の費用設定

- `scripts/deploy-product-api.mjs` はテスト決済限定で公開します。待機0台、最大1台、1 CPU、512 MiB、リクエスト処理中の課金に設定します。初回アクセスは起動待ちが発生し、混雑時には待ちやエラーが発生し得ます。
- ローカル設定の確認だけ: `node --env-file=.env scripts/deploy-product-api.mjs`
- 公開実行: `node --env-file=.env scripts/deploy-product-api.mjs --deploy`
- 実行前に専用サービスアカウント `legend-heroes-api@ailandgames.iam.gserviceaccount.com` を作成し、Firestore利用権限と下記3件の秘密情報の読み取り権限を付与します。
- Secret Managerに保存するのは `LINE_CHANNEL_SECRET`、`STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET` の3件です。IDや価格IDは秘密鍵ではないため通常のサーバー設定で渡します。以前案内したIDの保管は不要です。
- `.gcloudignore` はサーバーに必要なファイルだけを送信します。ローカルの `.env`、ゲーム画像、セーブ、Git履歴は送信しません。
- Google Cloudの「お支払い」→「予算とアラート」で、このプロジェクトを対象に月1,000円相当の通知予算を作り、50%、90%、100%でメール通知します。通知は利用料金の上限ではありません。最大1台も料金の上限保証ではありません。
- 画像配信、公開用イメージの保管、ビルド、通信、Firestoreの期限切れ自動削除は別途費用が発生し得ます。画像配信の実測前に総額を断定しません。

1. Google Cloud CLIを、`ailandgames` プロジェクトを作ったGoogleアカウントでログインします。操作ツールは2026年10月21日にこのPCへ導入済みです。`gcloud auth login ailandgames.jp@gmail.com` で本人のログインを行います。
2. Google Cloudで Cloud Run と Artifact Registry を有効にします。Cloud RunはAPIを動かす場所、Artifact RegistryはAPIの箱を保管する場所です。
3. Cloud RunがFirestoreを使える専用サービスアカウントを用意し、`ailandgames` のFirestoreデータベース利用権限を与えます。サービスアカウント鍵ファイルは作りません。
4. LINE Developersのチャネルに、公開URLの `https://ailandgames.web.app/api/auth/line/callback` を登録します。
5. `LINE_CHANNEL_SECRET`、`STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET` の3件をGoogle Secret Managerに登録し、Cloud Runからだけ読めるようにします。チャットやGitHubには貼りません。チャネルID・プロバイダーID・各価格IDは通常のサーバー設定として公開スクリプトが渡します。
6. StripeのWebhook送信先を `https://ailandgames.web.app/api/payments/stripe/webhook` に設定します。公開直後はテストキーで疎通を確認し、実決済に切り替えるのは本人確認・商品・返金対応の確認後です。
7. 既存Firestoreルールを確認してから、`firestore.backend-only.rules` を反映します。この設定を反映するとブラウザーからの直接読み書きは止まります。API公開と同時に行い、先に反映しません。
8. FirestoreのTTL（期限切れデータの自動削除）を `sessions` と `attempts` コレクションの `ttlAt` に設定します。認証は期限を毎回サーバーでも検証し、TTLは期限切れ記録を後から片付けるための設定です。
9. テスト決済・LINEログイン・別端末復元を確認してから、製品版WebをHostingへ公開します。

## 重要

- Firestore作成時に選んだ東京リージョンは後から変更できません。現在のデータベースは `asia-northeast1` です。
- Hostingは現時点で `ailandgames.web.app` を対象に設定しています。`legend-heroes2.web.app` も同じFirebaseプロジェクト内にありますが、今回の設定対象にはしていません。別のURLへ公開先を変えるときは、LINEの戻り先・Stripe設定・`PRODUCT_PUBLIC_ORIGIN` も同じURLへ合わせます。
- 公開手順中に旧Firestoreや旧Hostingサイトへ切り替えないでください。
- 会社名義でStripeを運用する場合、Stripeのアカウント・入金先口座も会社側の正式なものにします。
