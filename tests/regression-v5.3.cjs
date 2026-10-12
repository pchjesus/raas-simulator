// v5.3 two-case catalog and action workflow regression
// Run: node tests/regression-v5.3.cjs. Mock DOM/Canvas; browser verification is separate.
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
function boot(html){
    const elements={},calls={},timers=new Map();let lastTimer=0;
    function el(id){
        if(elements[id])return elements[id];
        return elements[id]={
            id,value:"none",textContent:"",innerHTML:"",hidden:id==="normalStudyView"?false:true,
            disabled:false,open:false,events:{},attrs:{},focusCount:0,
            width:id==="physiologyGraph"?1000:900,height:id==="physiologyGraph"?290:380,
            clientWidth:900,clientHeight:380,offsetWidth:904,offsetHeight:384,clientLeft:2,clientTop:2,
            addEventListener(type,fn){(this.events[type]??=[]).push(fn);},
            setAttribute(k,v){this.attrs[k]=v;},focus(){this.focusCount++;},
            showModal(){this.open=true;},close(){this.open=false;(this.events.close??[]).forEach(fn=>fn());},
            getBoundingClientRect(){return {left:0,top:0,right:904,bottom:384,width:904,height:384};},
            getContext(){return new Proxy({},{
                get(t,k){return t[k]??((...args)=>{calls[id]=(calls[id]??0)+1;});},
                set(t,k,v){t[k]=v;return true;}
            });}
        };
    }
    const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    if(!script)throw Error("single inline simulator script missing");
    const extras=[
        "state","physiology","stageData","drugData","flowDemo","firstClinicalScenario","secondClinicalScenario",
        "scenarioRuntime","validateScenarioDefinition","enterScenarioMode","exitScenarioMode",
        "resetScenarioSession","submitScenarioAnswer","switchStudyMode","renderScenarioStudy",
        "chooseScenarioAnswer","selectClinicalCase","showClinicalCaseCatalog","toggleFlowDemo","stopFlowDemo","calculatePhysiologyAtStep",
        "getGraphSeries","nextStep","previousStep","applyDrug","removeDrug","resetAll"
    ].map(name=>name+':typeof '+name+'==="undefined"?null:'+name).join(",");
    const api=new Function("document","setInterval","clearInterval",script+"\nreturn {"+extras+"};")(
        {getElementById:el},(fn,delay)=>{const id=++lastTimer;timers.set(id,{fn,delay});return id;},
        id=>timers.delete(id));
    return {api,el,calls,timers,fire(id,event){
        (el(id).events.click??[]).forEach(fn=>fn(event??{target:el(id)}));
    }};
}


const reference=boot(fs.readFileSync(path.join(root,"backups","v5.2.html"),"utf8"));
const source=fs.readFileSync(path.join(root,"index.html"),"utf8");
const app=boot(source);
let count=0;
function verify(flag,label){count++;if(!flag)throw Error("FAIL v5.3 "+label)}
function baselineParity(){
 return JSON.stringify({
  state:app.api.state,phy:app.api.physiology,graphs:["bp","sodium","volume","gfr"].map(k=>app.api.getGraphSeries(k))
 })===JSON.stringify({
  state:reference.api.state,phy:reference.api.physiology,graphs:["bp","sodium","volume","gfr"].map(k=>reference.api.getGraphSeries(k))
 });
}
const first=app.api.firstClinicalScenario,second=app.api.secondClinicalScenario;
verify(source.includes("RAAS Simulator v5.3"),"version 5.3");
verify(source.includes('id="scenarioCaseCatalog"')&&source.includes('id="scenarioSessionContent"'),"separate catalog/session");
verify(source.includes('id="caseCKDButton"')&&source.includes('id="caseMRAButton"'),"both case buttons");
verify(source.includes('id="scenarioBackToCasesButton"'),"safe back to catalog");
verify(first.id!==second.id,"two distinct IDs");
verify(first.questions.length===3&&second.questions.length===2,"3+2 knowledge questions");
verify(first.questions.every(q=>!!q.actionExercise)&&second.questions.every(q=>!!q.actionExercise),"each has related action");
verify(first.modelPolicy==="reference-only"&&second.modelPolicy==="reference-only","no patient prediction");
verify(app.api.validateScenarioDefinition(first).valid&&app.api.validateScenarioDefinition(second).valid,"both scenarios valid");
verify(second.questions.every(q=>q.sourceIds.every(id=>second.references.some(ref=>ref.id===id))),"question references linked");
verify(second.questions.every(q=>q.actionExercise.sourceIds.every(id=>second.references.some(ref=>ref.id===id))),"action references linked");
verify(second.questions.every(q=>q.choices.length===3&&q.actionExercise.choices.length===3),"three-choice questions");
verify(app.api.scenarioRuntime.mode==="normal","initial normal mode");
verify(app.el("scenarioStudyView").hidden&& !app.el("normalStudyView").hidden,"initial visibility");
verify(baselineParity(),"initial physiology parity");

