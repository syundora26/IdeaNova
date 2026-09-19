export type Business = 'cosmetics' | 'agriculture';
export type InquiryBusiness = Business | 'corporate';
export type SaleStatus = 'selling' | 'stopped';
export type PaymentMethod = 'bank' | 'paypay';
export type PaymentStatus = 'unpaid' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'unknown' | 'refunded';
export type OrderStatus = 'awaiting_payment' | 'paid' | 'shipped' | 'cancelled' | 'refunded';
export type ShippingStatus = 'unshipped' | 'preparing' | 'external_pending' | 'external_failed' | 'shipped';
export type ReviewStatus = 'pending' | 'published' | 'hidden';
export type InquiryStatus = 'new' | 'in_progress' | 'waiting' | 'complete';
export type AdminRole = 'full' | 'cosmetics' | 'agriculture' | 'readonly';
export type Scenario = 'normal' | 'slow' | 'network' | 'auth_failed' | 'agriculture_empty' | 'stock_changed' | 'price_changed' | 'sale_stopped' | 'payment_failed' | 'payment_cancelled' | 'payment_unknown' | 'review_failed' | 'inquiry_failed' | 'reply_failed' | 'shipping_failed' | 'migration_expired';
export type ErrorCode = 'VALIDATION' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'NETWORK' | 'UNAVAILABLE' | 'REFERRAL_INVALID' | 'PAYMENT_PENDING';
export class GatewayError extends Error {
    constructor(public code: ErrorCode, message: string, public fields: Record<string, string> = {}, public retryable = false) { super(message); this.name = 'GatewayError'; }
}
export interface ProductImage {
    src: string;
    alt: string;
    position?: string;
}
export interface Product {
    id: string;
    business: Business;
    name: string;
    category: string;
    price: number;
    size: string;
    description: string;
    images: ProductImage[];
    saleStatus: SaleStatus;
    inventoryTracked: boolean;
    availableQuantity: number;
    fulfillment: 'external' | 'ideanova';
    producer?: {
        visible: boolean;
        name: string;
        description: string;
    };
}
export interface Member {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    nickname: string;
    age: string;
    referrerId?: string;
    referralCode?: string;
}
export type MemberInput = Omit<Member, 'id' | 'referrerId' | 'referralCode'>;
export interface RegisterInput extends MemberInput {
    password: string;
    referralCode?: string;
    consent: boolean;
}
export interface Address {
    name: string;
    postal: string;
    address: string;
    phone: string;
}
export interface CartLine {
    productId: string;
    quantity: number;
}
export type Carts = Record<Business, CartLine[]>;
export interface QuoteLine {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
}
export interface CartQuote {
    id: string;
    business: Business;
    memberId: string;
    items: QuoteLine[];
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
    currency: 'JPY';
    taxIncluded: true;
    sample: boolean;
    expiresAt: string;
    referral?: ReferralResult;
}
export interface Payment {
    method: PaymentMethod;
    status: PaymentStatus;
    attempts: number;
    updatedAt: string;
}
export interface Shipping {
    fulfillment: 'external' | 'ideanova';
    status: ShippingStatus;
    carrier: string;
    tracking: string;
    shippedAt?: string;
}
export interface Order {
    id: string;
    memberId: string;
    business: Business;
    createdAt: string;
    items: QuoteLine[];
    subtotal: number;
    discount: number;
    shippingFee: number;
    total: number;
    address: Address;
    status: OrderStatus;
    payment: Payment;
    shipping: Shipping;
    referrerId?: string;
    sample: boolean;
}
export interface CreateOrderInput {
    quoteId: string;
    address: Address;
    paymentMethod: PaymentMethod;
    idempotencyKey: string;
    consent: boolean;
}
export interface ReviewPublic {
    id: string;
    productId: string;
    nickname: string;
    age: string;
    rating: number;
    date: string;
    text: string;
}
export interface ReviewOwn extends ReviewPublic {
    status: ReviewStatus;
}
export interface ReviewCollection {
    published: ReviewPublic[];
    own: ReviewOwn[];
}
export interface ReviewInput {
    productId: string;
    rating: number;
    text: string;
}
export interface Referrer {
    id: string;
    name: string;
    approved: boolean;
}
export interface Article {
    id: string;
    kind: 'news' | 'journal';
    title: string;
    text: string;
    date: string;
    category: string;
    image: string;
    published: boolean;
}
export interface Category {
    id: string;
    business: Business;
    name: string;
}
export interface ShippingConfig {
    business: Business;
    fee: number;
    freeOver: number | null;
    regionNote: string;
    dispatchNote: string;
}
export interface AdminIdentity {
    id: string;
    name: string;
    role: AdminRole;
    active: boolean;
}
export interface ReferralCode {
    code: string;
    referrerId: string;
    active: boolean;
    kind: 'percent' | 'fixed';
    value: number;
    productIds: string[];
    start: string;
    end: string;
    maxUses: number;
    uses: number;
}
export interface ReferralResult {
    valid: boolean;
    reason: 'valid' | 'not_found' | 'stopped' | 'period' | 'limit' | 'unapproved' | 'business' | 'product';
    message: string;
    code?: ReferralCode;
}
export interface InquiryInput {
    business: InquiryBusiness;
    name: string;
    email: string;
    subject: string;
    message: string;
    orderId?: string;
    consent: boolean;
    idempotencyKey: string;
}
export interface InquiryReply {
    id: string;
    text: string;
    status: 'sent' | 'failed';
    date: string;
}
export interface Inquiry {
    id: string;
    business: InquiryBusiness;
    name: string;
    email: string;
    subject: string;
    message: string;
    memberId?: string;
    orderId?: string;
    status: InquiryStatus;
    assignee: string;
    createdAt: string;
    replies: InquiryReply[];
}
export interface AuditEntry {
    id: string;
    actor: string;
    action: string;
    target: string;
    before: string;
    after: string;
    reason: string;
    date: string;
}
export interface AdminSnapshot {
    products: Product[];
    orders: Order[];
    reviews: ReviewOwn[];
    inquiries: Inquiry[];
    referrers: Referrer[];
    codes: ReferralCode[];
    audit: AuditEntry[];
    articles: Article[];
    categories: Category[];
    members: Member[];
    shippingConfigs: ShippingConfig[];
    administrators: AdminIdentity[];
}
export interface ReferralSales {
    referrer: Referrer;
    paidTotal: number;
    adjustment: number;
    orders: Order[];
}
export interface GatewaySnapshot {
    revision: number;
    member: Member | null;
    carts: Carts;
    scenario: Scenario;
    adminRole: AdminRole;
    adminEntered: boolean;
}
export interface ProductQuery {
    business: Business;
    category?: string;
    search?: string;
    sort?: 'default' | 'low' | 'high';
}
export interface ProductResult {
    items: Product[];
    categories: string[];
}
export interface MigrationItem { productId: string; name: string; requested: number; existing: number; quantity: number; unitPrice: number; notice: string }
export interface MigrationPreview { items: MigrationItem[]; expiresAt: string; applied: boolean }
export interface ShopGateway {
    issueMigration(lines: CartLine[]): Promise<{ id: string; expiresAt: string }>;
    inspectMigration(id: string): Promise<MigrationPreview>;
    applyMigration(id: string, confirmedItems: MigrationItem[]): Promise<MigrationPreview>;
    subscribe: (listener: () => void) => () => void;
    getSnapshot: () => GatewaySnapshot;
    listProducts(query: ProductQuery): Promise<ProductResult>;
    getProduct(business: Business, id: string): Promise<Product>;
    login(email: string, password: string): Promise<Member>;
    register(input: RegisterInput): Promise<Member>;
    logout(): Promise<void>;
    getSession(): Promise<Member | null>;
    updateMember(input: MemberInput): Promise<Member>;
    requestRecovery(email: string, kind: 'password' | 'id'): Promise<{
        accepted: true;
        sample: boolean;
    }>;
    confirmPasswordReset(email: string, token: string, password: string): Promise<{
        accepted: true;
        sample: boolean;
    }>;
    changeCart(business: Business, id: string, quantity: number): Promise<void>;
    quoteCart(business: Business): Promise<CartQuote>;
    createOrder(input: CreateOrderInput): Promise<Order>;
    getOrders(business?: Business): Promise<Order[]>;
    getOrder(id: string): Promise<Order>;
    startPayment(id: string): Promise<Order>;
    checkPayment(id: string): Promise<Order>;
    changePaymentMethod(id: string, method: PaymentMethod): Promise<Order>;
    getReviews(productId: string): Promise<ReviewCollection>;
    postReview(input: ReviewInput): Promise<ReviewOwn>;
    editReview(id: string, input: ReviewInput): Promise<ReviewOwn>;
    deleteReview(id: string): Promise<void>;
    validateReferral(code: string, business?: Business, productIds?: string[]): Promise<ReferralResult>;
    createInquiry(input: InquiryInput): Promise<{
        id: string;
        sample: boolean;
    }>;
    enterAdmin(): Promise<void>;
    exitAdmin(): void | Promise<void>;
    getAdmin(): Promise<AdminSnapshot>;
    adminOrder(id: string, action: 'confirm_payment' | 'prepare' | 'ship' | 'cancel' | 'refund' | 'retry_shipping', reason: string, tracking?: {
        carrier: string;
        tracking: string;
    }): Promise<Order>;
    adminReview(id: string, status: ReviewStatus, reason: string): Promise<void>;
    adminInquiry(id: string, status: InquiryStatus, assignee: string): Promise<void>;
    replyInquiry(id: string, text: string, retryId?: string): Promise<void>;
    adminProduct(id: string, patch: Partial<Pick<Product, 'saleStatus' | 'availableQuantity' | 'inventoryTracked' | 'producer'>>, reason: string): Promise<void>;
    adminCode(code: string, active: boolean, reason: string): Promise<void>;
    issueCode(input: Omit<ReferralCode, 'uses'>): Promise<ReferralCode>;
    getReferralSales(month: string): Promise<ReferralSales[]>;
    setScenario(scenario: Scenario): void | Promise<void>;
    setAdminRole(role: AdminRole): void | Promise<void>;
    resetDemo(): void | Promise<void>;
    listArticles(kind: 'news' | 'journal'): Promise<Article[]>;
    getShipping(business: Business): Promise<ShippingConfig>;
    saveArticle(input: Article, reason: string): Promise<void>;
    saveCategory(input: Category, reason: string): Promise<void>;
    saveProduct(input: Product, reason: string): Promise<void>;
    saveShipping(input: ShippingConfig, reason: string): Promise<void>;
    adminMember(id: string, input: MemberInput, referralCode: string, reason: string): Promise<void>;
    saveReferrer(input: Referrer, reason: string): Promise<void>;
    saveAdministrator(input: AdminIdentity, reason: string): Promise<void>;
}
export const businessNames: Record<Business, string> = { cosmetics: '化粧品', agriculture: '農作物' };
export const paymentLabels: Record<PaymentStatus, string> = { unpaid: '未入金', processing: '処理中', paid: '支払済み', failed: '支払失敗', cancelled: '支払取消', unknown: '結果確認中', refunded: '返金済み' };
export const orderLabels: Record<OrderStatus, string> = { awaiting_payment: '入金待ち', paid: '支払済み', shipped: '発送済み', cancelled: '取消', refunded: '返金済み' };
export const shippingLabels: Record<ShippingStatus, string> = { unshipped: '未発送', preparing: '発送準備', external_pending: '外部発送の連携待ち', external_failed: '外部発送の連携失敗', shipped: '発送済み' };
export const reviewLabels: Record<ReviewStatus, string> = { pending: '公開待ち', published: '公開', hidden: '非表示' };
export const inquiryLabels: Record<InquiryStatus, string> = { new: '新規', in_progress: '対応中', waiting: '返信待ち', complete: '完了' };
export const yen = (value: number) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(value);
export const dateLabel = (value: string) => new Date(value).toLocaleDateString('ja-JP');
export const scenarios: {
    id: Scenario;
    label: string;
    description: string;
    href: string;
}[] = [
    { id: 'migration_expired', label: 'カート移行の期限切れ', description: '期限が切れた移行案内を発行し、元サイトからのやり直しを確認します。', href: '/shop' },
    { id: 'normal', label: '通常の操作', description: 'すべてのデモ機能を通常状態で確認します。', href: '/shop' },
    { id: 'slow', label: '読み込み中', description: '通信に2秒かかる状態を表示します。', href: '/shop/cosmetics' },
    { id: 'network', label: '通信失敗', description: '取得に失敗したときの再読み込み導線を表示します。', href: '/shop/cosmetics' },
    { id: 'auth_failed', label: 'ログイン失敗', description: 'ログイン情報を確認する案内を表示します。', href: '/shop/login' },
    { id: 'agriculture_empty', label: '農作物が0件', description: '次の販売を待つ案内を表示します。', href: '/shop/agriculture' },
    { id: 'stock_changed', label: '注文直前の在庫不足', description: '見積後に在庫が減った状態。注文を止めて修正します。', href: '/shop/cart?business=cosmetics' },
    { id: 'price_changed', label: '注文直前の価格変更', description: '見積後の価格変更を通知し、再確認を求めます。', href: '/shop/cart?business=cosmetics' },
    { id: 'sale_stopped', label: '注文直前の販売停止', description: '見積後に販売を停止した商品を注文できない状態です。', href: '/shop/cart?business=cosmetics' },
    { id: 'payment_failed', label: 'PayPay失敗', description: '入力内容と注文を保持して再試行します。', href: '/shop/cart?business=cosmetics' },
    { id: 'payment_cancelled', label: 'PayPay取消', description: '取消後の支払い再開・方法変更を確認します。', href: '/shop/cart?business=cosmetics' },
    { id: 'payment_unknown', label: 'PayPay結果不明', description: '二重決済を防ぎ、結果確認のみ可能にします。', href: '/shop/cart?business=cosmetics' },
    { id: 'review_failed', label: 'レビュー投稿失敗', description: '本文・評価を保持し、再試行できます。', href: '/shop/cosmetics/products/c01' },
    { id: 'inquiry_failed', label: '問い合わせ送信失敗', description: '入力内容を残して再送できます。', href: '/contact' },
    { id: 'reply_failed', label: '管理者の返信失敗', description: '失敗した返信を未送信として扱い、再送できます。', href: '/admin' },
    { id: 'shipping_failed', label: '外部発送の連携失敗', description: '管理者が失敗を確認し、再連携できます。', href: '/admin' },
];
