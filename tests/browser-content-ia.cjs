const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch();let count=0;const errors=[];
 const ok=(condition,label)=>{assert.ok(condition,label);count++;};
 const snapshot=p=>p.evaluate(()=>JSON.stringify({state,physiology,scenarioRuntime,scenarioLatestFeedback,scenarioActionAnswers,scenarioActionPhase}));
 const rectOrder=async(p,ids)=>p.evaluate(ids=>ids.map(id=>document.getElementById(id).getBoundingClientRect().top).every((v,i,all)=>i===0||v>=all[i-1]),ids);
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve(__dirname,'../index.html'));
  const old=await browser.newPage();await old.goto('file://'+path.resolve(__dirname,'../backups/v6.0-candidate.html'));
  const outputs=()=>JSON.stringify({model:Object.keys(drugData).map(id=>Array.from({length:10},(_,i)=>calculatePhysiologyAtStep(i-1,id))),graphs:Object.keys(drugData).map(id=>['bp','sodium','volume','gfr'].map(key=>getGraphSeries(key,id))),canvas:document.getElementById('canvas').toDataURL(),graph:document.getElementById('physiologyGraph').toDataURL()});
  ok(await page.evaluate(outputs)===await old.evaluate(outputs),'baseline model, graph series and bitmap identity');await old.close();
  const baseline=await snapshot(page);await page.locator('#lxStart').click();
  const questions=new Set(),actions=new Set();
  for(let i=0;i<16;i++){
   await page.evaluate(i=>goLearningCourse(i),i);
   questions.add(await page.locator('#lxObjective').innerText());actions.add(await page.locator('#lxLearningAction').innerText());
   ok(await page.locator('#iaEvidence').isVisible(),'evidence instruction '+i);ok(await page.locator('#iaInterpretation').isVisible(),'reflection '+i);
   ok(await page.locator('#iaMechanism').isVisible(),'focused mechanism '+i);
   ok(await page.locator('#lxLearningPath').isHidden(),'full path optional '+i);
   ok(await page.locator('#lxOpenPractice').isVisible()===(i===9),'only ACEi activity opens practice '+i);
   if(i<9){
    const source=await page.evaluate(i=>clinicalStageNotes[i],i);
    ok(await page.locator('#learningStageNursing').innerText()===source.nursing,'original stage nursing '+i);
    ok((await page.locator('#learningStageSources').innerText()).includes(source.sourceIds),'stage source '+i);
    ok(await rectOrder(page,['lxObjective','iaMechanism','learningStageSummary','iaActivity','learningStageNursing']),'stage content order '+i);
   }else if(i<15){
    const id=['acei','arb','aldo','beta','loop','thiazide'][i-9],source=await page.evaluate(id=>clinicalDrugNotes[id],id);
    ok(await page.locator('#learningDrugMechanism').innerText()===source.medical,'original drug source '+id);
    ok(await page.locator('#learningDrugNursing').innerText()===source.nursing,'original drug nursing '+id);
    ok(await rectOrder(page,['lxObjective','iaMechanism','learningDrugMechanism','iaActivity','learningDrugNursing']),'drug content order '+id);
    if(i>=13)ok((await page.locator('#iaMechanismMeaning').innerText()).includes('RAAS 경로의 직접 차단을 뜻하지'),'diuretic actual target boundary');
   }
  }
  ok(questions.size===16&&actions.size===16,'distinct non-quiz activities');ok(await snapshot(page)===baseline,'all lesson reads isolated');
  await page.evaluate(()=>goLearningCourse(4));ok((await page.locator('#iaMechanismMeaning').innerText()).includes('갈증/바소프레신'),'Ang II multiple effects visible');
  await page.locator('#learningFreeButton').click();await page.locator('#learningFreeDrugButton').click();await page.locator('#learningDrugSelect').selectOption('loop');
  ok((await page.locator('#iaMechanismMeaning').innerText()).includes('NKCC2'),'free drug target');await page.locator('#learningGuidedButton').click();
  ok((await page.locator('#learningCourseStatus').innerText()).includes('5/16'),'guided position retained');
  await page.locator('#normalModeButton').click();await page.locator('[onclick="nextStep()"]').click();await page.locator('[onclick="nextStep()"]').click();await page.locator('[onclick="previousStep()"]').click();
  await page.evaluate(()=>showStageLearning(6));
  const status=await page.locator('#iaSimStatus').innerText();ok(status.includes('현재 조회: 7. Aldosterone')&&status.includes('최대 도달: 2. Renin')&&status.includes('현재 진행: 1. 혈압 감소'),'view/current/max distinct');
  ok(await rectOrder(page,['iaSimStatus','mobileCanvasExplorer','stageDetailPanel']),'simulator structure order');
  ok(await page.locator('#iaSimExplanation').isHidden(),'avoid duplicate mechanism when detail visible');
  await page.locator('#stageDetailCloseButton').click();ok(await page.locator('#iaSimExplanation').isVisible(),'progress mechanism remains available after closing detail');
  ok(await page.locator('#iaValue-naInfo').isVisible(),'model current Na visible');ok(await page.locator('#naInfo').isHidden(),'decomposition optional');await page.locator('#naInfo').locator('..').locator('summary').click();ok(await page.locator('#naInfo').isVisible(),'decomposition accessible');
  const prePractice=await snapshot(page);await page.locator('#learningModeButton').click();await page.evaluate(()=>goLearningCourse(9));await page.locator('#lxOpenPractice').click();
  ok(await page.locator('#lxResults').isHidden(),'results hidden before prediction');await page.locator('[value="unsure"][name="lxGuess"]').check();ok(await page.locator('#lxResults').isHidden(),'selection reveals no results');await page.locator('#lxConfirm').click();ok(await page.locator('#lxResults').isHidden(),'confirmation still requires observe');await page.locator('#lxObserve').click();
  for(let step=0;step<9;step++){
   const rows=await page.locator('#lxResultRows tr').allTextContents();const expected=await page.evaluate(step=>{const a=calculatePhysiologyAtStep(step,'acei').current,b=calculatePhysiologyAtStep(step,'none').current;return ['bp','sodium','volume','gfr'].map(key=>a[key]-b[key]);},step);
   for(let i=0;i<4;i++)ok(rows[i].includes(String(expected[i])),'derived difference '+step+'/'+i);
   if(step<8)await page.locator('#lxPracticeNext').click();
  }
  ok(await snapshot(page)===prePractice,'comparison isolated');
  fs.mkdirSync(path.resolve(__dirname,'../artifacts/content-ia'),{recursive:true});
  for(const width of [320,360,390,430,1440]){
   await page.setViewportSize({width,height:1000});
   for(const [name,id] of [['learning','learningModeButton'],['simulation','normalModeButton']]){
    await page.locator('#'+id).click();ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'no page overflow '+name+'/'+width);
    if(width===390||width===1440)await page.screenshot({path:path.resolve(__dirname,'../artifacts/content-ia/'+name+'-'+width+'.png'),fullPage:true});
   }
  }
  await page.locator('#scenarioModeButton').click();await page.locator('#caseMRAButton').click();ok(await page.locator('#scenarioLabPanel').isHidden(),'MRA Lab hidden');await page.locator('#scenarioChoice1').click();ok(await page.locator('#scenarioFeedbackNursing').isVisible(),'nursing in primary feedback flow');
  await page.locator('#scenarioActionStartButton').click();await page.locator('#scenarioActionChoice1').click();ok(await page.locator('#scenarioActionAssessment').isVisible(),'assessment visible');ok(await page.locator('#scenarioActionEscalation').isVisible(),'report visible');ok(await page.locator('#scenarioActionTeaching').isVisible(),'teaching visible');ok(await page.locator('#scenarioLabPanel').isVisible(),'gated Lab after action');
  for(const width of [390,1440]){await page.setViewportSize({width,height:1000});await page.screenshot({path:path.resolve(__dirname,'../artifacts/content-ia/clinical-'+width+'.png'),fullPage:true});}
  const clinical=await snapshot(page);await page.locator('#lxTourButton').click();await page.keyboard.press('Escape');ok(await snapshot(page)===clinical,'tour preserves IA clinical flow');
  ok(errors.length===0,errors.join('\n'));console.log('PASS content IA '+count+' actual Chromium checks');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
