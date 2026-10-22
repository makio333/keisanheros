# LINE / Stripe ローカル実接続チェック

この手順は、公開中のゲームを変更せず、ローカルコードを実LINEログインとStripeテスト決済へ接続するためのものです。セーブはこのPCの `.local-product-data/` にだけ保存されます。本番DBではありません。

2026-10-20: Stripe MCP の `stripe_implementation_planner` が利用できることを確認し、ユーザー指定の「AIlandサンドボックス」で計画を生成しました。選択した構成は、LINE購入者アカウントからサーバーで単発Checkoutを作成し、StripeのHosted Checkoutへ遷移、署名済みWebhookとStripeから再取得した支払情報で利用権を付与する方式です。MCPでの認証は、ゲームサーバーのAPIキー・Webhook・LINE設定を自動設定するものではありません。2026-10-21時点ではローカルの秘密設定と実サンドボックス決済確認まで完了しています。最新状況は末尾を参照してください。

料金は個人3枠4,980円、団体10枠19,800円・20枠34,800円・30枠49,800円（すべて日本円・税込・買い切り）。増枠は購入済みプランとの差額だけを請求します。AIlandGamesは別製品のため、既存セーブの移行や紐付けは今回の要件に含めません。

## 設定するもの

- LINE Developers: LoginチャネルのChannel ID、Channel Secret、Provider ID。
- LINE LoginのCallback URL: `https://<固定HTTPSトンネルのホスト>/api/auth/line/callback`。
- Stripe: テストモードの秘密キー、テスト用Webhook署名シークレット、4つの買い切りPrice ID。
- Stripe Webhookイベント: `checkout.session.completed` と `checkout.session.async_payment_succeeded`。
- トンネル: 固定HTTPS URLからこのPCの `127.0.0.1:5178` へ転送。LINEのCallback URLと `PRODUCT_PUBLIC_ORIGIN` は同じHTTPS URLにする。

LINE Secret、Stripe Secret Key、Webhook Secretは画面やGitHubに貼らず、`.env` にだけ入力します。`.env` とローカルセーブの場所はGit対象外です。

## 準備と起動

1. `.env.example` を `.env` に複製し、空欄を埋める。LINE Callback URLは次の形です。
   `https://<固定HTTPSトンネルのホスト>/api/auth/line/callback`
2. Stripeダッシュボードをテストモードにして、商品登録前なら `node --env-file=.env scripts/setup-stripe-products.mjs --apply-test` を実行する。表示された4つの `price_...` を `.env` に入れる。これはStripeのテスト商品を作る操作です。
3. StripeのテストWebhookを、`https://<固定HTTPSトンネルのホスト>/api/payments/stripe/webhook` へ登録し、表示された `whsec_...` を `.env` に入れる。
4. 固定HTTPSトンネルを `127.0.0.1:5178` へ向けた状態で `node --env-file=.env server/local-product-check.mjs` を実行する。
5. トンネルのHTTPS URLを開き、LINEログイン、テストCheckout、Webhook後の3枠付与、セーブ作成を確認する。

このローカルAPIは `sk_test_` 以外を受け付けません。Stripeのテストカードで実際の請求は発生しません。Stripe CLIを使う場合は、Webhook Secretに `stripe listen` が出力するテスト用署名シークレットを設定し、転送先を同じ `/api/payments/stripe/webhook` にします。

## 実装済みの確認と次の実接続テスト

- ローカル起動口の認証・保存・決済APIの参照範囲を修正。設定したトンネルのHostを許可し、保存ディレクトリと `.env` 系ファイルのHTTP配信を拒否。終了時に保存ロックを解放して再起動できます。保存先に `public/` やプロジェクト直下そのものは指定できません。
- Stripeへの通信前に、注文と送信内容を永続保存。同じ注文の再試行には同じ冪等キーと送信内容を使い、Stripe通信をDBトランザクションの外へ分離。Checkout作成の応答が失われても、検証済みWebhookから注文を復元できます。
- 期限の時刻だけでは注文を解除せず、Stripeが「expiredかつunpaid」と返した場合に解除。完了済みで支払確認中の注文は再購入・取消を止めます。Session ID不明のまま23時間以上経った注文は、自動再作成せず保留します。Stripe側で注文metadataと決済状況を照合する運用が必要です。遅延決済の失敗時に注文を自動解除する処理は未実装です。
- 固定のJPY金額を守るため、Adaptive Pricingを明示的に無効化。税込のPrice設定と税務処理は別です。自動税額計算やManaged Paymentsの契約は追加していません。

