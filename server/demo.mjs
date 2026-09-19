/** Local-only shared demo backend. No payment, mail or external API calls. */
import http from 'node:http';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { createServer as createViteServer } from 'vite';

const vite = await createViteServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' });
const { MockShopGateway } = await vite.ssrLoadModule('/src/gateway.ts');
const { GatewayError, scenarios } = await vite.ssrLoadModule('/src/domain.ts');
const engine = new MockShopGateway(15);
const origins = { corporate: 'http://127.0.0.1:5177', cosmetics: 'http://127.0.0.1:5179' };
const sessions = new Map();
const migrations = new Map();
const passwords = new Map();
const digest = password => { const salt = randomBytes(16).toString('hex'); return { salt, hash: scryptSync(password, salt, 32) }; };
passwords.set('member-demo', digest('demo-password'));
const initial = () => ({ revision: 0, member: null, carts: { cosmetics: [], agriculture: [] }, scenario: 'normal', adminRole: 'full', adminEntered: false });
const reject = (message = 'このサイトでは操作できません。') => { throw new GatewayError('FORBIDDEN', message); };
const invalid = message => { throw new GatewayError('VALIDATION', message); };
const adminMethods = new Set(['enterAdmin', 'exitAdmin', 'getAdmin', 'adminOrder', 'adminReview', 'adminInquiry', 'replyInquiry', 'adminProduct', 'adminCode', 'issueCode', 'getReferralSales', 'setAdminRole', 'resetDemo', 'saveArticle', 'saveCategory', 'saveProduct', 'saveShipping', 'adminMember', 'saveReferrer', 'saveAdministrator']);
const methods = new Set(['listProducts', 'getProduct', 'login', 'register', 'logout', 'getSession', 'updateMember', 'requestRecovery', 'confirmPasswordReset', 'changeCart', 'quoteCart', 'createOrder', 'getOrders', 'getOrder', 'startPayment', 'checkPayment', 'changePaymentMethod', 'getReviews', 'postReview', 'editReview', 'deleteReview', 'validateReferral', 'createInquiry', 'setScenario', 'listArticles', 'getShipping', ...adminMethods]);
let queue = Promise.resolve();

