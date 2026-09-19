const {chromium,expect}=require('@playwright/test');const fs=require('fs');
const dir='qa/seam-repair';fs.mkdirSync(dir+'/joins',{recursive:true});
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});const p=await b.newPage({reducedMotion:'reduce'});const results=[];
try{for(const width of[1024,1440,1887,1920]){await p.setViewportSize({width,height:1080});await p.goto('http://127.0.0.1:5177/');await p.locator('.ref-news-row').first().waitFor();await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode()}))});
const g=await p.evaluate(()=>{
 const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom}};
 const scene=rect('.ref-visual-story'),stone=rect('.ref-stone-base'),woman=rect('.ref-hero-woman'),city=rect('.ref-about-photo');
 const ctx=document.createElement('canvas').getContext('2d');
 const mask=key=>{const node=[...document.querySelectorAll('.ref-business-images clipPath')].find(e=>e.id.endsWith('-'+key));const path=new Path2D();path.addPath(new Path2D(node.firstChild.getAttribute('d')),new DOMMatrix().scale(scene.w/1024,scene.h/835));return path};
 const flower=mask('flower'),harvest=mask('harvest');const covered=(x,y)=>ctx.isPointInPath(flower,x,y)||ctx.isPointInPath(harvest,x,y);
 const stoneExposed=[],womanExposed=[];for(let x=stone.x+1;x<stone.x+stone.w-1;x+=.5)if(!covered(x,stone.bottom-.5))stoneExposed.push(x);
 for(let x=.5;x<scene.w;x+=.5)if(!covered(x,woman.bottom-.5))womanExposed.push(x);
 const cityPath=new Path2D();cityPath.addPath(new Path2D(document.querySelector('.ref-about-photo clipPath path').getAttribute('d')),new DOMMatrix().translate(city.x,city.y).scale(city.w,city.h));
 const gaps=[];for(let x=scene.w*.60;x<scene.w;x+=.5)for(let y=800*scene.h/835;y<scene.h;y+=.5)if(!covered(x,y)&&!ctx.isPointInPath(cityPath,x,y))gaps.push({x,y});
 return{width:innerWidth,scroll:document.documentElement.scrollWidth,scene,stone,woman,city,about:rect('.ref-about'),values:rect('.ref-values'),photoBottomExposedSamples:stoneExposed.length,womanBottomExposedSamples:womanExposed.length,cityGapSamples:gaps.length,firstGaps:gaps.slice(0,3),mask:getComputedStyle(document.querySelector('.ref-hero-products')).maskImage,backdrop:getComputedStyle(document.querySelector('.ref-hero-photo'),'::before').content};
});
expect(g.scroll).toBe(width);expect(g.photoBottomExposedSamples).toBe(0);expect(g.womanBottomExposedSamples).toBe(0);expect(g.cityGapSamples).toBe(0);expect(g.mask).toBe('none');expect(g.backdrop).toBe('none');expect(g.about.h).toBeLessThanOrEqual(420);expect(g.values.h).toBeLessThan(220);
for(const[name,x,y,w,h]of[['stone',.33,.50,.35,.24],['flower-harvest',.35,.61,.31,.21],['harvest-city',.45,.75,.55,.32]]){await p.screenshot({path:`${dir}/joins/${width}-${name}.png`,fullPage:true,clip:{x:width*x,y:width*y,width:width*w,height:width*h}})}results.push(g);}
fs.writeFileSync(dir+'/seams.json',JSON.stringify({checks:['Stone photograph bottom is completely occluded by flower/harvest, sampled every 0.5 CSS px','Woman photograph bottom is completely covered by foreground masks','No uncovered point between harvest and city at 0.5 CSS px grid','No product opacity fade, no solid-color hero underlay, no horizontal overflow','Company and values heights do not grow solely with viewport width'],sizes:results},null,2));console.log(JSON.stringify(results.map(g=>({width:g.width,stoneEdge:g.photoBottomExposedSamples,cityGaps:g.cityGapSamples,aboutHeight:g.about.h,valuesHeight:g.values.h})),null,2));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
