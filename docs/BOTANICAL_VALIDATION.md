> 履歴資料。現行仕様は [REFERENCE_MATCH.md](REFERENCE_MATCH.md)、現行検証は [REFERENCE_MATCH_VALIDATION.md](REFERENCE_MATCH_VALIDATION.md) です。

# 新しい参考デザインへの変更・検証結果

2026-09-12。ローカル企業サイト5177・化粧品サイト5179をEdge（Playwright）で確認しました。

| 確認内容 | 結果 | 記録（qa/botanical-ui内） |
|---|---|---|
| TypeScript、企業・化粧品のプレビュービルド | 成功 | build.log |
| 既存の単体テスト | 4ファイル・53件成功 | unit-results.json |
| 指定5画面のFV | ヘッダーと合わせて画面高に一致、横はみ出しなし | botanical-layout.json |
| 素材の独立性 | 提供JPG・旧参考PNGへの通信を遮断しても表示。全5素材が読み込まれ、見出しの文字を選択可能 | botanical-layout.json |
| 透過素材 | 化粧品と植物に透明ピクセルと不透明に近いピクセルを確認。生成されたアルファ値の上限は254 | botanical-layout.json |
| 個別UIの設定 | 見出し・説明・写真・ボタンを個別変更し、他の部品の文言・スタイル・リンク先に影響なし | component-props.json |
| 長文・差し替え・横向き | 見出し・記事を長くし、写真を交換。文字とボタンの重なり・横スクロールなし | botanical-layout.json |
| 記事の導線 | 日付順にn01・n02・j01を表示し、元のニュース・コラム詳細へ移動 | botanical-layout.json |
| 企業ページ | 13ページ×4幅、52画面を確認 | results.json |
| アクセシビリティ自動検査 | PC・スマートフォン26回、最終の写真接続調整後にトップ2回を追加。対象WCAG A/AA違反0件 | results.json / final-home-a11y.json |
| メニュー操作 | Enter・Tab・Escape、フォーカス復帰、移動後の現在地とメニュー閉鎖 | results.json |
| 記事の状態 | 読込・0件・失敗・再試行。統合した1つの一覧で表示 | results.json |
| 問い合わせ | 入力不備、確認、修正、送信失敗時の入力保持と再試行完了。失敗応答はテスト内の模擬応答 | results.json |
| サイト往復 | 化粧品へ同一タブで移動し、戻って農作物へ。会員とカート1点を保持 | results.json |
| スタイル分離 | ショップ・管理6画面で企業CSSを無効にしても表示寸法・文字・色などが一致 | results.json |
| ビルド後の動作 | 7項目成功。独立サイト移動、商品詳細の直接アクセス・再読込、カテゴリー選択・既存カテゴリーURL | build-smoke.json |
| 業務処理の保持 | 会員・カート・注文・問い合わせ・接続・共通サービスなど13ファイルが前回のソースZIPと完全一致 | business-preservation.json |

## FVの実測

| 画面 | ヘッダー | FV | 合計 |
|---|---:|---:|---:|
| 1440×900 | 88px | 812px | 900px |
| 1440×1080 | 88px | 992px | 1080px |
| 768×1024 | 80px | 944px | 1024px |
| 390×844 | 80px | 764px | 844px |
| 320×740 | 80px | 660px | 740px |

PCの写真背景だけをFV下へ延ばして事業紹介の曲線をつなげています。文字やボタンはそれぞれの領域に配置し、FV自体の高さは上表のとおりです。スマートフォンの写真領域は390px幅で約408px、320px幅で約286pxあり、最低260pxを確保しています。

## 画面記録

- [PCのトップ全体](../qa/botanical-ui/after/1440x900-home.png)
- [PCのFV](../qa/botanical-ui/after/1440x900-fv.png)
- [背の高いPC画面](../qa/botanical-ui/after/1440x1080-home.png)
- [タブレット](../qa/botanical-ui/after/768x1024-home.png)
- [スマートフォンのトップ全体](../qa/botanical-ui/after/390x844-home.png)
- [スマートフォンのFV](../qa/botanical-ui/after/390x844-fv.png)
- [320px幅](../qa/botanical-ui/after/320x740-home.png)
- [変更前のPC](../qa/botanical-ui/before/1440x900-home.png)
- [変更前のスマートフォン](../qa/botanical-ui/before/390x844-home.png)

追加で844×390の横向き、720×450で文字125％拡大、200％ズーム相当の720pxビューポートを確認しています。ブラウザー自体の200％ズーム操作と実機での操作は未検証です。自動アクセシビリティ検査は完全な適合保証ではありません。

写真は新規生成のため、参考画像とは構図・曲線・配色・文字組みを基準に比較しています。正式な会社・商品情報は確認中、本番の認証・決済・送信・ドメイン公開は未接続のままです。
