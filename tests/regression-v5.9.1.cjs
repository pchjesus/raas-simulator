const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');
const current=read('backups/v5.9.1.html'),frozen=read('backups/v5.9.1.html'),base=read('backups/v5.9.html');
let count=0;function check(cond,reason){assert.ok(cond,reason);count++;}
check(current===frozen,'current HTML must be exact v5.9.1 backup');
for(const v of ['5.9','5.9.1']){const content=read('backups/v'+v+'.html');check(content.includes('<title>RAAS Simulator v'+v+'</title>'),'frozen title '+v);}
check(current.includes('<h1>RAAS Simulator v5.9.1</h1>'),'headline');
check(current.includes('v5.9.1 · 임상 적용'),'clinical badge');
const script=current.match(/<script>([\s\S]*?)<\/script>/)?.[1];check(Boolean(script),'inline script exists');
new vm.Script(script,{filename:'v5.9.1:index.html'});check(true,'real Node JS syntax parser');
const markup=current.split('<script>')[0].replace(/<style>[\s\S]*?<\/style>/,'');
const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);check(ids.length===new Set(ids).size,'DOM IDs unique');
const tests=['drugSelect','normalModeButton','learningModeButton','scenarioModeButton','canvas','physiologyGraph','mobileCanvasExplorer','flowDemoToggle','flowDemoStop','learningCourse','learningFocusTools','learningFreeStageButton','learningFreeDrugButton','learningStagePanel','learningDrugPanel','learningSummaryPanel','learningLabReference','scenarioPatientEssential','scenarioPatientObservations','scenarioCaseDetails','scenarioLabPanel','scenarioLabItems','scenarioLabInterpretation','scenarioKnowledgeDynamicReviews','scenarioNursingDynamicReviews','scenarioRestartButton','scenarioBackToCasesButton','scenarioExitButton','modelPolicyDialog','helpDialog'];
for(const id of tests)check(markup.includes('id="'+id+'"'),'retained / new element '+id);
const getStyle=markup=>{const m=markup.match(/<style>([\s\S]*?)<\/style>/);return m?m[1]:'';};const style=getStyle(current);
for(const token of ['--ui-navy:','--ui-border:','--ui-page:','--ui-focus:'])check(style.includes(token),'P1/T1 token '+token);
for(const part of ['.main{width:calc(100% - 32px);max-width:1200px;grid-template-columns:220px','font-size:16px','border:1px solid var(--ui-border)','@media(max-width:700px)','@media(max-width:420px)','grid-template-columns:repeat(4,minmax(0,1fr))'])check(style.includes(part),'readability/layout rule '+part);
check(/<div class="model-graph-pan"[^>]*role="region"[^>]*tabindex="0"/.test(markup),'keyboard-scrollable graph');
check(/<canvas id="physiologyGraph" width="1000" height="290"/.test(markup),'original graph pixel size');
check(/<canvas id="canvas"\s*width="900"\s*height="380"/.test(markup),'original pathway pixel size');
check(/\.model-graph-pan canvas\{[^}]*width:1000px;height:290px;max-width:none/.test(style),'graph does not get squeezed');
check((markup.match(/class="control-group"/g)||[]).length===3,'three logical control groups');
for(const f of ['applyDrug','removeDrug','previousStep','nextStep','resetProgress','resetAll'])check(markup.includes('onclick="'+f+'()"'),'keep control action '+f);
check(markup.includes('<section id="learningSummaryPanel"'),'final learning unit has content');
check(markup.includes('<details class="learning-disclosure" open><summary>간호 사정과 안전 포인트'),'essential nursing visible');
check(script.includes('function renderLearningFocus(){'),'K2 focus controller');
check(script.includes('document.getElementById("learningCoursePosition")')===false,'no accidental course state renaming');
check(script.includes('kind!=="stage"')&&script.includes('kind!=="drug"')&&script.includes('kind!=="summary"'),'guided single focus');
check(script.includes('learningFreeTopic="drug"'),'clinical related-learning connects drug');
check(markup.includes('id="scenarioPatientEssential"'),'patient context outside collapsible detail');
check(markup.includes('id="scenarioLabInterpretation" class="scenario-lab-interpretation"'),'safety interpretation plain visible paragraph');
check(!/<details[^>]*>[\s\S]{0,150}<summary>검사 해석과 안전한 간호 확인/.test(markup),'Lab safety is not in a disclosure');
check(markup.includes('정적 가상 Lab 결과'),'obsolete no-Lab policy replaced');
check(!markup.includes('환자별 검사 수치와 약물 반응은 제공되지 않으며'),'obsolete contradictory policy gone');
for(const term of ['scenarioLatestFeedback','scenarioActionPhase','scenarioActionAnswers','scenarioLearningLinks'])check(script.includes(term),'clinical state retained '+term);
function segment(s,start,end){const i=s.indexOf(start),j=s.indexOf(end,i+start.length);check(i>=0&&j>i,'fixture boundaries '+start);return s.slice(i,j)}
for(const [begin,end,label] of [
 ['const firstClinicalScenario={','// v5.3 — second sourced teaching case','CKD original questions and answer keys'],
 ['const secondClinicalScenario={','// =============================\n// RAAS 단계 데이터','HFrEF original questions and keys'],
 ['const stageData=[','const drugData=','RAAS pathway data'],
 ['const drugData=','const clinicalStageNotes=','six drug definitions'],
 ['const scenarioLabExamples=','function renderScenarioLab(','all static Lab examples']]){
 check(segment(current,begin,end)===segment(base,begin,end),label+' unchanged');
}
check(script.includes('panel.hidden=!lab'),'only related Lab visible');
check(script.includes('if(scenarioActionPhase')||script.includes('scenarioActionPhase==="review"'),'action phase state retained');
console.log('PASS v5.9.1 '+count+' real Node source integrity, accessibility and educational state checks.');
