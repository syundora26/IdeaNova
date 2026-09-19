# IdeaNova 本番接続仕様書

2026-09-11 / 郡山企業サイト・専用ショップ改修 / フロントエンド接続設計

## 1. 今回の完成範囲と接続境界

React・TypeScript・Vite・CSS・GSAPで企業・農作物と化粧品を別々に起動・ビルドします。`src/domain.ts`のShopGatewayを画面の接続窓口とし、`src/httpGateway.ts`からローカル共通サービス`server/demo.mjs`へ接続します。サービスが`src/gateway.ts`の業務エンジンを利用し、共通データとサイト別セッションを管理します。

**新しいサイト配置、Cookie、カート移行、デモ通信形式は[別ドメイン化の接続仕様](DOMAIN_SEPARATION.md)を参照してください。** 本書のHTTPパス・JSON形式は本番Laravel側との合意用提案であり、現在のRPCと同一ではありません。

C要件定義仕様書R6を業務要件、D画面デザインR4を画面状態の参考としました。郡山の地域企業、日本語、白・紺・淡いグレーと、後から承認された化粧品別ドメイン化を優先します。

企業のProviderと化粧品のProviderは独立しています。会員情報は共通ですが、ログイン・カートはサイト別です。再読み込み時にCookieセッションを取得するため、共通サービスが起動している間は会員・注文等を保持します。フォーム下書きはブラウザメモリ、商品ID・数量だけはサイト別localStorageです。旧化粧品カートは期限付きIDで確認して引き継ぎ、元データを削除しません。

パスワードはローカル共通サービスに送信してsalt付き照合値をメモリに保持します。認証情報をStorageや移動URLへ保存しません。デモ管理者入室・回復トークンは本番セキュリティの代替ではありません。実認証・決済・送信・発送・永続DBは未接続です。

## 2. 本番の責任分担

| 項目 | フロントエンド | Laravel側の正本・責務 |
|---|---|---|
| 認証 | ログイン入力、状態表示、復帰先 | Fortify／Sanctumを前提とする認証、Cookieセッション、CSRF、セッション失効 |
| 認可 | 権限を表示し、エラーから回復 | 操作ごとのPolicy／権限・担当事業・所有者の検査。非表示UIだけで代替しない |
| 価格・税 | サーバー見積の金額を表示 | 商品価格、税区分、税込総額、端数、送料、割引を再計算 |
| 在庫 | 最新数量・販売停止を表示 | 注文確定のトランザクション内で競合を防止し、在庫確保・解放を管理 |
| 注文 | 確認済み見積IDと配送先を送る | 不変の注文スナップショット、所有者、事業、冪等キー、金額・状態の保存 |
| 決済 | 決済開始と結果照会のみ | PayPay契約に応じた接続、署名等の検証、Webhook／照会による確定、二重反映防止 |
| 発送 | 配送会社・追跡情報を表示 | 外部発送先への最小限の情報受け渡し、配送状態・再連携・追跡情報の保存 |
| レビュー | 認証後の公開用情報を表示 | 所有者・化粧品限定・公開状態を検査し、公開用DTOへ投影 |
| 問い合わせ | 入力・確認・再試行・受付番号 | 保存、送信キュー、返信、送信失敗、同一送信の重複防止 |
| 監査 | 操作者・変更前後・理由を表示 | 操作者、対象、変更前後、理由、日時、request IDの改変防止を含む監査記録 |

ブラウザで認証情報・アクセストークンをlocalStorageへ保存しません。ログイン前にCSRF初期化を行い、同意履歴の版・日時も本番側で記録してください。メールアドレス回復時にアカウントの有無を不用意に開示しない応答を使用します。

## 3. 共通通信規約

ベースパス案：`/api/v1`。日時はISO 8601、金額はJPYの整数。画面では日本語表記へ変換します。識別子は不透明な文字列として扱い、フロント側で連番や形式に依存しません。

