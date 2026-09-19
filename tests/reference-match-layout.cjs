const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
const dir='qa/reference-polish';
(async()=>{
 fs.mkdirSync(dir+'/after',{recursive:true});fs.mkdirSync(dir+'/comparison',{recursive:true});
 const b=await chromium.launch({channel:'msedge',headless:true});const ctx=await b.newContext({reducedMotion:'reduce',locale:'ja-JP'});const p=await ctx.newPage();
 const result={checks:[],measurements:[],anchors:[],screens:[],errors:[],requests:[]};p.on('pageerror',e=>result.errors.push(e.message));p.on('request',r=>result.requests.push(r.url()));
 await ctx.route(/IMG_7664|botanical-design\.jpg|provided-design\.png|reference-design\.png/,r=>r.abort());
 const ready=async()=>{await p.goto('http://127.0.0.1:5177/');await p.locator('.ref-news-row').first().waitFor();await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode()}))});};
 try{
  for(const [width,height] of [[1024,900],[1440,900],[1440,1080],[1888,1000],[1920,1080],[768,1024],[390,844],[320,740]]){
   await p.setViewportSize({width,height});await ready();
   const m=await p.evaluate(()=>({width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,header:document.querySelector('.site-header').getBoundingClientRect().height,hero:document.querySelector('.ref-hero').getBoundingClientRect().height,heroBottom:document.querySelector('.ref-hero').getBoundingClientRect().bottom,photo:document.querySelector('.ref-hero-photo').getBoundingClientRect().height,footer:document.querySelector('.reference-footer').getBoundingClientRect().top}));
   expect(m.scroll).toBeLessThanOrEqual(width+1);if(width<=1000)expect(m.photo).toBeGreaterThanOrEqual(260);
   await expect(p.locator('.corporate-value')).toHaveCount(4);await expect(p.locator('.ref-news-row')).toHaveCount(3);await expect(p.locator('.corporate-panel,.ref-categories,.ref-column-grid')).toHaveCount(0);
   const fn=`${dir}/after/${width}x${height}`;await p.screenshot({path:fn+'-home.png',fullPage:true});await p.screenshot({path:fn+'-fv.png'});result.screens.push(fn+'-home.png',fn+'-fv.png');result.measurements.push(m);
   if(width===1024){
    const anchors=[['business start','.ref-business-duo','y',490],['cosmetics copy','.ref-cosmetics-copy','x',40],['agriculture copy','.ref-agriculture-copy','x',785],['about start','.ref-about','y',800],['about copy','.ref-about-copy','x',98],['about eyebrow','.ref-about-copy .ref-eyebrow','y',840],['city left','.ref-city-art','x',515],['values icons','.ref-value-list','y',1135],['news start','.ref-news','y',1268],['footer start','.reference-footer','y',1395]];
    for(const[name,sel,axis,reference]of anchors){const actual=await p.locator(sel).evaluate((e,a)=>e.getBoundingClientRect()[a],axis);const difference=actual-reference;result.anchors.push({name,reference,actual,difference});expect(Math.abs(difference),name).toBeLessThanOrEqual(10);}
    const bg=await p.locator('.ref-hero-note,.ref-city-note').evaluateAll(es=>es.map(e=>getComputedStyle(e).backgroundColor));expect(bg).toEqual(['rgba(0, 0, 0, 0)','rgba(0, 0, 0, 0)']);
   }
  }
  const pc=result.measurements.filter(m=>m.width===1440);expect(pc[0].hero).toBe(pc[1].hero);expect(pc[0].footer).toBe(pc[1].footer);
  result.checks.push('1024 reference placement: ten layout anchors within 10px; viewport height does not stretch desktop composition; six target sizes have no horizontal overflow');
  const selected=await p.locator('h1').evaluate(e=>{const r=document.createRange();r.selectNodeContents(e);getSelection().removeAllRanges();getSelection().addRange(r);return getSelection().toString()});expect(selected).toContain('未来');
  result.images=await p.locator('.reference-home img').evaluateAll(imgs=>imgs.map(i=>({src:i.getAttribute('src'),width:i.naturalWidth,height:i.naturalHeight})));expect(result.images.every(i=>i.width>0)).toBe(true);
  for(const key of ['woman','products','flower','harvest','city','leaves'])expect(result.images.some(i=>i.src===`/images/reference-${key}.png`)).toBe(true);
  expect(result.requests.some(u=>/IMG_7664|botanical-design\.jpg|provided-design\.png|reference-design\.png/.test(u))).toBe(false);
  await expect(p.getByText('街並みはイメージです',{exact:true})).toHaveCount(1);
  result.checks.push('Source JPG blocked, six independent assets load, heading is selectable and scenic illustration has its own disclosure');
  for(const[width,height]of[[1440,900],[1024,900],[768,1024],[390,844],[320,740],[844,390],[720,450]]){
   await p.setViewportSize({width,height});await ready();
   if(width===720)await p.locator('.reference-home').evaluate(e=>e.querySelectorAll('h1,h2,h3,p,a').forEach(n=>n.style.fontSize=parseFloat(getComputedStyle(n).fontSize)*2+'px'));
   await p.locator('.ref-about-copy h2').evaluate(e=>e.textContent='ひらめきを大切に、地域の皆さまの暮らしのそばに寄り添う企業へ。');
   await p.locator('.ref-cosmetics-copy h2').evaluate(e=>e.textContent='毎日の肌に向き合いながら、やさしい未来へつながるひとときを。');
   await p.locator('.ref-news-title').first().evaluate(e=>e.textContent='地域の暮らしに寄り添うための取り組みについてお知らせします。長いタイトルでも、文字を省略せずに表示します。');
   await p.locator('.ref-about-photo img').evaluate(async e=>{e.src='/images/reference-flower.png';await e.decode()});
   const geometry=await p.evaluate(()=>{const boxes=[...document.querySelectorAll('.ref-business-copy,.ref-about-copy')].map(e=>[...e.querySelectorAll('h2,p,.corporate-action')].map(n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom}}));return {width:innerWidth,scroll:document.documentElement.scrollWidth,boxes}});
   expect(geometry.scroll).toBeLessThanOrEqual(width+1);for(const boxes of geometry.boxes)for(let i=1;i<boxes.length;i++)expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i-1].bottom-1);
   await p.screenshot({path:`${dir}/after/${width}x${height}-long-content.png`,fullPage:true});
  }
  result.checks.push('Long headings/news, independent photo swap, landscape and doubled text preserve document order without copy/button overlap');
  await p.setViewportSize({width:390,height:844});await ready();await p.getByRole('link',{name:'事業紹介へスクロール'}).click();await expect.poll(()=>p.locator('#business').evaluate(e=>Math.round(e.getBoundingClientRect().top))).toBe(24);
  await ready();expect(await p.locator('.ref-news-row').evaluateAll(es=>es.map(e=>e.getAttribute('href')))).toEqual(['/news/n01','/news/n02','/journal/j01']);await p.locator('.ref-news-row').last().click();await expect(p).toHaveURL(/journal\/j01$/);
  result.checks.push('Business scroll target, real news/journal ordering and original detail destinations');
  expect(result.errors).toEqual([]);
 }catch(e){result.failure=String(e);await p.screenshot({path:dir+'/match-failure.png',fullPage:true});throw e}
 finally{fs.writeFileSync(dir+'/reference-layout.json',JSON.stringify(result,null,2));await b.close()}
 console.log(JSON.stringify({checks:result.checks.length,screens:result.screens.length,anchors:result.anchors,errors:result.errors},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
