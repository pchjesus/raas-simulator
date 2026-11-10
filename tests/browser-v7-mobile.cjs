'use strict';
// v7 mobile responsive behavior: checks 320-760px with original v6 engine unmodified.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  fs.readFile(file,(e,data)=>{if(e){res.writeHead(404).end();return}
    res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream'});res.end(data);});
});
const start=()=>new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port)));
const close=()=>new Promise(resolve=>server.close(resolve));
(async()=>{
 const port=await start(),browser=await chromium.launch();let checks=0;
 const ok=(condition,msg)=>{assert.ok(condition,msg);checks++};
 try{
  for(const width of [320,360,375,390,412,430,760]){
   const page=await browser.newPage({viewport:{width,height:850},reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.getElementById('v7EngineStatus')?.textContent.includes('연결됨'));
   const nav=async(v)=>page.locator('button[data-nav="'+v+'"]:visible').first().click();
   const layout=async()=>page.evaluate(()=>{
    const q=s=>document.querySelector(s),rect=s=>{const el=q(s);if(!el)return null;const r=el.getBoundingClientRect();return {height:r.height,width:r.width,left:r.left,right:r.right}};
    return {overflow:document.documentElement.scrollWidth-innerWidth,help:rect('.top-help'),tagline:rect('.topbar .tagline'),
    unit:rect('.unit-switcher'),unitButton:rect('.unit-tab'),question:rect('.question-tile'),stage:rect('.stage-track button'),path:rect('.path-card'),
    toolbar:Array.from(document.querySelectorAll('#view-explore .toolbar-actions>.btn')).map(e=>({height:e.getBoundingClientRect().height,scroll:e.scrollWidth,client:e.clientWidth}))}
   });
   let x=await layout();
   ok(x.overflow<=1,'home no horizontal overflow at '+width);
   ok(x.help.height>=40&&x.help.height<=44,'single-line accessible help button at '+width);
   ok(x.tagline.height<25,'mobile tagline fits one line at '+width);
   ok(await page.locator('.tagline-mobile').isVisible(),'mobile title shown at '+width);
   await nav('explore');x=await layout();
   ok(x.overflow<=1,'explore no global overflow '+width);
   ok(x.stage.height>=76&&x.stage.height<=80,'compact accessible stage card '+width);
   ok(x.toolbar.length===2&&x.toolbar.every(b=>b.height<=46&&b.scroll<=b.client+1),'exploration CTA labels do not wrap '+width);
   ok(x.path.height<=(width<=350?260:215),'path panel density '+width);
   await page.locator('#modeCompact').click();
   ok(await page.locator('#v7ApplyDrug').isVisible(),'compact mode action remains '+width);
   await page.locator('#modeStandard').click();
   await nav('learn');x=await layout();
   ok(x.overflow<=1,'learning no global overflow '+width);
   ok(x.unit.height<=205,'unit switcher density '+width+' ('+x.unit.height+'px)');
   ok(x.unitButton.height>=60&&x.unitButton.height<=75,'unit card compact but legible '+width);
   ok(x.question.height>=72&&x.question.height<=100,'question tile compact and wraps as needed '+width);
   ok(await page.locator('#lessonUnitTabs .unit-tab').count()===5,'all 5 units present '+width);
   for(let i=0;i<5;i++){
     await page.locator('#lessonUnitTabs .unit-tab').nth(i).click();
     ok(await page.locator('#lessonOutline .question-tile').count()===[2,2,5,6,1][i],'unit '+i+' complete '+width);
   }
   ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'unit browsing stays local '+width);
   await nav('cases');
   const caseHeights=await page.locator('.case-card').evaluateAll(cards=>cards.map(c=>c.getBoundingClientRect().height));
   ok(caseHeights.length===2&&caseHeights.every(h=>h<=220),'clinical case selection density '+width+': '+caseHeights.join(','));
   ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'cases no global overflow '+width);
   ok(errors.length===0,'no page script errors '+width+': '+errors.join('; '));
   await page.close();
  }
  // Desktop label/size still uses the existing approved layout.
  const desktop=await browser.newPage({viewport:{width:1024,height:850},reducedMotion:'reduce'});
  await desktop.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  ok(await desktop.locator('.tagline-desktop').isVisible(),'desktop tagline unchanged');
  ok(await desktop.locator('.tagline-mobile').isHidden(),'mobile label hidden on desktop');
  await desktop.close();
  console.log('PASS v7 mobile density '+checks+' Chromium assertions at 320/360/375/390/412/430/760 and desktop guard 1024');
 }finally{await browser.close();await close()}
})().catch(e=>{console.error(e);process.exitCode=1});