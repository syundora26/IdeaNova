const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true }); const ctx = await browser.newContext(); const page = await ctx.newPage();
  const corp = 'http://127.0.0.1:5177', cos = 'http://127.0.0.1:5179', checks = [];
  const rpc = async (origin, method, ...args) => { const r = await (await ctx.request.post(origin + '/demo-api/rpc', { headers: { Origin: origin }, data: { method, args } })).json(); expect(r.error).toBeUndefined(); return r.value; };
  try {
    await rpc(corp, 'resetDemo');
    const input = { name: '共通更新の確認', email: 'refresh@example.invalid', password: 'refresh-password', phone: '000-0000-0000', address: '郡山市デモ住所', nickname: '更新確認', age: '30代', consent: true };
    const member = await rpc(corp, 'register', input); await rpc(cos, 'login', input.email, input.password);
    await page.goto(corp + '/shop/account', { waitUntil: 'networkidle' }); await page.getByRole('button', { name: '登録情報', exact: true }).click();
    await rpc(cos, 'updateMember', { ...member, name: '化粧品側から更新した氏名' }); await page.evaluate(() => dispatchEvent(new Event('focus')));
    await expect(page.getByLabel(/^氏名/)).toHaveValue('化粧品側から更新した氏名');
    await page.getByLabel(/^住所/).fill('編集中の住所は保持'); await rpc(cos, 'updateMember', { ...member, name: '再度更新した氏名' }); await page.evaluate(() => dispatchEvent(new Event('focus')));
    await expect(page.getByLabel(/^住所/)).toHaveValue('編集中の住所は保持'); checks.push('別サイトのプロフィール変更をフォーカス時に反映し、編集中の入力は保持');
    await page.goto(corp + '/admin'); await page.getByRole('button', { name: /デモ管理画面に入る/ }).click(); await page.getByRole('button', { name: 'お問い合わせ', exact: true }).click();
    await rpc(cos, 'createInquiry', { business: 'cosmetics', name: input.name, email: input.email, subject: '化粧品から新しい問い合わせ', message: '管理画面を開いたまま追加した受付', consent: true, idempotencyKey: 'focus-inquiry' });
    await page.evaluate(() => dispatchEvent(new Event('focus'))); await expect(page.getByText('管理画面を開いたまま追加した受付', { exact: true })).toBeVisible(); checks.push('開いた共通管理画面に別サイトの新着問い合わせをフォーカス時に反映');
    fs.writeFileSync('qa/separation/shared-refresh-results.json', JSON.stringify({ checks }, null, 2)); console.log(JSON.stringify({ checks: checks.length }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