function toCatalog(){
 app.fire("scenarioModeButton");
 verify(app.el("scenarioCaseCatalog").hidden===false,"catalog visible on entering scenario");
 verify(app.el("scenarioSessionContent").hidden===true,"session hidden without selection");
 verify(app.api.scenarioRuntime.mode==="normal","no implicit first-case start");
 verify(app.el("scenarioModeButton").attrs["aria-pressed"]==="true","scenario nav shows selected");
}
toCatalog();
verify(app.api.selectClinicalCase("nonexistent")===false,"invalid case is rejected");
verify(app.api.scenarioRuntime.mode==="normal","invalid case did not mutate session");
function pick(id){
 app.fire(id==="ckd-acei-nursing-monitoring"?"caseCKDButton":"caseMRAButton");
 verify(app.api.scenarioRuntime.mode==="scenario","session begins for "+id);
 verify(app.api.scenarioRuntime.definition.id===id,"correct case selected "+id);
 verify(app.el("scenarioCaseCatalog").hidden&& !app.el("scenarioSessionContent").hidden,"correct area visible "+id);
 verify(app.el("scenarioProgress").textContent.includes("1 / "),"question one visible "+id);
 verify(app.el("scenarioHeading").textContent===app.api.scenarioRuntime.definition.title,"case heading "+id);
}
pick(first.id);
verify(app.el("scenarioSourcePrimary").attrs.href.includes("kdigo.org"),"CKD links to KDIGO");
verify(app.el("scenarioSourceSecondary").hidden,"CKD has single evidence source");
app.fire("scenarioChoice1");
app.fire("scenarioActionStartButton");
app.fire("scenarioActionChoice1");
app.fire("scenarioBackToCasesButton");
verify(app.api.scenarioRuntime.mode==="normal"&&!app.api.scenarioRuntime.session,"back clears first case session");
verify(!app.el("scenarioCaseCatalog").hidden&&app.el("scenarioSessionContent").hidden,"back returns chooser");
verify(app.el("caseCKDButton").focusCount>0,"focus returns to catalog");
pick(second.id);
verify(app.el("scenarioSourcePrimary").attrs.href.includes("jacc.org"),"HFrEF links AHA/ACC/HFSA");
verify(!app.el("scenarioSourceSecondary").hidden,"HFrEF second citation shown");
verify(app.el("scenarioSourceSecondary").attrs.href.includes("nice.org.uk"),"HFrEF links NICE");
verify(app.api.scenarioRuntime.session.questionIndex===0&&Object.keys(app.api.scenarioRuntime.session.answers).length===0,"switch did not retain CKD attempt");
app.fire("scenarioBackToCasesButton");
pick(first.id);
verify(app.api.scenarioRuntime.session.questionIndex===0,"return CKD starts fresh");
app.fire("normalModeButton");
verify(app.api.scenarioRuntime.mode==="normal"&&app.el("scenarioStudyView").hidden,"return normal clears selected case");
verify(app.el("normalStudyView").hidden===false,"normal UI restored");
verify(baselineParity(),"normal physiology untouched by case switches");

