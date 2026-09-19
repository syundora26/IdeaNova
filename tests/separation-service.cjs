const { request } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const origins = { corporate: 'http://127.0.0.1:5177', cosmetics: 'http://127.0.0.1:5179' };
const results = [];
async function main() {
  const client = await request.newContext();
  const other = await request.newContext();
  const call = async (site, method, args = [], ctx = client) => (await ctx.post(origins[site] + '/demo-api/rpc', { headers: { Origin: origins[site] }, data: { method, args } })).json();
  const ok = async (site, method, ...args) => { const r = await call(site, method, args); assert.equal(r.error, undefined, JSON.stringify(r.error)); return r.value; };
  const bad = async (site, method, args, code) => { const r = await call(site, method, args); assert.equal(r.error?.code, code, JSON.stringify(r)); };
  const test = async (name, fn) => { await fn(); results.push({ name, pass: true }); console.log('PASS ' + name); };
  await ok('corporate', 'resetDemo');
  await ok('corporate', 'bootstrap', []); await ok('cosmetics', 'bootstrap', []);
  const member = { name: '共有確認会員', email: 'shared@example.invalid', phone: '000-0000-0000', address: '福島県郡山市 デモ住所', nickname: '共有ニックネーム', age: '30代', password: 'shared-password', consent: true, referralCode: 'DEMO10' };
  let person, cosmeticOrder, agricultureOrder;
  const address = { name: member.name, postal: '000-0000', address: member.address, phone: member.phone };
  const order = async (site, paymentMethod = 'bank', key = 'same-key') => { const q = await ok(site, 'quoteCart', site === 'cosmetics' ? 'cosmetics' : 'agriculture'); return ok(site, 'createOrder', { quoteId: q.id, address, paymentMethod, consent: true, idempotencyKey: key }); };
  await test('登録情報を共有し、ログインはサイト別・パスワードを照合', async () => {
    person = await ok('corporate', 'register', member);
    assert.equal(await ok('cosmetics', 'getSession'), null);
    await bad('cosmetics', 'login', [member.email, 'wrong-password'], 'UNAUTHENTICATED');
    assert.equal((await ok('cosmetics', 'login', member.email, member.password)).id, person.id);
    const state = await client.storageState();
    assert.deepEqual(state.cookies.map(c => c.name).sort(), ['ideanova_corporate_demo', 'ideanova_cosmetics_demo']);
    assert(state.cookies.every(c => c.httpOnly && c.sameSite === 'Lax'));
  });
  await test('登録情報の更新が反映され、IDや紹介者の書換えを受け付けない', async () => {
    await ok('cosmetics', 'updateMember', { ...person, name: '更新した共通氏名', id: 'member-demo', referrerId: 'invalid' });
    const m = await ok('corporate', 'getSession');
    assert.equal(m.name, '更新した共通氏名'); assert.equal(m.id, person.id); assert.equal(m.referrerId, person.referrerId);
  });
  await test('一方のログアウトは他方に影響しない', async () => {
    await ok('cosmetics', 'logout'); assert.equal(await ok('cosmetics', 'getSession'), null);
    assert.equal((await ok('corporate', 'getSession')).id, person.id);
    await ok('cosmetics', 'login', member.email, member.password);
  });
  await test('カート・商品・見積の事業をサービス側で制限', async () => {
    await ok('corporate', 'changeCart', 'agriculture', 'a01', 2);
    await ok('cosmetics', 'changeCart', 'cosmetics', 'c01', 1);
    await bad('corporate', 'changeCart', ['cosmetics', 'c01', 1], 'FORBIDDEN');
    await bad('cosmetics', 'getProduct', ['agriculture', 'a01'], 'FORBIDDEN');
    await bad('corporate', 'quoteCart', ['cosmetics'], 'FORBIDDEN');
    const c = await call('corporate', 'getSession'); assert.deepEqual(c.snapshot.carts.cosmetics, []); assert.equal(c.snapshot.carts.agriculture[0].quantity, 2);
  });
  await test('化粧品紹介割引・農作物適用外・異事業見積の注文拒否', async () => {
    const c = await ok('cosmetics', 'quoteCart', 'cosmetics'); assert(c.discount > 0);
    const a = await ok('corporate', 'quoteCart', 'agriculture'); assert.equal(a.discount, 0);
    await bad('corporate', 'createOrder', [{ quoteId: c.id, address, paymentMethod: 'bank', consent: true, idempotencyKey: 'attack' }], 'FORBIDDEN');
    cosmeticOrder = await order('cosmetics', 'paypay'); agricultureOrder = await order('corporate');
    assert.notEqual(cosmeticOrder.id, agricultureOrder.id);
  });
  await test('注文履歴と決済操作は各サイトの事業のみ', async () => {
    assert.deepEqual((await ok('corporate', 'getOrders')).map(o => o.business), ['agriculture']);
    assert.deepEqual((await ok('cosmetics', 'getOrders')).map(o => o.business), ['cosmetics']);
    await bad('corporate', 'getOrder', [cosmeticOrder.id], 'FORBIDDEN');
    await bad('corporate', 'startPayment', [cosmeticOrder.id], 'FORBIDDEN');
    await bad('cosmetics', 'getOrders', ['agriculture'], 'FORBIDDEN');
  });
  await test('PayPay結果不明は再決済を拒否し、照会で解決', async () => {
    await ok('cosmetics', 'setScenario', 'payment_unknown');
    assert.equal((await ok('cosmetics', 'startPayment', cosmeticOrder.id)).payment.status, 'unknown');
    await bad('cosmetics', 'startPayment', [cosmeticOrder.id], 'PAYMENT_PENDING');
    await bad('cosmetics', 'changePaymentMethod', [cosmeticOrder.id, 'bank'], 'PAYMENT_PENDING');
    await ok('cosmetics', 'setScenario', 'normal');
    const o = await ok('cosmetics', 'checkPayment', cosmeticOrder.id); assert.equal(o.payment.status, 'paid'); assert.equal(o.payment.attempts, 1);
  });
  await test('未ログインのレビュー本文拒否・会員複数投稿・公開情報限定', async () => {
    const anonymous = await call('cosmetics', 'getReviews', ['c01'], other); assert.equal(anonymous.error.code, 'UNAUTHENTICATED');
    await bad('corporate', 'getReviews', ['c01'], 'FORBIDDEN');
    const first = await ok('cosmetics', 'postReview', { productId: 'c01', rating: 5, text: '共通管理の公開確認用' });
    await ok('cosmetics', 'postReview', { productId: 'c01', rating: 4, text: '二度目の投稿' });
    await ok('corporate', 'enterAdmin'); await ok('corporate', 'adminReview', first.id, 'published', '公開を確認');
    const r = await ok('cosmetics', 'getReviews', 'c01'); assert.equal(r.own.length, 2);
    assert.deepEqual(Object.keys(r.published.find(x => x.id === first.id)), ['id', 'productId', 'nickname', 'age', 'rating', 'date', 'text']);
    await ok('cosmetics', 'editReview', first.id, { productId: 'c01', rating: 5, text: '編集した本文' });
    assert.equal((await ok('cosmetics', 'getReviews', 'c01')).own[0].status, 'pending');
  });
  await test('3窓口・2事業注文が共通管理に反映、返信失敗と再試行', async () => {
    for (const business of ['corporate', 'agriculture', 'cosmetics']) await ok(business === 'cosmetics' ? 'cosmetics' : 'corporate', 'createInquiry', { business, name: member.name, email: member.email, subject: business + '確認', message: '共通管理への受付確認', consent: true, idempotencyKey: 'inquiry-' + business });
    const a = await ok('corporate', 'getAdmin'); assert.equal(a.orders.length, 2); assert.equal(a.inquiries.length, 4);
    const i = a.inquiries.find(i => i.business === 'cosmetics');
    await ok('corporate', 'setScenario', 'reply_failed'); await bad('corporate', 'replyInquiry', [i.id, '返信確認'], 'NETWORK');
    await ok('corporate', 'setScenario', 'normal');
    const failed = (await ok('corporate', 'getAdmin')).inquiries.find(x => x.id === i.id).replies[0];
    await ok('corporate', 'replyInquiry', i.id, '返信確認', failed.id);
    assert.equal((await ok('corporate', 'getAdmin')).inquiries.find(x => x.id === i.id).replies.length, 1);
    await bad('cosmetics', 'createInquiry', [{ business: 'corporate' }], 'FORBIDDEN');
  });
  await test('化粧品サイトの管理API拒否・企業管理の事業権限維持', async () => {
    for (const method of ['enterAdmin', 'getAdmin', 'setAdminRole', 'resetDemo']) await bad('cosmetics', method, [], 'FORBIDDEN');
    await ok('corporate', 'setAdminRole', 'agriculture');
    assert.deepEqual((await ok('corporate', 'getAdmin')).orders.map(o => o.business), ['agriculture']);
    await bad('corporate', 'adminOrder', [cosmeticOrder.id, 'refund', '権限確認'], 'FORBIDDEN');
    await ok('corporate', 'setAdminRole', 'full');
  });
  let migration, preview;
  await test('移行IDは化粧品ID・数量だけを含む案内を発行し期限を持つ', async () => {
    await ok('corporate', 'changeCart', 'agriculture', 'a01', 1);
    await ok('cosmetics', 'changeCart', 'cosmetics', 'c01', 1);
    migration = await ok('corporate', 'issueMigration', [{ productId: 'c01', quantity: 3, price: 1, email: 'ignored' }]);
    assert.match(migration.id, /^[a-f0-9]{48}$/); const remaining = Date.parse(migration.expiresAt) - Date.now(); assert(remaining > 599000 && remaining <= 601000, `移行期限は約10分: ${remaining}ms`);
    await bad('corporate', 'issueMigration', [[{ productId: 'a01', quantity: 1 }]], 'NOT_FOUND');
    await bad('cosmetics', 'inspectMigration', ['missing'], 'NOT_FOUND');
    preview = await ok('cosmetics', 'inspectMigration', migration.id); assert.equal(preview.items[0].quantity, 3); assert.equal(preview.items[0].unitPrice, 3850);
  });
  await test('移行確定前の価格・在庫変更で再確認し、重複加算しない', async () => {
    const p = (await ok('corporate', 'getAdmin')).products.find(p => p.id === 'c01');
    await ok('corporate', 'saveProduct', { ...p, price: 4000, availableQuantity: 2 }, '移行再検査');
    await bad('cosmetics', 'applyMigration', [migration.id, preview.items], 'CONFLICT');
    preview = await ok('cosmetics', 'inspectMigration', migration.id); assert.equal(preview.items[0].quantity, 2); assert.equal(preview.items[0].unitPrice, 4000);
    await ok('cosmetics', 'applyMigration', migration.id, preview.items);
    await ok('cosmetics', 'applyMigration', migration.id, preview.items);
    let s = await call('cosmetics', 'getSession'); assert.equal(s.snapshot.carts.cosmetics[0].quantity, 2);
    await ok('cosmetics', 'changeCart', 'cosmetics', 'c01', 0); await ok('cosmetics', 'applyMigration', migration.id, preview.items);
    s = await call('cosmetics', 'getSession'); assert.equal(s.snapshot.carts.cosmetics.length, 0);
    s = await call('corporate', 'getSession'); assert.equal(s.snapshot.carts.agriculture[0].quantity, 1);
    const r = await call('cosmetics', 'inspectMigration', [migration.id], other); assert.equal(r.error.code, 'FORBIDDEN');
    await ok('corporate', 'saveProduct', p, 'デモ条件復旧');
  });
  await test('販売停止品は移行できず、農作物カートは変化しない', async () => {
    const ticket = await ok('corporate', 'issueMigration', [{ productId: 'c03', quantity: 1 }]);
    const p = await ok('cosmetics', 'inspectMigration', ticket.id); assert.equal(p.items[0].quantity, 0);
    await ok('cosmetics', 'applyMigration', ticket.id, p.items);
    assert.equal((await call('corporate', 'getSession')).snapshot.carts.agriculture[0].quantity, 1);
  });
  await test('期限切れ移行IDは参照・確定とも拒否する', async () => {
    await ok('corporate', 'setScenario', 'migration_expired');
    const ticket = await ok('corporate', 'issueMigration', [{ productId: 'c01', quantity: 1 }]);
    await ok('corporate', 'setScenario', 'normal');
    await bad('cosmetics', 'inspectMigration', [ticket.id], 'NOT_FOUND');
    await bad('cosmetics', 'applyMigration', [ticket.id, []], 'NOT_FOUND');
  });
  await test('共有パスワード再設定とサイト別セッションを維持', async () => {
    await ok('cosmetics', 'confirmPasswordReset', member.email, 'demo-reset', 'changed-password');
    await ok('corporate', 'logout'); await bad('corporate', 'login', [member.email, member.password], 'UNAUTHENTICATED');
    await ok('corporate', 'login', member.email, 'changed-password');
    assert.equal((await ok('cosmetics', 'getSession')).id, person.id);
  });
  await test('未知の操作と異なるOriginを拒否', async () => {
    await bad('corporate', 'activateSession', [{}], 'FORBIDDEN');
    const forbidden = await client.post(origins.corporate + '/demo-api/rpc', { headers: { Origin: origins.cosmetics }, data: { method: 'getSession', args: [] } }); assert.equal(forbidden.status(), 403);
  });
  await client.dispose(); await other.dispose();
}
main().then(() => { fs.writeFileSync('qa/separation/service-results.json', JSON.stringify({ results }, null, 2)); }).catch(e => { console.error(e); fs.writeFileSync('qa/separation/service-results.json', JSON.stringify({ results, error: String(e) }, null, 2)); process.exitCode = 1; });
