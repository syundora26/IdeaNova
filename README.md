共有用ビルド： [仕様・検証・公開待ち事項](docs/SHARE_PREVIEW.md) ／ `npm run build:share`

最新の修正： [問い合わせの輪郭・検証結果](docs/CONTACT_CONTOUR.md) ／ [修正前後の比較](qa/contact-contour/index.html)

# IdeaNova — 美しさが、未来をつくる。

React＋TypeScript＋Vite＋CSS＋GSAP。同じソースから企業・農作物と化粧品の2サイトを個別に起動・ビルドします。共通会員・共通管理、サイト別のログイン・カート・購入画面を実装したローカルデモです。

**正式ドメイン・DNS・本番公開、実認証・決済・メール・外部発送・永続DBは未接続です。** 会社情報・商品・価格・送料は仮値または確認中です。追加した共通サービスはローカル専用で、外部サービスは利用しません。

## 現在のレイアウト（2026-09-12・下部の装飾と輪郭）

価値観右下の布・ガラス容器・葉、お知らせからフッターへの浅い波形、朱色の問い合わせを元画像の構成へ寄せました。細い縦帯として繰り返していた葉は、独立した装飾へ置き換えています。FV・事業紹介・街並みは維持しています。

- [現行の変更・部品・素材・検証](docs/LOWER_FINISH.md)
- [参考と修正前後の下部比較](qa/lower-finish/comparison/index.html)

`npm run test:lower` が今回の下部検査です。前版の写真接続については [SEAM_REPAIR.md](docs/SEAM_REPAIR.md) を参照してください。旧HPの会社情報は使用しません。

## 前版の提供画像再現（履歴）

ユーザー提供画像を基準に、明朝体の見出し、曲線の写真、事業紹介と深緑のフッターを再現しています。当時の仕様は [docs/REFERENCE_DESIGN.md](docs/REFERENCE_DESIGN.md)、検証記録は [docs/REFERENCE_VALIDATION.md](docs/REFERENCE_VALIDATION.md) を参照してください。

## 以前の3色リデザイン（履歴）

深緑・生成り・朱色で、企業HPの見出し・文字・ボタン・セクションを統一しました。郡山の写真帯と大きな日本語のFVを配置し、本文は18px/17px、補足は14px以上です。農作物・化粧品ショップと管理画面は従来のデザインを維持しています。

デザイン仕様は [docs/DESIGN.md](docs/DESIGN.md)、当時の検証は [docs/CORPORATE_REDESIGN_VALIDATION.md](docs/CORPORATE_REDESIGN_VALIDATION.md)、画面記録は `qa/corporate-redesign` を参照してください。

## 起動

Node.js 24で確認しています。

```sh
npm ci
npm run dev:all
```

