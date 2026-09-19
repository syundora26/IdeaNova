import { GatewayError, type ShopGateway, type GatewaySnapshot, type Business, type ProductQuery, type Member, type MemberInput, type RegisterInput, type CartQuote, type CreateOrderInput, type Order, type PaymentMethod, type ReviewInput, type ReviewOwn, type ReviewPublic, type InquiryInput, type Inquiry, type AuditEntry, type ReviewStatus, type InquiryStatus, type Product, type ReferralCode, type Scenario, type AdminRole, type Article, type Category, type ShippingConfig, type Referrer, type AdminIdentity, type MigrationPreview } from './domain';
import { productFixtures, codeFixtures, referrerFixtures } from './fixtures';
import { articles as articleFixtures } from './data';
const copy = <T,>(v: T): T => structuredClone(v);
const now = () => new Date().toISOString();
const fail = (message: string, fields: Record<string, string> = {}) => { throw new GatewayError('VALIDATION', message, fields); };
const sampleMember: Member = { id: 'member-demo', name: 'デモ利用者', email: 'demo@example.invalid', phone: '000-0000-0000', address: '福島県郡山市（デモ住所）', nickname: '郡山の暮らし', age: '40代' };
type StoredReview = ReviewOwn & {
    ownerId: string;
};
/** In-memory demo. Only product IDs and quantities are persisted; never authentication or PII. */
export class MockShopGateway implements ShopGateway {
    async issueMigration(): Promise<{ id: string; expiresAt: string }> { throw new GatewayError('UNAVAILABLE', '移行IDは共通データサービスで発行します。'); }
    async inspectMigration(): Promise<MigrationPreview> { throw new GatewayError('UNAVAILABLE', '共通データサービスで移行内容を確認してください。'); }
    async applyMigration(): Promise<MigrationPreview> { throw new GatewayError('UNAVAILABLE', '共通データサービスで引き継いでください。'); }
    private listeners = new Set<() => void>();
    private state: GatewaySnapshot = { revision: 0, member: null, carts: { cosmetics: [], agriculture: [] }, scenario: 'normal', adminRole: 'full', adminEntered: false };
    private referrers = copy(referrerFixtures);
    private categories: Category[] = productFixtures().filter((p, i, a) => a.findIndex(x => x.business === p.business && x.category === p.category) === i).map((p, i) => ({ id: "CAT-" + i, business: p.business, name: p.category }));
    private articles: Article[] = articleFixtures.map(a => ({ ...a, kind: a.kind === "news" ? "news" : "journal", image: a.image === "hero" ? "koriyama" : a.image, published: true }));
    private shippingConfigs: ShippingConfig[] = [{ business: "cosmetics", fee: 550, freeOver: null, regionNote: "配送地域・地域別追加送料は確認中", dispatchNote: "メーカー・外部発送先より発送。日程は確認中" }, { business: "agriculture", fee: 770, freeOver: null, regionNote: "配送地域・地域別追加送料は確認中", dispatchNote: "IdeaNovaより発送。日程は確認中" }];
    private administrators: AdminIdentity[] = [{ id: "ADM-1", name: "管理者A（デモ）", role: "full", active: true }, { id: "ADM-2", name: "化粧品担当（デモ）", role: "cosmetics", active: true }, { id: "ADM-3", name: "農作物担当（デモ）", role: "agriculture", active: true }];
    private products = productFixtures();
    private codes = codeFixtures();
    private members: Member[] = [copy(sampleMember)];
    private orders: Order[] = [];
    private quotes = new Map<string, CartQuote>();
    private orderKeys = new Map<string, string>();
    private reviews: StoredReview[] = [{ id: 'review-demo', productId: 'c01', ownerId: 'member-example', nickname: 'あさの時間', age: '30代', rating: 4, date: now(), text: '毎日の使い心地を紹介する、公開レビューのサンプルです。', status: 'published' }];
    private inquiries: Inquiry[] = [{ id: 'INQ-DEMO', business: 'corporate', name: 'お問い合わせ例', email: 'sample@example.invalid', subject: '事業について', message: '相談内容の表示例です。実際に届いた問い合わせではありません。', status: 'new', assignee: '未割当', createdAt: now(), replies: [] }];
    private inquiryKeys = new Map<string, string>();
    private audits: AuditEntry[] = [];
    private serial = 100;
    private dataRevision = 0;
    private scenarioConsumed = false;
    constructor(private latency = 160) { try {
        const raw = typeof localStorage !== 'undefined' ? (localStorage.getItem('ideanova-cart-v2') || localStorage.getItem('ideanova-carts')) : null;
        if (raw) {
            const carts = JSON.parse(raw);
            for (const b of ['cosmetics', 'agriculture'] as Business[])
                if (Array.isArray(carts[b]))
                    this.state.carts[b] = carts[b].filter((l: {
                        productId: string;
                        quantity: number;
                    }) => this.products.some(p => p.id === l.productId && p.business === b) && Number.isInteger(l.quantity) && l.quantity > 0).map((l: {
                        productId: string;
                        quantity: number;
                    }) => ({ ...l, quantity: Math.min(99, l.quantity) }));
        }
    }
    catch { /* Invalid saved carts are ignored. */ } }
    subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
    getSnapshot = () => this.state;
    /** Server-only adapter boundary. The local service serializes activation + operation + capture. */
    activateSession(snapshot: GatewaySnapshot, consumed: boolean) {
        this.state = copy(snapshot);
        this.state.revision = this.dataRevision;
        this.state.member = copy(this.members.find(m => m.id === snapshot.member?.id) || null);
        this.scenarioConsumed = consumed;
    }
    isScenarioConsumed() { return this.scenarioConsumed; }
    findMemberId(email: string) { return this.members.find(m => m.email.toLowerCase() === String(email).toLowerCase())?.id; }
    assertQuoteBusiness(id: string, business: Business) {
        if (this.quotes.get(id)?.business !== business) throw new GatewayError('FORBIDDEN', 'このサイトの注文内容を確認してください。');
    }
    private emit() { this.state = { ...this.state, revision: ++this.dataRevision, carts: copy(this.state.carts), member: this.state.member ? copy(this.state.member) : null }; try {
        if (typeof localStorage !== 'undefined')
            localStorage.setItem('ideanova-cart-v2', JSON.stringify(this.state.carts));
    }
    catch { /* Memory carts remain usable. */ } this.listeners.forEach(l => l()); }
    private id(prefix: string) { return `${prefix}-${++this.serial}`; }
    private async wait() { await new Promise(r => setTimeout(r, this.state.scenario === 'slow' ? 2000 : this.latency)); if (this.state.scenario === 'network')
        throw new GatewayError('NETWORK', '通信できませんでした。入力を残したまま、もう一度お試しください。', {}, true); }
    private member() { if (!this.state.member)
        throw new GatewayError('UNAUTHENTICATED', '会員ログインが必要です。'); return this.state.member; }
    private product(id: string) { const p = this.products.find(p => p.id === id); if (!p)
        throw new GatewayError('NOT_FOUND', '商品が見つかりません。'); return p; }
    private permission(business?: Business | 'corporate', write = false) { if (!this.state.adminEntered)
        throw new GatewayError('UNAUTHENTICATED', 'デモ管理画面に入室してください。'); const role = this.state.adminRole; if ((write && role === 'readonly') || (role !== 'full' && role !== 'readonly' && ((business && business !== role) || (!business && write))))
        throw new GatewayError('FORBIDDEN', 'この対象を操作する権限がありません。'); }
    private audit(action: string, target: string, before: unknown, after: unknown, reason: string) { this.audits.unshift({ id: this.id('AUD'), actor: `デモ管理者 / ${this.state.adminRole}`, action, target, before: JSON.stringify(before), after: JSON.stringify(after), reason, date: now() }); }
    private reason(value: string) { if (!value.trim())
        fail('変更理由を入力してください。'); }
    async listProducts(q: ProductQuery) { await this.wait(); let items = this.products.filter(p => p.business === q.business && (q.business !== 'agriculture' || p.saleStatus === 'selling')); const categories = this.categories.filter(c => c.business === q.business).map(c => c.name); if (q.business === 'agriculture' && this.state.scenario === 'agriculture_empty')
        items = []; if (q.category)
        items = items.filter(p => p.category === q.category); if (q.search)
        items = items.filter(p => (p.name + p.description).includes(q.search!)); if (q.sort && q.sort !== 'default')
        items.sort((a, b) => q.sort === 'low' ? a.price - b.price : b.price - a.price); return copy({ items, categories }); }
    async getProduct(b: Business, id: string) { await this.wait(); const p = this.product(id); if (p.business !== b)
        throw new GatewayError('NOT_FOUND', 'この売場の商品ではありません。'); return copy(p); }
    async getSession() { await this.wait(); return copy(this.state.member); }
    private validateMember(input: MemberInput) { const fields: Record<string, string> = {}; for (const key of ['name', 'email', 'phone', 'address', 'nickname', 'age'] as const)
        if (!input[key]?.trim())
            fields[key] = '入力してください。'; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
        fields.email = 'メールアドレスを確認してください。'; if (Object.keys(fields).length)
        fail('入力内容をご確認ください。', fields); }
    async login(email: string, password: string) { await this.wait(); if (password.length < 8)
        fail("パスワードは8文字以上で入力してください。"); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        fail('メールアドレスを入力してください。', { email: 'メールアドレスを確認してください。' }); if (this.state.scenario === 'auth_failed')
        throw new GatewayError('UNAUTHENTICATED', 'ログインできませんでした。メールアドレスとパスワードをご確認ください。'); const m = this.members.find(m => m.email.toLowerCase() === email.toLowerCase()); if (!m)
        throw new GatewayError('UNAUTHENTICATED', 'このデモで登録したメール、または demo@example.invalid をご利用ください。'); this.state.member = copy(m); this.emit(); return copy(m); }
    async register(input: RegisterInput) { await this.wait(); this.validateMember(input); if (input.password.length < 8)
        fail("パスワードは8文字以上で入力してください。"); if (!input.consent)
        fail('利用規約への同意が必要です。'); if (this.members.some(m => m.email.toLowerCase() === input.email.toLowerCase()))
        fail('登録済みのメールアドレスです。ログインしてください。'); let ref: ReferralCode | undefined; if (input.referralCode?.trim()) {
        const result = await this.validateReferral(input.referralCode);
        if (!result.valid)
            throw new GatewayError('REFERRAL_INVALID', result.message, { referralCode: result.message });
        ref = result.code;
    } const m: Member = { id: this.id('MEM'), name: input.name.trim(), email: input.email.trim(), address: input.address.trim(), phone: input.phone.trim(), nickname: input.nickname.trim(), age: input.age, referrerId: ref?.referrerId, referralCode: ref?.code }; this.members.push(m); this.state.member = m; this.emit(); return copy(m); }
    async logout() { this.state.member = null; this.emit(); }
    async updateMember(input: MemberInput) { await this.wait(); const m = this.member(); this.validateMember(input); if (this.members.some(x => x.id !== m.id && x.email.toLowerCase() === input.email.toLowerCase()))
        fail('このメールアドレスは登録済みです。'); Object.assign(m, input); this.members = this.members.map(x => x.id === m.id ? copy(m) : x); this.emit(); return copy(m); }
    async requestRecovery(email: string, _kind: 'password' | 'id') { await this.wait(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        fail('連絡可能なメールアドレスを入力してください。'); return { accepted: true, sample: true } as const; }
    async confirmPasswordReset(email: string, token: string, password: string) { await this.wait(); if (token !== 'demo-reset' || this.state.scenario === 'auth_failed')
        fail('再設定リンクが無効、または期限切れです。再設定案内をもう一度お申し込みください。'); if (password.length < 8 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        fail('メールアドレスと8文字以上の新しいパスワードを入力してください。'); return { accepted: true, sample: true } as const; }
    async changeCart(b: Business, id: string, quantity: number) { await this.wait(); const p = this.product(id); if (p.business !== b)
        fail('異なる事業の商品を同じカートに入れることはできません。'); if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99)
        fail('数量は0〜99の整数で指定してください。'); if (quantity > 0 && (p.saleStatus !== 'selling' || p.inventoryTracked && quantity > p.availableQuantity))
        throw new GatewayError('CONFLICT', p.saleStatus === 'stopped' ? 'この商品は販売を停止しています。' : `在庫は${p.availableQuantity}点です。数量をご確認ください。`); const cart = this.state.carts[b].filter(l => l.productId !== id); if (quantity)
        cart.push({ productId: id, quantity }); this.state.carts[b] = cart; this.emit(); }
    async validateReferral(code: string, business?: Business, productIds?: string[]) { await this.wait(); const c = this.codes.find(c => c.code === code.trim().toUpperCase()); let reason: 'valid' | 'not_found' | 'stopped' | 'period' | 'limit' | 'unapproved' | 'business' | 'product' = 'valid'; if (business === 'agriculture')
        reason = 'business';
    else if (!c)
        reason = 'not_found';
    else if (!this.referrers.find(r => r.id === c.referrerId)?.approved)
        reason = 'unapproved';
    else if (!c.active)
        reason = 'stopped';
    else if (now().slice(0, 10) < c.start || now().slice(0, 10) > c.end)
        reason = 'period';
    else if (c.uses >= c.maxUses)
        reason = 'limit';
    else if (productIds && !productIds.some(id => c.productIds.includes(id)))
        reason = 'product'; const messages = { valid: '紹介割引を利用できます。', not_found: '紹介コードが見つかりません。コードなしでも登録できます。', stopped: 'この紹介コードは停止中です。', period: '紹介コードの有効期間外です。', limit: '紹介コードの利用上限に達しています。', unapproved: 'この紹介者は承認されていません。', business: '農作物には紹介割引を適用しません。', product: 'カートに紹介割引の対象商品がありません。' }; return { valid: reason === 'valid', reason, message: messages[reason], code: c ? copy(c) : undefined }; }
    async quoteCart(b: Business) {
        await this.wait();
        const member = this.state.member;
        const lines = this.state.carts[b];
        if (!lines.length)
            fail('カートに商品がありません。');
        for (const l of lines) {
            const p = this.product(l.productId);
            if (p.saleStatus === 'stopped' || p.inventoryTracked && l.quantity > p.availableQuantity)
                throw new GatewayError('CONFLICT', `${p.name}の販売状態・在庫が変わりました。カートの数量を修正してください。`);
        }
        const referral = member?.referralCode ? await this.validateReferral(member.referralCode, b, lines.map(l => l.productId)) : undefined;
        const code = referral?.valid ? referral.code : undefined;
        let remainingFixed = code?.kind === 'fixed' ? code.value : 0;
        const items = lines.map(l => { const p = this.product(l.productId); const gross = p.price * l.quantity; const eligible = code?.productIds.includes(p.id); const discount = eligible ? Math.min(gross, code?.kind === 'percent' ? Math.floor(gross * code.value / 100) : remainingFixed) : 0; if (eligible && code?.kind === 'fixed')
            remainingFixed -= discount; return { productId: p.id, name: p.name, quantity: l.quantity, unitPrice: p.price, discount, total: gross - discount }; });
        const subtotal = items.reduce((s, l) => s + l.unitPrice * l.quantity, 0), discount = items.reduce((s, l) => s + l.discount, 0), config = this.shippingConfigs.find(c => c.business === b)!, shipping = config.freeOver !== null && subtotal >= config.freeOver ? 0 : config.fee;
        const quote: CartQuote = { id: this.id('Q'), business: b, memberId: member?.id || '', items, subtotal, discount, shipping, total: subtotal - discount + shipping, currency: 'JPY', taxIncluded: true, sample: true, expiresAt: new Date(Date.now() + 15 * 60000).toISOString(), referral };
        this.quotes.set(quote.id, copy(quote));
        return quote;
    }
    async createOrder(input: CreateOrderInput) {
        await this.wait();
        const m = this.member();
        const key = m.id + ':' + input.idempotencyKey;
        const previous = this.orderKeys.get(key);
        if (previous)
            return copy(this.orders.find(o => o.id === previous)!);
        const q = this.quotes.get(input.quoteId);
        if (!q || q.memberId !== m.id || new Date(q.expiresAt).getTime() < Date.now())
            throw new GatewayError('CONFLICT', '金額の確認期限が切れました。もう一度内容をご確認ください。');
        if (!input.consent)
            fail('注文内容と利用条件への同意が必要です。');
        for (const k of ['name', 'postal', 'address', 'phone'] as const)
            if (!input.address[k]?.trim())
                fail('配送先をすべて入力してください。', { [k]: '入力してください。' });
        if (!this.scenarioConsumed && ['stock_changed', 'price_changed', 'sale_stopped'].includes(this.state.scenario)) {
            const p = this.product(q.items[0].productId);
            this.scenarioConsumed = true;
            if (this.state.scenario === 'stock_changed') {
                p.inventoryTracked = true;
                p.availableQuantity = Math.max(0, q.items[0].quantity - 1);
            }
            if (this.state.scenario === 'price_changed')
                p.price += 300;
            if (this.state.scenario === 'sale_stopped')
                p.saleStatus = 'stopped';
            this.emit();
            throw new GatewayError('CONFLICT', '確定直前に在庫・販売状態・価格が変わりました。入力は保持しています。カートと金額を再確認してください。');
        }
        let fresh: CartQuote;
        try {
            fresh = await this.quoteCart(q.business);
        }
        catch (error) {
            const duplicate = this.orderKeys.get(key);
            if (duplicate)
                return copy(this.orders.find(o => o.id === duplicate)!);
            throw error;
        }
        if (JSON.stringify(fresh.items) !== JSON.stringify(q.items) || fresh.total !== q.total)
            throw new GatewayError('CONFLICT', '価格・割引またはカートが変わりました。最新の金額をご確認ください。');
        const duplicate = this.orderKeys.get(key);
        if (duplicate)
            return copy(this.orders.find(o => o.id === duplicate)!);
        if (this.member().id !== m.id)
            throw new GatewayError('UNAUTHENTICATED', '再ログインしてご確認ください。');
        for (const l of q.items) {
            const p = this.product(l.productId);
            if (p.saleStatus !== 'selling' || p.price !== l.unitPrice || p.inventoryTracked && p.availableQuantity < l.quantity)
                throw new GatewayError('CONFLICT', '商品の状態が変わりました。再確認してください。');
        }
        const o: Order = { id: this.id('ORD'), memberId: m.id, business: q.business, createdAt: now(), items: copy(q.items), subtotal: q.subtotal, discount: q.discount, shippingFee: q.shipping, total: q.total, address: copy(input.address), status: 'awaiting_payment', payment: { method: input.paymentMethod, status: 'unpaid', attempts: 0, updatedAt: now() }, shipping: { fulfillment: q.business === 'cosmetics' ? 'external' : 'ideanova', status: 'unshipped', carrier: '', tracking: '' }, referrerId: q.discount > 0 ? m.referrerId : undefined, sample: true };
        for (const line of q.items) {
            const p = this.product(line.productId);
            if (p.inventoryTracked)
                p.availableQuantity -= line.quantity;
        }
        if (q.referral?.valid && q.referral.code) {
            const c = this.codes.find(c => c.code === q.referral!.code!.code);
            if (c)
                c.uses++;
        }
        this.orders.unshift(o);
        this.orderKeys.set(key, o.id);
        this.state.carts[q.business] = [];
        this.emit();
        return copy(o);
    }
    async getOrders(b?: Business) { await this.wait(); const m = this.member(); return copy(this.orders.filter(o => o.memberId === m.id && (!b || o.business === b))); }
    private ownOrder(id: string) { const m = this.member(); const o = this.orders.find(o => o.id === id && o.memberId === m.id); if (!o)
        throw new GatewayError('NOT_FOUND', '注文が見つかりません。'); return o; }
    async getOrder(id: string) { await this.wait(); return copy(this.ownOrder(id)); }
    async startPayment(id: string) { await this.wait(); const o = this.ownOrder(id); if (o.payment.method !== 'paypay' || o.status !== 'awaiting_payment')
        throw new GatewayError('CONFLICT', 'この注文では支払いを開始できません。'); if (['processing', 'unknown'].includes(o.payment.status))
        throw new GatewayError('PAYMENT_PENDING', '決済結果を確認中です。再決済せず、状態を確認してください。'); o.payment.status = 'processing'; o.payment.attempts++; o.payment.updatedAt = now(); this.emit(); await this.wait(); const scenario = this.state.scenario; o.payment.status = scenario === 'payment_failed' ? 'failed' : scenario === 'payment_cancelled' ? 'cancelled' : scenario === 'payment_unknown' ? 'unknown' : 'paid'; if (o.payment.status === 'paid')
        o.status = 'paid'; this.emit(); return copy(o); }
    async checkPayment(id: string) { await this.wait(); const o = this.ownOrder(id); if (['processing', 'unknown'].includes(o.payment.status) && this.state.scenario !== 'payment_unknown') {
        o.payment.status = 'paid';
        o.payment.updatedAt = now();
        o.status = 'paid';
        this.emit();
    } return copy(o); }
    async changePaymentMethod(id: string, method: PaymentMethod) { await this.wait(); const o = this.ownOrder(id); if (o.status !== 'awaiting_payment' || ['processing', 'unknown'].includes(o.payment.status))
        throw new GatewayError('PAYMENT_PENDING', '決済結果が確定するまで支払方法を変更できません。'); o.payment.method = method; o.payment.status = 'unpaid'; this.emit(); return copy(o); }
    private reviewProduct(id: string) { if (this.product(id).business !== 'cosmetics')
        throw new GatewayError('FORBIDDEN', 'レビューは化粧品のみ利用できます。'); }
    private publicReview(r: StoredReview): ReviewPublic { return { id: r.id, productId: r.productId, nickname: r.nickname, age: r.age, rating: r.rating, date: r.date, text: r.text }; }
    async getReviews(productId: string) { await this.wait(); const m = this.member(); this.reviewProduct(productId); const entries = this.reviews.filter(r => r.productId === productId); return { published: entries.filter(r => r.status === 'published').map(r => this.publicReview(r)), own: entries.filter(r => r.ownerId === m.id).map(r => ({ ...this.publicReview(r), status: r.status })) }; }
    private validateReview(input: ReviewInput) { this.reviewProduct(input.productId); if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5 || !input.text.trim() || input.text.length > 2000)
        fail('評価と本文（1〜2,000文字）をご確認ください。'); if (this.state.scenario === 'review_failed')
        throw new GatewayError('NETWORK', 'レビューを送信できませんでした。本文は保持されています。', {}, true); }
    async postReview(input: ReviewInput) { await this.wait(); const m = this.member(); this.validateReview(input); const r: StoredReview = { ...input, text: input.text.trim(), id: this.id('REV'), ownerId: m.id, nickname: m.nickname, age: m.age, date: now(), status: 'pending' }; this.reviews.unshift(r); this.emit(); return { ...this.publicReview(r), status: r.status }; }
    async editReview(id: string, input: ReviewInput) { await this.wait(); const m = this.member(); this.validateReview(input); const r = this.reviews.find(r => r.id === id && r.ownerId === m.id); if (!r || r.productId !== input.productId)
        throw new GatewayError('FORBIDDEN', 'ご本人のレビューのみ編集できます。'); Object.assign(r, { rating: input.rating, text: input.text, date: now(), status: 'pending' }); this.emit(); return { ...this.publicReview(r), status: r.status }; }
    async deleteReview(id: string) { await this.wait(); const m = this.member(); const r = this.reviews.find(r => r.id === id && r.ownerId === m.id); if (!r)
        throw new GatewayError('FORBIDDEN', 'ご本人のレビューのみ削除できます。'); r.status = 'hidden'; this.emit(); }
    async createInquiry(input: InquiryInput) { await this.wait(); if (!['corporate', 'cosmetics', 'agriculture'].includes(input.business))
        fail('窓口を確認してください。'); if (!input.name.trim() || !input.subject.trim() || !input.message.trim() || !input.consent || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
        fail('必須項目と同意をご確認ください。'); if (input.orderId) {
        const o = this.ownOrder(input.orderId);
        if (o.business !== input.business)
            fail('注文と問い合わせ窓口が一致しません。');
    } const previous = this.inquiryKeys.get(input.idempotencyKey); if (previous)
        return { id: previous, sample: true } as const; if (this.state.scenario === 'inquiry_failed')
        throw new GatewayError('NETWORK', '送信できませんでした。入力内容を残しています。時間をおいて再送してください。', {}, true); const i: Inquiry = { id: this.id('INQ'), business: input.business, name: input.name, email: input.email, subject: input.subject, message: input.message, memberId: this.state.member?.id, orderId: input.orderId || undefined, status: 'new', assignee: '未割当', createdAt: now(), replies: [] }; this.inquiries.unshift(i); this.inquiryKeys.set(input.idempotencyKey, i.id); this.emit(); return { id: i.id, sample: true } as const; }
    async enterAdmin() { await this.wait(); this.state.adminEntered = true; this.emit(); }
    exitAdmin() { this.state.adminEntered = false; this.emit(); }
    async getAdmin() { await this.wait(); this.permission(); const role = this.state.adminRole; const allow = (b: string) => role === 'full' || role === 'readonly' || role === b; return copy({ products: this.products.filter(p => allow(p.business)), orders: this.orders.filter(o => allow(o.business)), reviews: allow('cosmetics') ? this.reviews.map(r => ({ ...this.publicReview(r), status: r.status })) : [], inquiries: this.inquiries.filter(i => allow(i.business)), referrers: role === 'full' || role === 'readonly' ? this.referrers : [], codes: role === 'full' || role === 'readonly' ? this.codes : [], audit: role === 'full' || role === 'readonly' ? this.audits : this.audits.filter(a => a.actor.endsWith('/ ' + role)), articles: role === 'full' || role === 'readonly' ? this.articles : [], categories: this.categories.filter(c => allow(c.business)), members: role === 'full' || role === 'readonly' ? this.members : [], shippingConfigs: this.shippingConfigs.filter(c => allow(c.business)), administrators: role === 'full' || role === 'readonly' ? this.administrators : [] }); }
    async adminOrder(id: string, action: 'confirm_payment' | 'prepare' | 'ship' | 'cancel' | 'refund' | 'retry_shipping', reason: string, tracking?: {
        carrier: string;
        tracking: string;
    }) { await this.wait(); const o = this.orders.find(o => o.id === id); if (!o)
        throw new GatewayError('NOT_FOUND', '注文が見つかりません。'); this.permission(o.business, true); this.reason(reason); const before = copy(o); if (action === 'confirm_payment') {
        if (o.payment.method !== 'bank' || o.status !== 'awaiting_payment')
            throw new GatewayError('CONFLICT', '入金待ちの銀行振込のみ確認できます。');
        o.payment.status = 'paid';
        o.payment.updatedAt = now();
        o.status = 'paid';
    }
    else if (action === 'prepare' || action === 'retry_shipping') {
        if (o.status !== 'paid')
            throw new GatewayError('CONFLICT', '支払済み注文のみ発送準備できます。');
        o.shipping.status = o.business === 'cosmetics' ? (this.state.scenario === 'shipping_failed' ? 'external_failed' : 'external_pending') : 'preparing';
    }
    else if (action === 'ship') {
        if (o.status !== 'paid' || !tracking?.carrier.trim() || !tracking.tracking.trim())
            fail('支払済み注文に配送会社・追跡番号を指定してください。');
        o.shipping = { ...o.shipping, ...tracking, status: 'shipped', shippedAt: now() };
        o.status = 'shipped';
    }
    else if (action === 'cancel') {
        if (o.status !== 'awaiting_payment' || ['unknown', 'processing'].includes(o.payment.status))
            throw new GatewayError('CONFLICT', '未入金で結果確定済みの注文のみ取り消せます。');
        o.status = 'cancelled';
        o.payment.status = 'cancelled';
        for (const l of o.items) {
            const p = this.product(l.productId);
            if (p.inventoryTracked)
                p.availableQuantity += l.quantity;
        }
    }
    else {
        if (!['paid', 'shipped'].includes(o.status))
            throw new GatewayError('CONFLICT', '支払済み・発送済み注文のみ返金できます。');
        o.status = 'refunded';
        o.payment.status = 'refunded';
        o.payment.updatedAt = now();
    } this.audit(action, id, before, o, reason); this.emit(); return copy(o); }
    async adminReview(id: string, status: ReviewStatus, reason: string) { await this.wait(); this.permission('cosmetics', true); this.reason(reason); const r = this.reviews.find(r => r.id === id); if (!r)
        throw new GatewayError('NOT_FOUND', 'レビューが見つかりません。'); this.audit('レビュー公開管理', id, r.status, status, reason); r.status = status; this.emit(); }
    async adminInquiry(id: string, status: InquiryStatus, assignee: string) { await this.wait(); const i = this.inquiries.find(i => i.id === id); if (!i)
        throw new GatewayError('NOT_FOUND', '問い合わせが見つかりません。'); this.permission(i.business, true); this.audit('問い合わせ担当・状態', id, { status: i.status, assignee: i.assignee }, { status, assignee }, '対応更新'); i.status = status; i.assignee = assignee.trim() || '未割当'; this.emit(); }
    async replyInquiry(id: string, text: string, retryId?: string) { await this.wait(); const i = this.inquiries.find(i => i.id === id); if (!i)
        throw new GatewayError('NOT_FOUND', '問い合わせが見つかりません。'); this.permission(i.business, true); if (!text.trim())
        fail('返信本文を入力してください。'); let reply = retryId ? i.replies.find(r => r.id === retryId && r.status === 'failed') : undefined; if (retryId && !reply)
        throw new GatewayError('CONFLICT', '再送できる返信がありません。'); if (!reply) {
        reply = { id: this.id('REPLY'), text, status: 'failed', date: now() };
        i.replies.push(reply);
    } reply.text = text; reply.status = this.state.scenario === 'reply_failed' ? 'failed' : 'sent'; reply.date = now(); this.audit('問い合わせ返信', id, '', reply.status, 'デモ送信'); this.emit(); if (reply.status === 'failed')
        throw new GatewayError('NETWORK', '返信に失敗しました。未送信として保存しています。再送できます。', {}, true); }
    async adminProduct(id: string, patch: Partial<Pick<Product, 'saleStatus' | 'availableQuantity' | 'inventoryTracked' | 'producer'>>, reason: string) { await this.wait(); const p = this.product(id); this.permission(p.business, true); this.reason(reason); if (patch.availableQuantity !== undefined && (!Number.isInteger(patch.availableQuantity) || patch.availableQuantity < 0))
        fail('在庫は0以上の整数で指定してください。'); const before = copy(p); Object.assign(p, copy(patch)); this.audit('商品変更', id, before, p, reason); this.emit(); }
    async adminCode(code: string, active: boolean, reason: string) { await this.wait(); this.permission(undefined, true); this.reason(reason); const c = this.codes.find(c => c.code === code); if (!c)
        throw new GatewayError('NOT_FOUND', 'コードが見つかりません。'); if (active && !this.referrers.find(r => r.id === c.referrerId)?.approved)
        fail('未承認の紹介者は有効にできません。'); this.audit('紹介コード切替', code, c.active, active, reason); c.active = active; this.emit(); }
    async issueCode(input: Omit<ReferralCode, 'uses'>) { await this.wait(); this.permission(undefined, true); if (!this.referrers.find(r => r.id === input.referrerId)?.approved || this.codes.some(c => c.code === input.code) || !input.code.trim() || !Number.isInteger(input.value) || input.value <= 0 || input.kind === 'percent' && input.value > 100 || input.maxUses < 1 || input.start > input.end || !input.productIds.length || input.productIds.some(id => this.product(id).business !== 'cosmetics'))
        fail('承認済み紹介者、未使用コード、対象商品、期間、割引・回数を確認してください。'); const c = { ...copy(input), uses: 0 }; this.codes.push(c); this.audit('紹介コード発行', c.code, '', c, '管理登録'); this.emit(); return copy(c); }
    async getReferralSales(month: string) { await this.wait(); this.permission(); if (this.state.adminRole !== 'full' && this.state.adminRole !== 'readonly')
        throw new GatewayError('FORBIDDEN', '紹介売上を閲覧する権限がありません。'); return this.referrers.map(referrer => { const orders = this.orders.filter(o => o.business === 'cosmetics' && o.referrerId === referrer.id && o.createdAt.startsWith(month)); return { referrer: copy(referrer), paidTotal: orders.filter(o => ['paid', 'shipped', 'refunded'].includes(o.status)).reduce((s, o) => s + o.subtotal - o.discount, 0), adjustment: -orders.filter(o => o.status === 'refunded').reduce((s, o) => s + o.subtotal - o.discount, 0), orders: copy(orders) }; }); }
    async listArticles(kind: 'news' | 'journal') { await this.wait(); return copy(this.articles.filter(a => a.kind === kind && a.published).sort((a, b) => b.date.localeCompare(a.date))); }
    async getShipping(b: Business) { await this.wait(); return copy(this.shippingConfigs.find(c => c.business === b)!); }
    async saveArticle(input: Article, reason: string) { await this.wait(); this.permission(undefined, true); this.reason(reason); if (!input.title.trim() || !input.text.trim() || !input.date || !['koriyama', 'cosmetics', 'agriculture'].includes(input.image))
        fail('記事のタイトル・本文・日付・画像を確認してください。'); const before = this.articles.find(a => a.id === input.id); const a = { ...copy(input), id: input.id || this.id('ART') }; this.articles = this.articles.filter(x => x.id !== a.id); this.articles.push(a); this.audit('記事編集・公開', a.id, before || '', a, reason); this.emit(); }
    async saveCategory(input: Category, reason: string) { await this.wait(); this.permission(input.business, true); this.reason(reason); if (!input.name.trim() || this.categories.some(c => c.business === input.business && c.name === input.name && c.id !== input.id))
        fail('カテゴリー名を確認してください。'); const before = this.categories.find(c => c.id === input.id); if (before && before.business !== input.business)
        throw new GatewayError('FORBIDDEN', 'カテゴリーの事業は変更できません。'); const c = { ...copy(input), id: input.id || this.id('CAT') }; if (before)
        this.products.filter(p => p.business === c.business && p.category === before.name).forEach(p => p.category = c.name); this.categories = this.categories.filter(x => x.id !== c.id); this.categories.push(c); this.audit('カテゴリー編集', c.id, before || '', c, reason); this.emit(); }
    async saveProduct(input: Product, reason: string) { await this.wait(); this.permission(input.business, true); this.reason(reason); if (!input.name.trim() || !input.description.trim() || !input.size.trim() || !Number.isInteger(input.price) || input.price < 0 || !Number.isInteger(input.availableQuantity) || input.availableQuantity < 0 || !this.categories.some(c => c.business === input.business && c.name === input.category) || !input.images.length || input.images.some(i => !/^\/images\/[a-z0-9-]+\.webp$/.test(i.src)))
        fail('商品名・カテゴリー・価格・内容量・在庫・画像をご確認ください。'); const before = this.products.find(p => p.id === input.id); if (before && before.business !== input.business)
        throw new GatewayError('FORBIDDEN', '商品の事業は変更できません。'); const p = { ...copy(input), id: input.id || this.id('PRD'), fulfillment: input.business === 'cosmetics' ? 'external' as const : 'ideanova' as const }; this.products = this.products.filter(x => x.id !== p.id); this.products.push(p); this.audit('商品情報編集', p.id, before || '', p, reason); this.emit(); }
    async saveShipping(input: ShippingConfig, reason: string) { await this.wait(); this.permission(input.business, true); this.reason(reason); if (!Number.isInteger(input.fee) || input.fee < 0 || input.freeOver !== null && (!Number.isInteger(input.freeOver) || input.freeOver < 0))
        fail('送料・送料無料条件は0以上の整数で指定してください。'); const before = this.shippingConfigs.find(c => c.business === input.business); this.shippingConfigs = this.shippingConfigs.map(c => c.business === input.business ? copy(input) : c); this.audit('送料・配送案内編集', input.business, before, input, reason); this.emit(); }
    async adminMember(id: string, input: MemberInput, referralCode: string, reason: string) { await this.wait(); this.permission(undefined, true); this.reason(reason); this.validateMember(input); const m = this.members.find(m => m.id === id); if (!m)
        throw new GatewayError('NOT_FOUND', '会員が見つかりません。'); if (this.members.some(x => x.id !== id && x.email.toLowerCase() === input.email.toLowerCase()))
        fail('メールアドレスが重複しています。'); let code: ReferralCode | undefined; if (referralCode) {
        const result = await this.validateReferral(referralCode);
        if (!result.valid)
            throw new GatewayError('REFERRAL_INVALID', result.message);
        code = result.code;
    } const before = copy(m); Object.assign(m, input, { referralCode: code?.code, referrerId: code?.referrerId }); if (this.state.member?.id === id)
        this.state.member = copy(m); this.audit('会員情報・紹介者訂正', id, before, m, reason); this.emit(); }
    async saveReferrer(input: Referrer, reason: string) { await this.wait(); this.permission(undefined, true); this.reason(reason); if (!input.name.trim())
        fail('紹介者名を入力してください。'); const before = this.referrers.find(r => r.id === input.id); const r = { ...copy(input), id: input.id || this.id('REF') }; this.referrers = this.referrers.filter(x => x.id !== r.id); this.referrers.push(r); this.audit('紹介者登録・承認', r.id, before || '', r, reason); this.emit(); }
    async saveAdministrator(input: AdminIdentity, reason: string) { await this.wait(); this.permission(undefined, true); this.reason(reason); if (!input.name.trim() || !['full', 'readonly', 'cosmetics', 'agriculture'].includes(input.role))
        fail('管理者名と権限を確認してください。'); const before = this.administrators.find(a => a.id === input.id); const a = { ...copy(input), id: input.id || this.id('ADM') }; if (!this.administrators.some(x => x.id !== a.id && x.role === 'full' && x.active) && !(a.role === 'full' && a.active))
        fail('有効な全体管理者を1名以上残してください。'); this.administrators = this.administrators.filter(x => x.id !== a.id); this.administrators.push(a); this.audit('管理者登録・権限変更', a.id, before || '', a, reason); this.emit(); }
    setScenario(s: Scenario) { this.state.scenario = s; this.scenarioConsumed = false; this.emit(); }
    setAdminRole(role: AdminRole) { this.state.adminRole = role; this.emit(); }
    resetDemo() { const fresh = new MockShopGateway(this.latency); this.products = fresh.products; this.codes = fresh.codes; this.referrers = fresh.referrers; this.categories = fresh.categories; this.articles = fresh.articles; this.shippingConfigs = fresh.shippingConfigs; this.administrators = fresh.administrators; this.members = fresh.members; this.orders = []; this.quotes.clear(); this.orderKeys.clear(); this.reviews = fresh.reviews; this.inquiries = fresh.inquiries; this.inquiryKeys.clear(); this.audits = []; this.state = { revision: this.state.revision, member: null, carts: { cosmetics: [], agriculture: [] }, scenario: 'normal', adminRole: 'full', adminEntered: false }; this.scenarioConsumed = false; this.emit(); }
}
export const shopGateway: ShopGateway = new MockShopGateway();
