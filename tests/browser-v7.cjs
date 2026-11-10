'use strict';
// Real browser contract for RAAS v7. Uses a local HTTP origin to exercise same-origin v6 bridge.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404).end();return}
    res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream'});
    res.end(data);
  });
});
const serve=()=>new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port)));
const stop=()=>new Promise(resolve=>server.close(resolve));
(async()=>{
  const port=await serve(),browser=await chromium.launch();
  let checks=0;
  const ok=(value,label)=>{assert.ok(value,label);checks++};
  try{
    for(const width of [390,1024,1440]){
      const page=await browser.newPage({viewport:{width,height:960},reducedMotion:'reduce'});
      page.setDefaultTimeout(12000);
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      page.on('dialog',dialog=>dialog.accept());
      await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.getElementById('v7EngineStatus')?.textContent.includes('연결됨'));
      const snap=()=>page.evaluate(()=>document.getElementById('v7EngineFrame').contentWindow.RAASV6.snapshot());
      const nav=(target)=>page.locator('button[data-nav="'+target+'"]:visible').first().click();
      const frame=page.frameLocator('#v7EngineFrame');
      ok((await snap()).current.bp===120,'initial original v6 BP '+width);
      ok(await page.locator('#v7EngineFrame').getAttribute('src')==='backups/v6.0-content-ia.html','Pages-relative model URL');
      ok(await page.locator('#v7LegacyPortal').evaluate(e=>e.closest('main')?.id)==='main','activity in workspace');
      await nav('learn');
      await page.locator('.v7-lesson-deep-dive summary').click();
      const all=await page.evaluate(()=>document.getElementById('v7EngineFrame').contentWindow.RAASV6.getCurriculum());
      ok(all.length===16,'16 source-backed lessons');
      for(let i=0;i<all.length;i++){
        await page.evaluate(i=>selectLesson(i),i);
        ok((await page.locator('#lessonQuestion').innerText())===all[i].question,'question '+i);
        ok((await page.locator('#lessonMechanism').textContent())===all[i].mechanism,'mechanism '+i);
        ok((await page.locator('#lessonEvidence').innerText())===all[i].evidence,'evidence '+i);
        ok(await page.locator('#v7BridgeHelp').isVisible()===(i===9),'ACEi practice conditional '+i);
      }
      await page.evaluate(()=>selectLesson(9));
      await page.locator('#v7StartPractice').click();
      ok(await page.locator('#v7LegacyPortal').isVisible(),'practice started');
      ok(await frame.locator('#lxResults').isHidden(),'practice gated before prediction');
      await frame.locator('[name="lxGuess"][value="unsure"]').check();
      ok(await frame.locator('#lxResults').isHidden(),'practice gated after selection');
      await frame.locator('#lxConfirm').click();
      ok(await frame.locator('#lxResults').isHidden(),'practice gated after confirmation');
      await frame.locator('#lxObserve').click();
      ok(await frame.locator('#lxResults').isVisible(),'practice after observation');
      ok((await snap()).current.bp===120,'practice main model isolation');
      await page.locator('#v7CloseLegacy').click();
      await nav('explore');
      ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'default explorer has no page-wide overflow '+width);
      await page.locator('#modeCompact').click();
      ok(await page.locator('#v7ApplyDrug').isVisible(),'compact keeps drug application');
      await page.locator('#modeStandard').click();
      await page.locator('[data-drug="acei"]').first().click();
      ok((await snap()).current.bp===120,'select target is read only');
      await page.locator('#v7ApplyDrug').click();
      ok((await snap()).current.bp===105,'applied ACEi original BP');
      ok((await page.locator('#outputCard .v').first().innerText())==='105','output synchronizes');
      ok((await page.locator('#v7ActualGraph').getAttribute('src')||'').startsWith('data:image/png;'),'real graph bitmap available');
      await page.locator('#v7RemoveDrug').click();
      ok((await snap()).current.bp===120,'drug removal restores baseline');
      await page.locator('#v7ProgressNext').click();
      ok((await snap()).currentStep===0,'actual next stage');
      await page.locator('#v7ResetProgress').evaluate(e=>e.closest('details').open=true);
      await page.locator('#v7ResetProgress').click();
      ok((await snap()).currentStep===-1,'progress reset');
      await nav('cases');
      await page.locator('#v7StartClinical').click();
      ok(await page.locator('#v7LegacyPortal').isVisible(),'real CKD case');
      ok(await page.locator('.phase-preview').isHidden(),'duplicate static case guide hidden');
      ok(await frame.locator('#scenarioLabPanel').isHidden(),'CKD Lab initially gated');
      await frame.locator('#scenarioChoice1').click();
      ok(await frame.locator('#scenarioFeedbackNursing').isVisible(),'original nursing feedback');
      await frame.locator('#scenarioActionStartButton').click();
      await frame.locator('#scenarioActionChoice1').click();
      ok(await frame.locator('#scenarioLabPanel').isVisible(),'CKD Lab after action');
      await page.locator('#v7CloseLegacy').click();
      ok(await page.locator('.phase-preview').isVisible(),'case selection returns');
      await page.locator('[data-case="hfref"]').click();
      await page.locator('#v7StartClinical').click();
      ok(await frame.locator('#scenarioLabPanel').isHidden(),'HFrEF Lab initially gated');
      await frame.locator('#scenarioChoice1').click();
      await frame.locator('#scenarioActionStartButton').click();
      await frame.locator('#scenarioActionChoice1').click();
      ok(await frame.locator('#scenarioLabPanel').isVisible(),'HFrEF Lab after action');
      const current=(await snap()).current.bp;
      await nav('learn');
      ok(await page.locator('#v7LegacyPortal').isHidden(),'tab hides case without reset');
      ok((await snap()).current.bp===current,'tab preserves model state');
      ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page-wide overflow '+width);
      ok(errors.length===0,'no JS errors '+width+': '+errors.join('; '));
      await page.close();
    }
    console.log('PASS v7 integrated '+checks+' Chromium checks (390/1024/1440); backed by original v6 engine.');
  }finally{await browser.close();await stop()}
})().catch(e=>{console.error(e);process.exitCode=1});