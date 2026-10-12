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



const source=fs.readFileSync(path.join(root,"index.html"),"utf8");
const prior=fs.readFileSync(path.join(root,"backups","v5.3.html"),"utf8");
const app=boot(source),old=boot(prior);
let count=0;
function ok(x,label){count++;if(!x)throw Error("FAIL v5.4: "+label)}
function parity(label){
 const snapshot=x=>JSON.stringify({state:x.api.state,phys:x.api.physiology,graph:["bp","sodium","volume","gfr"].map(k=>x.api.getGraphSeries(k))});
 ok(snapshot(app)===snapshot(old),label);
}
ok(source.includes("RAAS Simulator v5.4"),"version visible");
for(const id of ["scenarioLearningProgress","scenarioActiveCaseLabel","scenarioActionAssessment","scenarioActionEscalation","scenarioActionTeaching"])ok(source.includes('id="'+id+'"'),"required anchor "+id);
ok(source.includes('class="scenario-action-detail-grid"'),"grouped actions");
ok(source.includes('class="scenario-case-meta"'),"case metadata");
ok(source.includes('aria-live="polite" aria-atomic="true"'),"progress announced");
ok(source.includes('@media (max-width:600px)'),"narrow breakpoint");
ok(source.includes('.scenario-actions button{width:100%;min-height:44px'),"mobile button targets");
ok(source.includes('.scenario-action-detail-grid{grid-template-columns:1fr}'),"narrow nursing detail layout");
parity("initial model and graphs");
const scenarios=[{button:"caseCKDButton",definition:app.api.firstClinicalScenario},{button:"caseMRAButton",definition:app.api.secondClinicalScenario}];
for(const drug of ["none","acei","arb","aldo","beta","loop","thiazide"]){
 app.api.resetAll();old.api.resetAll();
 app.el("drugSelect").value=drug;old.el("drugSelect").value=drug;
 app.api.applyDrug();old.api.applyDrug();parity("apply drug "+drug);
 for(let step=0;step<9;step++){app.api.nextStep();old.api.nextStep();parity("normal RAAS advance "+drug+" "+step)}
 const normal=JSON.stringify(app.api.state),phys=JSON.stringify(app.api.physiology),graphDraws=app.calls.physiologyGraph||0;
 app.fire("scenarioModeButton");
 ok(!app.el("scenarioCaseCatalog").hidden&&app.el("scenarioSessionContent").hidden,"catalog before selection "+drug);
 for(const item of scenarios){
  app.fire(item.button);
  const def=app.api.scenarioRuntime.definition,total=def.questions.length;
  const actionTotal=def.questions.filter(q=>q.actionExercise).length;
  const progress=()=>app.el("scenarioLearningProgress").textContent;
  ok(def.id===item.definition.id,"selected case "+drug+" "+def.id);
  ok(app.el("scenarioActiveCaseLabel").textContent.includes(def.title),"active case label "+drug+" "+def.id);
  ok(progress().includes("현재: 임상 판단 선택"),"initial phase "+drug+" "+def.id);
  ok(progress().includes("임상 판단 0/"+total+" 완료"),"initial remaining "+drug+" "+def.id);
  ok(progress().includes("간호 행동 0/"+actionTotal+" 완료"),"initial actions "+drug+" "+def.id);
  for(let q=0;q<total;q++){
   const exercise=def.questions[q].actionExercise,choice=q%3+1;
   ok(progress().includes("임상 판단 "+q+"/"+total+" 완료"),"before question "+drug+" "+def.id+" "+q);
   app.fire("scenarioChoice"+choice);
   ok(progress().includes("현재: 임상 판단 해설"),"clinical feedback "+drug+" "+def.id+" "+q);
   ok(progress().includes("임상 판단 "+(q+1)+"/"+total+" 완료"),"knowledge count "+drug+" "+def.id+" "+q);
   const beforeDuplicate=progress();app.fire("scenarioChoice"+choice);
   ok(progress()===beforeDuplicate,"duplicate knowledge guard "+drug+" "+def.id+" "+q);
   app.fire("scenarioActionStartButton");
   ok(progress().includes("현재: 간호 행동 선택"),"action phase "+drug+" "+def.id+" "+q);
   app.fire("scenarioActionChoice"+(q%3+1));
   ok(progress().includes("현재: 간호 행동 해설"),"action feedback "+drug+" "+def.id+" "+q);
   ok(progress().includes("간호 행동 "+(q+1)+"/"+actionTotal+" 완료"),"action count "+drug+" "+def.id+" "+q);
   ok(app.el("scenarioActionAssessment").textContent===exercise.assessment,"assessment intact "+drug+" "+def.id+" "+q);
   ok(app.el("scenarioActionEscalation").textContent===exercise.escalation,"report intact "+drug+" "+def.id+" "+q);
   ok(app.el("scenarioActionTeaching").textContent===exercise.teaching,"teaching intact "+drug+" "+def.id+" "+q);
   ok(app.el("scenarioActionFeedbackRationale").textContent===exercise.rationale,"rationale intact "+drug+" "+def.id+" "+q);
   ok(app.el("scenarioActionEvidence").textContent.includes("출처:"),"citation intact "+drug+" "+def.id+" "+q);
   const frozen=progress();app.fire("scenarioActionChoice1");ok(progress()===frozen,"duplicate action guard "+drug+" "+def.id+" "+q);
   app.fire("scenarioNextButton");
   ok(progress().includes(q===total-1?"학습 완료":"임상 판단 선택"),"next/complete "+drug+" "+def.id+" "+q);
  }
  ok(app.el("scenarioResultPanel").hidden===false,"result screen "+drug+" "+def.id);
  ok(progress().includes("남은 0문항"),"all answered "+drug+" "+def.id);
  app.fire("scenarioRestartButton");
  ok(progress().includes("임상 판단 0/"+total+" 완료"),"restart knowledge "+drug+" "+def.id);
  ok(progress().includes("간호 행동 0/"+actionTotal+" 완료"),"restart actions "+drug+" "+def.id);
  app.fire("scenarioBackToCasesButton");
  ok(app.api.scenarioRuntime.session===null&&app.el("scenarioSessionContent").hidden,"case cleanup "+drug+" "+def.id);
 }
 ok(JSON.stringify(app.api.state)===normal&&JSON.stringify(app.api.physiology)===phys,"no normal state pollution "+drug);
 ok((app.calls.physiologyGraph||0)===graphDraws,"no hidden graph draws "+drug);
 app.fire("normalModeButton");parity("mode switch parity "+drug);
 for(let step=0;step<9;step++){app.api.previousStep();old.api.previousStep();parity("normal backward "+drug+" "+step)}
}
console.log("PASS v5.4 UI hierarchy, progress, reset, parity: "+count+" deterministic checks (mock DOM/Canvas).");