次の実接続では、LINEのログイン→初回購入→Webhookで枠付与→差額増枠→別端末で同じLINEから復元を確認します。あわせて支払失敗・手続き取消・Webhook再送・支払確認待ちも確認します。商品登録スクリプトのプレビューと自動テストは外部決済なしで実行できます。

参照: [Stripe Checkoutの完了処理](https://docs.stripe.com/checkout/fulfillment?payment-ui=stripe-hosted)、[Stripeの冪等リクエスト](https://docs.stripe.com/api/idempotent_requests)。

## 本番化前の制限

この起動口は、単一プロセス・ローカルJSON保存の動作確認専用です。PCの停止・故障で利用者のセーブは利用できず、同時アクセスや複数サーバーにも対応しません。公開API、Cloud Run、Firestore、正式なバックアップを整えるまで、このローカルストアのセーブを製品データとして使わないでください。本番キー・本番Webhook・本番決済への切替もここでは行いません。

公開前には、施設での利用条件、返金・異議申立てと利用権の扱い、実運用のDB・管理者権限・API流量制限を確定する必要があります。返金処理や利用権の自動取消は現在の実装に含まれません。

## 2026-10-20 実接続設定の進捗

- ユーザーの依頼でAIlandサンドボックスに4つのテスト商品・税込JPYの単発Priceを実登録し、サーバーから価格を再取得して確認しました。実請求はありません。
- 既存の「レジェンドヒーローズ」LINEチャネルとProviderを確認。既存のLINE Secret、Stripeテストキー、テストWebhook署名Secretをローカルの `.env` に保存しました。内容は会話やGitへ出さず、ファイル権限は600です。
- ユーザーの明示的な許可後、Cloudflareの一時HTTPSトンネルを開始。専用の空ストアは `/private/tmp/legend-payment-sandbox-TKkgnC`。このパスはテスト専用で、以前のセーブを読み込みません。
- 今回の接続先は `https://interface-via-dui-jurisdiction.trycloudflare.com`。一時トンネルの再起動でURLが変わる場合は、`.env`、LINEコールバック、Stripe通知先をすべて更新してください。
- Stripe通知先は `we_1USeQAP6fOxiz2wO1LNDIIV7`。上記URLの `/api/payments/stripe/webhook` に、完了・遅延成功の2イベントを登録済みです。
- HTTPS経由で認証APIの200、未認証購入APIの401、`.env` の403を確認。購入権を付与しない署名付き接続確認イベントも200で受信しました。これは実際のCheckout完了検証の代わりではありません。
- LINEコンソールへ一時トンネルURLを登録済み。実際のLINEログインから新規購入者作成とセッション発行、`login=success` での復帰を確認しました。

| プラン | 今回登録したテスト用Price ID |
|---|---|
| 個人3人分 | `price_1USe6lP6fOxiz2wOlqNhOniD` |
| 団体10人分 | `price_1USe79P6fOxiz2wOra03GWOV` |
| 団体20人分 | `price_1USe7GP6fOxiz2wO6cACYA1b` |
| 団体30人分 | `price_1USe7KP6fOxiz2wOfpL9b2Vu` |

## 2026-10-21 実決済サービスでのテスト結果

- 実LINEで認証した購入者から、ゲームの購入ボタンで個人3人分のCheckoutを開始。Stripe APIでも `livemode=false`、4,980円、JPY、単発を支払操作前に照合しました。
- Stripe Hosted Checkoutへ公式テストカードと架空の連絡先だけを入力して送信。Stripeで `complete/paid`、アプリの保存先で署名検証済みの購入1件・イベント1件・注文fulfilledを確認しました。実請求はありません。
- 同じ認証済み購入者のアプリAPIから団体10人分への増枠Checkoutを開始。控除4,980円・差額14,820円を照合し、Hosted Checkout上でも14,820円の表示を確認してテスト送信しました。
- 増枠も `complete/paid` と実Webhookによるfulfilledを確認。購入2件・署名イベント2件、アカウントAPIの総枠数10・使用0を確認しました。テスト支払合計19,800円で、団体10人分の直接購入価格と一致します。
- ゲーム画面のアクセシビリティ表示でも `プレイヤー 0 / 10` と、次の20人分への差額15,000円を確認しました。開発サーバー経由の初回表示は大量の素材読み込みで時間がかかります。
- このネイティブブラウザー操作ではプレイヤー作成操作が安定せず、新しいテストセーブは作成していません。実接続でのセーブ作成・再読み込みの確認は残っています。従来の架空データによる所有権・枠数・復元テストは通っています。
- 秘密設定用の127.0.0.1限定フォームは停止済み。ゲームと許可済み一時HTTPSトンネルは確認用に起動したままです。PCや実行プロセスが停止すれば使えなくなり、正式な公開環境にはなりません。
