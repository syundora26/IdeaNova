export type Business = 'cosmetics' | 'agriculture';
export const brands = { cosmetics: { name: '化粧品', en: 'Cosmetics', shipping: 'メーカー・外部倉庫より発送' }, agriculture: { name: '農作物', en: 'Agriculture', shipping: 'IdeaNovaより発送' } };
export interface Product {
    id: string;
    business: Business;
    name: string;
    en: string;
    category: string;
    price: number;
    size: string;
    description: string;
    image: string;
    position: string;
    stock: number;
    producer?: string;
}
export const products: Product[] = [
    { id: 'c01', business: 'cosmetics', name: 'バランシング ローション', en: 'Balancing Lotion', category: '化粧水', price: 3850, size: '150 mL', description: '毎日のスキンケアに、心地よいひとときを。みずみずしいテクスチャーの化粧水を想定したデザインサンプルです。成分・効能・使用方法は正式商品情報の確定後に掲載します。', image: 'cosmetics', position: '24% center', stock: 8 },
    { id: 'c02', business: 'cosmetics', name: 'モイスチャー セラム', en: 'Moisture Serum', category: '美容液', price: 5940, size: '30 mL', description: '自分の肌と向き合う時間に。なめらかな使い心地の美容液を想定したデザインサンプルです。実在する商品の効能を示すものではありません。', image: 'cosmetics', position: '51% center', stock: 12 },
    { id: 'c03', business: 'cosmetics', name: 'デイリー フェイスクリーム', en: 'Daily Face Cream', category: 'クリーム', price: 4620, size: '50 g', description: 'いつものお手入れを、丁寧に。肌になじむクリームを想定したデザインサンプルです。正式な使用方法・成分は商品情報の確定後に掲載します。', image: 'cosmetics', position: '78% center', stock: 0 },
    { id: 'a01', business: 'agriculture', name: '季節の野菜ボックス', en: 'Seasonal Vegetable Box', category: '野菜', price: 2980, size: '旬の野菜 5種', description: '季節ごとに変わる畑の恵みを、食卓へ。旬の野菜の詰め合わせを想定したサンプルです。実際の品目・産地・内容量は販売時にご案内します。', image: 'agriculture', position: 'center', stock: 10, producer: 'つくり手の紹介は、正式な生産者情報の確認後に掲載します。' },
    { id: 'a02', business: 'agriculture', name: '秋のかぼちゃ', en: 'Autumn Kabocha', category: '野菜', price: 980, size: '1玉', description: '食卓で季節を楽しむ、秋のかぼちゃ。掲載内容・価格はデザイン確認用のサンプルです。産地・品種は正式商品情報に差し替えます。', image: 'agriculture', position: '42% center', stock: 6 },
    { id: 'a03', business: 'agriculture', name: 'みずみずしい秋の梨', en: 'Autumn Pears', category: '果物', price: 1980, size: '3玉', description: 'ひと口に、季節のよろこびを。秋の梨を想定したデザインサンプルです。品種・産地・お届け時期は正式商品情報に差し替えます。', image: 'agriculture', position: '83% center', stock: 4 },
];
export const articles = [
    { id: 'n01', kind: 'news', date: '2026.09.11', category: 'お知らせ', title: 'IdeaNova、新しいウェブサイトのご案内。', text: '会社のこと、化粧品のこと、季節の農作物のこと。IdeaNovaをより身近に感じていただけるサイトを準備しています。', image: 'hero' },
    { id: 'n02', kind: 'news', date: '2026.09.08', category: '農作物', title: '秋の食卓を彩る、季節の便り。', text: '季節の移ろいとともに、食卓に届くものも変わります。農作物のページでは、販売中の商品をご紹介します。', image: 'agriculture' },
    { id: 'j01', kind: 'column', date: '2026.09.05', category: '暮らしのコラム', title: '自分をいたわる、朝の小さな習慣。', text: 'いつもの朝に、少しだけ自分のための時間を。肌に触れるものを選ぶことも、一日の始まりを丁寧に過ごすことも、暮らしを見つめ直すきっかけになります。', image: 'cosmetics' },
    { id: 'j02', kind: 'column', date: '2026.09.01', category: '季節のコラム', title: '旬を選ぶ。季節と暮らす。', text: '色やかたちの違う野菜を手に取ると、季節の変化に気づきます。何をつくるか考える時間も、日々の食卓を楽しむひとつの方法です。', image: 'agriculture' },
];
export const yen = (n: number) => new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(n);
export interface CartLine {
    productId: string;
    quantity: number;
}
export type Carts = Record<Business, CartLine[]>;
export const emptyCarts = (): Carts => ({ cosmetics: [], agriculture: [] });
export function setCartQuantity(carts: Carts, business: Business, id: string, quantity: number): Carts {
    const product = products.find(p => p.id === id && p.business === business);
    if (!product || !Number.isFinite(quantity))
        return carts;
    const safe = Math.min(product.stock, Math.max(0, Math.floor(quantity)));
    const lines = carts[business].filter(l => l.productId !== id);
    if (safe)
        lines.push({ productId: id, quantity: safe });
    return { ...carts, [business]: lines };
}
export function restoreCarts(value: unknown): Carts {
    let result = emptyCarts();
    if (!value || typeof value !== 'object')
        return result;
    for (const b of ['cosmetics', 'agriculture'] as const) {
        const lines = (value as Record<string, unknown>)[b];
        if (!Array.isArray(lines))
            continue;
        for (const line of lines)
            if (line && typeof line.productId === 'string' && typeof line.quantity === 'number')
                result = setCartQuantity(result, b, line.productId, line.quantity);
    }
    return result;
}
export function cartTotal(carts: Carts, business: Business) { return carts[business].reduce((sum, l) => sum + (products.find(p => p.id === l.productId && p.business === business)?.price ?? 0) * l.quantity, 0); }
