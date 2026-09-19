const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const mime = { '.png': 'image/png', '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2' };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  const errors = [], checks = []; page.on('pageerror', e => errors.push(e.message));
  // Serve built files at the approved preview origins. Only /demo-api uses the live local proxy.
  await ctx.route('http://127.0.0.1:*/**', async route => {
    const u = new URL(route.request().url()); if (u.pathname.startsWith('/demo-api/')) return route.continue();
    const root = path.resolve('dist', u.port === '5179' ? 'cosmetics' : 'corporate');
    let file = path.resolve(root, '.' + decodeURIComponent(u.pathname));
    if (!file.startsWith(root + path.sep) && file !== root) return route.abort();
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
    await route.fulfill({ body: fs.readFileSync(file), contentType: mime[path.extname(file)] || 'application/octet-stream' });
  });
  try {
    await page.goto('http://127.0.0.1:5177/'); await expect(page.getByRole('heading', { name: /美しさが、/ })).toBeVisible(); checks.push('企業用ビルドのトップを表示');
    await page.goto('http://127.0.0.1:5177/business/cosmetics'); await page.getByRole('link', { name: /^化粧品オンラインショップへ/ }).click(); await expect(page).toHaveURL('http://127.0.0.1:5179/'); await expect(page.locator('.product-card').first()).toBeVisible(); checks.push('企業用ビルドから化粧品用ビルドへ同一タブ移動');
    await page.goto('http://127.0.0.1:5179/products/c01'); await expect(page.getByRole('heading', { name: 'バランシング ローション' })).toBeVisible(); await page.reload(); await expect(page.getByRole('button', { name: /^カートに入れる/ })).toBeVisible(); checks.push('化粧品用ビルドの商品詳細へ直接アクセス・再読み込み');
    await page.goto('http://127.0.0.1:5179/admin'); await expect(page.getByRole('heading', { name: 'ページが見つかりません' })).toBeVisible(); checks.push('化粧品ビルドに管理画面を配置しない');
    await page.goto('http://127.0.0.1:5177/');
    await page.locator('.ref-agriculture-copy').getByRole('link', {name:'オンラインショップで購入',exact:true}).click();
    await page.getByRole('combobox', {name:/^カテゴリー/}).selectOption('野菜');
    await expect(page.getByRole('combobox', {name:/^カテゴリー/})).toHaveValue('野菜');
    await expect(page.locator('.product-card')).toHaveCount(2);
    // Dropdown filtering is existing in-memory state; only a category URL persists on reload.
    await page.goto('http://127.0.0.1:5177/shop/agriculture?category=野菜');
    await page.reload();
    await expect(page.getByRole('combobox', {name:/^カテゴリー/})).toHaveValue('野菜');
    await expect(page.locator('.product-card')).toHaveCount(2);
    checks.push('農作物導線・野菜選択と既存カテゴリーURLの再読込で2商品を表示');
    await page.getByRole('combobox', {name:/^カテゴリー/}).selectOption('果物');
    await expect(page.getByRole('combobox', {name:/^カテゴリー/})).toHaveValue('果物');
    await expect(page.locator('.product-card')).toHaveCount(1);
    await expect(page.locator('.product-card')).toContainText('秋の梨');
    checks.push('ショップ内の果物選択で該当商品を表示');
    await page.goto('http://127.0.0.1:5177/shop/agriculture?category=unknown');
    await expect(page.getByRole('combobox', {name:/^カテゴリー/})).toHaveValue('');
    await expect(page.locator('.product-card')).toHaveCount(3);
    checks.push('未対応カテゴリーは全商品へ安全に戻す');
    expect(errors).toEqual([]); fs.writeFileSync('qa/lower-finish/build-smoke.json', JSON.stringify({ checks, errors, method: 'built files served by Playwright route; live same-origin demo proxy' }, null, 2)); console.log(JSON.stringify({ checks: checks.length, errors }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });



