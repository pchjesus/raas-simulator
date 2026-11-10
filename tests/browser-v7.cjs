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
      ok(await page.locator('#lessonMedical').isVisible(),'medical meaning is visible without disclosure');
      ok(await page.locator('#lessonNursing').isVisible(),'nursing assessment is visible without disclosure');
      ok(await page.locator('#lessonEvidence').isVisible(),'evidence is visible without disclosure');
      ok(await page.locator('.v7-lesson-deep-dive summary').count()===0,'core clinical evidence is never hidden in a summary');
      const all=await page.evaluate(()=>document.getElementById('v7EngineFrame').contentWindow.RAASV6.getCurriculum());
      ok(all.length===16,'16 source-backed lessons');
      for(let i=0;i<all.length;i++){
        await page.evaluate(i=>selectLesson(i),i);
        ok((await page.locator('#lessonQuestion').innerText())===all[i].question,'question '+i);
        ok((await page.locator('#lessonMechanism').textContent())===all[i].mechanism,'mechanism '+i);
        ok((await page.locator('#lessonEvidence').innerText())===all[i].evidence,'evidence '+i);
        if(all[i].medical)ok((await page.locator('#lessonMedical').innerText())===all[i].medical,'medical source '+i);
        if(all[i].nursing)ok((await page.locator('#lessonNursing').innerText())===all[i].nursing,'nursing source '+i);
        ok(await page.locator('#lessonEvidence').isVisible(),'evidence visible for item '+i);
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
      const modeSnapshot=await snap();
      const folder=path.join(root,'artifacts','v7.1');
      const capture=async(file)=>{
        // Full-page screenshots start at the origin, not at a focus-induced scroll offset.
        await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
        await page.screenshot({path:path.join(folder,file),fullPage:true,animations:'disabled'});
      };
      if(width===1440){
        fs.mkdirSync(folder,{recursive:true});
        await capture('desktop-standard-1440x900.png');
      }
      await page.locator('#modeCompact').click();
      ok(await page.locator('#v7ApplyDrug').isVisible(),'compact keeps drug application');
      const position=await page.evaluate(()=>{
        const p=document.querySelector('.path-card').getBoundingClientRect();
        const m=document.querySelector('#outputCard').getBoundingClientRect();
        return {outputParent:document.querySelector('#outputCard').parentElement.id,
          drugParent:document.querySelector('#drugCard').parentElement.id,
          sameLeft:Math.abs(p.left-m.left)<3,belowPath:m.top>=p.bottom-1,
          singleResults:document.querySelectorAll('#outputCard').length===1,
          overflow:document.documentElement.scrollWidth<=innerWidth+1};
      });
      ok(position.drugParent==='compactDock','compact drug controls remain on right '+width);
      ok(position.outputParent===(width>1160?'compactResults':'compactDock'),'compact results responsive parent '+width);
      if(width>1160)ok(position.sameLeft&&position.belowPath,'compact metrics sit under pathway '+width);
      ok(position.singleResults&&position.overflow,'one output panel and no horizontal overflow '+width);
      ok((await snap()).current.bp===modeSnapshot.current.bp,'mode change keeps original physiology '+width);
      if(width===1440){
        await capture('desktop-compact-1440x900.png');
        await page.setViewportSize({width:1024,height:900});
        ok(await page.locator('#outputCard').evaluate(el=>el.parentElement.id)==='compactDock','resize to narrow re-docks live results');
        await page.setViewportSize({width:1440,height:900});
        ok(await page.locator('#outputCard').evaluate(el=>el.parentElement.id)==='compactResults','resize wide restores left result lane');
      }
      await page.locator('#modeStandard').click();
      ok(await page.locator('#outputCard').evaluate(el=>el.parentElement.id)==='experiment','standard restores original graph panel');
      ok(await page.locator('#drugCard').evaluate(el=>el.parentElement.id)==='experiment','standard restores drug panel');
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
      if(width===1440){
        await nav('learn');
        await page.evaluate(()=>selectLesson(9));
        await capture('learning-acei-1440x900.png');
        await nav('cases');
      }
      const clinical=()=>page.evaluate(()=>document.querySelector('#v7EngineFrame').contentWindow.RAASV6.clinicalView());
      const selectAndSubmit=async()=>{
        const answer=page.locator('#v71AnswerOptions .v71-choice').first();
        ok(await answer.isVisible(),'visible v7 answer option at '+width);
        ok(await page.locator('#v71Submit').isDisabled(),'cannot submit without selection at '+width);
        if(width===1440){await answer.focus();await page.keyboard.press('Enter')}
        else await answer.click();
        ok(await page.locator('#v71Submit').isEnabled(),'option selection enables explicit submission at '+width);
        await page.locator('#v71Submit').click();
        ok(await page.locator('#v71AnswerFeedback').isVisible(),'v7 source-backed feedback after submission at '+width);
      };
      for(const [codeName,questions,actions] of [['ckd',3,3],['hfref',2,2]]){
        if(codeName==='hfref')await page.locator('[data-case="hfref"]').click();
        await page.locator('#v7StartClinical').click();
        ok(await page.locator('#v71ClinicalWorkspace').isVisible(),'v7 clinical workspace visible '+codeName+' '+width);
        ok(await page.locator('#v7LegacyPortal').isHidden(),'original v6 interface is not user-facing during clinical mode '+codeName);
        ok(await page.locator('.phase-preview').isHidden(),'static v7 clinical guide hidden while solving '+codeName);
        let c=await clinical();
        ok(c.phase==='judgement'&&c.knowledgeDone===0&&c.actionDone===0,'fresh original v6 case state '+codeName);
        ok(c.question?.choices?.length===3,'three original choices in first question '+codeName);
        ok(c.judgementFeedback===null&&c.actionFeedback===null&&c.lab===null,'projection does not leak answer or Lab before submission '+codeName);
        ok(await page.locator('#v71AnswerFeedback').isHidden(),'v7 feedback gated before selection '+codeName);
        ok(await page.locator('#v71ClinicalLab').isHidden(),'v7 Lab gated before selection '+codeName);
        for(let qi=0;qi<questions;qi++){
          c=await clinical();
          ok(c.phase==='judgement','judgement prompt phase '+codeName+' Q'+qi);
          ok((await page.locator('#v71TaskPrompt').innerText())===c.question.prompt,'question text matches authoritative original '+codeName+' Q'+qi);
          await selectAndSubmit();
          c=await clinical();
          ok(c.phase==='judgement-feedback'&&!!c.judgementFeedback,'original judgement gate opened '+codeName+' Q'+qi);
          ok(c.lab===null,'no Lab released after judgement only '+codeName+' Q'+qi);
          ok(await page.locator('#v71ClinicalLab').isHidden(),'no visible early Lab '+codeName+' Q'+qi);
          ok((await page.locator('#v71FeedbackCompare').innerText()).includes(c.judgementFeedback.selected),'selected choice feedback is source-backed '+codeName+' Q'+qi);
          ok(await page.locator('#v71Continue').isVisible(),'action transition offered after feedback '+codeName+' Q'+qi);
          await page.locator('#v71Continue').click();
          c=await clinical();
          ok(c.phase==='action'&&!!c.actionQuestion,'original action stage '+codeName+' Q'+qi);
          await selectAndSubmit();
          c=await clinical();
          ok(c.phase==='action-feedback','original action feedback '+codeName+' Q'+qi);
          ok(c.actionFeedback?.assessment?.length>0,'original nursing assessment available '+codeName+' Q'+qi);
          const originalLabVisible=await frame.locator('#scenarioLabPanel').evaluate(el=>!el.hidden);
          ok(await page.locator('#v71ClinicalLab').isVisible()===originalLabVisible,'Lab UI follows original gate '+codeName+' Q'+qi);
          ok((c.lab!==null)===originalLabVisible,'Lab projection follows original release '+codeName+' Q'+qi);
          if(qi===0){
            ok(originalLabVisible,'first question explicitly permits post-action Lab '+codeName);
            if(width===1440){
              await capture('clinical-'+codeName+'-feedback-1440x900.png');
            }
            await nav('learn');
            ok(await page.locator('#v71ClinicalWorkspace').isHidden(),'clinical workspace hides when studying '+codeName);
            await nav('cases');
            ok((await clinical()).phase==='action-feedback','clinical feedback persists after navigation '+codeName);
            ok(await page.locator('#v71ClinicalWorkspace').isVisible(),'v7 clinical workspace resumes '+codeName);
          }
          await page.locator('#v71Continue').click();
        }
        c=await clinical();
        ok(c.phase==='result'&&c.result!==null,'original complete result released '+codeName);
        ok(c.knowledgeDone===questions&&c.actionDone===actions,'all judgment and action responses retained '+codeName);
        ok(await page.locator('#v71ClinicalReview').isVisible(),'v7 result review shown '+codeName);
        ok(await page.locator('#v71ReviewJudgements .v71-review-card').count()===questions,'complete judgment reviews '+codeName);
        ok(await page.locator('#v71ReviewActions .v71-review-card').count()===actions,'complete nursing reviews '+codeName);
        if(width===1440){
          await capture('clinical-'+codeName+'-review-1440x900.png');
        }
        await page.locator('#v71Restart').click();
        c=await clinical();
        ok(c.phase==='judgement'&&c.knowledgeDone===0&&c.actionDone===0,'explicit restart resets original answers '+codeName);
        ok(c.lab===null&&c.judgementFeedback===null,'restart re-locks feedback and Lab '+codeName);
        await page.locator('#v71ReturnCases').click();
        ok(await page.locator('#v71ClinicalWorkspace').isHidden(),'return to case catalog '+codeName);
        ok(await page.locator('#v7StartClinical').isVisible(),'case chooser controls restored '+codeName);
      }
      const current=(await snap()).current.bp;
      await nav('learn');
      ok(await page.locator('#v7LegacyPortal').isHidden(),'tab hides legacy activity without reset');
      ok((await snap()).current.bp===current,'study navigation preserves physiology after case flows');
      ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page-wide overflow '+width);
      ok(errors.length===0,'no JS errors '+width+': '+errors.join('; '));
      await page.close();
    }
    // Explicitly exercise non-reduced motion and interrupted view transitions.
    const animated=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
    await animated.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
    await animated.waitForFunction(()=>document.getElementById('v7EngineStatus')?.textContent.includes('연결됨'));
    await animated.locator('button[data-nav="explore"]:visible').first().click();
    await animated.evaluate(()=>{
      for(const id of ['modeCompact','modeStandard','modeCompact'])document.getElementById(id).click();
    });
    await animated.waitForFunction(()=>document.getElementById('outputCard').parentElement.id==='compactResults');
    ok(await animated.locator('#view-explore').evaluate(el=>el.classList.contains('is-compact')),'rapid morph ends in latest compact intent');
    ok(await animated.locator('#outputCard').evaluate(el=>el.parentElement.id)==='compactResults','rapid morph preserves live results placement');
    ok(await animated.evaluate(()=>document.getElementById('v7EngineFrame').contentWindow.RAASV6.snapshot().current.bp)===120,'rapid morph leaves physiology unchanged');
    await animated.locator('#modeStandard').click();
    await animated.waitForFunction(()=>document.getElementById('outputCard').parentElement.id==='experiment');
    ok(await animated.locator('#view-explore').evaluate(el=>!el.classList.contains('is-compact')),'animated return restores standard layout');
    await animated.close();
    console.log('PASS v7 integrated '+checks+' Chromium checks (390/1024/1440); backed by original v6 engine.');
  }finally{await browser.close();await stop()}
})().catch(e=>{console.error(e);process.exitCode=1});