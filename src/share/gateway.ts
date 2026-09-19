import { GatewayError, type ShopGateway, type GatewaySnapshot, type Business, type ProductQuery, type Article } from '../domain';
import { productFixtures } from '../fixtures';
import { articles } from '../data';
const products = productFixtures();
const snapshot: GatewaySnapshot = { revision: 0, member: null, carts: { cosmetics: [], agriculture: [] }, scenario: 'normal', adminRole: 'readonly', adminEntered: false };
const unavailable = () => Promise.reject(new GatewayError('UNAVAILABLE', 'このサイトはデザイン確認用です。登録・注文・送信は行えません。入力内容は送信されません。'));
const reads = {
  subscribe: (_listener: () => void) => () => {},
  getSnapshot: () => snapshot,
  getSession: async () => null,
  listProducts: async (query: ProductQuery) => {
    const group = products.filter(p => p.business === query.business);
    let items = group.filter(p => (query.business !== 'agriculture' || p.saleStatus === 'selling') && (!query.category || p.category === query.category) && (!query.search || (p.name + p.description).includes(query.search)));
    if (query.sort && query.sort !== 'default') items = [...items].sort((a,b) => query.sort === 'low' ? a.price-b.price : b.price-a.price);
    return structuredClone({ items, categories: [...new Set(group.map(p => p.category))] });
  },
  getProduct: async (business: Business, id: string) => {
    const p = products.find(p => p.business === business && p.id === id);
    if (!p) throw new GatewayError('NOT_FOUND', 'この売場の商品が見つかりません。');
    return structuredClone(p);
  },
  listArticles: async (kind: 'news' | 'journal'): Promise<Article[]> => structuredClone(articles.filter(a => (a.kind === 'news' ? 'news' : 'journal') === kind).map(a => ({ ...a, kind, image: a.image === 'hero' ? 'koriyama' : a.image, published: true })).sort((a,b) => b.date.localeCompare(a.date))),
  getShipping: async (business: Business) => ({ business, fee: business === 'cosmetics' ? 550 : 770, freeOver: null, regionNote: '配送地域・地域別追加送料は確認中', dispatchNote: business === 'cosmetics' ? 'メーカー・外部発送先より発送。日程は確認中' : 'IdeaNovaより発送。日程は確認中' }),
  getReviews: async () => { throw new GatewayError('UNAUTHENTICATED', 'レビューは会員向けの画面です。公開確認版では本文を表示しません。'); },
};
// A read-only allowlist: no HTTP, browser storage, personal data, or mutation adapter.
export const shopGateway = new Proxy(reads, { get(target, key: string) { return key in target ? target[key as keyof typeof target] : unavailable; } }) as unknown as ShopGateway;
export async function initializeGateway() {}
export function legacyCosmeticsCart() { return []; }
