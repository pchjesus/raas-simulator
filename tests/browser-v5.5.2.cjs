// Actual Chromium integration smoke (Playwright in CI). Manual mobile/UX QA remains separate.
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
const browser=await chromium.launch({headless:true});
let n=0;const errors=[];function ok(v,label){n++;assert.ok(v,label)}
try{
const page=await browser.newPage({viewport:{width:1365,height:880}});
page.on('pageerror',e=>errors.push(e.message));
await page.goto('file://'+path.resolve(__dirname,'../index.html'));
ok((await page.title()).trim()==='RAAS Simulator v5.5.2','real browser title');
ok((await page.locator('h1').innerText()).trim()==='RAAS Simulator v5.5.2','visible title');
ok(await page.locator('.study-mode-primary button').count()===3,'three primary tabs');
ok(await page.locator('.study-mode-secondary button').count()===2,'two secondary help buttons');
const primaryColor=await page.locator('#normalModeButton').evaluate(x=>getComputedStyle(x).backgroundColor);
const helpColor=await page.locator('#globalHelpButton').evaluate(x=>getComputedStyle(x).backgroundColor);
ok(primaryColor!==helpColor,'primary selected button distinguishable from help');
await page.locator('#globalHelpButton').click();
ok(await page.locator('#helpDialog').evaluate(el=>el.open),'native help dialog opens');
await page.keyboard.press('Escape');
await page.waitForFunction(()=>!document.getElementById('helpDialog').open&&document.activeElement.id==='globalHelpButton');
ok(true,'Esc closes dialog and focus restored');
await page.locator('#modelPolicyButton').click();
ok(await page.locator('#modelPolicyDialog').evaluate(el=>el.open),'policy dialog opens');
await page.locator('#modelPolicyCloseButton').click();
await page.waitForFunction(()=>document.activeElement.id==='modelPolicyButton');
ok(true,'policy dialog close returns focus');
await page.locator('#canvas').focus();
await page.keyboard.press('ArrowRight');
ok(!(await page.locator('#stageDetailPanel').evaluate(el=>el.hidden)),'keyboard Canvas learning detail opens');
await page.locator('#learningModeButton').click();
ok(!(await page.locator('#learningStudyView').evaluate(el=>el.hidden)),'learning view visible');
await page.locator('#scenarioModeButton').click();
await page.locator('#caseCKDButton').click();
await page.locator('#scenarioChoice1').click();
const baseline=await page.evaluate(()=>JSON.stringify(scenarioRuntime.session.answers));
ok(baseline!=='{}','clinical choice committed');
await page.locator('#learningModeButton').click();
await page.locator('#normalModeButton').click();
await page.locator('#scenarioModeButton').click();
ok(await page.evaluate(()=>JSON.stringify(scenarioRuntime.session.answers))===baseline,'answer survives 3 tab switches');
await page.screenshot({path:'browser-desktop-v5.5.2.png'});
await page.locator('#scenarioBackToCasesButton').click();
ok(await page.evaluate(()=>scenarioRuntime.session===null),'explicit case reset clears answers');
for(const width of [320,390,430]){
 await page.setViewportSize({width,height:800});
 const rect=await page.locator('.study-mode-nav').boundingBox();
 const p=await page.locator('.study-mode-primary').boundingBox();
 const s=await page.locator('.study-mode-secondary').boundingBox();
 ok(!!rect&&!!p&&!!s&&p.x>=-1&&s.x>=-1&&p.x+p.width<=width+1&&s.x+s.width<=width+1,'nav groups contained at '+width);
 for(const id of ['normalModeButton','learningModeButton','scenarioModeButton','globalHelpButton','modelPolicyButton']){
  const b=await page.locator('#'+id).boundingBox();
  ok(!!b&&b.x>=-1&&b.x+b.width<=width+1,'button '+id+' contained at '+width);
 }
 if(width===320)await page.screenshot({path:'browser-mobile-nav-v5.5.2.png'});
}
ok(errors.length===0,'no JavaScript page errors '+errors.join('; '));
console.log('PASS actual headless Chromium: '+n+' v5.5.2 browser checks (desktop+mobile nav viewport; NOT manual device/reader QA).');
}finally{await browser.close()}
})().catch(err=>{console.error(err.stack||err);process.exitCode=1});
