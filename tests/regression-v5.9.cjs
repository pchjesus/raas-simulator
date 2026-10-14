// v5.9 integrated QA: actual Node CLI, no browser claims.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const live=read('index.html'),old=read('backups/v5.5.2.html');
let n=0;function ok(v,why){n++;assert.ok(v,why)}
for(const v of ['5.6','5.7','5.8','5.9']){
 const html=read('backups/v'+v+'.html');
 ok(html.includes('<title>RAAS Simulator v'+v+'</title>'),'frozen title '+v);
 ok(html.includes('<h1>RAAS Simulator v'+v+'</h1>'),'frozen heading '+v);
}
ok(live===read('backups/v5.9.html'),'v5.9 live and frozen files identical');
ok(live.includes('v5.9 · 임상 적용'),'clinical badge version');
const script=live.match(/<script>([\s\S]*?)<\/script>/)?.[1];
ok(!!script,'single inline script present');
new vm.Script(script,{filename:'index.html:app'});ok(true,'JavaScript parses in real Node');
const markup=live.split('<script>')[0].replace(/<style>[\s\S]*?<\/style>/,'');
const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
ok(ids.length===new Set(ids).size,'no duplicate static DOM IDs');
for(const id of ['canvas','physiologyGraph','stageDetailPanel','mobileStageNavigator','mobileCanvasExplorer','learningCourse','learningGuidedButton','learningFreeButton','learningCoursePrev','learningCourseNext','learningLabReference','scenarioLabPanel','scenarioLabItems','scenarioKnowledgeDynamicReviews','scenarioNursingDynamicReviews','learningBackToClinicalButton']){
 if(id==='mobileStageNavigator'){ok(live.includes('class="mobile-stage-navigator"'),'mobile navigator exists');continue}
 ok(markup.includes('id="'+id+'"'),'required UI '+id);
}
ok((markup.match(/data-mobile-stage="\d+"/g)||[]).length===9,'exactly nine mobile stage buttons');
for(const i of Array.from({length:9},(_,x)=>x))ok(markup.includes('data-mobile-stage="'+i+'"'),'stage card '+i);
for(const v of ['320','360','700'])ok(live.includes(v+'px'),'small breakpoint mention '+v);
for(const f of ['learningCourseSteps','renderLearningCourse','goLearningCourse','scenarioLearningLinks','openScenarioRelatedLearning','renderScenarioLab','scenarioLabExamples','renderScenarioReviewCards'])ok(script.includes(f),'feature helper '+f);
for(const q of ['ckd-acei-nursing-monitoring:monitoring','ckd-acei-nursing-monitoring:follow-up','hf-mra-monitoring:mra-safety','hf-mra-monitoring:mra-followup'])ok(script.includes('"'+q+'"'),'relevant Lab case '+q);
ok(!script.includes('"ckd-acei-nursing-monitoring:dual-raas":{\n  context'),'no irrelevant lab for duplicate therapy question');
for(const id of ['scenarioChoice1','scenarioChoice2','scenarioChoice3','scenarioActionChoice1','scenarioActionChoice2','scenarioActionChoice3','scenarioBackToCasesButton','scenarioRestartButton','modelPolicyDialog','helpDialog','scenarioTakeawaysDialog'])ok(markup.includes('id="'+id+'"'),'retained '+id);
ok(script.includes('panel.hidden=!lab'),'Lab hidden when no relevant data');
ok(script.includes('scenarioActionPhase==="review"'),'Lab gated behind action feedback');
ok(script.includes('learningCourseMode="free"'),'review links preserve course pointer');
ok(script.includes('rows.sort((a,b)=>Number(a.correct)-Number(b.correct)'),'wrong-first sort');
ok(script.includes('items.replaceChildren()'),'Lab rows cleared on rerender');
ok(script.includes('judge.replaceChildren();nursing.replaceChildren()'),'dynamic review rows cleared');
ok(script.includes('Lab')&&markup.includes('가상 교육 자료'),'clinical/model separation messaging');
ok(markup.includes('mL/min/1.73m²'),'eGFR normalized unit');
ok(markup.includes('검사실 참고범위'),'reference ranges not over-asserted');
function segment(html,start,end){const i=html.indexOf(start),j=html.indexOf(end,i+start.length);ok(i>=0&&j>i,'found stable scenario bounds '+start);return html.slice(i,j)}
ok(segment(live,'const firstClinicalScenario={','// v5.3 — second sourced teaching case')===segment(old,'const firstClinicalScenario={','// v5.3 — second sourced teaching case'),'CKD answer key, source, prompt and options unchanged');
ok(segment(live,'const secondClinicalScenario={','// =============================\n// RAAS 단계 데이터')===segment(old,'const secondClinicalScenario={','// =============================\n// RAAS 단계 데이터'),'HFrEF answer key and prompt unchanged');
ok(segment(live,'const stageData=[','const drugData=')===segment(old,'const stageData=[','const drugData='),'RAAS stage data unchanged');
ok(segment(live,'const drugData=','const clinicalStageNotes=')===segment(old,'const drugData=','const clinicalStageNotes='),'six drug definitions unchanged');
console.log('PASS v5.9 '+n+' actual Node structural/safety/content regression checks (browser QA separate).');
