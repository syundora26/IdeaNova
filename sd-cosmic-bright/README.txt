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

【宇宙モーション版について】
背景の星空のスクロール連動、軌道を回る光点、工程の星座結線、ボタン等のマイクロインタラクションを追加しています。
設計・実装・監査の記録は docs/MOTION_DESIGN.md と docs/motion/ にあります。
prefers-reduced-motion（視差効果を減らす設定）の環境では従来どおりの静止表示になります。
images の 2 枚は以前 CSS で掛けていた明るさ調整を画像に焼き込んだものです（source/scripts/bake-filters.py で再生成できます）。
