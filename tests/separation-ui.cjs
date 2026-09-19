const { chromium, expect, request } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('node:fs');
const corp = 'http://127.0.0.1:5177', cos = 'http://127.0.0.1:5179', dir = 'qa/separation';
const checks = [], screens = [], audits = [], errors = [];
const mark = text => { checks.push(text); console.log('PASS ' + text); };
const nav = async (page, path) => { await page.evaluate(path => { history.pushState({}, '', path); dispatchEvent(new PopStateEvent('popstate')); }, path); };
const scenario = async (page, name) => { await nav(page, '/preview'); await page.getByRole('radio', { name, exact: true }).click(); await expect(page.getByRole('radio', { name, exact: true })).toBeChecked(); };
const add = async (page, path) => { await nav(page, path); await page.getByRole('button', { name: /^カートに入れる/ }).click(); await expect(page.getByText(/のカートに追加しました/)).toBeVisible(); };
async function login(page, email, password) { await page.getByLabel(/^メールアドレス/).fill(email); await page.getByLabel(/^パスワード/).fill(password); await page.getByRole('button', { name: /^ログインする/ }).click(); }
async function checkout(page, method = 'bank') {
  await page.getByLabel(/^お名前/).fill('検証用会員'); await page.getByLabel(/^郵便番号/).fill('963-0000'); await page.getByLabel(/^ご住所/).fill('福島県郡山市・検証用住所'); await page.getByLabel(/^電話番号/).fill('000-0000-0000');
  await page.getByRole('radio', { name: method === 'bank' ? /^銀行振込/ : /^PayPay/ }).check(); await page.getByRole('button', { name: /^注文内容を確認する/ }).click(); await expect(page.getByRole('heading', { name: '注文内容の最終確認' })).toBeVisible(); await page.getByRole('checkbox').check();
}
(async () => {
  fs.mkdirSync(dir, { recursive: true });
  const setup = await request.newContext();
  await setup.post(corp + '/demo-api/rpc', { headers: { Origin: corp }, data: { method: 'resetDemo', args: [] } }); await setup.dispose();
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let page;
  try {
    for (const [label, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
      const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      page = await ctx.newPage(); page.setDefaultTimeout(12000); page.on('pageerror', e => errors.push(e.message));
      await page.goto(corp + '/', { waitUntil: 'networkidle' }); await expect(page.getByRole('heading', { name: /暮らしに、/ })).toBeVisible();
      expect(await page.locator('.site-header').getByRole('link', { name: /カート|会員/ }).count()).toBe(0);
      await page.screenshot({ path: `${dir}/${label}-corporate.png`, fullPage: true });
      await nav(page, '/business/cosmetics'); await page.getByRole('link', { name: /^化粧品オンラインショップへ/ }).click();
      await expect(page).toHaveURL(cos + '/'); await expect(page.getByRole('heading', { name: '化粧品の売場' })).toBeVisible(); expect(ctx.pages().length).toBe(1);
      await page.goBack(); await expect(page).toHaveURL(corp + '/business/cosmetics');
      await page.getByRole('link', { name: /^化粧品オンラインショップへ/ }).click(); await expect(page).toHaveURL(cos + '/');
      await expect(page.locator('.product-card')).toHaveCount(3); await page.screenshot({ path: `${dir}/${label}-cosmetics.png`, fullPage: true });
      expect(await page.locator('.site-footer').getByRole('link', { name: /農作物|管理画面/ }).count()).toBe(0);
      mark(`${label}: 同一タブで化粧品へ移動・戻る・専用ヘッダーとフッター`);
      await add(page, '/products/c01'); await expect(page.getByText(/レビューの本文は会員の方のみ/)).toBeVisible();
      await page.locator('.shop-nav').getByRole('link', { name: '企業サイトへ' }).click(); await expect(page).toHaveURL(corp + '/');
      await nav(page, '/shop'); await expect(page.getByRole('heading', { name: /季節の恵みを/ })).toBeVisible();
      await add(page, '/shop/agriculture/products/a01'); await expect(page.locator('.shop-nav').getByRole('link', { name: 'カート 1点' })).toBeVisible();
      await nav(page, '/business/cosmetics'); await page.getByRole('link', { name: /^化粧品オンラインショップへ/ }).click();
      await page.locator('.shop-nav').getByRole('link', { name: 'カート 1点' }).click(); await expect(page).toHaveURL(cos + '/cart');
      await page.getByRole('link', { name: /購入手続きへ/ }).click(); await page.getByRole('link', { name: /新規会員登録/ }).click();
      const email = `separated-${label}@example.invalid`;
      await page.getByLabel(/^氏名/).fill('検証用会員'); await page.getByLabel(/^メールアドレス/).fill(email); await page.getByLabel(/^電話番号/).fill('000-0000-0000'); await page.getByLabel(/^住所/).fill('郡山市・デモ住所'); await page.getByLabel(/^ニックネーム/).fill('郡山の会員'); await page.getByLabel(/^年代/).selectOption('30代'); await page.getByLabel(/^パスワード/).fill('separated-password'); await page.getByLabel(/^紹介コード/).fill('INVALID'); await page.getByRole('checkbox').check();
      await page.getByRole('button', { name: /^会員登録して続ける/ }).click(); await page.getByRole('button', { name: /紹介コードを使わずに登録へ戻る/ }).click(); await expect(page.getByLabel(/^氏名/)).toHaveValue('検証用会員'); await page.getByRole('button', { name: /^会員登録して続ける/ }).click();
      await expect(page).toHaveURL(cos + '/checkout'); await checkout(page); await page.getByRole('button', { name: '入力画面へ戻る' }).click(); await expect(page.getByLabel(/^ご住所/)).toHaveValue('福島県郡山市・検証用住所'); await page.getByRole('button', { name: /^注文内容を確認する/ }).click(); await page.getByRole('checkbox').check(); await page.getByRole('button', { name: /^デモ注文を確定する/ }).click();
      await expect(page).toHaveURL(/5179\/orders\//); await expect(page.getByRole('heading', { name: '銀行振込のご案内' })).toBeVisible();
      const cosmeticOrderUrl = page.url(); await page.reload(); await expect(page.getByRole('heading', { name: '銀行振込のご案内' })).toBeVisible();
      mark(`${label}: 別カート保持・紹介コードなし登録・購入復帰・再読込後の会員/注文保持`);
      await nav(page, '/products/c01'); await page.getByLabel(/^本文/).fill('分離後の会員レビュー確認です。'); await page.getByRole('button', { name: /投稿内容を確認する/ }).click(); await page.getByRole('button', { name: /この内容で投稿する/ }).click(); await expect(page.locator('.own-reviews')).toContainText('公開待ち');
      await nav(page, '/account'); await page.getByRole('button', { name: '登録情報', exact: true }).click(); await page.getByLabel(/^ニックネーム/).fill('共通プロフィール'); await page.getByRole('button', { name: /変更を保存する/ }).click(); await expect(page.getByText('登録情報を更新しました。')).toBeVisible();
      const corporatePage = await ctx.newPage(); await corporatePage.goto(corp + '/shop/account', { waitUntil: 'networkidle' }); await expect(corporatePage.getByRole('link', { name: 'ログインする →' })).toBeVisible();
      await corporatePage.getByRole('link', { name: 'ログインする →' }).click(); await login(corporatePage, email, 'separated-password'); await expect(corporatePage.getByText('共通プロフィール さん、こんにちは。')).toBeVisible(); await expect(corporatePage.getByRole('heading', { name: 'まだご注文はありません' })).toBeVisible();
      await nav(corporatePage, '/shop/cart'); await expect(corporatePage.locator('.cart-row')).toHaveCount(1); await corporatePage.getByRole('link', { name: /購入手続きへ/ }).click(); await checkout(corporatePage); await corporatePage.getByRole('button', { name: /^デモ注文を確定する/ }).click(); await expect(corporatePage).toHaveURL(/5177\/shop\/orders\//);
      await nav(corporatePage, '/shop/account'); await expect(corporatePage.locator('.order-list')).toContainText('農作物'); expect(await corporatePage.locator('.order-list').innerText()).not.toContain('化粧品'); await corporatePage.getByRole('button', { name: 'ログアウト', exact: true }).click();
      await page.goto(cosmeticOrderUrl); await expect(page.getByRole('heading', { name: '銀行振込のご案内' })).toBeVisible(); await corporatePage.close();
      const cookies = await ctx.cookies(); expect(cookies.filter(c => c.name.startsWith('ideanova_')).every(c => c.httpOnly)).toBe(true);
      const local = await page.evaluate(() => JSON.stringify({ ...localStorage })); expect(local).not.toContain(email); expect(local).not.toContain('password');
      mark(`${label}: 共通プロフィール・他サイトへ個別ログイン・サイト別注文履歴/ログアウト`);
      await nav(page, '/contact'); await page.getByLabel(/^件名/).fill('化粧品配送のご相談'); await page.getByLabel(/^お問い合わせ内容/).fill('別サイトの問い合わせ確認です。'); await page.getByRole('checkbox').check(); await page.getByRole('button', { name: /入力内容を確認する/ }).click(); await page.getByRole('button', { name: /この内容で送信する/ }).click(); await expect(page.getByRole('heading', { name: 'お問い合わせを受け付けました。' })).toBeVisible();
      mark(`${label}: 化粧品専用の問い合わせ入力・確認・完了`);
      await ctx.close();
    }
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    page = await ctx.newPage(); page.setDefaultTimeout(12000); page.on('pageerror', e => errors.push(e.message));
    await page.goto(corp + '/products/c01'); await expect(page).toHaveURL(cos + '/products/c01'); await expect(page.getByRole('heading', { name: 'バランシング ローション' })).toBeVisible();
    await page.goto(corp + '/login?next=%2Fcheckout%3Fbusiness%3Dcosmetics'); await expect(page).toHaveURL(cos + '/login?next=%2Fcheckout');
    await login(page, 'demo@example.invalid', 'demo-password'); await expect(page).toHaveURL(cos + '/checkout');
    await page.goto(cos + '/login?next=https%3A%2F%2Fevil.example'); await expect(page).toHaveURL(cos + '/login?next=%2Faccount');
    await page.goto(cos + '/admin'); await expect(page.getByRole('heading', { name: 'ページが見つかりません' })).toBeVisible();
    mark('旧商品ID・旧ログイン購入復帰・任意URL拒否・化粧品側に管理画面なし');
    await page.goto(corp + '/shop');
    await page.evaluate(() => localStorage.setItem('ideanova-cart-v2', JSON.stringify({ cosmetics: [{ productId: 'c02', quantity: 2 }], agriculture: [{ productId: 'a01', quantity: 1 }] })));
    await page.goto(corp + '/shop/cosmetics/products/c02'); await expect(page.getByRole('heading', { name: '新しいショップへ、お買い物を引き継ぐ。' })).toBeVisible();
    await page.getByRole('button', { name: /化粧品カートを引き継ぐ/ }).click(); await expect(page).toHaveURL(/5179\/cart\/transfer\?id=/); await expect(page.getByRole('button', { name: /この内容でカートを引き継ぐ/ })).toBeVisible();
    const migrationUrl = page.url(); await page.screenshot({ path: `${dir}/migration-confirmation.png`, fullPage: true });
    await page.getByRole('button', { name: /この内容でカートを引き継ぐ/ }).click(); await expect(page.getByRole('heading', { name: 'カートを引き継ぎました。' })).toBeVisible();
    await page.reload(); await expect(page.getByRole('heading', { name: 'カートを引き継ぎました。' })).toBeVisible();
    await page.getByRole('link', { name: 'カートを確認する →' }).click(); await expect(page.locator('.cart-row')).toHaveCount(1); await expect(page.locator('.shop-nav').getByRole('link', { name: 'カート 2点' })).toBeVisible();
    await page.goto(corp + '/shop'); expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ideanova-cart-v2')).cosmetics[0].quantity)).toBe(2);
    await page.evaluate(() => localStorage.removeItem('ideanova-cart-v2')); // test fixture cleanup; application never deletes it.
    mark('旧カート案内・内容確認・移行ID・再読込で重複なし・元データ保持');
    await page.goto(cos + '/cart'); await page.getByRole('link', { name: /購入手続きへ/ }).click(); await checkout(page, 'paypay');
    await page.getByRole('button', { name: /^デモ注文を確定する/ }).click(); await expect(page).toHaveURL(/5179\/orders\//); const unknownOrder = new URL(page.url()).pathname;
    await expect(page.getByRole('button', { name: /PayPayのデモ支払いへ/ })).toBeVisible();
    await scenario(page, 'PayPay結果不明'); await nav(page, unknownOrder); await page.getByRole('button', { name: /PayPayのデモ支払いへ/ }).click(); await expect(page.getByRole('heading', { name: 'お支払い結果を確認しています。' })).toBeVisible(); expect(await page.getByRole('button', { name: /PayPayのデモ支払いへ|銀行振込に変更/ }).count()).toBe(0);
    await scenario(page, '通常の操作'); await nav(page, unknownOrder); await page.getByRole('button', { name: /支払い状況を確認する/ }).click(); await expect(page.getByRole('heading', { name: 'お支払いを確認しました。' })).toBeVisible(); mark('分離後も決済結果不明時は照会だけを案内');
    await scenario(page, '注文直前の価格変更'); await add(page, '/products/c02'); await nav(page, '/checkout'); await checkout(page); await page.getByRole('button', { name: /^デモ注文を確定する/ }).click(); await expect(page.getByRole('alert')).toContainText('確定直前'); await page.getByRole('button', { name: '最新金額を再確認' }).click(); await expect(page.getByLabel(/^ご住所/)).toHaveValue('福島県郡山市・検証用住所'); mark('価格再確認でも配送先の入力を保持');
    await scenario(page, '問い合わせ送信失敗'); await nav(page, '/contact'); await page.getByLabel(/^件名/).fill('再送確認'); await page.getByLabel(/^お問い合わせ内容/).fill('保持する問い合わせ本文'); await page.getByRole('checkbox').check(); await page.getByRole('button', { name: /入力内容を確認する/ }).click(); await page.getByRole('button', { name: /この内容で送信する/ }).click(); await expect(page.getByRole('alert')).toContainText('送信できませんでした'); await page.getByRole('button', { name: '内容を修正する' }).click(); await expect(page.getByLabel(/^お問い合わせ内容/)).toHaveValue('保持する問い合わせ本文');
    await scenario(page, '通常の操作'); await nav(page, '/contact'); await expect(page.getByLabel(/^お問い合わせ内容/)).toHaveValue('保持する問い合わせ本文'); await page.getByRole('button', { name: /入力内容を確認する/ }).click(); await page.getByRole('button', { name: /この内容で送信する/ }).click(); await expect(page.getByRole('heading', { name: 'お問い合わせを受け付けました。' })).toBeVisible(); mark('送信失敗・専用確認画面で復旧・入力を保持して再送');
    await page.goto(corp + '/preview'); await scenario(page, '農作物が0件'); await nav(page, '/shop/agriculture'); await expect(page.getByRole('heading', { name: 'ただいま、次の収穫を待っています。' })).toBeVisible(); await scenario(page, '通常の操作');
    await nav(page, '/admin'); await page.getByRole('button', { name: /デモ管理画面に入る/ }).click(); await expect(page.getByRole('heading', { name: '運営管理', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'お問い合わせ', exact: true }).click(); await expect(page.getByText('別サイトの問い合わせ確認です。').first()).toBeVisible(); mark('共通管理画面に化粧品の問い合わせを表示・農作物ゼロ件画面');
    for (const [label, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
      await page.setViewportSize({ width, height });
      for (const [site, origin, paths] of [['corporate', corp, ['/', '/shop', '/shop/agriculture', '/shop/cart', '/shop/login', '/contact', '/admin']], ['cosmetics', cos, ['/', '/products/c01', '/cart', '/checkout', '/login', '/register', '/reset', '/recovery', '/account', '/contact', '/legal/privacy', '/legal/commerce']]]) {
        for (const path of paths) {
          await page.goto(origin + path, { waitUntil: 'networkidle' }); await expect(page.locator('.site-header, .admin-header')).toBeVisible(); await expect(page.locator('h1')).toBeVisible(); await expect(page.locator('.loading')).toHaveCount(0);
          expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), `${label} ${site} ${path}`).toBe(false);
          const file = `${label}-${site}-${path.replace(/[^a-z0-9]/gi, '-') || 'home'}.png`;
          await page.screenshot({ path: `${dir}/${file}`, fullPage: true }); screens.push({ label, site, path, file, overflow: false });
          if (label === 'desktop' || ['/', '/register'].includes(path)) {
            const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
            audits.push({ label, site, path, violations: result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })) });
          }
        }
      }
    }
    await page.goto(cos + '/'); await page.evaluate(() => window.focus()); await page.waitForTimeout(250); await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: '本文へ移動' })).toBeFocused(); await page.keyboard.press('Enter'); await expect(page.locator('#main-content')).toBeFocused(); mark('キーボードの本文スキップ・PC/スマートフォンの直接アクセスと表示幅');
    expect(errors).toEqual([]); expect(audits.flatMap(a => a.violations)).toEqual([]);
    fs.writeFileSync(`${dir}/ui-results.json`, JSON.stringify({ checks, screens, audits, errors, migrationUrl: migrationUrl.replace(/id=[^&]+/, 'id=[redacted]') }, null, 2));
    await browser.close(); console.log(JSON.stringify({ checks: checks.length, screens: screens.length, audits: audits.length, errors }));
  } catch (error) {
    if (page) await page.screenshot({ path: `${dir}/failure.png`, fullPage: true }).catch(() => {});
    fs.writeFileSync(`${dir}/ui-results.json`, JSON.stringify({ checks, screens, audits, errors, failure: String(error) }, null, 2)); await browser.close(); throw error;
  }
})().catch(e => { console.error(e); process.exitCode = 1; });

