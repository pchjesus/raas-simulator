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
        "getGraphSeries","showStageLearning","nextStep","previousStep","applyDrug","removeDrug","resetAll"
    ].map(name=>name+':typeof '+name+'==="undefined"?null:'+name).join(",");
    const api=new Function("document","setInterval","clearInterval",script+"\nreturn {"+extras+"};")(
        {getElementById:el},(fn,delay)=>{const id=++lastTimer;timers.set(id,{fn,delay});return id;},
        id=>timers.delete(id));
    return {api,el,calls,timers,fire(id,event){
        (el(id).events.click??[]).forEach(fn=>fn(event??{target:el(id)}));
    }};
}





// Historical self-test: pin the v5.5.1 release instead of asserting future index version labels.
const src=fs.readFileSync(path.join(root,"backups","v5.5.1.html"),"utf8"), base=fs.readFileSync(path.join(root,"backups","v5.5.html"),"utf8");
const now=boot(src),old=boot(base);let n=0;
function ok(x,s){n++;if(!x)throw Error("v5.5.1 FAIL "+s)}
function snap(a){return JSON.stringify({state:a.api.state,phys:a.api.physiology,drugs:a.api.drugData,
 effects:a.api.stageData.map(s=>s.effect),scenarios:[a.api.firstClinicalScenario,a.api.secondClinicalScenario].map(s=>({questions:s.questions,references:s.references})),
 graphs:["bp","sodium","volume","gfr"].map(k=>a.api.getGraphSeries(k))})}
