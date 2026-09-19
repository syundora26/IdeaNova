const { chromium, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('node:fs');
const dir = 'qa/lower-finish';
const base = 'http://127.0.0.1:5177';
const routes = ['/', '/company', '/business', '/business/cosmetics', '/business/agriculture', '/news', '/news/n01', '/journal', '/journal/j01', '/contact', '/legal/privacy', '/legal/terms', '/legal/commerce'];
const results = { screens: [], audits: [], checks: [], errors: [], typography: [], isolation: [] };
const mark = label => { results.checks.push(label); console.log('PASS ' + label); fs.writeFileSync(dir+'/results.json',JSON.stringify(results,null,2)); };
const label = route => route === '/' ? 'home' : route.slice(1).replaceAll('/', '-');
async function ready(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('h1').first().waitFor();
  if (new URL(url).pathname === '/' && new URL(url).port === '5177') await page.locator('.ref-news-row').first().waitFor();
  await expect(page.getByText('記事を読み込んでいます…', {exact:true})).toHaveCount(0);
  if (new URL(url).pathname === '/shop/agriculture' || (new URL(url).port === '5179' && new URL(url).pathname === '/')) await page.locator('.product-card').first().waitFor();
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(img => { img.loading='eager'; return img.decode().catch(()=>{}); })); });
}
async function widthCheck(page, route, width) {
  const overflow = await page.evaluate(() => ({width: innerWidth, scroll: document.documentElement.scrollWidth,
    items: [...document.querySelectorAll('main *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(el).position !== 'absolute').slice(0,8).map(el => el.className)}));
  expect(overflow.scroll, route + ' / ' + width + ' ' + JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width + 1);
}
(async () => {
  fs.mkdirSync(dir, {recursive:true});
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const context = await browser.newContext({reducedMotion:'reduce',locale:'ja-JP'});
  const page = await context.newPage();
  page.on('pageerror', error => results.errors.push(error.message));
  page.setDefaultTimeout(12000);
  try {
    for (const [width,height] of [[1440,1000],[768,1024],[390,844],[320,740]]) {
      await page.setViewportSize({width,height});
      for (const route of routes) {
        await ready(page, base + route);
        await widthCheck(page, route, width);
        const small = await page.evaluate(() => [...document.querySelectorAll('.corporate-layout *')].filter(el => {
          const r = el.getBoundingClientRect(); return r.width && r.height && getComputedStyle(el).visibility !== 'hidden' &&
          [...el.childNodes].some(n=>n.nodeType===3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 14;
        }).map(el=>({tag:el.tagName,class:el.className,text:el.textContent.slice(0,50),font:getComputedStyle(el).fontSize})));
        expect(small, route + ' / ' + width + ' text below 14px').toEqual([]);
        const path = dir + '/' + width + '-' + label(route) + '.png';
        await page.screenshot({path,fullPage:true}); results.screens.push(path);
        if (width===1440 || width===390) {
          const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
          results.audits.push({width,route,violations:audit.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}))});
        }
        if (route==='/') {
          await page.screenshot({path:dir+'/'+width+'-first-view.png'});
          const fonts=await page.locator('.ref-hero h1').evaluate(el=>({size:getComputedStyle(el).fontSize,height:el.getBoundingClientRect().height,lineHeight:getComputedStyle(el).lineHeight}));
          results.typography.push({width,...fonts});
          expect(await page.locator('.ref-headline-line').count()).toBe(2);
          if(width===1440 || width===390) for (const section of ['ref-business-duo','ref-about','ref-values','ref-footer-contact']) {
            if (width <= 1000 && section === 'ref-business-duo') { for (const part of ['ref-cosmetics-copy','ref-agriculture-copy']) await page.locator('.'+part).screenshot({path:dir+'/'+width+'-'+part+'.png'}); } else await page.locator('.'+section).screenshot({path:dir+'/'+width+'-'+section+'.png'});
          }
        }
      }
      mark(width+'px: 13 corporate routes, no overflow, text at least 14px, two-line hero');
    }
    await page.setViewportSize({width:390,height:844});
    await ready(page,base+'/');
    const toggle=page.getByRole('button',{name:'メニューを開く'});
    await toggle.focus(); await page.keyboard.press('Enter');
    await expect(page.locator('#corporate-navigation')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator('#corporate-navigation a').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused(); await expect(toggle).toHaveAttribute('aria-expanded','false');
    await toggle.click(); await page.locator('#corporate-navigation').getByRole('link',{name:'会社案内',exact:true}).click();
    await expect(page.locator('main')).toBeFocused(); await expect(toggle).toHaveAttribute('aria-expanded','false');
    await toggle.click(); await expect(page.locator('#corporate-navigation').getByRole('link',{name:'会社案内',exact:true})).toHaveAttribute('aria-current','page');
    mark('Mobile menu: Enter, Tab, Escape, focus return, page change and current-page indicator');

    await ready(page,base+'/contact');
    await page.getByRole('button',{name:/入力内容を確認する/}).click();
    await expect(page.locator('.corporate-field-error')).toHaveCount(5);
    await expect(page.getByLabel(/^お名前/)).toBeFocused();
    await page.screenshot({path:dir+'/390-contact-validation.png',fullPage:true});
    const fill = async () => {
      await page.getByLabel(/^お名前/).fill('企業HP確認用');
      await page.getByLabel(/^メールアドレス/).fill('corporate-qa@example.invalid');
      await page.getByLabel(/^件名/).fill('企業HPの導線確認');
      await page.getByLabel(/^お問い合わせ内容/).fill('失敗時にもこの入力内容を保持します。');
      await page.getByRole('checkbox').check();
    };
    await fill(); await expect(page.locator('.corporate-field-error')).toHaveCount(0);
    await page.getByRole('button',{name:/入力内容を確認する/}).click();
    await expect(page.locator('.confirmation')).toContainText('失敗時にもこの入力内容を保持します。');
    await page.getByRole('button',{name:'内容を修正する'}).click();
    await expect(page.getByLabel(/^お問い合わせ内容/)).toHaveValue('失敗時にもこの入力内容を保持します。');
    await page.getByRole('button',{name:/入力内容を確認する/}).click();
    let failed=false;
    const failOnce=async route=>{
      const body=route.request().postDataJSON();
      if(body.method==='createInquiry'&&!failed){failed=true;await route.fulfill({json:{error:{code:'NETWORK',message:'送信できませんでした。入力を保持しています。',retryable:true}}});}
      else if(body.method==='createInquiry'){await route.fulfill({json:{value:{id:'UI-QA-DEMO'}}});}
      else await route.continue();
    };
    await page.route('**/demo-api/rpc',failOnce);
    await page.getByRole('button',{name:/この内容で送信する/}).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.locator('.confirmation')).toContainText('失敗時にもこの入力内容を保持します。');
    await page.screenshot({path:dir+'/390-contact-failed.png',fullPage:true});
    await page.getByRole('button',{name:/もう一度送信する/}).click();
    await expect(page.getByRole('heading',{name:'お問い合わせを受け付けました。'})).toBeVisible();
    await page.unroute('**/demo-api/rpc',failOnce);
    mark('Company inquiry: inline validation, edit, preserved input on failure and retry completion (response fixture)');

    for (const state of ['loading','empty','error']) {
      let release;
      const gate=new Promise(resolve=>{release=resolve});
      const handler=async route=>{
        const body=route.request().postDataJSON();
        if(body.method!=='listArticles')return route.continue();
        if(state==='loading')await gate;
        await route.fulfill({json:state==='error'?{error:{code:'NETWORK',message:'記事を取得できませんでした。',retryable:true}}:{value:[]}});
      };
      await page.route('**/demo-api/rpc',handler);
      await page.goto(base+'/');
      if(state==='loading') {
        await expect(page.getByText('記事を読み込んでいます…').first()).toBeVisible();
        await page.screenshot({path:dir+'/390-articles-loading.png',fullPage:true}); release(); await expect(page.getByText('現在、掲載中の記事はありません。')).toHaveCount(1);
      } else if(state==='empty') {
        await expect(page.getByText('現在、掲載中の記事はありません。')).toHaveCount(1);
        await page.screenshot({path:dir+'/390-articles-empty.png',fullPage:true});
      } else {
        await expect(page.getByRole('alert')).toHaveCount(1);
        await page.screenshot({path:dir+'/390-articles-error.png',fullPage:true});
      }
      await page.unroute('**/demo-api/rpc',handler);
      if(state==='error') {
        await page.getByRole('button',{name:/もう一度読み込む/}).first().click();
        await expect(page.locator('.ref-news-row')).toHaveCount(3);
      }
      await ready(page,base+'/');
    }
    mark('Articles: loading, empty, communication failure and successful retry');

    await page.setViewportSize({width:1440,height:1000});
    await ready(page,base+'/');
    await page.setViewportSize({width:720,height:500});
    await widthCheck(page,'200% zoom',1440);
    await page.screenshot({path:dir+'/200-percent-zoom-home.png',fullPage:true});
    await page.getByRole('button',{name:'メニューを開く'}).click();
    await expect(page.locator('#corporate-navigation')).toBeVisible();
    await page.setViewportSize({width:1440,height:1000});
    await ready(page,base+'/contact');
    await page.setViewportSize({width:720,height:500});
    await widthCheck(page,'200% zoom contact',1440);
    await page.screenshot({path:dir+'/200-percent-zoom-contact.png',fullPage:true});
    await page.setViewportSize({width:1440,height:1000});
    mark('200% equivalent viewport reflow: home, mobile menu and company contact');

    for (const url of [base+'/shop',base+'/shop/agriculture',base+'/shop/login','http://127.0.0.1:5179/','http://127.0.0.1:5179/contact',base+'/admin']) {
      await ready(page,url);
      const snapshot=()=>page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().height).map(e=>{
        const s=getComputedStyle(e),r=e.getBoundingClientRect();return [e.tagName,e.className,s.color,s.backgroundColor,s.fontSize,s.padding,s.margin,s.borderRadius,Math.round(r.width),Math.round(r.height)];
      }));
      const before=await snapshot();
      await page.evaluate(()=>{for(const s of document.styleSheets)if(s.ownerNode?.getAttribute('data-vite-dev-id')?.match(/\/(corporate|reference)\.css$/))s.disabled=true;});
      const after=await snapshot();
      expect(after,url+' theme leakage').toEqual(before);
      results.isolation.push(url);
      await page.evaluate(()=>{for(const s of document.styleSheets)s.disabled=false;});
    }
    mark('6 shop/admin pages have identical computed styles with corporate stylesheet disabled');

    await page.setViewportSize({width:390,height:844});
    await ready(page,base+'/shop/login');
    await page.getByLabel(/^メールアドレス/).fill('demo@example.invalid');
    await page.getByLabel(/^パスワード/).fill('demo-password');
    await page.getByRole('button',{name:/ログインする/}).click();
    await expect(page).toHaveURL(/account/);
    await ready(page,base+'/shop/agriculture/products/a01');
    await page.getByRole('button',{name:/カートに入れる/}).click();
    await expect(page.locator('.shop-nav').getByRole('link',{name:'カート 1点'})).toBeVisible();
    await page.locator('.shop-nav').getByRole('link',{name:'企業サイトへ'}).click();
    await page.locator('.ref-cosmetics-copy').getByRole('link',{name:'化粧品サイトへ',exact:true}).click();
    await expect(page).toHaveURL('http://127.0.0.1:5179/'); expect(context.pages().length).toBe(1);
    await page.goBack(); await expect(page).toHaveURL(base+'/');
    await page.locator('.ref-agriculture-copy').getByRole('link',{name:'オンラインショップで購入',exact:true}).click();
    await expect(page.locator('.shop-nav').getByRole('link',{name:'カート 1点'})).toBeVisible();
    await page.locator('.shop-nav').getByRole('link',{name:'会員ページ'}).click();
    await expect(page.getByRole('heading',{name:'会員ページ',exact:true})).toBeVisible();
    mark('Corporate/cosmetics/agriculture same-tab round trip preserves agriculture cart and member session');

    expect(results.errors).toEqual([]);
    const violations=results.audits.flatMap(a=>a.violations.map(v=>({...v,width:a.width,route:a.route})));
    fs.writeFileSync(dir+'/results.json',JSON.stringify(results,null,2));
    console.log(JSON.stringify({checks:results.checks.length,screens:results.screens.length,audits:results.audits.length,violations},null,2));
    expect(violations).toEqual([]);
  } catch(error) {
    results.failure=String(error); fs.writeFileSync(dir+'/results.json',JSON.stringify(results,null,2));
    await page.screenshot({path:dir+'/failure.png',fullPage:true});
    throw error;
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});



