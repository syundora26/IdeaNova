const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const dir = 'qa/four-pages';
fs.mkdirSync(dir, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const results = { pages: [], errors: [], links: [] };
  page.on('pageerror', e => results.errors.push(e.message));
  async function ready(path) {
    await page.goto('http://127.0.0.1:5177' + path);
    await page.locator('h1').waitFor();
    if (path === '/') await page.locator('.ref-news-row').first().waitFor();
    if (path === '/news' || path === '/journal') await page.locator('.corporate-article').first().waitFor();
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => { i.loading = 'eager'; return i.decode(); })); });
    // Responsive sources may switch after the viewport changes; wait for the final candidates.
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0));
  }
  try {
    for (const width of [1440, 768, 375]) {
      await page.setViewportSize({ width, height: 960 });
      for (const path of ['/', '/company', '/news', '/journal']) {
        await ready(path);
        const metrics = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, broken: [...document.images].filter(i => !i.naturalWidth).length, headings: document.querySelectorAll('h1').length }));
        expect(metrics.scroll).toBe(width); expect(metrics.broken).toBe(0); expect(metrics.headings).toBe(1);
        await page.screenshot({ path: `${dir}/${path.slice(1) || 'home'}-${width}.png`, fullPage: true });
        results.pages.push({ path, ...metrics });
      }
    }
    for (const kind of ['news', 'journal']) {
      await ready('/' + kind);
      await page.locator('.corporate-article').first().click();
      await expect(page.locator('article h1')).toBeVisible();
      await page.getByRole('link', { name: '一覧へ戻る' }).click();
      await expect(page).toHaveURL(new RegExp('/' + kind + '$'));
      results.links.push(kind + ' detail and return');
    }
    await page.getByRole('button', { name: /メニュー/ }).click();
    await page.locator('#corporate-navigation a[href="/company"]').click();
    await expect(page.locator('h1')).toHaveText('会社案内');
    await expect(page.locator('#corporate-navigation')).toBeHidden();
    await page.locator('.ref-footer-contact').click();
    await expect(page).toHaveURL(/\/contact$/);
    results.links.push('mobile menu, company, contact');
    await page.setViewportSize({ width: 1440, height: 960 });
    await ready('/');
    await page.locator('.corporate-header-shop').click();
    await expect(page).toHaveURL('http://127.0.0.1:5179/');
    results.links.push('cosmetics site');
    expect(results.errors).toEqual([]);
  } finally {
    fs.writeFileSync(`${dir}/results.json`, JSON.stringify(results, null, 2));
    await browser.close();
  }
  console.log(JSON.stringify(results, null, 2));
})().catch(e => { console.error(e); process.exitCode = 1; });
