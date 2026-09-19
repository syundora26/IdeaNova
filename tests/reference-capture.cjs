const {chromium}=require('@playwright/test');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});const p=await b.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});await p.goto('http://127.0.0.1:5177/',{waitUntil:'networkidle'});await p.locator('.ref-news-row').first().waitFor();await p.evaluate(async()=>{ await document.fonts.ready; await Promise.all([...document.images].map(img=>{img.loading='eager';return img.decode().catch(()=>{});})); });await p.screenshot({path:'qa/botanical-ui/desktop.png',fullPage:true}); console.log(await p.evaluate(()=>({h:document.body.scrollHeight,w:document.documentElement.scrollWidth,h1:getComputedStyle(document.querySelector('h1')).fontFamily})));await p.setViewportSize({width:390,height:844});await p.screenshot({path:'qa/botanical-ui/mobile.png',fullPage:true});await b.close();})();



