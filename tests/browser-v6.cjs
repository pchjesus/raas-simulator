const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
(async()=>{
const browser=await chromium.launch();let checks=0;const errors=[];
const screenshotDir=path.resolve(__dirname,'../artifacts/content-ia');
const ok=(v,m)=>{assert.ok(v,m);checks++};
const snapshot=page=>page.evaluate(()=>JSON.stringify({state,physiology,scenarioRuntime,scenarioLatestFeedback,scenarioActionPhase,scenarioActionAnswers}));
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.resolve(__dirname,'../index.html'));
 ok(await page.locator('#lxHome').isVisible(),'default hub');
 await page.locator('#lxExplore').click();await page.locator('#drugSelect').selectOption('arb');await page.locator('[onclick="applyDrug()"]').click();
 await page.locator('[onclick="nextStep()"]').click();const main=await snapshot(page);
 await page.locator('#lxHomeButton').click();await page.locator('#lxStart').click();
 for(let i=0;i<16;i++){await page.evaluate(i=>goLearningCourse(i),i);ok(await page.locator('#lxObjective').innerText(),'objective '+i);ok(await page.locator('#lxLearningPath li').count()===9,'path '+i);}
 ok(await page.locator('#learningSummaryPanel').isVisible(),'final substantive unit');
 await page.evaluate(()=>goLearningCourse(9));
 await page.locator('#lxOpenPractice').click();ok(await page.locator('#lxObserve').isDisabled(),'no observation before confirm');
 await page.locator('[name="lxGuess"][value="same"]').check();await page.locator('#lxConfirm').click();await page.locator('#lxObserve').click();
 for(let i=0;i<9;i++){
  const expected=await page.evaluate(i=>[calculatePhysiologyAtStep(i,'none').current,calculatePhysiologyAtStep(i,'acei').current],i);
  const text=await page.locator('#lxResultRows').innerText();for(const values of expected)for(const value of Object.values(values))ok(text.includes(String(value)),'same engine result '+i);
  ok(!(await page.locator('#lxResults').innerText()).includes('undefined'),'all units valid');
  if(i<8)await page.locator('#lxPracticeNext').click();
 }
 ok(await snapshot(page)===main,'practice isolated');await page.locator('#lxPracticeReset').click();ok(await page.locator('#lxResults').isHidden(),'reset practice only');
 await page.locator('#lxPracticeBack').click();ok(await snapshot(page)===main,'return isolated');
 for(const width of [320,360,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:900});await page.locator('#lxHomeButton').click();
  ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'hub no overflow '+width);
  await page.locator('#lxTourButton').click();
  for(let i=0;i<7;i++){
   await page.waitForTimeout(30);const box=await page.locator('#lxTourPanel').boundingBox();ok(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=901,'tour contained '+width+'/'+i);
   if(i===2){await page.evaluate(()=>window.scrollBy(0,100));await page.waitForTimeout(20);}
   if(i<6)await page.locator('#lxTourNext').click();
  }
  await page.keyboard.press('Escape');ok(await page.locator('#lxTour').isHidden(),'escape '+width);ok(await page.locator('#lxHome').isVisible(),'view restored');ok(await snapshot(page)===main,'tour state unchanged');
  ok(await page.evaluate(()=>document.activeElement.id)==='lxTourButton','focus restored');
 }
 await page.locator('#lxTourButton').click();await page.evaluate(()=>{lxTourSteps[0].target='missing-target';lxTourLayout();});ok(await page.locator('#lxTourPanel').isVisible(),'missing target fallback');await page.locator('#lxTourSkip').click();await page.evaluate(()=>lxTourSteps[0].target='lxStart');
 await page.locator('#scenarioModeButton').click();await page.locator('#caseCKDButton').click();
 await page.locator('#scenarioChoice1').click();const clinical=await snapshot(page);
 await page.locator('#lxHomeButton').click();await page.locator('#lxTourButton').click();await page.locator('#lxTourClose').click();await page.locator('#scenarioModeButton').click();ok(await snapshot(page)===clinical,'clinical answer survives home and tutorial');
 fs.mkdirSync(screenshotDir,{recursive:true});
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:1000});
  for(const [name,id] of [['home','lxHomeButton'],['learning','learningModeButton'],['simulation','normalModeButton'],['clinical','scenarioModeButton']]){await page.locator('#'+id).click();if(name==='learning')await page.evaluate(()=>{learningCourseMode='guided';goLearningCourse(9)});await page.screenshot({path:path.join(screenshotDir,name+'-'+width+'.png'),fullPage:true});}
 }
 await page.locator('#learningModeButton').click();await page.evaluate(()=>{learningCourseMode='guided';goLearningCourse(9)});await page.locator('#lxOpenPractice').click();
 await page.locator('[name="lxGuess"][value="lower"]').check();await page.locator('#lxConfirm').click();await page.locator('#lxObserve').click();await page.screenshot({path:path.join(screenshotDir,'practice-1440.png'),fullPage:true});
 await page.locator('#lxTourButton').click();await page.keyboard.press('Tab');ok((await page.evaluate(()=>document.activeElement.id)).startsWith('lxTour'),'tour keyboard trap');
 await page.locator('#lxTourNext').click();await page.locator('#lxTourPrev').click();ok((await page.locator('#lxTourProgress').innerText()).startsWith('1'),'tour previous');
 await page.screenshot({path:path.join(screenshotDir,'tutorial-1440.png')});
 for(let i=0;i<7;i++)await page.locator('#lxTourNext').click();ok(await page.locator('#lxTour').isHidden(),'complete closes tour');ok(await page.locator('#lxPractice').isVisible(),'practice restored after completion');
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#lxHomeButton').click();ok(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),'reduced motion');
 await page.setViewportSize({width:720,height:500});await page.locator('#lxTourButton').click();const zoomBox=await page.locator('#lxTourPanel').boundingBox();ok(zoomBox.y+zoomBox.height<=501,'200 percent equivalent CSS viewport');await page.keyboard.press('Escape');
 ok(errors.length===0,errors.join('\n'));console.log('PASS v6 '+checks+' browser learning, practice, tutorial, responsive and state checks');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
