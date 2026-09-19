> 前版の記録です。現在の構成は [BOTANICAL_UI.md](BOTANICAL_UI.md)、検証は [BOTANICAL_VALIDATION.md](BOTANICAL_VALIDATION.md) を参照してください。

# 個別UI部品への改修・検証結果

2026-09-11。Edge（Playwright）、ローカル企業5177・化粧品5179で確認。

| 検証 | 結果 | 記録（qa/component-ui内） |
|---|---|---|
| TypeScript・企業／化粧品のプレビュービルド | 成功 | build.log |
| 既存単体テスト | 4ファイル・53件成功 | unit-results.json |
| 個別設定の独立性 | 見出し・本文・写真・ボタンを順に変更。他の部品のスタイル・内容・リンクを保持 | component-props.json |
| FVと開放的な配置 | 指定5画面でヘッダー＋FVが画面高と一致。6セクションの外枠・背景・左右内余白なし | component-layout.json |
| 長文・写真差し替え | 横はみ出し・セクション間の重なりなし。ヘッダー実測値の変更にも追従 | component-layout.json |
| 企業ページ | 13ページ×4幅の52画面 | results.json |
| アクセシビリティ自動検査 | PC・スマートフォン26回、WCAG A/AA対象の違反0件 | results.json |
| キーボード | メニューのEnter・Tab・Escape、フォーカス復帰、現在地表示、リンク操作 | results.json |
| 記事・問い合わせ | 読込・空・失敗・再試行、入力確認・修正・失敗時保持・再送完了。失敗応答はテスト内の模擬応答 | results.json |
| 参考画像からの独立 | 提供PNGを通信遮断しても全写真が表示。文字選択・写真差し替えを4幅で確認 | independence.json |
| ショップ往復・状態保持 | 同一タブで化粧品へ移動して戻り、農作物へ移動。会員とカート1点を保持 | results.json |
| スタイルの分離 | ショップ・管理6画面で企業CSSを無効にしても寸法・色・文字などが一致 | results.json |
| 配信ビルド | 7項目成功。化粧品への移動・詳細再読込・管理非配置・農作物カテゴリー別表示 | build-smoke.json |
| 業務処理の保存 | 会員・カート・注文・問い合わせ・接続・共通サービスなど13ファイルが前回納品ZIPと完全一致 | business-preservation.json |

## FVの実測値

| 画面 | ヘッダー | FV | 合計 |
|---|---:|---:|---:|
| 1440×900 | 72px | 828px | 900px |
| 1440×1080 | 72px | 1008px | 1080px |
| 768×1024 | 72px | 952px | 1024px |
| 390×844 | 72px | 772px | 844px |
| 320×740 | 72px | 668px | 740px |

## 画面記録

- [PC全体：1440×900](../qa/component-ui/after/1440x900-home.png)
- [PCのFV](../qa/component-ui/after/1440x900-fv.png)
- [スマートフォン全体：390×844](../qa/component-ui/after/390x844-home.png)
- [スマートフォンのFV](../qa/component-ui/after/390x844-fv.png)
- [変更前のPC](../qa/component-ui/before/1440x900-home.png)
- [変更前のスマートフォン](../qa/component-ui/before/390x844-home.png)

追加で844×390の横向き、720×450で125％文字拡大、200％ズーム相当の720pxビューポートを確認しました。ブラウザー自体の200％ズーム操作や実機での操作は未検証です。自動アクセシビリティ検査は完全な適合保証ではありません。

今回の改修は企業UI部品と配置の整理です。本番接続・実認証・決済・送信・ドメイン公開は対象外。正式な会社情報・商品情報の確認中表記を維持しています。
