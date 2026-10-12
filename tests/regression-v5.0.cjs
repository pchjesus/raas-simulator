// v5.0 clinical scenario mode regression
// Run: node tests/regression-v5.0.cjs. Mock DOM/Canvas; browser verification is separate.
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
        "state","physiology","stageData","drugData","flowDemo","firstClinicalScenario",
        "scenarioRuntime","validateScenarioDefinition","enterScenarioMode","exitScenarioMode",
        "resetScenarioSession","submitScenarioAnswer","switchStudyMode","renderScenarioStudy",
        "chooseScenarioAnswer","toggleFlowDemo","stopFlowDemo","calculatePhysiologyAtStep",
        "getGraphSeries","nextStep","previousStep","applyDrug","removeDrug","resetAll"
    ].map(name=>name+':typeof '+name+'==="undefined"?null:'+name).join(",");
    const api=new Function("document","setInterval","clearInterval",script+"\nreturn {"+extras+"};")(
        {getElementById:el},(fn,delay)=>{const id=++lastTimer;timers.set(id,{fn,delay});return id;},
        id=>timers.delete(id));
    return {api,el,calls,timers,fire(id,event){
        (el(id).events.click??[]).forEach(fn=>fn(event??{target:el(id)}));
    }};
}
const before=boot(fs.readFileSync(path.join(root,"backups","v4.10.html"),"utf8"));
const source=fs.readFileSync(path.join(root,"index.html"),"utf8");
const now=boot(source);
let checks=0;
function check(ok,label){checks++;if(!ok)throw Error("v5.0 FAIL: "+label);}
function parity(){
    return JSON.stringify({
        state:now.api.state,
        physiology:now.api.physiology,
        graphs:["bp","sodium","volume","gfr"].map(key=>now.api.getGraphSeries(key))
    })===JSON.stringify({
        state:before.api.state,
        physiology:before.api.physiology,
        graphs:["bp","sodium","volume","gfr"].map(key=>before.api.getGraphSeries(key))
    });
}
const definition=now.api.firstClinicalScenario;
check(source.includes("RAAS Simulator v5.0"),"new version");
check(source.includes('id="normalStudyView"'),"normal mode exists");
check(source.includes('id="scenarioStudyView"'),"scenario mode exists");
check(source.includes('id="scenarioEvidenceLink"')===false,"no dead reference element");
check(source.includes("KDIGO 2024 CKD Guideline"),"citation link in screen");
check(now.api.validateScenarioDefinition(definition).valid,"schema validates");
check(definition.modelPolicy==="reference-only","no patient calculation");
check(definition.questions.length===3,"three questions");
check(definition.references.length>0,"references exist");
check(definition.questions.every(q=>q.sourceIds.every(id=>definition.references.some(ref=>ref.id===id))),"every question sourced");
check(now.el("scenarioStudyView").hidden&& !now.el("normalStudyView").hidden,"initial general study visible");
check(now.api.scenarioRuntime.mode==="normal","scenario inactive initially");
check(parity(),"initial physiology parity");

