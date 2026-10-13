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




const current=fs.readFileSync(path.join(root,"index.html"),"utf8");
const frozen=fs.readFileSync(path.join(root,"backups","v5.4.1.html"),"utf8");
const app=boot(current),old=boot(frozen);
let count=0;
function ok(condition,label){count++;if(!condition)throw Error("FAIL v5.5 "+label);}
function snap(x){return JSON.stringify({state:x.api.state,physiology:x.api.physiology,
  graphs:["bp","sodium","volume","gfr"].map(k=>x.api.getGraphSeries(k))});}
ok(current.includes("RAAS Simulator v5.5"),"version");
for(const id of ["normalModeButton","learningModeButton","scenarioModeButton","learningStudyView","globalHelpButton",
 "learningStageSelect","learningDrugSelect","scenarioRoadmapContext","scenarioRoadmapJudgement","scenarioRoadmapAction","scenarioRoadmapResult",
 "scenarioCurrentTask","scenarioJudgementEvidenceDetails","scenarioActionEvidenceDetails","scenarioTakeawaysDialog","scenarioTakeawaysButton"]){
 ok(current.includes('id="'+id+'"'),"new UI "+id);
}
ok(current.includes("다시 풀기 / 다른 사례 선택 / 학습 종료"),"explicit reset instructions");
ok(current.includes("내가 선택한 답")&&current.includes("권장 답안"),"comparison labels");
ok(current.includes("기전·의학적 의미")&&current.includes("간호 사정과 안전 포인트"),"library hierarchy");
for(const item of ["scenarioFeedbackSelected","scenarioFeedbackCorrectAnswer","scenarioActionFeedbackSelected","scenarioActionFeedbackCorrect","scenarioActionAssessment","scenarioActionEscalation","scenarioActionTeaching"])
 ok((current.match(new RegExp('id="'+item+'"','g'))||[]).length===1,"retained anchor "+item);
