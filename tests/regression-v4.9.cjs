// v4.9 scenario foundation regression; node tests/regression-v4.9.cjs
// Synthetic fixture; mock DOM/Canvas verification is not browser or clinical validation.
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
function boot(html){
    const elements={},draws={},timers=new Map();
    let timerCount=0;
    function el(id){
        return elements[id]??={
            id,value:id==="graphVariable"?"bp":"none",hidden:true,open:false,
            innerHTML:"",textContent:"",events:{},attrs:{},
            width:id==="physiologyGraph"?1000:900,height:id==="physiologyGraph"?290:380,
            clientWidth:900,clientHeight:380,offsetWidth:904,offsetHeight:384,
            clientLeft:2,clientTop:2,
            addEventListener(type,fn){(this.events[type]??=[]).push(fn);},
            setAttribute(name,value){this.attrs[name]=value;},
            focus(){},showModal(){this.open=true;},
            close(){this.open=false;(this.events.close??[]).forEach(fn=>fn());},
            getBoundingClientRect(){return {left:0,top:0,right:904,bottom:384,width:904,height:384};},
            getContext(){return new Proxy({},{
                get(target,key){return target[key]??((...args)=>{
                    draws[id]=(draws[id]??0)+1;
                });},
                set(target,key,value){target[key]=value;return true;}
            });}
        };
    }
    const match=html.match(/<script>([\s\S]*?)<\/script>/);
    if(!match)throw Error("Missing inline simulator script");
    const exports="\nreturn {state,physiology,stageData,drugData,getStageColor,"+
        "calculatePhysiologyAtStep,getGraphSeries,nextStep,previousStep,"+
        "applyDrug,removeDrug,resetProgress,resetAll,showStageLearning,flowDemo,"+
        "scenarioRuntime:typeof scenarioRuntime==='undefined'?null:scenarioRuntime,"+
        "SCENARIO_SCHEMA_VERSION:typeof SCENARIO_SCHEMA_VERSION==='undefined'?null:SCENARIO_SCHEMA_VERSION,"+
        "validateScenarioDefinition:typeof validateScenarioDefinition==='undefined'?null:validateScenarioDefinition,"+
        "createScenarioSession:typeof createScenarioSession==='undefined'?null:createScenarioSession,"+
        "enterScenarioMode:typeof enterScenarioMode==='undefined'?null:enterScenarioMode,"+
        "submitScenarioAnswer:typeof submitScenarioAnswer==='undefined'?null:submitScenarioAnswer,"+
        "resetScenarioSession:typeof resetScenarioSession==='undefined'?null:resetScenarioSession,"+
        "exitScenarioMode:typeof exitScenarioMode==='undefined'?null:exitScenarioMode};";
    const api=new Function("document","setInterval","clearInterval",match[1]+exports)(
        {getElementById:el},(fn,ms)=>{
            const id=++timerCount;timers.set(id,{fn,ms});return id;
        },id=>timers.delete(id));
    return {api,el,draws,timers,fire(id,type,arg={}){
        (el(id).events[type]??[]).forEach(fn=>fn(arg));
    }};
}
const before=boot(fs.readFileSync(path.join(root,"backups","v4.8.html"),"utf8"));
const now=boot(fs.readFileSync(path.join(root,"index.html"),"utf8"));
let checks=0;
function check(condition,message){
    checks++;
    if(!condition)throw new Error("FAIL v4.9: "+message);
}
function snapshot(app){
    return JSON.stringify({
        state:app.api.state,physiology:app.api.physiology,
        colors:app.api.stageData.map((_,index)=>app.api.getStageColor(index)),
        graph:app.api.getGraphSeries("bp")
    });
}
function fixture(){
    return {
        schemaVersion:1,id:"synthetic-training-case",version:1,
        title:"가상 문항 데이터 검증",
        caseContext:"실제 환자 정보가 없는 소프트웨어 테스트 전용 사례",
        objectives:["문제 풀이 상태와 일반 학습 상태 구분"],
        observations:[{label:"관찰",value:"테스트용 문구"}],
        modelPolicy:"reference-only",
        references:[{id:"source-a",citation:"가상 자료 A (검증용; 임상 근거 아님)"}],
        questions:[
            {id:"q-a",prompt:"첫 번째 테스트 질문",choices:[
                {id:"a",text:"선택 A"},{id:"b",text:"선택 B"}],
                correctChoiceId:"a",rationale:"테스트 문항의 정적 해설",sourceIds:["source-a"]},
            {id:"q-b",prompt:"두 번째 테스트 질문",choices:[
                {id:"a",text:"선택 A"},{id:"b",text:"선택 B"}],
                correctChoiceId:"b",rationale:"두 번째 정적 해설",sourceIds:["source-a"]}
        ]
    };
}
function invalid(mutator,message){
    const definition=fixture();
    mutator(definition);
    check(!now.api.validateScenarioDefinition(definition).valid,message);
    const previous=JSON.stringify(now.api.scenarioRuntime);
    check((()=>{
        try{now.api.enterScenarioMode(definition);return false;}
        catch(error){return error instanceof Error;}
    })(),message+" rejected");
    check(JSON.stringify(now.api.scenarioRuntime)===previous,message+" remains unchanged");
}
check(now.api.SCENARIO_SCHEMA_VERSION===1,"schema version");
check(now.api.scenarioRuntime.mode==="normal"&&now.api.scenarioRuntime.session===null,"initial normal");
check(snapshot(now)===snapshot(before),"v4.8 initial parity");
check(now.api.validateScenarioDefinition(fixture()).valid,"fixture accepted");
invalid(d=>{d.schemaVersion=99;},"unsupported schema");
invalid(d=>{d.modelPolicy="predictive";},"no predictive policy");
invalid(d=>{d.references=[];},"no references");
invalid(d=>{d.questions[0].sourceIds=["missing"];},"invalid reference link");
invalid(d=>{d.questions[0].correctChoiceId="wrong";},"invalid correct answer");
invalid(d=>{d.questions[0].choices[1].id="a";},"duplicate choices");
invalid(d=>{d.questions[1].id="q-a";},"duplicate question ID");
invalid(d=>{d.observations[0].value=1;},"observation type");