- 企業・農作物：[http://127.0.0.1:5177](http://127.0.0.1:5177)
- 化粧品：[http://127.0.0.1:5179](http://127.0.0.1:5179)
- 共通サービス：127.0.0.1:5180（画面なし、ローカル限定）

個別起動は `dev:service`、`dev:corporate`、`dev:cosmetics`。使用中のポートがある場合は重複起動せず、そのプロセスを確認してください。

```sh
npm run build:preview
```

確認用ビルドを`dist/corporate`、`dist/cosmetics`へ出力します。正式URL未決定のため、通常の`npm run build`は停止するのが正しい動作です。`.env.example`を参考に異なる正式HTTPSオリジンを設定後、`build:corporate`・`build:cosmetics`で個別にビルドできます。ドメイン設定だけで本番APIが接続されるわけではありません。

## ページ

| 目的 | 企業 :5177 | 化粧品 :5179 |
|---|---|---|
| トップ | `/` | `/`（化粧品一覧） |
| 会社・事業 | `/company`、`/business`、`/business/cosmetics`、`/business/agriculture` | 企業サイトへのリンク |
| 記事 | `/news`、`/journal` | 配置なし |
| 売場 | `/shop`、`/shop/agriculture` | `/` |
| 商品例 | `/shop/agriculture/products/a01` | `/products/c01` |
| 購入 | `/shop/cart`、`/shop/checkout` | `/cart`、`/checkout` |
| 会員 | `/shop/login`、`register`、`reset`、`recovery`、`account` | `/login`、`/register`、`/reset`、`/recovery`、`/account` |
| 注文詳細 | `/shop/orders/{id}` | `/orders/{id}` |
| 問い合わせ | `/contact`（会社）、`/shop/contact`（農作物） | `/contact`（化粧品） |
| 法務 | `/legal/privacy`、`/legal/terms`、`/legal/commerce` | 同じ3パス、化粧品向け案内 |
| 共通管理 | `/admin` | 配置なし、管理APIも拒否 |
| 確認シナリオ | `/preview` | `/preview`（そのサイトの操作に適用） |

企業ヘッダーに会員・カートは表示しません。化粧品事業紹介から専用ショップへ同じタブで移動します。商品ID・安全な購入復帰先を保持して旧化粧品URLからも案内します。旧化粧品カートがあれば移行案内を表示し、元の保存データは削除しません。

## デモ操作

- 共通会員：`demo@example.invalid` / `demo-password`。新規登録も可能。同じメール・パスワードで各サイトに個別ログインします。
- 一方での登録・ログインで他方は自動ログインしません。ログアウトは操作サイトだけ。登録情報は共通です。
- 紹介コードなし登録に対応。化粧品用`DEMO10`（10%）・`DEMO500`（500円）と、`STOPPED`・`EXPIRED`・`USEDUP`・`UNAPPROVED`の適用外条件を確認できます。
- `/preview`で失敗シナリオを選びます。化粧品の決済・レビューは化粧品側の確認画面、農作物・管理は企業側で設定します。
- PayPay結果不明では再決済せず、「通常の操作」に戻して同じ注文の状態照会を行います。
- 共通管理から両事業の注文・銀行入金確認・発送・レビュー公開・3窓口問い合わせ・記事等を操作できます。管理者入室と権限選択はデモで、本番の認可ではありません。
- 回復画面の`demo-reset`はデモ用の共通パスワードを変更します。メールは送信しません。

共通データはサービスのメモリに保持され、ブラウザ再読み込みでも残ります。サービス停止・再起動で初期化されます。Cookieはサイト別・HttpOnlyで、認証情報をlocalStorageや移動URLへ保存しません。商品ID・数量だけをサイト別localStorageに保存します。フォーム下書きは各ページのメモリのみです。

## 構成

| ファイル | 役割 |
|---|---|
| `src/site.ts`、`vite.config.ts` | サイト識別、移動先集約、個別起動・ビルド・公開設定検査 |
| `src/App.tsx`、`router.tsx` | サイト別画面、同一タブ遷移、旧URLと安全な復帰先 |
| `src/domain.ts` | ShopGateway、会員・金額・注文・決済・発送・レビュー・移行の型 |
| `src/httpGateway.ts` | 共通サービスへ接続、Cookieセッション初期化、サイト別カート復元 |
| `server/demo.mjs` | ローカル共通データ、会員照合、サイト別Cookie、業務スコープ、期限付き移行ID |
| `src/gateway.ts` | 共通業務エンジン、権限・在庫・金額・状態・監査の検査 |
| `src/GatewayContext.tsx` | 初期読込、状態・エラー・再試行、メモリ下書き |
| `src/MigrationPages.tsx` | 旧カートの案内・再検査・移行確認 |
| `src/Corporate.tsx`、`ShopPages.tsx` | 企業、事業、記事、法務、売場、商品、レビュー |
| `src/CheckoutPages.tsx`、`MemberPages.tsx`、`InquiryPage.tsx` | 購入、会員、各問い合わせ |
| `src/AdminPages.tsx`、`AdminSettings.tsx` | 共通管理、確認シナリオ |
| `src/styles.css` | 既存ショップ・管理を含む共通スタイル |
| `src/corporate.css`、`src/CorporateUI.tsx` | 企業専用の3色テーマ、見出し・ボタン・記事・状態表示 |

## 検証

3つのローカルプロセスが起動した状態で実行します。サービス/UIテストはデモ初期化を行うため、手動確認中のデータを残す場合は先に控えてください。

```sh
npm test
npm run test:service
npm run test:ui
npm run test:admin
npm run test:recovery
npm run test:refresh
npm run test:build
```

Microsoft EdgeをPlaywrightから使用します。`test:ui`はPC・スマートフォンの操作・スクリーンショット・横幅・axe検査を一体で実行します。`test:visual`、`test:a11y`は同じテストの別名なので重複実行不要です。`qa/separation`に今回の結果を収録します。以前の単一サイト検証は`qa/redesign`と旧ZIPに残しています。

## 納品資料

- [別ドメイン化の接続仕様](docs/DOMAIN_SEPARATION.md)
- [業務ごとの本番接続仕様](docs/CONNECTION_SPEC.md)
- [C仕様書 REQ対応表](docs/REQ_MATRIX.md)
- [検証結果・制限](docs/VALIDATION.md)
- [デザイン方針](docs/DESIGN.md)
- [素材・ライセンス](ASSETS.md)

ZIPには現行ソース・共通サービス・テスト・仕様書・検証結果を収録し、node_modules・dist・旧版アーカイブは含めません。`package-lock.json`から依存を再現できます。

## 本番で残る作業

共通Laravel会員基盤とFortify／Sanctum、サイト別Cookie/CSRF、実管理者認証・Policy、DBトランザクション・監査保存、PayPay・送信・外部発送の接続が必要です。正式ドメイン・会社情報・商品・送料/税/端数処理・銀行口座/期限・PayPay契約・法務文言は未確定です。

旧ドメインideanova.jpの移行、ランキング、AI推薦、多階層紹介、紹介料自動計算・自動支払いは追加していません。

### 企業HPの表示・操作検証

`npm run test:corporate` で13ルート×4幅、26回のaxe検査、記事状態、会社問い合わせ、メニュー、サイト往復、テーマ分離を検証します。Microsoft Edgeを利用します。問い合わせの失敗・再試行はブラウザ内の応答フィクスチャで確認し、実送信しません。サイト往復はローカルサービスのデモ会員で確認します。

