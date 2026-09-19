# IdeaNova — 内容に合う高さと余白（現行仕様）

2026-09-12。対象は企業トップと企業共通ヘッダー・フッター。参考画像は雰囲気の基準に留め、画像の1024px座標や縦横比からページ全体を拡大する方式を撤去しました。以前の±10px位置合わせは今回の完成条件ではありません。

## 高さと余白

| 領域 | PC | 1000px以下 |
|---|---|---|
| ヘッダー | 72px | メニュー式、72px |
| FV | ヘッダーとの合計が clamp(520px,70svh,720px)。長文時は伸長 | 文字→写真。写真280〜420px、画面高指定なし |
| 2事業 | 2列、上下64px。見出し・説明・ボタンを共有する行で整列 | 化粧品→農作物。上下56px |
| 会社紹介 | 文章と写真の2列、上下80px。写真は右端まで | 1列、上下56px |
| 価値観・お知らせ | 上下48px。価値観4列・記事行64px以上 | 上下48px。価値観2列 |
| フッター | 上下56px、法務と問い合わせ領域に必要な高さを確保 | 縦方向に並べ替え、リンクを折り返す |

文章領域は最大1280px、左右余白PC40px・小画面20px。本文18px／17px、補足14px以上。主要操作52px以上。大画面で本文や各セクションの余白は一律拡大しません。パネルの外枠・交互背景は追加していません。

## 独立したUI

| ファイル・部品 | 役割 |
|---|---|
| ReferenceHome.tsx | 通常の文書順、事業の共有行、既存記事データの受け渡し |
| CorporateUI.tsx（変更なし） | 見出し、強調語、説明、操作、記事、ロゴ、価値観 |
| CorporateMedia.tsx / HeroPhotographs | 女性、商品、生成りの曲線を独立配置 |
| CorporateMedia.tsx / BusinessPhotographs | 花と収穫を別の領域に配置。切り抜きと境界線に同じローカルSVGパスを使用 |
| CorporateMedia.tsx / CorporatePhoto | 画像URL・位置・形を個別指定。写真はobject-fitで表示し縦横に変形させない |
| reference.css | 高さ、余白、画面幅別の配置。企業レイアウトの中だけに適用 |

曲線・商品・石台は写真専用の領域だけで重なります。文章や操作に画像座標の絶対配置を使いません。事業の写真は上下の接続余白まで描画し、本文の高さが変わっても写真と境界線が分離しない構造です。

## 素材

既存素材7点を継続使用し、今回の新規生成や参考JPGのページ配信はありません。

- reference-woman.png：女性と木漏れ日
- reference-products.png：商品・花・石台の透過素材
- reference-flower.png：花びら
- reference-harvest.png：野菜と収穫する手
- reference-city.png：山と街並みのイメージ
- reference-leaves.png：植物の透過装飾
- reference-stone-extension.png：曲線間に見える石台の接続補完

街並み・商品はイメージです。旧HPの会社情報、参考画像内の架空の記事・商品効能・SNSリンクは追加しません。素材ファイルの一覧・ハッシュは qa/natural-layout/assets.json。見出し・説明・写真・ボタンを差し替える部品検証を実施しました。

## 維持した機能

化粧品の同一タブ別サイト移動、農作物ショップ、記事詳細、会社問い合わせ、サイト別会員・カート・共通管理は既存実装を維持。ShopGateway、公開API、認証・カート・注文の型や保存方式を変更していません。通常は非表示のスキップリンク、キーボード用メニュー、動きを減らす設定を維持しています。

## プレビューと確認

- 企業・農作物：http://127.0.0.1:5177/
- 化粧品：http://127.0.0.1:5179/
- 起動：npm ci → npm run dev:all
- 高さ・余白：npm run test:layout
- 個別部品：npm run test:components
- 企業・業務導線：npm run test:corporate
- 単体テスト：npm test
- 両サイトのローカル用ビルド：npm run build:preview
- ビルド設定・動作：npm run test:build

test:polish は現行の高さ・余白検証を指します。reference-match-layout.cjs、reference-polish.cjs、reference-comparison.cjs は旧座標仕様の履歴で、現行の合否判定には使いません。

本番公開・ドメイン設定は行っていません。認証・決済・送信は引き続きデモです。