const preserved=snapshot(now),draws=JSON.stringify(now.draws);
const original=fixture(),session=now.api.enterScenarioMode(original);
check(now.api.scenarioRuntime.mode==="scenario"&&session.questionIndex===0,"enter");
check(now.api.scenarioRuntime.definition!==original,"definition copied");
check(JSON.stringify(now.draws)===draws,"enter no redraw");
check(snapshot(now)===preserved,"enter leaves model unchanged");
original.questions[0].correctChoiceId="b";
check(now.api.scenarioRuntime.definition.questions[0].correctChoiceId==="a","definition isolated");
check((()=>{try{now.api.submitScenarioAnswer("missing");return false;}catch(e){return e instanceof Error;}})(),"invalid answer rejected");
check(now.api.scenarioRuntime.session.questionIndex===0,"invalid answer not advancing");
const response=now.api.submitScenarioAnswer("b");
check(response.correct===false&&!response.completed&&response.questionId==="q-a","wrong-answer feedback");
check(now.api.scenarioRuntime.session.questionIndex===1,"question advanced");
check(now.api.scenarioRuntime.session.answers["q-a"]==="b","answer recorded");
check(response.rationale==="테스트 문항의 정적 해설"&&response.sourceIds[0]==="source-a","sourced feedback");
const completion=now.api.submitScenarioAnswer("b");
check(completion.correct&&completion.completed,"completion feedback");
check(now.api.scenarioRuntime.session.status==="completed","completed state");
check((()=>{try{now.api.submitScenarioAnswer("a");return false;}catch(e){return e instanceof Error;}})(),"answers after completion rejected");
check(snapshot(now)===preserved,"answers no change to RAAS");
check(JSON.stringify(now.draws)===draws,"answers do not redraw");

check(now.api.resetScenarioSession(),"scenario reset");
check(now.api.scenarioRuntime.session.questionIndex===0&&
    Object.keys(now.api.scenarioRuntime.session.answers).length===0,"answers cleared");
now.api.exitScenarioMode();
check(now.api.scenarioRuntime.mode==="normal"&&
    now.api.scenarioRuntime.definition===null&&now.api.scenarioRuntime.session===null,"exit");
check(!now.api.resetScenarioSession(),"reset outside mode inert");
check((()=>{try{now.api.submitScenarioAnswer("a");return false;}catch(e){return e instanceof Error;}})(),"answer outside mode blocked");
check(snapshot(now)===preserved,"exit preserves RAAS");

const drugs=["none","acei","aldo","arb","beta","loop","thiazide"];
const variables=["bp","sodium","volume","gfr"];
for(const drug of drugs){
    before.api.resetAll();now.api.resetAll();
    before.el("drugSelect").value=drug;now.el("drugSelect").value=drug;
    before.api.applyDrug();now.api.applyDrug();
    check(snapshot(now)===snapshot(before),"drug parity "+drug);
    for(let step=-1;step<9;step++){
        check(JSON.stringify(now.api.calculatePhysiologyAtStep(step,drug))===
            JSON.stringify(before.api.calculatePhysiologyAtStep(step,drug)),
            "calculate parity "+drug+" "+step);
    }
    for(let step=0;step<9;step++){
        before.api.nextStep();now.api.nextStep();
        check(snapshot(now)===snapshot(before),"progress parity "+drug+" "+step);
    }
    for(const variable of variables){
        check(JSON.stringify(now.api.getGraphSeries(variable,drug))===
            JSON.stringify(before.api.getGraphSeries(variable,drug)),
            "graph parity "+drug+" "+variable);
    }
    const state=snapshot(now);
    now.api.enterScenarioMode(fixture());
    now.api.submitScenarioAnswer("a");
    now.api.exitScenarioMode();
    check(snapshot(now)===state,"scenario isolation "+drug);
    for(let step=0;step<9;step++){
        before.api.previousStep();now.api.previousStep();
        check(snapshot(now)===snapshot(before),"backward parity "+drug+" "+step);
    }
    before.api.resetProgress();now.api.resetProgress();
    check(snapshot(now)===snapshot(before),"progress reset parity "+drug);
    before.api.removeDrug();now.api.removeDrug();
    check(snapshot(now)===snapshot(before),"remove drug parity "+drug);
}
now.api.resetAll();before.api.resetAll();
check(snapshot(now)===snapshot(before),"full reset parity");
check(now.api.scenarioRuntime.mode==="normal","mode still normal");
console.log("PASS v4.9 scenario isolation: "+checks+
    " deterministic checks across seven drug scenarios (mock DOM/Canvas).");
