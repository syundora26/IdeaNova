株式会社SD 宇宙デザイン（明るさ調整版）

公開中の最新版と同じデザインです。
PC・スマートフォンに対応しています。

【内容】
index.html / assets / images / favicon.svg / og.png / robots.txt
  公開用の完成データです。HTML、CSS、JavaScript、背景画像を含みます。
source/
  編集用の元データです。

【Webサーバーへの設置】
index.html と assets、images、favicon.svg、og.png、robots.txt を、
フォルダーの位置関係を変えずにアップロードしてください。
source フォルダーとこの説明書は、公開サーバーへのアップロードには不要です。

【PCでの確認・編集】
Node.js をインストールしたPCで、source フォルダーを開き、
以下を順に実行してください。

npm ci
npm run dev

表示されたURL（通常は http://localhost:4173/ ）をブラウザーで開きます。
編集後の公開データは npm run build で source/dist に生成されます。

完成データをローカルで確認する場合も、ローカルWebサーバー経由で開いてください。
フォントには Google Fonts を使用しているため、フォントの取得にはインターネット接続が必要です。

元サイトの文言を維持しています。会社情報・メールアドレス・実績のサンプル表記も、元サイトと同じです。
