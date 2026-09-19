# GitHub画面から直接アップロードする版

最新ファイル：IdeaNova_Browser_Upload_2026-09-12.zip

1. ZIPを「すべて展開」します。
2. 展開先の dist フォルダーを開きます。
3. GitHubで https://github.com/sakibou5922/ideanova/upload/main を開きます。
4. distの中身（index.html・assets・images・cosmetics・.nojekyll）をまとめてドラッグします。
5. アップロードが終わったら Commit changes を押します。
6. Settings → Pages → Sourceを Deploy from a branch にします。
7. Branchを main、フォルダーを /(root) にして Save を押します。
8. 公開処理の完了後、Pagesに表示される Visit site のURLを共有します。

GitHub上で README.md と同じ階層に index.html・assets・images・cosmetics が表示される配置です。
この方法では .github フォルダーや手動のGitHub Actions設定は使いません。

公開されるのはデザイン確認版です。写真・記事・商品・画面の移動を確認できます。
会員登録・注文・決済・送信は行いません。PCを起動し続ける必要はありません。

## 確認済み

- 全40ファイル。最大約11.98MiB。ブラウザーの100ファイル・1ファイル25MiBの制限以内。
- 字体と画像の元データは維持し、フォントの小分けファイルをCSSへまとめ、両サイトで画像を共有。
- 1440・1024・768・390・320pxのホーム画面を整理前と比較し、画像寸法・画素に差がないことを確認。
- 会社・記事・化粧品・農作物の移動、再読み込み、カテゴリー検索、問い合わせ確認、送信しない制御を確認。
- API通信0件、ブラウザーエラー0件、HTTP取得失敗0件。

アップロードの公式説明：https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
Pagesの公式説明：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