function sessionFor(req, site, res) {
  const cookieName = `ideanova_${site}_demo`;
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(x => x.trim().split('=')));
  let id = cookies[cookieName];
  let session = sessions.get(id);
  if (!session || session.site !== site || session.expires < Date.now()) {
    id = randomBytes(32).toString('hex');
    session = { id, site, snapshot: initial(), initialized: false, consumed: false, expires: Date.now() + 24 * 3600000 };
    sessions.set(id, session);
    res.setHeader('Set-Cookie', `${cookieName}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
  }
  return session;
}

async function cleanLines(input) {
  if (!Array.isArray(input) || input.length > 100) invalid('カート内容を確認してください。');
  const map = new Map();
  for (const line of input) {
    if (!line || typeof line.productId !== 'string' || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) invalid('商品ID・数量を確認してください。');
    await engine.getProduct('cosmetics', line.productId);
    // A repeated product in the source is an absolute quantity, never an addition.
    map.set(line.productId, line.quantity);
  }
  return [...map].map(([productId, quantity]) => ({ productId, quantity }));
}

async function migrationPreview(record) {
  const items = [];
  for (const line of record.lines) {
    const p = await engine.getProduct('cosmetics', line.productId);
    const current = engine.getSnapshot().carts.cosmetics.find(x => x.productId === p.id)?.quantity || 0;
    const wanted = Math.max(current, line.quantity);
    const quantity = p.saleStatus === 'stopped' ? 0 : Math.min(wanted, p.inventoryTracked ? p.availableQuantity : 99);
    items.push({ productId: p.id, name: p.name, requested: line.quantity, existing: current, quantity, unitPrice: p.price,
      notice: p.saleStatus === 'stopped' ? '販売停止のため引き継げません' : quantity < wanted ? '現在の在庫数に合わせて数量を減らします' : current ? '既存数量と引継数量の多い方を採用します' : '現在の価格で引き継ぎます' });
  }
  return { items, expiresAt: new Date(record.expires).toISOString(), applied: !!record.destination };
}

async function rpc(session, method, args) {
  const site = session.site, business = site === 'cosmetics' ? 'cosmetics' : 'agriculture';
  if (method === 'bootstrap') {
    if (!session.initialized) {
      // Restore only this site's own product IDs/quantities. Legacy cosmetics is not imported here.
      const lines = args[0];
      if (Array.isArray(lines)) for (const line of lines.slice(0, 100)) {
        try { await engine.changeCart(business, line.productId, line.quantity); } catch { /* Rejected saved line stays in browser storage for manual review. */ }
      }
      session.initialized = true;
    }
    return null;
  }
  if (method === 'issueMigration') {
    if (site !== 'corporate') reject();
    const lines = await cleanLines(args[0]);
    if (!lines.length) invalid('引き継ぐ化粧品がありません。');
    const id = randomBytes(24).toString('hex');
    const expires = Date.now() + (engine.getSnapshot().scenario === 'migration_expired' ? -1 : 10 * 60000);
    migrations.set(id, { lines, expires, source: session.id });
    return { id, expiresAt: new Date(expires).toISOString() };
  }
  if (method === 'inspectMigration' || method === 'applyMigration') {
    if (site !== 'cosmetics') reject();
    const record = migrations.get(args[0]);
    if (!record || record.expires < Date.now()) throw new GatewayError('NOT_FOUND', '引き継ぎ案内の期限が切れたか、見つかりません。企業サイトで案内を作り直してください。');
    if (record.destination && record.destination !== session.id) reject('この引き継ぎは別のブラウザで完了しています。');
    if (method === 'inspectMigration') return migrationPreview(record);
    if (record.destination) return record.result; // Replay does not add or restore removed quantities.
    const current = await migrationPreview(record);
    if (JSON.stringify(current.items) !== JSON.stringify(args[1])) throw new GatewayError('CONFLICT', '価格・在庫・カート内容が変わりました。最新の内容を読み込み直して確認してください。');
    for (const item of current.items) {
      // Do not delete an existing cart item that is currently unavailable.
      if (item.quantity > 0) await engine.changeCart('cosmetics', item.productId, item.quantity);
    }
    record.destination = session.id;
    record.result = { ...current, applied: true };
    return record.result;
  }
  if (!methods.has(method)) reject('利用できない操作です。');
  if (adminMethods.has(method) && site !== 'corporate') reject();
  if (method === 'setScenario' && !scenarios.some(s => s.id === args[0])) invalid('確認シナリオを選択してください。');
  if (method === 'setAdminRole' && !['full', 'cosmetics', 'agriculture', 'readonly'].includes(args[0])) invalid('権限を確認してください。');
  if (['changeCart', 'quoteCart', 'getProduct', 'getShipping'].includes(method) && args[0] !== business) reject();
  if (method === 'listProducts' && args[0]?.business !== business) reject();
  if (method === 'getOrders') {
    if (args[0] && args[0] !== business) reject();
    args = [business];
  }
  if (['getOrder', 'startPayment', 'checkPayment', 'changePaymentMethod'].includes(method)) {
    if ((await engine.getOrder(args[0])).business !== business) reject();
  }
  if (method === 'createOrder') { engine.assertQuoteBusiness(args[0]?.quoteId, business); args[0].idempotencyKey = site + ':' + session.id + ':' + args[0].idempotencyKey; }
  if (['getReviews', 'postReview', 'editReview', 'deleteReview'].includes(method) && site !== 'cosmetics') reject();
  if (method === 'createInquiry' && !(site === 'cosmetics' ? args[0]?.business === 'cosmetics' : ['corporate', 'agriculture'].includes(args[0]?.business))) reject();
  if (method === 'createInquiry') args[0].idempotencyKey = site + ':' + session.id + ':' + args[0].idempotencyKey;
  if (method === 'login') {
    const id = engine.findMemberId(args[0]);
    const stored = passwords.get(id);
    if (typeof args[1] !== 'string' || !stored || !timingSafeEqual(stored.hash, scryptSync(args[1], stored.salt, 32))) throw new GatewayError('UNAUTHENTICATED', 'メールアドレスまたはパスワードをご確認ください。');
  }
  // Project only editable profile fields; never trust an id/referrer supplied by the browser.
  if (method === 'updateMember' || method === 'adminMember') {
    const index = method === 'adminMember' ? 1 : 0;
    args[index] = Object.fromEntries(['name', 'email', 'phone', 'address', 'nickname', 'age'].map(k => [k, args[index]?.[k]]));
  }
  const result = await engine[method](...args);
  if (method === 'register') passwords.set(result.id, digest(args[0].password));
  if (method === 'confirmPasswordReset') {
    const id = engine.findMemberId(args[0]);
    if (id) passwords.set(id, digest(args[2]));
  }
  if (method === 'resetDemo') {
    sessions.forEach(s => { s.snapshot = initial(); s.consumed = false; s.initialized = true; });
    migrations.clear(); passwords.clear(); passwords.set('member-demo', digest('demo-password'));
  }
  return result;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.url === '/health' && req.method === 'GET') { res.end(JSON.stringify({ ok: true, mode: 'local-demo' })); return; }
  const site = req.headers['x-ideanova-site'];
  if (req.method !== 'POST' || req.url !== '/rpc' || !Object.hasOwn(origins, site) || req.headers.origin !== origins[site] || !req.headers['content-type']?.startsWith('application/json')) {
    res.statusCode = 403; res.end(JSON.stringify({ error: { code: 'FORBIDDEN', message: 'ローカルプレビューからのみ利用できます。' } })); return;
  }
  let body = '';
  try {
    for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 128 * 1024) throw Error('size'); }
    body = JSON.parse(body);
    if (typeof body.method !== 'string' || !Array.isArray(body.args)) throw Error('shape');
  } catch { res.statusCode = 400; res.end(JSON.stringify({ error: { code: 'VALIDATION', message: 'リクエストを確認してください。' } })); return; }
  const session = sessionFor(req, site, res);
  // Serialize the in-memory engine across awaits: no user context can leak between requests.
  const execute = async () => {
    engine.activateSession(session.snapshot, session.consumed);
    let value, error;
    try { value = await rpc(session, body.method, body.args); }
    catch (e) { error = e instanceof GatewayError ? { code: e.code, message: e.message, fields: e.fields, retryable: e.retryable } : { code: 'VALIDATION', message: '入力内容を確認してください。' }; }
    session.snapshot = structuredClone(engine.getSnapshot());
    session.consumed = engine.isScenarioConsumed();
    res.end(JSON.stringify({ value, error, snapshot: session.snapshot }));
  };
  queue = queue.then(execute, execute);
});
server.listen(5180, '127.0.0.1', () => console.log('IdeaNova common demo service: http://127.0.0.1:5180'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.close(); vite.close().finally(() => process.exit(0)); });
