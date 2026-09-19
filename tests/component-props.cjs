const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const results={checks:[],errors:[]};page.on('pageerror',e=>results.errors.push(e.message));
  try {
    await page.goto('http://127.0.0.1:5177/');await page.locator('.ref-news-row').first().waitFor();
    // Mount actual components in a test-only host; no editor or route is added to the app.
    await page.evaluate(async()=>{
      const {default:React}=await import('/node_modules/.vite/deps/react.js');
      const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
      const UI=await import('/src/CorporateUI.tsx');const Media=await import('/src/CorporateMedia.tsx');
      const h=React.createElement;const host=document.createElement('div');host.id='component-fixture';host.className='corporate-layout';document.body.append(host);
      const root=createRoot(host);let changed={};
      const article={id:'n01',title:'記事の見出し',date:'2026.09.11',category:'お知らせ',image:'hero'};
      window.renderFixture=patch=>{changed={...changed,...patch};root.render(h('div',{className:'reference-home',style:{width:600,padding:20}},
        h('div',{id:'test-heading'},h(UI.EditorialHeading,{eyebrow:'小見出し',size:changed.heading?40:32,gap:changed.heading?24:12,dot:true},changed.heading?'個別に変更した見出し':'見出し')),
        h('div',{id:'test-description'},h(UI.CorporateDescription,{width:changed.description?260:420,lineHeight:changed.description?2:1.8},'本文の幅と行間を独立して調整します。'.repeat(changed.description?3:1))),
        h('div',{id:'test-photo'},h(Media.CorporatePhoto,{src:changed.photo?Media.corporateImages.fruit:Media.corporateImages.basket,ratio:changed.photo?'1 / 1':'2 / 1',position:changed.photo?'20% center':'center',shape:'soft'})),
        h('div',{id:'test-action'},h(UI.CorporateAction,{href:changed.action?'/contact':'/company',tone:changed.action?'red':'green'},changed.action?'お問い合わせへ':'会社案内へ')),
        h('div',{id:'test-control'},h(UI.CorporateDescription,null,'変更しない本文'),h(UI.CorporateAction,{href:'/news',variant:'text'},'お知らせ一覧')),
        h(UI.CorporateCategory,{href:'/shop/agriculture?category=野菜',label:'野菜',photo:{src:Media.corporateImages.basket}}),
        h(UI.CorporateNewsRow,{article}),h(UI.CorporateColumnCard,{article:{...article,id:'j01'},photo:{src:Media.corporateImages.towels}})
      ));};window.renderFixture({});
    });
    await page.locator('#test-action a').waitFor();await page.evaluate(()=>document.fonts.ready);
    const snapshot=()=>page.locator('#component-fixture').evaluate(e=>Object.fromEntries([...e.querySelectorAll('[id^="test-"]')].map(el=>[el.id,[...el.querySelectorAll('*')].map(n=>{const s=getComputedStyle(n);return [n.tagName,n.textContent,s.fontSize,s.lineHeight,s.maxWidth,s.gap,s.backgroundColor,s.aspectRatio,s.objectPosition,n.getAttribute('href'),n.getAttribute('src')];})])));
    let before=await snapshot();
    for(const part of ['heading','description','photo','action']){
      await page.evaluate(part=>window.renderFixture({[part]:true}),part);
      await expect.poll(async()=>JSON.stringify((await snapshot())['test-'+part])).not.toBe(JSON.stringify(before['test-'+part]));
      const after=await snapshot();
      for(const key of Object.keys(before))if(key!=='test-'+part)expect(after[key],part+' changed '+key).toEqual(before[key]);
      before=after;results.checks.push(part+' props change its instance without changing the other component styles/content/links');
    }
    await page.locator('#test-action a').focus();expect(await page.locator('#test-action a').evaluate(e=>getComputedStyle(e).outlineStyle)).toBe('solid');
    await expect(page.locator('#component-fixture .corporate-category')).toHaveAttribute('href','/shop/agriculture?category=%E9%87%8E%E8%8F%9C');
    await expect(page.locator('#component-fixture .ref-news-row')).toHaveAttribute('href','/news/n01');
    await expect(page.locator('#component-fixture .ref-column-card')).toHaveAttribute('href','/journal/j01');
    await page.locator('#test-action a').press('Enter');await expect(page).toHaveURL('http://127.0.0.1:5177/contact');
    results.checks.push('Independent action has visible keyboard focus and navigates; category/news/column keep data-driven destinations');
    expect(results.errors).toEqual([]);console.log(JSON.stringify(results));
  }catch(e){results.failure=String(e);throw e;}
  finally{fs.mkdirSync('qa/lower-finish',{recursive:true});fs.writeFileSync('qa/lower-finish/component-props.json',JSON.stringify(results,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