```json
{
  "data": {},
  "meta": { "requestId": "opaque-id", "version": "1" }
}
```

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "商品の価格または在庫が変わりました。",
    "fields": {},
    "retryable": false,
    "details": { "changedProductIds": ["c01"], "recovery": "requote" }
  },
  "meta": { "requestId": "opaque-id" }
}
```

| エラーコード | HTTP案 | 意味 | 画面の復帰方法 |
|---|---:|---|---|
| VALIDATION | 422 | 必須、形式、数量、同意の不備 | 入力を残し、項目メッセージを表示 |
| UNAUTHENTICATED | 401 | ログイン前・セッション失効 | 安全な内部URLを`next`に保持してログイン。復帰後は再見積 |
| FORBIDDEN | 403 | 他人の記録・事業外・権限外 | 再送で解決しない旨を表示。権限内の一覧へ戻す |
| NOT_FOUND | 404 | 商品・注文等が存在しない／閲覧不能 | 該当事業の一覧へ |
| CONFLICT | 409 | 価格・在庫・販売状態・割引・カート変更 | 注文を作成せず入力を保持。カート修正または再見積と再同意 |
| REFERRAL_INVALID | 422 | コード無効・未承認・期間外・上限 | コード訂正、またはコードを外して会員登録を続行 |
| PAYMENT_PENDING | 409 | 決済処理中・結果不明 | 再決済・支払方法変更を禁止。結果照会へ |
| NETWORK | 通信断／502等 | 通信または送信の失敗 | 内容を保持。読み取りは再読込、作成は同じ冪等キーで状態確認・再送 |
| UNAVAILABLE | 503 | 一時利用不可 | 入力を保持して案内。決済は不明状態を照会してから再開 |

読込中、0件、入力不備、未認証、権限不足、業務不成立、通信失敗を同じ空画面にまとめません。作成系の応答が不明な場合、無条件に新規作成へ進めないでください。

## 4. 主要データ型

型定義の実装正本は `src/domain.ts` です。`sample`はデモでtrue、本番adapterではfalseとして区別します。本番adapterは起動時にgetSessionを呼び、認証状態を取得してからsubscribeへ変更を通知してください。

| 型 | 主要フィールド | 境界 |
|---|---|---|
| Product | id, business, name, category, price, size, description, images[], saleStatus, inventoryTracked, availableQuantity, fulfillment, producer | 未ログインで取得可能。生産者情報はvisibleに従う |
| Member | id, name, email, phone, address, nickname, age, referrerId?, referralCode? | 本人または会員管理権限。公開レビューに流用しない |
| CartQuote | id, business, memberId, items[], subtotal, discount, shipping, total, expiresAt, referral? | 確認済み金額。注文・決済情報と分離 |
| QuoteLine | productId, name, quantity, unitPrice, discount, total | 割引を各明細に配賦したスナップショット |
| Order | id, memberId, business, items[], totals, address, status, payment, shipping, referrerId? | 注文後の価格を商品マスター変更から保護 |
| Payment | method, status, attempts, updatedAt | 注文状態と別管理。決済成功によって注文支払済みへ移行 |
| Shipping | fulfillment, status, carrier, tracking, shippedAt? | cosmetics=external / agriculture=ideanova |
| ReviewPublic | id, productId, nickname, age, rating, date, text | 氏名・住所・電話・メール・ownerIdを含まない |
| ReviewOwn | ReviewPublic + status | 本人の公開待ち・非表示も確認可能 |
| Inquiry | id, business, name, email, subject, message, memberId?, orderId?, status, assignee, replies[] | 会社・化粧品・農作物を識別して管理 |
| ReferralCode | code, referrerId, active, kind, value, productIds, start, end, maxUses, uses | 承認済み・管理登録済みの紹介者のみ有効 |
| Article | id, kind, title, text, date, category, image, published | 公開取得ではpublished=trueのみ |
| ShippingConfig | business, fee, freeOver, regionNote, dispatchNote | 基本送料・無料条件はデモ計算へ反映。地域文は案内のみ |
| AdminIdentity / AuditEntry | name, role, active / actor, action, target, before, after, reason, date | 管理者登録はデモ情報。実ログイン資格は発行しない |

## 5. 操作ごとの接続契約

下表のリクエスト・レスポンスは4節の型を参照します。エラー欄の略記は V=VALIDATION、A=UNAUTHENTICATED、F=FORBIDDEN、N=NOT_FOUND、C=CONFLICT、R=REFERRAL_INVALID、P=PAYMENT_PENDING、通信=NETWORK/UNAVAILABLE です。すべての通信操作で通信失敗が発生し得ます。

### 5.1 会員

| Gateway操作 / HTTP案 | リクエスト | レスポンス | 主なエラー | 画面復帰先 | C REQ |
|---|---|---|---|---|---|
| login / POST `/login` | email, password | Member＋Cookieセッション | V/A/通信 | 安全なnext。購入なら`/shop/checkout?business=…` | MEM-003,006 |
| register / POST `/register` | RegisterInput：6会員項目、password、任意referralCode、consent | Member＋Cookieセッション | V/R/通信 | next。無効紹介コードは入力画面で外せる | MEM-001,002 / REF-003,004 |
| getSession / GET `/member` | Cookie | Memberまたは未認証 | A/通信 | 現在画面／ログイン | MEM-003,005 |
| logout / POST `/logout` | Cookie, CSRF | 204 | A/通信 | `/shop`。事業別カートは維持 | MEM-003 |
| updateMember / PATCH `/member` | MemberInput | 更新Member | V/A/通信 | `/shop/account` 登録情報 | MEM-005 |
| requestRecovery(password) / POST `/forgot-password` | email | accepted（存在を明かさない） | V/通信 | `/shop/reset` 受付、ログインへ | MEM-004 |
| requestRecovery(id) / POST `/account-recovery` | 連絡可能なemail、kind=id | accepted | V/通信 | `/shop/recovery`。連絡先も使えなければ問い合わせ | MEM-004 |
| confirmPasswordReset / POST `/reset-password` | email, token, password | accepted | V/通信 | `/shop/reset?token=…` 完了、無効/期限切れなら案内再申込 | MEM-004 |

Fortifyの実エンドポイント名とレスポンスをadapter内で上表に合わせます。デモは確認用トークン`demo-reset`で完了状態を表示し、それ以外は無効・期限切れを表示します。本番はトークンの発行、照合、失効、パスワードの保存をLaravel側で行います。

### 5.2 商品・カート・見積

| Gateway操作 / HTTP案 | リクエスト | レスポンス | 主なエラー | 画面復帰先 | C REQ |
|---|---|---|---|---|---|
| listProducts / GET `/products` | business, category?, search?, sort? | ProductResult：items, categories | V/通信 | 同じ売場。農作物0件は専用案内 | PRD-001〜004 / AGR-001 |
| getProduct / GET `/products/{id}` | business, id | Product | N/通信 | `/shop/{business}` | PRD-002,004,006 / AGR-002 |
| getShipping / GET `/shipping-config` | business | ShippingConfig | V/通信 | 商品画面の発送案内 | SHP-001,003 / AGR-003 |
| changeCart / PUT `/cart/{business}/lines/{id}` | quantity（0で削除） | 確認済みカート | V/C/通信 | 同じカート。別事業は変更しない | PRD-005,006 / ORD-001 |
| quoteCart / POST `/quotes` | business, cart items。正式地域判定時は配送先も追加 | CartQuote | V/A/C/通信 | 購入確認。期限・状態変更時は再見積 | ORD-002 / PRD-007 / REF-005 / SHP-003 |

現在のデモはカートをサイト別CookieセッションとID・数量だけのブラウザ保存で保持します。本番の匿名カートはサーバーセッションまたは匿名カートIDへ接続し、ログイン時の統合ルールを合意してください。クライアントが送ったprice/discount/totalを信用しません。

### 5.3 注文・決済

| Gateway操作 / HTTP案 | リクエスト | レスポンス | 主なエラー | 画面復帰先 | C REQ |
|---|---|---|---|---|---|
| createOrder / POST `/orders` | quoteId, address, paymentMethod, consent, idempotencyKey | Order | V/A/C/通信 | `/shop/orders/{id}`。競合時は入力保持→カート／再見積 | ORD-001〜003 / MEM-006 / PRD-006,007 |
| getOrders / GET `/orders` | business?（サイト事業と一致必須） | 本人かつサイト事業のOrder[] | A/通信 | `/shop/account` | MEM-007 / ORD-004 |
| getOrder / GET `/orders/{id}` | id | 本人のOrder | A/N/通信 | `/shop/orders/{id}` | ORD-004 / SHP-004 |
| startPayment / POST `/orders/{id}/payments` | id、サーバー管理の決済試行キー | Payment/Order、必要なら決済先URL | A/N/C/P/通信 | 外部決済の同一タブ遷移→注文詳細 | PAY-002,003 |
| checkPayment / GET `/orders/{id}/payment` | id | 最新Payment/Order | A/N/通信 | 注文詳細。結果不明なら照会のみ | PAY-002 / ORD-003 |
| changePaymentMethod / PATCH `/orders/{id}/payment-method` | method | Order | A/N/C/P/通信 | 注文詳細 | PAY-001,002 |

注文作成は会員・事業・見積期限・カート・紹介条件・価格・販売状態・在庫を再検査します。同じサイト・セッション・会員＋冪等キーで同一注文を返します。デモでは同時の二重確定も単一注文になります。本番はDB一意制約・トランザクション・決済側冪等性で保証してください。

PayPayの金額・merchantPaymentId等はサーバー発行です。ブラウザの成功クエリだけでpaidにしません。Webhookと照会が前後・重複しても、金額照合後に1回だけ反映します。オフライン店頭用QRは使用しません。

### 5.4 レビュー・紹介

| Gateway操作 / HTTP案 | リクエスト | レスポンス | 主なエラー | 画面復帰先 | C REQ |
|---|---|---|---|---|---|
| getReviews / GET `/products/{id}/reviews` | productId、Cookie | published:ReviewPublic[], own:ReviewOwn[] | A/F/N/通信 | 化粧品商品詳細。未ログインは本文を取得しない | REV-001,003,004 |
| postReview / POST `/products/{id}/reviews` | rating 1〜5, text | ReviewOwn(status=pending) | V/A/F/通信 | 投稿確認→公開待ち | REV-002,003,005 |
| editReview / PATCH `/reviews/{id}` | productId, rating, text | ReviewOwn(status=pending) | V/A/F/N/通信 | 本人の投稿欄 | REV-006 |
| deleteReview / DELETE `/reviews/{id}` | id | 204。デモ上はhidden | A/F/N/通信 | 本人の投稿欄 | REV-006 |
| validateReferral / POST `/referral-validation` | code, business?, productIds? | ReferralResult：valid, reason, message | V/通信 | 登録のコード訂正・なし登録／見積結果 | REF-001〜005 |

公開本文を含むレスポンスは会員認証後にのみ返します。投稿者のMemberオブジェクトをそのまま渡さず、ReviewPublicへ投影します。購入履歴による投稿回数制限は設けません。本人編集は公開待ちへ戻す方式を今回のデモ運用として採用しました。

### 5.5 問い合わせ・管理

| Gateway操作 / HTTP案 | リクエスト | レスポンス | 主なエラー | 画面復帰先 | C REQ |
|---|---|---|---|---|---|
| createInquiry / POST `/inquiries` | InquiryInput＋冪等キー | id | V/A/C/通信 | 各窓口の受付完了。失敗時は内容保持 | INQ-001〜003 |
| enterAdmin / 本番管理者認証 | 管理者認証情報 | 権限と事業スコープ | A/F/通信 | `/admin` | ADM-003 |
| getAdmin / GET `/admin/overview` | 担当スコープ、フィルター | AdminSnapshot（権限内のみ） | A/F/通信 | 管理一覧 | ADM-001,002 |
| adminOrder / POST `/admin/orders/{id}/transitions` | action, reason, tracking? | Order | V/A/F/N/C/通信 | 注文一覧、状態・履歴を更新 | ORD-003,004 / PAY-001 / SHP-001,002,004 / ADM-004 |
| adminReview / PATCH `/admin/reviews/{id}` | status, reason | 204 | V/A/F/N/通信 | 公開管理 | REV-005 / ADM-004 |
| adminInquiry / PATCH `/admin/inquiries/{id}` | status, assignee | 204 | A/F/N/通信 | 統合問い合わせ | INQ-002,003 |
| replyInquiry / POST `/admin/inquiries/{id}/replies` | text, retryId? | 保存した返信と送信状態 | V/A/F/N/C/通信 | 同じ問い合わせ。失敗は未送信として再送 | INQ-004 |
| adminProduct / PATCH `/admin/products/{id}/availability` | saleStatus?, availableQuantity?, inventoryTracked?, producer?, reason | 204 | V/A/F/N/通信 | 商品の販売条件 | PRD-004,006 / AGR-002 / ADM-004 |
| saveProduct / POST・PUT `/admin/products/{id?}` | Product, reason | Productまたは204 | V/A/F/N/通信 | 商品情報編集 | PRD-002 / ADM-001 |
| saveCategory / POST・PUT `/admin/categories/{id?}` | Category, reason | Categoryまたは204 | V/A/F/通信 | カテゴリー編集 | PRD-003 / ADM-001 |
| adminMember / PATCH `/admin/members/{id}` | MemberInput, referralCode, reason | 204 | V/A/F/N/R/通信 | 会員訂正。過去注文を変更しない | MEM-002,005 / REF-004 / ADM-004 |
| saveReferrer / POST・PUT `/admin/referrers/{id?}` | name, approved, reason | Referrerまたは204 | V/A/F/通信 | 紹介者登録・承認 | REF-002 / ADM-001 |
| issueCode / POST `/admin/referral-codes` | code, referrerId, kind, value, productIds, start, end, maxUses | ReferralCode | V/A/F/通信 | 発行・再発行 | REF-003,005 |
| adminCode / PATCH `/admin/referral-codes/{code}` | active, reason | 204 | V/A/F/N/通信 | コードの停止／再有効化 | REF-003 / ADM-004 |
| getReferralSales / GET `/admin/referral-sales` | month | ReferralSales[] | A/F/通信 | 月別紹介売上 | REF-006,007 |
| saveShipping / PUT `/admin/shipping-config/{business}` | ShippingConfig, reason | 204 | V/A/F/通信 | 送料・発送案内 | SHP-003 |
| listArticles / GET `/articles` | kind=news/journal | 公開Article[] | V/通信 | 企業トップ・一覧・詳細 | COR-002,003 |
| saveArticle / POST・PUT `/admin/articles/{id?}` | Article, reason | 204 | V/A/F/通信 | 記事管理・公開状態 | COR-002,003 / ADM-001 |
| saveAdministrator / POST・PUT `/admin/administrators/{id?}` | AdminIdentity, reason | 204 | V/A/F/通信 | 管理者と権限 | ADM-003,004 |

本番は一覧をページングし、巨大な全件データをoverviewで一括返却しないよう分割してください。デモのgetAdminは画面確認用の小規模データを一括返します。

`setScenario`、`setAdminRole`、`resetDemo` は開発用です。本番APIや一般利用者の公開機能にはしません。管理権限の切り替えは本番では認証済み管理者の所属から取得します。

## 6. 状態遷移と復帰

### 注文・決済・発送

- 銀行振込：注文作成 → awaiting_payment/unpaid → 管理者の入金確認 → paid/paid → 発送準備 → shipped。
- PayPay：注文作成 → unpaid → processing → paid / failed / cancelled / unknown。
- failed/cancelled：同じ注文で支払い再開または支払方法変更。新しい注文を作り直さない。
- unknown/processing：支払開始・方法変更・取消を止め、照会だけを表示。確定した結果を反映する。
- 未入金で結果確定済みの注文のみ取消可。デモは確保在庫を1回だけ戻す。
- paid/shippedの返金はrefundedへ。返金記録は紹介売上の調整に反映。実返金は未接続。
- 化粧品の発送：unshipped → external_pending、失敗時external_failed → 管理者が再連携。追跡情報登録後shipped。
- 農作物の発送：unshipped → preparing → shipped。発送元はIdeaNova。温度帯配送は追加しない。

### レビュー・問い合わせ

- 投稿入力 → 投稿確認 → pending。管理者がpublishedまたはhiddenへ変更。
- 本人編集 → pendingへ戻す。本人削除 → hiddenとして扱う。
- 問い合わせ入力 → 確認 → 完了。失敗しても本文・宛先・件名を保持して再送可能。
- 問い合わせ管理：new / in_progress / waiting / complete。担当者、会員ID、本人の同事業注文を関連付け可能。
- 返信はsent / failedを分離。failedのretryIdを再送して同じ履歴行を更新し、成功済み返信を重複送信しない。

## 7. デモ金額・割引・集計の仮ルール

1. 商品表示額は税込JPY整数のサンプル。税率や内税分解は正式決定していません。
2. 初期基本送料：化粧品550円、農作物770円。管理画面で変更可能。送料無料条件は割引前の商品小計で判定。
3. 割合割引は対象明細の商品額×割合を円未満切り捨て。固定額割引は注文全体で1回、対象明細順に配賦し商品額を超えない。
4. 紹介コードは承認、有効状態、期間、上限、対象商品を再検査。コード利用回数は割引を使った注文確定時に1回加算。取消後の回数復元ルールは未確定のためデモでは復元しない。
5. 紹介売上デモは注文月で抽出し、支払済み商品額（割引後、送料除外）を集計。返金分を調整欄に表示。取消は未計上。顧客・購入日・商品・数量を併記。
6. 本番は決済確定日、締め、翌月返金、部分返金、税、帳票の扱いを確定して集計設計を改める。紹介料自動計算・自動支払いは行わない。

## 8. URL移行と画面復帰先

[別ドメイン化の接続仕様 第3章](DOMAIN_SEPARATION.md#3-url対応)を正とします。本書第5章の`/shop/*`復帰先は企業・農作物側の表記です。化粧品側は`/login`・`/register`・`/reset`・`/recovery`・`/account`・`/cart`・`/checkout`・`/orders/{id}`・`/contact`に読み替え、商品詳細は`/products/{id}`です。

企業の旧化粧品URLは設定された化粧品サイトへ同じタブで置換します。商品ID、注文番号、許可済みの内部復帰先を保持し、外部から任意の転送先オリジンを指定できません。元の化粧品カートがある場合は、移行ID発行→現在価格・在庫の確認→利用者の確定→冪等適用の順で引き継ぎます。

企業`/shop`は農作物中心、企業`/admin`は共通管理です。化粧品側に管理画面を置かず、管理APIも拒否します。旧ドメインideanova.jpの301移行・SEO承継・旧コンテンツ無条件移植は引き続き対象外です。

## 9. 未確定事項・本番接続チェック

| 未確定項目 | 現在の画面 | 本番接続前の必要作業 |
|---|---|---|
| 正式法人名・住所・代表者・会社紹介 | 郡山の拠点表記、その他は確認中 | Current Source照合・原稿承認 |
| 商品・カテゴリー・価格・画像・成分・生産者 | 架空サンプル・権利確認済みイメージ | 正式商品マスターと権利確認素材へ差し替え |
| 税・端数・送料・地域・送料無料 | 上記デモ値、地域文は案内のみ | サーバー計算・配送可否・地域条件を確定しquote入力に配送先を追加 |
| 銀行口座・期限・振込手数料 | 口座番号を掲載せず未確定と表示 | 正式振込先、期限切れ・照合運用 |
| PayPay契約・方式・返金 | シナリオによる状態デモ | 契約、検証環境、サーバー接続、Webhook／照会、照合・リカバリー |
| 外部発送先・渡し方・追跡 | 連携待ち／失敗／手動追跡登録 | API・CSV等の方式、必要項目、個人情報、再連携手順 |
| 会員メール・回復・パスワード再設定完了 | 受付・トークン後の再設定画面はデモ | Fortify／Sanctum、認証メール、失効、トークン検証、本人確認 |
| 問い合わせメール・返信 | デモ受付・未送信・返信状態 | 保存、送信基盤、重複防止、監査、障害運用 |
| 法務文言・同意 | 掲載領域・同意UI、正式文言未確定 | 承認原稿、返品・不良/誤配送区分、同意版管理 |
| 管理者・実権限・監査保管 | デモ権限・確認・変更履歴 | 認可Policy、管理者アカウント、監査保存とアクセス制限 |

ランキング、AI推薦、多階層紹介、紹介料の自動計算・自動支払いは追加していません。この成果物を本番機能の完成として扱わないでください。
