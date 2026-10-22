# Googleログインの設定

新版にGoogleログインを追加しました。既存の共有Firestore版には追加しません。サーバー設定が揃った場合だけログインボタンが出ます。現時点ではGoogleで実際にログインできたという記録ではありません。

## Google側で用意するもの

1. Google Cloudの `ailandgames` プロジェクトで「Google Auth Platform」を開きます。
2. 「ブランディング」「対象」「データアクセス」を設定します。ゲーム名と問い合わせ先を登録し、テスト中は対象のGoogleアカウントをテストユーザーへ追加します。
3. 「クライアント」でウェブアプリケーション用のクライアントを作成します。
4. 承認済みのリダイレクトURIへ `https://ailandgames.web.app/api/auth/google/callback` を登録します。
5. 発行されたクライアントIDを `GOOGLE_CLIENT_ID`、クライアントシークレットを `GOOGLE_CLIENT_SECRET` としてサーバーに設定します。秘密情報はチャットやGitへ貼りません。

サーバーの公開スクリプトは、`GOOGLE_CLIENT_ID` が設定されている場合にGoogleログインを有効にする設定を追加します。秘密情報は同名のSecret Manager `GOOGLE_CLIENT_SECRET` を事前に作成し、実行用サービスアカウントへ読み取り権限を付けておきます。Web画面へ秘密情報を埋め込む設定はありません。

これはGoogle認証をサーバーへ直接つなぐ構成です。Firebase AuthenticationのGoogle設定だけでは、この実装のログインは有効になりません。

## LINEと同じセーブを使う

1. 先に、既存セーブがあるアカウントへLINEでログインします。
2. 保護者設定の「アカウント」で「Googleログインを追加」を押します。
3. 連携したいGoogleアカウントを選んで認証します。
4. 以後はLINEでもGoogleでも、同じゲームアカウント・セーブ・施設枠・購入状況を使えます。

先にGoogleから新規ログインすると、LINEとは別のゲームアカウントが作られます。メールアドレスや表示名が同じでも自動で統合しません。すでに別アカウントへ登録済みのGoogleアカウントとの連携は拒否します。

JSON移行先の許可はゲーム内部のアカウントIDで判断するため、Googleで作った施設アカウントでも、管理者がそのIDを許可すれば取り込めます。既存LINEの施設アカウントを利用している場合は、先にGoogleを連携して同じIDを維持してください。

## ログイン状態

GoogleもLINEと同じく8時間です。Googleログインの追加で30日間へ変更したわけではありません。ログアウト・別のブラウザー・期限切れの場合には再ログインが必要です。

公式資料: https://developers.google.com/identity/openid-connect/openid-connect
公式のトークン確認: https://developers.google.com/identity/sign-in/web/backend-auth
