# 化粧品ショップ別ドメイン化・接続仕様

2026-09-11 / ユーザー承認の別ドメイン化計画に基づく追加仕様

## 1. 実装範囲

同じReact＋TypeScriptプロジェクトから、企業・農作物用と化粧品用を別々に起動・ビルドする。共通会員・商品・注文・レビュー・紹介・問い合わせ・記事・管理設定・監査はローカル共通サービスへ移した。ログインとカートはサイト別セッションで管理する。正式ドメイン、DNS、本番公開、実決済、実メール、外部発送、本番DBは対象外。

添付C仕様書の業務要件は維持し、D資料の画面構成を継続利用する。別ドメイン化とログイン分離については、後から承認された今回のユーザー要求を優先する。旧ドメインideanova.jpの移行は行わない。

## 2. 起動・ビルド・配置

| 対象 | ローカル | 起動 | ビルド出力 |
|---|---|---|---|
| 企業・農作物 | `http://127.0.0.1:5177` | `npm run dev:corporate` | `dist/corporate` |
| 化粧品 | `http://127.0.0.1:5179` | `npm run dev:cosmetics` | `dist/cosmetics` |
| ローカル共通サービス | `http://127.0.0.1:5180` | `npm run dev:service` | デモ用Nodeプロセス。公開しない |

`npm run dev:all`で3プロセスを起動する。サービスはNode 24＋既存のViteを利用してTypeScriptの業務エンジンを読み込む。追加の外部サービス・npm依存はない。Nodeプロセス終了で共通データは消える。フロントの再読み込みだけでは会員・注文等は消えない。

`npm run build:preview`は2種類のローカル確認用成果物を作る。`npm run build`、`build:corporate`、`build:cosmetics`は公開用の構成チェックを行う。`VITE_CORPORATE_ORIGIN`と`VITE_COSMETICS_ORIGIN`に異なる正式HTTPSオリジンが必要。未設定、localhost、127.0.0.1、予約・例示ドメイン、パス・クエリ・認証情報付きURLでは停止する。ドメインの所有権確認を代替するものではない。

公開用ビルドが成功しても本番APIの実装完了を意味しない。ブラウザ側は今回のデモ接続 `/demo-api/rpc` のままであり、本番ではLaravel用アダプターへ交換する。確認シナリオは公開用ビルドでは表示しない。本番でデモサービスを公開してはならない。

静的ホスティングでは両サイトそれぞれの既知のSPAパスを各`index.html`へ返す。APIパスをHTMLへフォールバックしない。サイト間リンクは`src/site.ts`、Viteの環境設定に集約した。企業の化粧品事業紹介は残し、絶対URLの通常リンクで同じタブへ遷移する。

## 3. URL対応

以下の「企業」「化粧品」は設定済みの各オリジンを表す。

| 入口 | 移動先・動作 |
|---|---|
| 企業 `/business/cosmetics` | 企業側の事業紹介。購入CTAのみ化粧品 `/` |
| 企業 `/shop` | 農作物中心のショップ入口、化粧品は独立サイトへの案内 |
| 企業 `/shop/agriculture/products/{id}` | 企業内の農作物詳細 |
| 企業 `/cosmetics`、`/shop/cosmetics` | 化粧品 `/` |
| 企業 `/cosmetics/products/{id}`、`/shop/cosmetics/products/{id}`、`/products/{id}` | 化粧品 `/products/{id}`。商品ID保持 |
| 企業 `/products/{id}?business=agriculture` | 企業 `/shop/agriculture/products/{id}?business=agriculture` |
| 企業 `/shop/cart?business=cosmetics`、`/shop/checkout?business=cosmetics` | 化粧品 `/cart`、`/checkout` |
| 企業の旧 `/cart`、`/checkout`（事業省略） | 旧実装の既定事業を保持して化粧品へ |
| 企業 `/shop/cart`、`/shop/checkout`（事業省略） | 新しい農作物カート・購入手続き |
| 企業 `/login?next=/checkout?business=cosmetics`等 | 化粧品 `/login?next=/checkout`。registerも同様 |
| 企業 `/shop/contact?business=cosmetics&order={id}` | 化粧品 `/contact?order={id}` |
| 化粧品 `/shop/cosmetics/products/{id}`等の内部互換パス | 化粧品 `/products/{id}`等へ正規化 |
| 企業 `/admin` | 共通管理。化粧品 `/admin`はページなし、管理RPCも拒否 |

`next`、`returnTo`、`redirect`を`next`へまとめる。復帰先は商品・カート・購入・注文・会員の既知の内部パスのみ。任意の絶対URL、プロトコル相対URL、バックスラッシュ、ログインへのループは拒否し会員ページへ戻す。転送先オリジンをクエリから受け取らない。旧URLへの直接アクセスは置換遷移し、履歴のリダイレクトループを作らない。旧カートがあれば移動前に引き継ぎ案内を表示する。

## 4. 共通サービスとサイト別セッション

