'use strict';
// User-reported follow-up: tutorial isolation, one reset hub, highlight cleanup, readable clinical explanations.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}
 const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return}
  res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream'});res.end(data)});
});
(async()=>{
 const listen=()=>new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port)));
 const port=await listen(),browser=await chromium.launch();let checks=0;
 const ok=(value,msg)=>{assert.ok(value,msg);checks++};
 try{
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',dialog=>dialog.accept());
   await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.getElementById('v7EngineStatus')?.textContent.includes('연결됨'));
   const snap=()=>page.evaluate(()=>document.getElementById('v7EngineFrame').contentWindow.RAASV6.snapshot());
   const nav=x=>page.locator('button[data-nav="'+x+'"]:visible').first().click();
   const stage=x=>page.locator((width<=760?'#mobileStageTrack':'#desktopNodes')+' [data-stage="'+x+'"]').click();
   const startTour=async()=>{await page.evaluate(()=>openTour());ok(await page.locator('#walkthrough').isVisible(),'walkthrough appears '+width)};
   const selected=()=>page.evaluate(()=>state.drug);
   const stateStage=()=>page.evaluate(()=>state.stage);
   const marker=()=>page.locator('[data-stage].drug-target').count();
   await nav('explore');
   ok(await page.locator('#v7ResetAll').isVisible(),'unified reset controls visible '+width);
   ok(await page.locator('#v7ResetProgress').isVisible(),'progress reset co-located '+width);
   ok(await page.locator('#v7RemoveDrug').isVisible(),'drug remove co-located '+width);
   ok(await page.evaluate(()=>['v7ResetAll','v7ResetProgress','v7RemoveDrug'].every(id=>document.getElementById(id).closest('#drugCard')!==null)),'all reset buttons in same drug card '+width);
   await stage(2);
   await page.locator('[data-drug="arb"]').click();
   await page.locator('#v7ApplyDrug').click();
   await page.locator('#v7ProgressNext').click();
   await page.locator('#v7ProgressNext').click();
   await page.locator('#v7GraphSelect').selectOption('volume');
   await page.locator('#modeCompact').click();
   const baseline=await snap();
   ok(baseline.appliedDrug==='arb'&&baseline.currentStep===1,'pre-existing active model state '+width);
   await startTour();
   ok(await page.locator('#v7ApplyDrug').isDisabled(),'actual drug application locked during tour '+width);
   ok(await page.locator('#v7ProgressNext').isDisabled(),'model progress locked during tour '+width);
   await stage(4);
   await page.locator('[data-drug="acei"]').click();
   ok((await selected())==='acei','walkthrough changes only visual target '+width);
   await page.locator('#walkthroughSkip').click();
   const postSkip=await snap();
   ok(!await page.locator('#walkthrough').isVisible(),'tour skipped and closed '+width);
   ok((await selected())==='arb'&&(await stateStage())===2,'tour skip restores pre-tour choices '+width);
   ok((await page.locator('#modeCompact').getAttribute('aria-pressed'))==='true','tour skip restores layout '+width);
   ok(postSkip.appliedDrug===baseline.appliedDrug&&postSkip.currentStep===baseline.currentStep&&postSkip.maxReachedStep===baseline.maxReachedStep&&postSkip.graphVariable===baseline.graphVariable,'tour skip never mutates original model '+width);
   ok((await marker())>0,'original ARB target still highlighted '+width);
   await page.locator('#modeStandard').click();
   await startTour();
   await stage(4);
   await page.locator('[data-drug="acei"]').click();
   await page.locator('#walkthroughNext').click();
   await page.locator('#modeCompact').click();
   await page.locator('#view-explore [data-go="learn"]').click();
   ok(!await page.locator('#walkthrough').isVisible(),'final tutorial step automatically closes '+width);
   ok((await selected())==='arb'&&(await stateStage())===2,'completed tutorial rolls back temporary selections '+width);
   ok((await page.locator('#modeStandard').getAttribute('aria-pressed'))==='true','completed tour restores original layout '+width);
   ok(await page.locator('#view-explore').isVisible(),'tour returns to clean exploration workspace '+width);
   ok((await snap()).appliedDrug==='arb','completed tour preserves applied medication '+width);
   await startTour();
   await stage(4);
   await page.keyboard.press('Escape');
   ok(!await page.locator('#walkthrough').isVisible()&&(await stateStage())===2,'Escape restores tutorial selection '+width);
   await page.locator('#v7RemoveDrug').click();
   ok((await snap()).appliedDrug==='none','drug remove clears original applied state '+width);
   ok((await selected())==='none'&&(await marker())===0,'drug remove clears UI target orange markers '+width);
   ok(await page.locator('#targetNote').innerText().then(s=>s.includes('약물 선택 전')),'target help updates after drug removal '+width);
   await page.locator('[data-drug="acei"]').click();
   await page.locator('#v7ApplyDrug').click();
   ok((await snap()).appliedDrug==='acei','medicine applies after resetting '+width);
   await page.locator('#v7ResetProgress').click();
   ok((await snap()).currentStep===-1&&(await snap()).appliedDrug==='acei','progress reset preserves applied medicine by contract '+width);
   ok((await selected())==='acei'&&(await marker())>0,'progress only reset preserves target display '+width);
   await page.locator('#v7ProgressNext').click();
   await page.locator('#v7ResetAll').click();
   const all=await snap();
   ok(all.currentStep===-1&&all.maxReachedStep===-1&&all.appliedDrug==='none','full reset restores model progress and drugs '+width);
   ok(all.graphVariable==='bp','full reset restores graph variable '+width);
   ok((await selected())==='none'&&(await stateStage())===0&&(await marker())===0,'full reset clears visible target and concept '+width);
   ok((await page.locator('#v7RemoveDrug').isDisabled()),'drug remove disabled when nothing to clear '+width);
   await page.locator('[data-drug="mra"]').click();
   await page.locator('[data-drug="mra"]').click();
   ok((await selected())==='none'&&(await marker())===0,'second tap clears target-only selection '+width);
   await startTour();
   await stage(4);
   await page.locator('[data-drug="acei"]').click();
   await page.locator('#walkthroughSkip').click();
   ok((await selected())==='none'&&(await marker())===0,'fresh walkthrough leaves no orange target '+width);
   await nav('cases');
   await page.locator('#v7StartClinical').click();
   ok(await page.locator('#v71ClinicalWorkspace').isVisible(),'original clinical session still available '+width);
   const clinical=()=>page.evaluate(()=>document.getElementById('v7EngineFrame').contentWindow.RAASV6.clinicalView());
   ok((await clinical()).lab===null&&(await clinical()).judgementFeedback===null,'clinical answer/Lab gates unchanged '+width);
   await page.locator('#v71AnswerOptions .v71-choice').first().click();
   await page.locator('#v71Submit').click();
   ok(await page.locator('#v71AnswerFeedback').isVisible(),'clinical explanation visible after answer '+width);
   ok(await page.locator('#v71ClinicalLab').isHidden(),'follow-up Lab remains gated '+width);
   const typography=await page.evaluate(()=>{
     const size=selector=>Number.parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
     return {prompt:size('#v71TaskPrompt'),choice:size('.v71-feedback-compare article:last-child p'),
      rationale:size('.v71-evidence-priority p'),patient:size('.v71-patient-card>p')};
   });
   ok(typography.prompt>=17&&typography.choice>=16&&typography.rationale>=16&&typography.patient>=15,'clinical reading font sizes improved '+width+': '+JSON.stringify(typography));
   ok(errors.length===0,'no JavaScript errors '+width+': '+errors.join('; '));
   await page.close();
  }
  console.log('PASS v7.1 follow-up '+checks+' browser checks at 390/1440: tutorial isolation, reset consistency and clinical legibility');
 } finally {await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
