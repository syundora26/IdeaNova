import type { Product, ReferralCode, Referrer } from './domain';
import { products as originalProducts } from './data';
export function productFixtures(): Product[] { return originalProducts.map(p => ({ id: p.id, business: p.business, name: p.name, category: p.category, price: p.price, size: p.size, description: p.description, images: [{ src: `/images/${p.image}.webp`, alt: `${p.name}のイメージ（サンプル）`, position: p.position }, { src: `/images/${p.image}.webp`, alt: '商品の全体イメージ（サンプル）', position: 'center' }], saleStatus: p.id === 'c03' ? 'stopped' : 'selling', inventoryTracked: p.id !== 'c02', availableQuantity: p.id === 'a03' ? 0 : p.stock, fulfillment: p.business === 'cosmetics' ? 'external' : 'ideanova', producer: p.business === 'agriculture' ? { visible: p.id === 'a01', name: 'つくり手の紹介', description: '生産者の正式な情報は確認後に掲載します。現在は表示・非表示の確認用です。' } : undefined })); }
export const referrerFixtures: Referrer[] = [{ id: 'r1', name: '紹介者A（サンプル）', approved: true }, { id: 'r2', name: '紹介者B（サンプル）', approved: true }, { id: 'r3', name: '未承認の紹介者（サンプル）', approved: false }];
export function codeFixtures(): ReferralCode[] {
    const base = { active: true, productIds: ['c01', 'c02'], start: '2020-01-01', end: '2099-12-31', maxUses: 100, uses: 0 };
    return [
        { ...base, code: 'DEMO10', referrerId: 'r1', kind: 'percent', value: 10 },
        { ...base, code: 'DEMO500', referrerId: 'r2', kind: 'fixed', value: 500 },
        { ...base, code: 'STOPPED', referrerId: 'r1', kind: 'percent', value: 10, active: false },
        { ...base, code: 'EXPIRED', referrerId: 'r1', kind: 'fixed', value: 500, end: '2020-12-31' },
        { ...base, code: 'USEDUP', referrerId: 'r1', kind: 'percent', value: 10, maxUses: 1, uses: 1 },
        { ...base, code: 'UNAPPROVED', referrerId: 'r3', kind: 'percent', value: 10 },
    ];
}
