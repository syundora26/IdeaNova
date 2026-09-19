> 前版の記録です。現在の構成は [BOTANICAL_UI.md](BOTANICAL_UI.md)、検証は [BOTANICAL_VALIDATION.md](BOTANICAL_VALIDATION.md) を参照してください。

# 個別UI部品と開放的な企業トップ

2026-09-11。企業トップと共通ヘッダー・フッターの現行仕様です。6つの大きな外枠・角丸・境界線・交互の背景を撤去し、見出し・本文・写真・操作を個別に調整する構成に変更しました。

## 部品一覧

| ファイル | 部品 | 個別に調整できる内容 |
|---|---|---|
| CorporateUI.tsx | EditorialHeading | 小見出し、本文見出し、h1〜h3、改行、朱色の句点、文字サイズ、見出し間の間隔 |
| CorporateUI.tsx | CorporateDescription | 文章、本文幅、行間、上の間隔、用途別クラス |
| CorporateUI.tsx | CorporateAction | 文言、リンク先、ボタン／文字リンク、深緑／朱色、外部リンク矢印 |
| CorporateUI.tsx | CorporateCategory | 写真設定、カテゴリー名、検索先。写真・名前・矢印をまとめた操作領域 |
| CorporateUI.tsx | CorporateNewsRow | 実際のお知らせ1件を渡してタイトルと詳細リンクを表示 |
| CorporateUI.tsx | CorporateColumnCard | 実際のコラム1件と独立した写真設定を渡して表示 |
| CorporateUI.tsx | BusinessLabel | 事業番号、事業名、装飾の区切り線 |
| CorporateUI.tsx | CorporateNavItem | 文言、移動先、現在地。Enter・Tabで操作する通常のリンク |
| CorporateUI.tsx | ArticleState | 読込中・空・取得失敗・再試行。既存の動作を継続 |
| CorporateMedia.tsx | CorporatePhoto | 画像URL、代替テキスト、表示位置、縦横比、曲線、読込優先度 |
| CorporateMedia.tsx | HeroPhotographs | 3枚の独立写真とSVG曲線・区切り線 |
| CorporateMedia.tsx | PhotoNote | 写真から独立した短文。通常配置／写真上の配置 |
| CorporateMedia.tsx | LeafDecoration / FooterCurve | 写真に埋め込まない葉とフッターの曲線 |

既存の下層ページ用CorporateHeading・CorporateButton・CorporateArticleListも継続しています。ReferenceHome.tsxは部品の配置と記事データの受け渡しを担当します。画面上に編集操作や検証スイッチは追加していません。

## 寸法と操作

- 本文最大1440px。セクションに外枠と左右の内余白はありません。画面端の安全な余白は共通の本文幅で確保します。
- セクション上下の余白はPC80px、1000px以下64px、600px以下56px。内容が増えると高さも伸びます。
- FVはヘッダーの実測高さを差し引いた100svhを最低高さとし、文字・写真が収まらない場合は伸びます。スマートフォンの写真領域は最低260pxです。
- 明朝体・深緑・生成り・朱色と独立写真は継続使用します。郡山の実写の出典を保持しています。
- 操作部品には文字ラベル、ホバー、フォーカス表示を用意しています。ナビゲーションは移動先の現在地を表示します。
- スタイルは企業レイアウト内に限定します。化粧品への移動は既存のルーター経由で同じタブ。農作物カテゴリー・記事・問い合わせも既存URLを使用します。

## 確認方法と記録

`npm run test:components` は、指定5画面のFV・外枠撤去・セクション寸法・長文・写真差し替え・横向き・文字拡大・スクロールを検証します。さらに実際のReact部品をテスト内だけで描画し、見出し・説明・写真・ボタンの設定をそれぞれ変更して、ほかの部品の文字・スタイル・リンク先が変わらないことを比較します。

`npm run test:corporate` は企業13ページを4幅で確認し、メニュー、記事状態、問い合わせ失敗・再試行、ショップへの同一タブ移動と会員・カート保持を確認します。ショップ・管理6画面は企業CSSの有効／無効で表示が変わらないことを比較します。

写真・参考PNGからの独立性は `node tests/independent-ui.cjs`、ビルド後の導線は `node tests/build-smoke.cjs` で確認します。結果・スクリーンショットは `qa/component-ui` に保存します。200％相当の狭いビューポートと125％の文字拡大を検証対象とし、ブラウザー操作による実際の200％ズームとは区別しています。

正式な会社情報・商品・運用条件は引き続き確認中です。旧HPの会社情報は使用していません。公開API、会員、カート、注文、認証、決済、保存方式の変更はありません。
