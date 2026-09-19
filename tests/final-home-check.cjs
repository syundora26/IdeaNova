const {chromium,expect}=require('@playwright/test');
const Axe=require('@axe-core/playwright').default;
const fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});const ctx=await b.newContext({reducedMotion:'reduce'});const p=await ctx.newPage();const result=[];
 try{
  for(const width of [1440,390]){
   await p.setViewportSize({width,height:width===1440?900:844});await p.goto('http://127.0.0.1:5177/',{waitUntil:'networkidle'});await p.locator('.ref-news-row').first().waitFor();await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode()}))});
   const a=await new Axe({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();result.push({width,violations:a.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))});await p.screenshot({path:`qa/reference-match/${width}-home.png`,fullPage:true});expect(a.violations).toEqual([]);
  }
  console.log(JSON.stringify(result));
 }finally{fs.writeFileSync('qa/reference-match/final-home-a11y.json',JSON.stringify(result,null,2));await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
