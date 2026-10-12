// v5.2 clinical action workflow regression
// Run: node tests/regression-v5.2.cjs. Mock DOM/Canvas; browser verification is separate.
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

const before=boot(fs.readFileSync(path.join(root,"backups","v5.1.html"),"utf8"));
const source=fs.readFileSync(path.join(root,"index.html"),"utf8");
const now=boot(source);
let checks=0;
function check(ok,label){checks++;if(!ok)throw Error("v5.2 FAIL: "+label);}
function parity(){
    return JSON.stringify({
        state:now.api.state,physiology:now.api.physiology,
        graphs:["bp","sodium","volume","gfr"].map(k=>now.api.getGraphSeries(k))
    })===JSON.stringify({
        state:before.api.state,physiology:before.api.physiology,
        graphs:["bp","sodium","volume","gfr"].map(k=>before.api.getGraphSeries(k))
    });
}
const definition=now.api.firstClinicalScenario;
check(source.includes("RAAS Simulator v5.2"),"version");
check(source.includes('id="scenarioActionStep"'),"clinical action area");
check(source.includes('id="scenarioActionFeedbackPanel"'),"action-specific debrief");
check(source.includes('id="scenarioActionReview"'),"post-quiz action review");
check(definition.version===3&&definition.schemaVersion===1,"case version 3, schema remains 1");
check(definition.questions.length===3,"same three clinical questions");
check(now.api.validateScenarioDefinition(definition).valid,"new data validates");
check(definition.modelPolicy==="reference-only","no generated patient predictions");
check(definition.questions.every(q=>q.actionExercise&&q.actionExercise.choices.length===3),"three action exercises");
check(definition.questions.every(q=>q.actionExercise.choices.every(choice=>choice.feedback.length>40)),"nine explanation messages");
check(definition.questions.every(q=>q.actionExercise.sourceIds.every(id=>definition.references.some(ref=>ref.id===id))),"all action evidence bound");
for(const mutation of [
 d=>{d.questions[0].actionExercise.prompt="";},
 d=>{d.questions[0].actionExercise.assessment="";},
 d=>{d.questions[0].actionExercise.escalation="";},
 d=>{d.questions[0].actionExercise.teaching="";},
 d=>{d.questions[0].actionExercise.choices[0].feedback="";},
 d=>{d.questions[0].actionExercise.choices[0].id=d.questions[0].actionExercise.choices[1].id;},
 d=>{d.questions[0].actionExercise.correctChoiceId="unknown";},
 d=>{d.questions[0].actionExercise.sourceIds=["absent"];},
 d=>{d.questions[0].actionExercise.choices=[];}
]){
    const data=JSON.parse(JSON.stringify(definition));mutation(data);
    check(!now.api.validateScenarioDefinition(data).valid,"malformed action contract rejected");
}
const legacy=JSON.parse(JSON.stringify(definition));
legacy.questions.forEach(q=>delete q.actionExercise);
check(now.api.validateScenarioDefinition(legacy).valid,"legacy schema-1 scenario remains valid");
check(now.el("scenarioStudyView").hidden&&!now.el("normalStudyView").hidden,"normal mode initial");
check(parity(),"initial normal mode parity");
const drugs=["none","acei","arb","aldo","beta","loop","thiazide"];
for(const drug of drugs){
    before.api.resetAll();now.api.resetAll();
    before.el("drugSelect").value=drug;now.el("drugSelect").value=drug;
    before.api.applyDrug();now.api.applyDrug();
    for(let i=0;i<9;i++){before.api.nextStep();now.api.nextStep();check(parity(),"progress parity "+drug+" "+i);}
    const state=JSON.stringify(now.api.state),phys=JSON.stringify(now.api.physiology);
    const graphCounter=now.calls.physiologyGraph||0,canvasCounter=now.calls.canvas||0;
    now.fire("scenarioModeButton");
    check(now.api.scenarioRuntime.mode==="scenario","entered "+drug);
    check(now.el("scenarioStudyView").hidden===false&&now.el("normalStudyView").hidden,"visible scenario "+drug);
    check((now.calls.physiologyGraph||0)===graphCounter&&(now.calls.canvas||0)===canvasCounter,"mode switch no RAAS draw "+drug);
    check(JSON.stringify(now.api.state)===state&&JSON.stringify(now.api.physiology)===phys,"mode switch normal state preserved "+drug);
    for(let qi=0;qi<3;qi++){
        const q=definition.questions[qi],action=q.actionExercise;
        const correctKnowledge=q.choices.findIndex(c=>c.id===q.correctChoiceId);
        now.fire("scenarioChoice"+(correctKnowledge+1));
        check(now.el("scenarioFeedbackPanel").hidden===false,"original feedback retained "+drug+" "+qi);
        check(now.el("scenarioActionStartButton").hidden===false,"action start available "+drug+" "+qi);
        check(now.el("scenarioNextButton").hidden,"no bypass before action "+drug+" "+qi);
        const checkpoint=now.api.scenarioRuntime.session.questionIndex;
        now.fire("scenarioNextButton"); // programmatic click must not bypass required exercise
        check(now.api.scenarioRuntime.session.questionIndex===checkpoint,"skip blocked "+drug+" "+qi);
        now.fire("scenarioActionStartButton");
        check(now.el("scenarioActionStep").hidden===false,"action prompt shown "+drug+" "+qi);
        check(now.el("scenarioFeedbackPanel").hidden,"prior answer hidden during action question "+drug+" "+qi);
        check(now.el("scenarioActionPrompt").textContent===action.prompt,"correct action question "+drug+" "+qi);
        check(now.el("scenarioNextButton").hidden,"next hidden during action "+drug+" "+qi);
        const answerBefore=JSON.stringify(now.api.scenarioRuntime.session.answers);
        const selectedIndex=drug==="none"?((qi+1)%3):action.choices.findIndex(c=>c.id===action.correctChoiceId);
        const selected=action.choices[selectedIndex];
        now.fire("scenarioActionChoice"+(selectedIndex+1));
        check(now.el("scenarioActionFeedbackPanel").hidden===false,"action feedback visible "+drug+" "+qi);
        check(now.el("scenarioActionStep").hidden,"action options hidden after submit "+drug+" "+qi);
        check(now.el("scenarioActionFeedbackSelected").textContent.endsWith(selected.text),"selected action present "+drug+" "+qi);
        check(now.el("scenarioActionFeedbackReason").textContent.includes(selected.feedback),"option rationale "+drug+" "+qi);
        check(now.el("scenarioActionAssessment").textContent.includes(action.assessment),"assessment debrief "+drug+" "+qi);
        check(now.el("scenarioActionEscalation").textContent.includes(action.escalation),"escalation debrief "+drug+" "+qi);
        check(now.el("scenarioActionTeaching").textContent.includes(action.teaching),"teaching debrief "+drug+" "+qi);
        check(now.el("scenarioActionEvidence").textContent.includes("KDIGO"),"evidence debrief "+drug+" "+qi);
        check(now.el("scenarioActionFeedbackPanel").attrs["data-correct"]===String(selected.id===action.correctChoiceId),"action feedback correctness "+drug+" "+qi);
        check(JSON.stringify(now.api.scenarioRuntime.session.answers)===answerBefore,"action does not rewrite original answer "+drug+" "+qi);
        const snapshot=now.el("scenarioActionFeedbackSelected").textContent;
        now.fire("scenarioActionChoice"+(selectedIndex+1));
        check(now.el("scenarioActionFeedbackSelected").textContent===snapshot,"duplicate action ignored "+drug+" "+qi);
        now.fire("scenarioNextButton");
        if(qi<2)check(now.el("scenarioProgress").textContent.includes((qi+2)+" / 3"),"next clinical question "+drug+" "+qi);
    }
    check(now.api.scenarioRuntime.session.status==="completed","clinical complete "+drug);
    check(!now.el("scenarioResultPanel").hidden,"result visible "+drug);
    check(now.el("scenarioResultText").textContent.includes("임상 판단 3문항 중 3문항 정답"),"clinical score "+drug);
    check((now.el("scenarioActionReview").textContent.match(/내 행동:/g)||[]).length===3,"three action reviews "+drug);
    check((now.el("scenarioResultReview").textContent.match(/내 선택:/g)||[]).length===3,"three clinical reviews "+drug);
    check(parity()===true,"full attempt preserves previous RAAS calculation "+drug);
    now.fire("scenarioRestartButton");
    check(now.api.scenarioRuntime.session.questionIndex===0,"restart clinical index "+drug);
    check(Object.keys(now.api.scenarioRuntime.session.answers).length===0,"restart original answers "+drug);
    check(now.el("scenarioActionReview").hidden!==false||now.el("scenarioResultPanel").hidden,"restart hides old action review "+drug);
    now.fire("scenarioChoice2");
    now.fire("scenarioActionStartButton");
    now.fire("scenarioActionChoice1");
    now.fire("scenarioExitButton");
    check(now.api.scenarioRuntime.mode==="normal","exit scenario "+drug);
    now.fire("scenarioModeButton");
    check(now.api.scenarioRuntime.session.questionIndex===0&&Object.keys(now.api.scenarioRuntime.session.answers).length===0,"reenter fresh original session "+drug);
    check(now.el("scenarioActionStep").hidden,"reenter action step hidden "+drug);
    check(now.el("scenarioActionFeedbackPanel").hidden,"reenter action feedback hidden "+drug);
    now.fire("normalModeButton");
    for(let i=0;i<9;i++){before.api.previousStep();now.api.previousStep();check(parity(),"backward parity "+drug+" "+i);}
    before.api.resetAll();now.api.resetAll();check(parity(),"reset parity "+drug);
}
// All nine secondary action options, regardless of clinical answer, must have distinct feedback.
for(let qi=0;qi<3;qi++){
    const question=definition.questions[qi],act=question.actionExercise;
    for(let ai=0;ai<3;ai++){
        now.fire("scenarioModeButton");
        for(let prior=0;prior<qi;prior++){
            const p=definition.questions[prior];
            const chosen=p.choices.findIndex(c=>c.id===p.correctChoiceId);
            const actionChosen=p.actionExercise.choices.findIndex(c=>c.id===p.actionExercise.correctChoiceId);
            now.fire("scenarioChoice"+(chosen+1));
            now.fire("scenarioActionStartButton");
            now.fire("scenarioActionChoice"+(actionChosen+1));
            now.fire("scenarioNextButton");
        }
        now.fire("scenarioChoice1"); // original answer can be wrong
        now.fire("scenarioActionStartButton");
        const option=act.choices[ai];
        now.fire("scenarioActionChoice"+(ai+1));
        check(now.el("scenarioActionFeedbackReason").textContent==="선택한 이유: "+option.feedback,"unique action feedback "+question.id+"/"+option.id);
        check(now.el("scenarioActionFeedbackSelected").textContent==="내 선택: "+option.text,"unique action selected "+question.id+"/"+option.id);
        check(now.el("scenarioActionFeedbackTitle").textContent.includes(option.id===act.correctChoiceId?"적절":"보완"),"correctness action "+question.id+"/"+option.id);
        now.fire("scenarioExitButton");
        check(parity(),"normal RAAS isolated after action "+question.id+"/"+option.id);
    }
}
// Pausing a running demo on scenario transition is preserved from v5.0.
now.api.toggleFlowDemo();
check(now.timers.size===1,"demo running before transition");
const index=now.api.flowDemo.index;
now.fire("scenarioModeButton");
check(now.timers.size===0&&now.api.flowDemo.paused&&now.api.flowDemo.index===index,"demo paused and position preserved");
now.fire("normalModeButton");
now.api.toggleFlowDemo();
check(now.timers.size===1,"demo manually resumes");
now.api.stopFlowDemo();
check(now.timers.size===0,"demo stops");
console.log("PASS v5.2 nursing action workflow: "+checks+" deterministic checks (mock DOM/Canvas).");