ok(snap(app)===snap(old),"initial model identical");
for(const drug of ["none","acei","arb","aldo","beta","loop","thiazide"]){
  app.api.resetAll();old.api.resetAll();
  app.el("drugSelect").value=drug;old.el("drugSelect").value=drug;
  app.api.applyDrug();old.api.applyDrug();
  ok(snap(app)===snap(old),"apply drug parity "+drug);
  for(let i=0;i<9;i++){
    app.api.nextStep();old.api.nextStep();
    ok(snap(app)===snap(old),"RAAS step parity "+drug+"/"+i);
  }
  const baseline=snap(app);
  app.fire("learningModeButton");
  ok(!app.el("learningStudyView").hidden&&app.el("normalStudyView").hidden&&app.el("scenarioStudyView").hidden,"learning view "+drug);
  ok(app.el("learningStageTitle").textContent.length>0&&app.el("learningDrugTitle").textContent.length>0,"library rendered "+drug);
  ok(app.el("learningPathwayOverview").textContent===app.api.stageData.map((s,i)=>(i+1)+". "+s.name).join(" → "),"9-stage overview shares source data "+drug);
  ok(snap(app)===baseline,"learning view read-only "+drug);
  for(let i=0;i<9;i++){
    app.el("learningStageSelect").value=String(i);
    (app.el("learningStageSelect").events.change||[]).forEach(fn=>fn());
    ok(app.el("learningStageTitle").textContent.includes(app.api.stageData[i].name),"stage derived "+drug+"/"+i);
    ok(app.el("learningStageClinical").textContent.length>80,"stage medical note "+drug+"/"+i);
    ok(app.el("learningStageNursing").textContent.length>50,"stage nursing note "+drug+"/"+i);
    ok(snap(app)===baseline,"stage lookup read-only "+drug+"/"+i);
  }
  for(const key of ["acei","arb","aldo","beta","loop","thiazide"]){
    app.el("learningDrugSelect").value=key;
    (app.el("learningDrugSelect").events.change||[]).forEach(fn=>fn());
    ok(app.el("learningDrugTitle").textContent===app.api.drugData[key].name,"drug from source "+drug+"/"+key);
    ok(app.el("learningDrugNursing").textContent.length>50,"drug nursing educational note "+drug+"/"+key);
    ok(snap(app)===baseline,"drug lookup read-only "+drug+"/"+key);
  }
  app.fire("globalHelpButton");
  ok(app.el("helpDialog").open,"shared help opens in learning");
  app.fire("helpCloseButton");
  ok(!app.el("helpDialog").open&&app.el("globalHelpButton").focusCount>0,"shared help closes to invoker");
  app.fire("learningGoClinicalButton");
  ok(!app.el("scenarioStudyView").hidden&&app.el("learningStudyView").hidden,"learning to clinical "+drug);
  app.fire("normalModeButton");
  ok(!app.el("normalStudyView").hidden,"return simulator "+drug);
  ok(snap(app)===baseline,"all view transitions model isolated "+drug);
}
for(const item of [{button:"caseCKDButton",definition:app.api.firstClinicalScenario},
 {button:"caseMRAButton",definition:app.api.secondClinicalScenario}]){
 app.fire("scenarioModeButton");
 ok(!app.el("scenarioStudyView").hidden,"scenario entry "+item.button);
 app.fire(item.button);
 const def=app.api.scenarioRuntime.definition,n=def.questions.length;
 ok(def.id===item.definition.id,"correct selected case "+def.id);
 ok(!app.el("scenarioSessionContent").hidden&&app.el("scenarioCaseCatalog").hidden,"case content "+def.id);
 ok(app.el("scenarioCaseDetails").open,"case context initially open "+def.id);
 ok(app.el("scenarioCurrentTask").textContent.includes("임상 판단"),"initial step guidance");
 ok(app.el("scenarioRoadmapJudgement").attrs["aria-current"]==="step","judgement roadmap active");
 for(let i=0;i<n;i++){
   const q=def.questions[i];
   const selectedIndex=i===0?1:q.choices.findIndex(c=>c.id===q.correctChoiceId);
   const choice=q.choices[selectedIndex],expected=q.choices.find(c=>c.id===q.correctChoiceId);
   app.fire("scenarioChoice"+(selectedIndex+1));
   ok(app.el("scenarioAnsweredQuestion").textContent===q.prompt,"answered judgement prompt retained "+def.id+"/"+i);
   ok(app.el("scenarioFeedbackSelected").textContent===choice.text,"correct user choice displayed "+def.id+"/"+i);
   ok(app.el("scenarioFeedbackCorrectAnswer").textContent===expected.text,"recommended choice displayed "+def.id+"/"+i);
   ok(app.el("scenarioFeedbackChoiceExplanation").textContent.includes(choice.feedback),"specific choice rationale "+def.id+"/"+i);
   ok(app.el("scenarioFeedbackSource").textContent.includes("근거:"),"source reference "+def.id+"/"+i);
   ok(app.el("scenarioRoadmapJudgement").attrs["aria-current"]==="step","judgement explanation roadmap "+def.id+"/"+i);
   app.fire("learningModeButton");
   ok(app.api.scenarioRuntime.session.answers[q.id]===choice.id,"tabs preserve answer at feedback "+def.id+"/"+i);
   ok(!app.el("learningStudyView").hidden,"learning tab visible "+def.id+"/"+i);
   app.fire("normalModeButton");
   ok(app.api.scenarioRuntime.session.answers[q.id]===choice.id,"simulator tab preserves answer "+def.id+"/"+i);
   app.fire("scenarioModeButton");
   ok(!app.el("scenarioFeedbackPanel").hidden,"return to same feedback "+def.id+"/"+i);
   app.fire("scenarioActionStartButton");
   ok(app.el("scenarioRoadmapAction").attrs["aria-current"]==="step","action roadmap active "+def.id+"/"+i);
   const ex=q.actionExercise;
   const actionIndex=i===0?1:ex.choices.findIndex(c=>c.id===ex.correctChoiceId);
   const actionChoice=ex.choices[actionIndex],recommended=ex.choices.find(c=>c.id===ex.correctChoiceId);
   app.fire("scenarioActionChoice"+(actionIndex+1));
   ok(app.el("scenarioAnsweredActionPrompt").textContent===ex.prompt,"answered action prompt retained "+def.id+"/"+i);
   ok(app.el("scenarioActionFeedbackSelected").textContent===actionChoice.text,"action selected comparison "+def.id+"/"+i);
   ok(app.el("scenarioActionFeedbackCorrect").textContent===recommended.text,"action recommended comparison "+def.id+"/"+i);
   ok(app.el("scenarioActionFeedbackReason").textContent.includes(actionChoice.feedback),"action tailored feedback "+def.id+"/"+i);
   ok(app.el("scenarioActionAssessment").textContent===ex.assessment,"clinical assessment intact "+def.id+"/"+i);
   ok(app.el("scenarioActionEscalation").textContent===ex.escalation,"escalation intact "+def.id+"/"+i);
   ok(app.el("scenarioActionTeaching").textContent===ex.teaching,"teaching intact "+def.id+"/"+i);
   ok(app.el("scenarioNextButton").textContent.includes(i===n-1?"결과":"임상 판단"),"next step named "+def.id+"/"+i);
   app.fire("scenarioNextButton");
 }
 ok(!app.el("scenarioResultPanel").hidden,"results shown "+def.id);
 ok(app.el("scenarioRoadmapResult").attrs["aria-current"]==="step","result roadmap "+def.id);
 for(let i=0;i<n;i++){
   const q=def.questions[i],slot=i+1;
   ok(!app.el("scenarioKnowledgeReviewCard"+slot).hidden,"knowledge review card "+def.id+"/"+i);
   ok(app.el("scenarioKnowledgeReviewExpected"+slot).textContent===q.choices.find(c=>c.id===q.correctChoiceId).text,"correct review answer "+def.id+"/"+i);
   ok(!app.el("scenarioNursingReviewCard"+slot).hidden,"nursing review card "+def.id+"/"+i);
   ok(app.el("scenarioNursingReviewExpected"+slot).textContent===q.actionExercise.choices.find(c=>c.id===q.actionExercise.correctChoiceId).text,"nursing review correct answer "+def.id+"/"+i);
 }
 if(n===2)ok(app.el("scenarioKnowledgeReviewCard3").hidden&&app.el("scenarioNursingReviewCard3").hidden,"2-question case leaves 3rd slot hidden");
 app.fire("scenarioTakeawaysButton");
 ok(app.el("scenarioTakeawaysDialog").open,"compact modal opens "+def.id);
 for(const id of ["scenarioTakeawayAssessment","scenarioTakeawayEscalation","scenarioTakeawayTeaching","scenarioTakeawayEvidence"])ok(app.el(id).textContent.length>30,"summary populated "+id+"/"+def.id);
 app.fire("scenarioTakeawaysCloseButton");
 ok(!app.el("scenarioTakeawaysDialog").open&&app.el("scenarioTakeawaysButton").focusCount>0,"summary focus restore "+def.id);
 app.fire("learningModeButton");app.fire("scenarioModeButton");
 ok(!app.el("scenarioResultPanel").hidden,"completed session persists on tabs "+def.id);
 app.fire("scenarioRestartButton");
 ok(Object.keys(app.api.scenarioRuntime.session.answers).length===0,"explicit retry clears answers "+def.id);
 ok(!app.el("scenarioQuestionSection").hidden,"retry restarts case "+def.id);
 app.fire("scenarioBackToCasesButton");
 ok(app.api.scenarioRuntime.mode==="normal"&&app.api.scenarioRuntime.session===null,"case catalog clears session "+def.id);
 ok(!app.el("scenarioCaseCatalog").hidden,"case catalog visible "+def.id);
}
app.fire("caseCKDButton");
app.fire("scenarioChoice1");
ok(Object.keys(app.api.scenarioRuntime.session.answers).length===1,"answer captured before explicit exit");
app.fire("scenarioExitButton");
ok(app.api.scenarioRuntime.mode==="normal"&&app.api.scenarioRuntime.session===null,"explicit learning exit clears session");
ok(!app.el("normalStudyView").hidden,"explicit exit returns simulator");
// Hidden auto-demo should pause without losing the last displayed position.
app.api.toggleFlowDemo();
ok(app.api.flowDemo.timer!==null,"auto demo timer started");
const priorIndex=app.api.flowDemo.index,priorModel=snap(app);
app.fire("learningModeButton");
ok(app.api.flowDemo.timer===null&&app.api.flowDemo.paused,"demo paused on learning switch");
ok(app.api.flowDemo.index===priorIndex,"demo index retained across tab");
ok(snap(app)===priorModel,"tab pause does not alter model");
app.fire("normalModeButton");
app.api.stopFlowDemo();
ok(app.api.flowDemo.timer===null,"auto demo cleanup");
console.log("PASS v5.5 three-area learning/clinical UI: "+count+" deterministic checks (mock DOM/Canvas, browser verification outstanding).");