const options=["none","acei","arb","aldo","beta","loop","thiazide"];
const caseSets=[first,second];
for(const drug of options){
 reference.api.resetAll();app.api.resetAll();
 reference.el("drugSelect").value=drug;app.el("drugSelect").value=drug;
 reference.api.applyDrug();app.api.applyDrug();
 verify(baselineParity(),"apply drug parity "+drug);
 for(let step=0;step<9;step++){
  reference.api.nextStep();app.api.nextStep();
  verify(baselineParity(),"progress parity "+drug+" "+step);
 }
 const oldState=JSON.stringify(app.api.state),oldPhys=JSON.stringify(app.api.physiology);
 const graphDraws=app.calls.physiologyGraph||0,canvasDraws=app.calls.canvas||0;
 toCatalog();
 for(const definition of caseSets){
  pick(definition.id);
  verify(app.el("scenarioOverview").textContent.includes("근거 문헌 "+definition.references.length+"종"),"case-specific source count "+definition.id);
  verify(app.el("scenarioOverview").textContent.includes(definition.questions.length+"문항"),"case-specific question total "+definition.id);
  for(let qIndex=0;qIndex<definition.questions.length;qIndex++){
   const q=definition.questions[qIndex];
   const chosen=q.choices.findIndex(choice=>choice.id===q.correctChoiceId);
   app.fire("scenarioChoice"+(chosen+1));
   verify(app.el("scenarioFeedbackPanel").hidden===false,"clinical explanation "+definition.id+" "+qIndex);
   verify(app.el("scenarioActionStartButton").hidden===false,"action start "+definition.id+" "+qIndex);
   verify(app.el("scenarioNextButton").hidden,"no clinical skip "+definition.id+" "+qIndex);
   const frozen=JSON.stringify(app.api.scenarioRuntime.session.answers);
   app.fire("scenarioNextButton");
   verify(JSON.stringify(app.api.scenarioRuntime.session.answers)===frozen,"premature next blocked "+definition.id+" "+qIndex);
   app.fire("scenarioActionStartButton");
   verify(!app.el("scenarioActionStep").hidden,"action stage shown "+definition.id+" "+qIndex);
   const a=q.actionExercise;
   verify(app.el("scenarioActionPrompt").textContent===a.prompt,"action prompt correct "+definition.id+" "+qIndex);
   const actionIndex=a.choices.findIndex(choice=>choice.id===a.correctChoiceId);
   app.fire("scenarioActionChoice"+(actionIndex+1));
   verify(app.el("scenarioActionFeedbackPanel").hidden===false,"action feedback "+definition.id+" "+qIndex);
   verify(app.el("scenarioActionAssessment").textContent.includes(a.assessment),"nursing assessment "+definition.id+" "+qIndex);
   verify(app.el("scenarioActionEscalation").textContent.includes(a.escalation),"nursing escalation "+definition.id+" "+qIndex);
   verify(app.el("scenarioActionTeaching").textContent.includes(a.teaching),"nursing patient education "+definition.id+" "+qIndex);
   const expectedCitation=definition.references.find(ref=>ref.id===a.sourceIds[0]).citation;
   verify(app.el("scenarioActionEvidence").textContent.includes(expectedCitation),"action source case-specific "+definition.id+" "+qIndex);
   verify(app.el("scenarioActionFeedbackPanel").attrs["data-correct"]==="true","correct styling "+definition.id+" "+qIndex);
   app.fire("scenarioNextButton");
   if(qIndex<definition.questions.length-1){
    verify(app.el("scenarioProgress").textContent.includes((qIndex+2)+" / "+definition.questions.length),"advances "+definition.id+" "+qIndex);
   }
  }
  verify(app.api.scenarioRuntime.session.status==="completed","finished "+definition.id+" "+drug);
  verify(app.el("scenarioResultPanel").hidden===false,"summary visible "+definition.id+" "+drug);
  verify(app.el("scenarioResultText").textContent.includes("임상 판단 "+definition.questions.length+"문항 중 "+definition.questions.length+"문항 정답"),"knowledge score correct "+definition.id+" "+drug);
  verify((app.el("scenarioResultReview").textContent.match(/내 선택:/g)||[]).length===definition.questions.length,"knowledge review count "+definition.id+" "+drug);
  verify((app.el("scenarioActionReview").textContent.match(/내 행동:/g)||[]).length===definition.questions.length,"action review count "+definition.id+" "+drug);
  app.fire("scenarioRestartButton");
  verify(app.api.scenarioRuntime.session.status==="active"&&app.api.scenarioRuntime.session.questionIndex===0,"restart fresh "+definition.id+" "+drug);
  verify(app.el("scenarioResultPanel").hidden,"result hidden on restart "+definition.id+" "+drug);
  app.fire("scenarioBackToCasesButton");
  verify(app.api.scenarioRuntime.session===null,"case exit discards session "+definition.id+" "+drug);
 }
 verify(JSON.stringify(app.api.state)===oldState&&JSON.stringify(app.api.physiology)===oldPhys,"both cases leave normal state intact "+drug);
 verify((app.calls.physiologyGraph||0)===graphDraws&&(app.calls.canvas||0)===canvasDraws,"case mode does not draw hidden graph "+drug);
 app.fire("normalModeButton");
 for(let i=0;i<9;i++){reference.api.previousStep();app.api.previousStep();verify(baselineParity(),"backward parity "+drug+" "+i);}
 reference.api.resetAll();app.api.resetAll();
 verify(baselineParity(),"reset parity "+drug);
}
// Wrong choices of new case: verify all 2x3 and 2x3 secondary action explanations
for(let question=0;question<second.questions.length;question++){
 const q=second.questions[question],a=q.actionExercise;
 for(let selectedIndex=0;selectedIndex<3;selectedIndex++){
  toCatalog();pick(second.id);
  for(let prev=0;prev<question;prev++){
   const old=second.questions[prev];
   const index1=old.choices.findIndex(x=>x.id===old.correctChoiceId);
   const index2=old.actionExercise.choices.findIndex(x=>x.id===old.actionExercise.correctChoiceId);
   app.fire("scenarioChoice"+(index1+1));
   app.fire("scenarioActionStartButton");
   app.fire("scenarioActionChoice"+(index2+1));
   app.fire("scenarioNextButton");
  }
  const clinical=q.choices[selectedIndex];
  app.fire("scenarioChoice"+(selectedIndex+1));
  verify(app.el("scenarioFeedbackChoiceExplanation").textContent.includes(clinical.feedback),"HFrEF knowledge feedback "+q.id+"/"+clinical.id);
  app.fire("scenarioActionStartButton");
  const action=a.choices[selectedIndex];
  app.fire("scenarioActionChoice"+(selectedIndex+1));
  verify(app.el("scenarioActionFeedbackReason").textContent.includes(action.feedback),"HFrEF action feedback "+q.id+"/"+action.id);
  const freeze=app.el("scenarioActionFeedbackSelected").textContent;
  app.fire("scenarioActionChoice"+(selectedIndex+1));
  verify(app.el("scenarioActionFeedbackSelected").textContent===freeze,"HFrEF action no duplicate "+q.id+"/"+action.id);
  app.fire("scenarioBackToCasesButton");
  app.fire("normalModeButton");
  verify(baselineParity(),"all branch cases preserve RAAS "+q.id+"/"+action.id);
 }
}
// Timer must pause before case catalog display
app.api.toggleFlowDemo();
verify(app.timers.size===1,"demo starts");
const demoIndex=app.api.flowDemo.index;
toCatalog();
verify(app.timers.size===0&&app.api.flowDemo.paused&&app.api.flowDemo.index===demoIndex,"demo paused on catalog entry");
app.fire("normalModeButton");
app.api.toggleFlowDemo();verify(app.timers.size===1,"resume only via explicit user action");
app.api.stopFlowDemo();verify(app.timers.size===0,"stop demo");
console.log("PASS v5.3 dual-case catalog: "+count+" deterministic checks (mock DOM/Canvas).");