ok(src.includes("RAAS Simulator v5.5.1"),"version");
for(const id of ["modelPolicyButton","modelPolicyDialog","modelPolicyCloseButton","graphPolicyButton"])ok(src.includes('id="'+id+'"'),"policy control "+id);
for(const text of ["혈청 Na⁺ 농도 변화를 뜻하지 않습니다.","K⁺는 현재 시뮬레이터에서 계산하지 않습니다.","실제 검사·투약·치료 결정","가로축은 시간 경과가 아닌 RAAS 단계","환자의 혈압이 반드시 정상화됨을 의미하지 않습니다."])ok(src.includes(text),"policy retains necessary safeguard "+text);
ok(src.includes("ⓘ 시뮬레이션 수치 변화"),"number explanation optional");
ok(!src.includes("현재 모델에서는 이 단계 자체에 수치 효과를 더하지 않습니다."),"reported system phrase deleted");
ok(now.api.stageData.length===9,"nine physiological steps");
for(let i=0;i<9;i++){
 const st=now.api.stageData[i];
 ok(st.learningDetail.length>=42,"stage educational substance "+i);
 ok(!/현재 모델|현재 교육용 모델|이 시뮬레이터|수치 변화가 설정/.test(st.learningDetail),"stage free of engine notes "+i);
}
ok(now.api.stageData[0].learningDetail.includes("치밀반점"),"specific renal signal retained");
ok(!now.api.stageData[8].description.includes("정상화됩니다"),"false normalization promise corrected");
ok(snap(now)===snap(old),"baseline effects, clinical answer keys, citations unchanged");
const markup=src.split("<script>")[0].replace(/<style>[\s\S]*?<\/style>/g,"").replace(/<!--[\s\S]*?-->/g,"");
const ids=[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);ok(new Set(ids).size===ids.length,"unique element identifiers");
const stack=[];let sane=true;for(const t of markup.matchAll(/<\/?(section|article|div|details|dialog|nav|ol|li|form)\b[^>]*>/g)){
 if(t[0].startsWith("</")){if(stack.pop()!==t[1])sane=false;}else stack.push(t[1]);
}ok(sane&&stack.length===0,"valid nested block tags");
for(const drug of ["none","acei","arb","aldo","beta","loop","thiazide"]){
 now.api.resetAll();old.api.resetAll();now.el("drugSelect").value=drug;old.el("drugSelect").value=drug;
 now.api.applyDrug();old.api.applyDrug();ok(snap(now)===snap(old),"drug parity "+drug);
 for(let i=0;i<9;i++){
  now.api.nextStep();old.api.nextStep();ok(snap(now)===snap(old),"step effect parity "+drug+"/"+i);
  const before=snap(now),drawCalls=now.calls.physiologyGraph||0;
  now.api.showStageLearning(i);
  ok(now.el("stageDetailLearning").textContent===now.api.stageData[i].learningDetail,"canonical stage text "+drug+"/"+i);
  ok(snap(now)===before,"stage notes read-only "+drug+"/"+i);
  ok((now.calls.physiologyGraph||0)===drawCalls,"stage info no graph mutation "+drug+"/"+i);
 }
 for(const trigger of ["modelPolicyButton","graphPolicyButton"]){
  const before=snap(now);now.fire(trigger);
  ok(now.el("modelPolicyDialog").open,"model details shown "+drug+"/"+trigger);
  now.fire("modelPolicyCloseButton");
  ok(!now.el("modelPolicyDialog").open,"model details closed "+drug+"/"+trigger);
  ok(now.el(trigger).focusCount>0,"focus restored "+drug+"/"+trigger);
  ok(snap(now)===before,"modal doesn't touch calculations "+drug+"/"+trigger);
 }
 now.fire("learningModeButton");
 for(let i=0;i<9;i++){
  now.el("learningStageSelect").value=String(i);
  (now.el("learningStageSelect").events.change||[]).forEach(fn=>fn());
  ok(now.el("learningStageMechanism").textContent===now.api.stageData[i].learningDetail,"learning content parity "+drug+"/"+i);
 }
 ok(snap(now)===snap(old),"library doesn't affect physiology "+drug);
 now.fire("scenarioModeButton");now.fire("normalModeButton");
 for(let i=0;i<9;i++){now.api.previousStep();old.api.previousStep();ok(snap(now)===snap(old),"backwards parity "+drug+"/"+i)}
}
for(const entry of [{button:"caseCKDButton",def:old.api.firstClinicalScenario},{button:"caseMRAButton",def:old.api.secondClinicalScenario}]){
 now.fire("scenarioModeButton");now.fire(entry.button);
 const d=now.api.scenarioRuntime.definition;
 ok(JSON.stringify(d.questions)===JSON.stringify(entry.def.questions),"all questions and answer feedback unchanged "+d.id);
 ok(JSON.stringify(d.references)===JSON.stringify(entry.def.references),"citations unchanged "+d.id);
 for(let i=0;i<d.questions.length;i++){
  const q=d.questions[i],ix=i===0?1:q.choices.findIndex(x=>x.id===q.correctChoiceId);
  now.fire("scenarioChoice"+(ix+1));
  ok(now.el("scenarioFeedbackSelected").textContent===q.choices[ix].text,"selected answer "+d.id+"/"+i);
  ok(now.el("scenarioFeedbackSource").textContent.includes("근거:"),"judgement evidence "+d.id+"/"+i);
  now.fire("learningModeButton");now.fire("scenarioModeButton");
  ok(now.api.scenarioRuntime.session.answers[q.id]===q.choices[ix].id,"tab preserves answers "+d.id+"/"+i);
  now.fire("scenarioActionStartButton");
  const a=q.actionExercise,choice=i===0?1:a.choices.findIndex(x=>x.id===a.correctChoiceId);
  now.fire("scenarioActionChoice"+(choice+1));
  ok(now.el("scenarioActionFeedbackSelected").textContent===a.choices[choice].text,"nursing feedback "+d.id+"/"+i);
  ok(now.el("scenarioActionEvidence").textContent.includes("출처:"),"nursing evidence "+d.id+"/"+i);
  now.fire("scenarioNextButton");
 }
 ok(!now.el("scenarioResultPanel").hidden,"case completed "+d.id);
 now.fire("scenarioTakeawaysButton");ok(now.el("scenarioTakeawaysDialog").open,"takeaways "+d.id);
 now.fire("scenarioTakeawaysCloseButton");now.fire("scenarioBackToCasesButton");
 ok(now.api.scenarioRuntime.session===null,"explicit case reset "+d.id);
}
console.log("PASS v5.5.1 "+n+" content/modals/simulation/scenario regression checks in V8 mock DOM/Canvas");