```text
企業・農作物 React :5177 ─ ShopGateway ─ 同一オリジン /demo-api ─┐
                                                              ├─ ローカル共通サービス :5180
化粧品 React :5179 ───── ShopGateway ─ 同一オリジン /demo-api ───┘      ├ 共通データ
                                                                     └ サイト別セッション
```

- `src/httpGateway.ts`がHTTPアダプター。`GatewayProvider`は初期セッション取得を待ってからルートを描画する。会員確認前の誤ったログイン案内を防ぐ。
- Viteプロキシがサイト識別を上書きする。共通サービスはOrigin、JSON Content-Type、操作allowlist、業務・所有者・管理権限を検査する。サイト指定を入力フォームから信用しない。
- ローカルではポートが異なってもCookieのホストは同じなので、`ideanova_corporate_demo`と`ideanova_cosmetics_demo`を使い分ける。どちらもランダムな不透明値、HttpOnly、SameSite=Lax、Path=/、有効期間24時間。HTTPローカル用なのでSecureは本番で必須とする。
- 登録後のログインは登録を行ったサイトのみ。メールとパスワードは共通データで照合する。デモ初期アカウントは`demo@example.invalid` / `demo-password`。ローカルサービスではパスワードのsalt付きscrypt照合値をメモリに保持する。パスワード・セッショントークンをlocalStorage・sessionStorage・移動URLへ入れない。
- ログアウトはそのサイトの会員状態だけを解除し、他サイトの会員状態と両カートに影響しない。ページ再読み込み・フォーカス・同一サイト内の移動時に現在会員を確認するため、他サイトのプロフィール変更も反映される。共通データの更新番号も取得し、開いた管理画面に戻った際は新着注文・問い合わせ等を再取得する。プロフィールの編集中入力は上書きしない。
- カートはサービスのサイト別セッションで保持し、商品ID・数量だけを各オリジンの`ideanova-{site}-cart-v3`に保存する。ログイン情報、個人情報、金額は保存しない。セッション初期化時にその事業の保存カートだけを復元・検査する。
- 共通の小規模メモリエンジンは処理を直列化し、各操作の前後でセッションを切り替える。await中に別会員の状態が混ざらない。デモ用の実装判断であり、本番の処理能力・排他制御を保証する方式ではない。
- シナリオはサイト別。企業側`/preview`には共通データ初期化と管理権限のデモ操作、両サイトには各事業の失敗確認を配置する。通常利用画面には検証スイッチを置かない。

管理への入室と権限選択は説明付きのデモであり、実際の管理者認証ではない。パスワード回復の`demo-reset`も画面確認専用で、本番の本人確認・期限付き一回限りトークンではない。実個人情報を入力しない。

## 5. デモ通信契約

両サイトの同一オリジンへ `POST /demo-api/rpc`。本文は`{method,args}`。既存の全ShopGateway操作の引数・業務型は`domain.ts`および`CONNECTION_SPEC.md`第5章に対応する。応答は`{value?,error?,snapshot}`、通信形式不正は400、Origin等の拒否は403。業務エラーはデモRPCの200応答中の`error`で表現し、アダプターがGatewayErrorへ戻す。本番RESTのHTTP状態コードとは区別する。

| 操作 | 入力 | 出力 | 主なエラーと画面復帰 | C REQ |
|---|---|---|---|---|
| bootstrap（HTTP初期化） | このサイトのCartLine[] | GatewaySnapshot | 接続不可は起動案内と再試行。認証はCookieからのみ | REQ-MEM-003、REQ-PRD-005 |
| register / login | RegisterInput / email,password | 共通Member＋このサイトの会員状態 | VALIDATION、REFERRAL_INVALID、UNAUTHENTICATED。入力保持、安全なnextへ復帰 | REQ-MEM-001〜004、006 |
| getSession / updateMember / logout | Cookie / MemberInput / なし | Memberまたはnull | 登録情報の同期。更新でid・referrerIdを受け付けない。ログアウトは操作サイトのみ | REQ-MEM-003、005 |
| listProducts / getProduct / getShipping | 事業・検索条件 / 事業,id / 事業 | ProductResult / Product / ShippingConfig | 別事業はFORBIDDEN。商品一覧に戻す | REQ-PRD-001〜004、REQ-AGR-001〜003 |
| changeCart / quoteCart / createOrder | 事業,id,数量 / 事業 / CreateOrderInput | snapshot / CartQuote / Order | サイトの事業を再検査。異事業見積はFORBIDDEN。価格・在庫変更はCONFLICTで再確認 | REQ-PRD-005〜007、REQ-ORD-001〜003 |
| getOrders / getOrder / 支払い3操作 | サイトの事業 / 注文id等 | 自事業のOrder[] / Order | 共通会員でも他サイトの事業はFORBIDDEN。結果不明はPAYMENT_PENDING、照会へ | REQ-MEM-007、REQ-ORD-004、REQ-PAY-001〜003 |
| レビュー4操作 / 紹介検証 | 商品id、投稿内容、コード等 | ReviewCollection / ReviewOwn / ReferralResult | 化粧品のみ。未会員の本文取得はUNAUTHENTICATED、他事業はFORBIDDEN | REQ-REV-001〜006、REQ-REF-001〜005 |
| createInquiry / 管理操作 | InquiryInput / 対象id、状態、理由等 | 受付id / AdminSnapshot等 | サイトの窓口を検査。化粧品側管理RPCはFORBIDDEN。失敗時は入力・返信履歴保持 | REQ-INQ-001〜004、REQ-ADM-001〜004 |