const scenarios=["none","acei","arb","aldo","beta","loop","thiazide"];
for(const drug of scenarios){
    before.api.resetAll();now.api.resetAll();
    before.el("drugSelect").value=drug;now.el("drugSelect").value=drug;
    before.api.applyDrug();now.api.applyDrug();
    check(parity(),"drug applied parity "+drug);
    for(let step=0;step<9;step++){before.api.nextStep();now.api.nextStep();check(parity(),"progress parity "+drug+" "+step);}
    const currentState=JSON.stringify(now.api.state);
    const currentPhys=JSON.stringify(now.api.physiology);
    const drawCount={...now.calls};
    const originalPhyObject=now.api.physiology;
    now.fire("scenarioModeButton");
    check(now.api.scenarioRuntime.mode==="scenario","scenario entered "+drug);
    check(now.el("normalStudyView").hidden&&!now.el("scenarioStudyView").hidden,"views separated "+drug);
    check(now.el("scenarioModeButton").attrs["aria-pressed"]==="true","scenario nav active "+drug);
    check(now.el("scenarioProgress").textContent.includes("1 / 3"),"first question "+drug);
    check(now.el("scenarioChoice1").textContent.includes("혈압"),"first option "+drug);
    check(now.el("scenarioContext").textContent.includes("만성콩팥병"),"case context "+drug);
    check(now.el("scenarioObjectives").textContent.includes("학습 목표"),"learning objectives "+drug);
    check(now.el("scenarioObservations").textContent.includes("ACE 억제제"),"observations "+drug);
    check(JSON.stringify(now.api.state)===currentState,"mode switch state isolated "+drug);
    check(JSON.stringify(now.api.physiology)===currentPhys&&now.api.physiology===originalPhyObject,"model not modified "+drug);
    check(JSON.stringify(now.calls)===JSON.stringify(drawCount),"no extra graph or canvas rendering on mode switch "+drug);

    const chosen=["scenarioChoice1","scenarioChoice2","scenarioChoice3"];
    const expectedKeys=["a","b","c"];
    for(let question=0;question<3;question++){
        now.fire(chosen[question]);
        check(now.api.scenarioRuntime.session.answers[definition.questions[question].id]===expectedKeys[question],"answer recorded "+drug+" "+question);
        check(now.el("scenarioFeedbackPanel").hidden===false,"feedback visible "+drug+" "+question);
        check(now.el("scenarioNextButton").hidden===false,"continue visible "+drug+" "+question);
        check(now.el("scenarioFeedbackText").textContent.length>50,"sourced rationale "+drug+" "+question);
        check(now.el("scenarioFeedbackCorrectAnswer").textContent.includes("정답:"),"explicit correct choice "+drug+" "+question);
        check(now.el("scenarioFeedbackSource").textContent.includes("KDIGO"),"ref label "+drug+" "+question);
        check(chosen.every(id=>now.el(id).hidden),"options hidden after answer "+drug+" "+question);
        const answerSnapshot=JSON.stringify(now.api.scenarioRuntime.session.answers);
        now.fire(chosen[question]); // click ignored once feedback shown
        check(JSON.stringify(now.api.scenarioRuntime.session.answers)===answerSnapshot,"duplicate response blocked "+drug+" "+question);
        now.fire("scenarioNextButton");
        if(question<2){
            check(now.el("scenarioProgress").textContent.includes((question+2)+" / 3"),"advanced "+drug+" "+question);
            check(now.el("scenarioFeedbackPanel").hidden,"feedback hidden on next "+drug+" "+question);
        }
    }
    check(now.api.scenarioRuntime.session.status==="completed","completed state "+drug);
    check(now.el("scenarioResultPanel").hidden===false,"result shown "+drug);
    check(now.el("scenarioResultText").textContent.includes("3문항 중 3문항"),"score 3 "+drug);
    check(JSON.stringify(now.api.state)===currentState,"quiz leaves general state unchanged "+drug);
    check(JSON.stringify(now.api.physiology)===currentPhys,"quiz leaves physiology unchanged "+drug);
    now.fire("scenarioRestartButton");
    check(now.api.scenarioRuntime.session.status==="active","restart state "+drug);
    check(now.api.scenarioRuntime.session.questionIndex===0,"restart question index "+drug);
    check(Object.keys(now.api.scenarioRuntime.session.answers).length===0,"restart answers cleared "+drug);
    check(now.el("scenarioResultPanel").hidden,"restart hides result "+drug);
    now.fire("scenarioChoice2"); // first question deliberately wrong
    check(now.el("scenarioFeedbackTitle").textContent.includes("다시"),"incorrect choice feedback "+drug);
    now.fire("scenarioExitButton");
    check(now.api.scenarioRuntime.mode==="normal"&&now.api.scenarioRuntime.session===null,"exit clears session "+drug);
    check(now.el("scenarioStudyView").hidden&&!now.el("normalStudyView").hidden,"returns normal view "+drug);
    check(now.el("normalModeButton").attrs["aria-pressed"]==="true","normal mode active "+drug);
    check(JSON.stringify(now.api.state)===currentState&&JSON.stringify(now.api.physiology)===currentPhys,"exit preserves general data "+drug);
    now.fire("scenarioModeButton");
    check(now.api.scenarioRuntime.session.questionIndex===0,"reenter fresh "+drug);
    check(Object.keys(now.api.scenarioRuntime.session.answers).length===0,"old attempt gone "+drug);
    now.fire("normalModeButton");
    check(now.api.scenarioRuntime.mode==="normal","tab exit works "+drug);
    for(let step=0;step<9;step++){before.api.previousStep();now.api.previousStep();check(parity(),"backward parity "+drug+" "+step);}
    before.api.resetAll();now.api.resetAll();
    check(parity(),"reset all parity "+drug);
}

now.api.toggleFlowDemo();
check(now.timers.size===1&&now.api.flowDemo.timer!==null,"demo running before switch");
const id=now.api.flowDemo.timer,position=now.api.flowDemo.index;
now.fire("scenarioModeButton");
check(now.timers.size===0&&now.api.flowDemo.timer===null,"hidden demo timer paused");
check(now.api.flowDemo.paused&&now.api.flowDemo.index===position,"demo index preserved");
check(!now.timers.has(id),"original timer cleared");
now.fire("normalModeButton");
check(now.api.flowDemo.paused,"demo stays paused upon return");
now.api.toggleFlowDemo();
check(now.timers.size===1,"demo resumes manually");
now.api.stopFlowDemo();
check(now.timers.size===0&&now.api.flowDemo.index===-1,"demo stops");

console.log("PASS v5.0 clinical mode: "+checks+" deterministic checks (mock DOM/Canvas).");