注文の冪等キーはサイト・セッション・会員と組み合わせる。問い合わせもサイト・セッションを付け、別の利用者が同じ文字列を使っても受付を混同しない。共通管理の集計は2事業、問い合わせは会社・化粧品・農作物の3窓口。既存の事業担当/全体/閲覧専用によるサーバー側検査を維持する。

## 6. 旧化粧品カートの引き継ぎ契約

旧`ideanova-cart-v2`、なければ`ideanova-carts`の化粧品明細を企業サイトで読み、案内を表示する。元キーの書換え・削除は行わない。企業側の化粧品changeCart/quoteCart/createOrderは共通サービスで拒否する。

| 操作 | 入力 | 応答 | エラー・復帰 | 対応 |
|---|---|---|---|---|
| issueMigration（企業のみ） | CartLine[]。商品ID・1〜99の整数数量、最大100明細 | ランダム移行id、expiresAt | 形式不正VALIDATION、農作物IDはNOT_FOUND。案内を再作成 | REQ-PRD-005、006、追加承認の移行要件 |
| inspectMigration（化粧品のみ） | id | items：名称、旧数量、既存数量、引継数量、現在単価、注意文、期限、applied | 期限切れ/不明idはNOT_FOUND、他セッションで使用済みはFORBIDDEN。企業で案内を作り直す | 同上 |
| applyMigration（化粧品のみ） | id、確認したitems | MigrationPreview(applied=true) | 金額・数量等の差分はCONFLICT。入力案内を保持し最新内容の再確認へ | REQ-PRD-005〜007、追加承認の移行要件 |

IDは24バイト乱数、有効期限10分。転送URLにはこのIDと許可済みの内部nextだけを載せる。移行記録にはID・数量を保持し、元会員の氏名・メール・認証情報・確定価格は移さない。

移行先に同一商品があるときは数量を加算せず、両者の多い方を採用して現在在庫を上限とする。販売停止は引き継ぎ対象外、在庫不足は減数予定を表示する。新カートに既存の販売停止明細がある場合、それを勝手に削除しない。確認表示から確定までに価格・数量・在庫が変わると再確認を要求する。新規の価格は必ず現在値で表示する。

確定時に移行IDを移行先セッションへ結び付け、同じIDの再試行は同じ結果を返す。確定後に利用者が商品を削除しても、再試行によって復活させない。元の農作物カートと旧化粧品保存データは変更しない。期限切れ確認は企業側`/preview`の「カート移行の期限切れ」で再現できる。

## 7. 本番Laravel接続案

共通Laravel側にusers、products、orders、reviews、referrals、inquiries、audit等の正本を置く。両サイトの同一オリジン`/api`を共通基盤へ接続するリバースプロキシまたはBFFを用意する案とする。別の登録ドメイン間でCookieを共有する設計にはしない。Fortify／Sanctumの採用、各入口のセッションCookie・CSRF・ガードの具体設定はバックエンド担当と確定する。

- CookieはSecure・HttpOnly・ホスト限定。セッションレコードにサイト識別を結び付け、別サイトセッションの再利用を拒否する。
- 会員DBは共通、セッションストア上のログインはサイト別。ログアウトは当該セッションのみ失効する。サイト間ログイン転送トークン/SSOは導入しない。
- サーバーで配信先と対象事業を決め、注文・金額・在庫・割引・所有者を毎回検査する。管理APIは企業の管理入口のみ、別途管理者認証・Policyを必須とする。
- 共通データ更新後の再取得でプロフィールを同期。会員情報変更前の再認証、メール確認・変更時の通知、パスワード変更後の既存セッション扱いは本番運用として確定する。
- `/api/v1/cart-transfers`で作成、`/{id}`で確認、`/{id}/consume`で確定する案。期限・対象サイト・移行先・使用済み状態をDBで保持し、移行の二重適用を一意制約とトランザクションで防止する。
- 本番は旧カートに保存した金額を使わず、サーバー見積・在庫ロック・確認済みバージョンで注文を確定する。送信・決済の結果不明は冪等キーと状態照会で回復する。

税・端数・送料、銀行口座・期限、PayPay契約、外部発送条件、正式会社・商品情報、法務文言は未確定。ランキング、AI推薦、多階層紹介、紹介料の自動計算・自動支払いは追加していない。
