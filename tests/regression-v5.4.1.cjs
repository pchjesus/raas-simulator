// v4.10 — clinical learning & two dialog regression (synthetic mock DOM/Canvas)
// Run: node tests/regression-v4.10.cjs; does not prove real browser layout/focus.
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
function boot(html){
    const elements={},calls={};
    function el(id){
        if(elements[id])return elements[id];
        return elements[id]={
            value:id==="graphVariable"?"bp":"none",textContent:"",innerHTML:"",
            hidden:true,open:false,events:{},attrs:{},focusCount:0,
            width:id==="physiologyGraph"?1000:900,height:id==="physiologyGraph"?290:380,
            clientWidth:900,clientHeight:380,offsetWidth:904,offsetHeight:384,
            clientLeft:2,clientTop:2,
            addEventListener(type,fn){(this.events[type]??=[]).push(fn);},
            setAttribute(k,v){this.attrs[k]=v;},focus(){this.focusCount++;},
            showModal(){this.open=true;},
            close(){this.open=false;(this.events.close??[]).forEach(fn=>fn());},
            getBoundingClientRect(){
                if(id==="helpDialog"||id==="changelogDialog"){
                    return {left:100,top:100,right:600,bottom:600,width:500,height:500};
                }
                return {left:0,top:0,right:904,bottom:384,width:904,height:384};
            },
            getContext(){
                return new Proxy({},{
                    get(t,k){return t[k]??((...args)=>{
                        calls[id]=(calls[id]??0)+1;
                    });},
                    set(t,k,v){t[k]=v;return true;}
                });
            }
        };
    }
    const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    if(!js)throw Error("Missing inline JS");
    const api=new Function("document","setInterval","clearInterval",js+
        "\nreturn {state,physiology,stageData,drugData,flowDemo,"+
        "clinicalStageNotes:typeof clinicalStageNotes==='undefined'?null:clinicalStageNotes,"+
        "clinicalDrugNotes:typeof clinicalDrugNotes==='undefined'?null:clinicalDrugNotes,"+
        "getStageColor,calculatePhysiologyAtStep,getGraphSeries,showStageLearning,"+
        "nextStep,previousStep,applyDrug,removeDrug,resetProgress,resetAll,"+
        "scenarioRuntime,validateScenarioDefinition};")(
        {getElementById:el},()=>null,()=>{});
    return {api,el,calls,fire(id,type,event={}){
        (el(id).events[type]??[]).forEach(fn=>fn(event));
    }};
}

const source=fs.readFileSync(path.join(root,"index.html"),"utf8");
const frozen=fs.readFileSync(path.join(root,"backups","v5.4.html"),"utf8");
const app=boot(source),previous=boot(frozen);
let count=0;
function check(ok,label){count++;if(!ok)throw Error("FAIL v5.4.1 "+label);}
function snapshot(a){
 return JSON.stringify({state:a.api.state,physiology:a.api.physiology,
  stage:a.api.stageData,drug:a.api.drugData,
  colors:a.api.stageData.map((_,i)=>a.api.getStageColor(i)),
  graphs:["bp","sodium","volume","gfr"].map(x=>a.api.getGraphSeries(x))});
}
const js=html=>html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
check(source.includes("RAAS Simulator v5.4.1"),"patch version");
check(js(source)===js(frozen),"all simulator JavaScript unchanged from v5.4");
const sections=[
 ["stageMechanismDetails",true,["stageDetailLearning","stageDetailClinical","stageDetailEffect"],"기전"],
 ["stageNursingDetails",false,["stageDetailNursing"],"간호 사정"],
 ["stageDrugsEvidenceDetails",false,["stageDetailDrugClinical","stageDetailDrugs","stageDetailEvidence"],"약물·근거"]
];
for(const [id,startsOpen,childIds,label] of sections){
 const match=source.match(new RegExp('<details id="'+id+'"([^>]*)>([\\s\\S]*?)<\\/details>'));
 check(!!match,"details group exists "+id);
 check(match[1].includes('class="stage-detail-accordion"'),"native accordion class "+id);
 check(match[1].includes(" open")===startsOpen,"initial open state "+id);
 check(match[2].includes("<summary>"+label+"</summary>"),"native summary "+id);
 for(const name of childIds)check(match[2].includes('id="'+name+'"'),"anchor inside correct group "+id+"/"+name);
}
check((source.match(/<details id="stage(?:Mechanism|Nursing|DrugsEvidence)Details"/g)||[]).length===3,"three named accordion groups");
check((source.match(/<\/details>/g)||[]).length===3,"three closing details tags");
check(source.includes(".stage-detail-accordion > summary:focus-visible"),"visible focus");
check(source.includes("min-height:44px;"),"touch-friendly summary");
check(source.includes('id="stageDetailPanel"')&&source.includes('id="stageDetailCloseButton"'),"original panel close");
check(source.includes('id="stageDetailSummary"'),"always visible summary");
for(const id of ["stageDetailLearning","stageDetailClinical","stageDetailEffect","stageDetailNursing","stageDetailDrugClinical","stageDetailDrugs","stageDetailEvidence"])
 check((source.match(new RegExp('id="'+id+'"','g'))||[]).length===1,"one original anchor "+id);
check(snapshot(app)===snapshot(previous),"initial RAAS and physiology identical");
const textIds=["stageDetailTitle","stageDetailSummary","stageDetailLearning","stageDetailClinical","stageDetailEffect","stageDetailNursing","stageDetailDrugClinical","stageDetailDrugs","stageDetailEvidence","stageLearningHint"];
for(const drug of ["none","acei","arb","aldo","beta","loop","thiazide"]){
 app.api.resetAll();previous.api.resetAll();
 app.el("drugSelect").value=drug;previous.el("drugSelect").value=drug;
 app.api.applyDrug();previous.api.applyDrug();
 check(snapshot(app)===snapshot(previous),"drug model parity "+drug);
 for(let stage=0;stage<9;stage++){
  app.api.nextStep();previous.api.nextStep();
  check(snapshot(app)===snapshot(previous),"step model parity "+drug+"/"+stage);
  const frozenState=snapshot(app),graphCalls=app.calls.physiologyGraph||0;
  app.api.showStageLearning(stage);previous.api.showStageLearning(stage);
  check(!app.el("stageDetailPanel").hidden,"stage visible "+drug+"/"+stage);
  check(snapshot(app)===frozenState,"read-only learning "+drug+"/"+stage);
  check(snapshot(app)===snapshot(previous),"learning parity "+drug+"/"+stage);
  check((app.calls.physiologyGraph||0)===graphCalls,"no graph recalc "+drug+"/"+stage);
  for(const id of textIds)check(app.el(id).textContent===previous.el(id).textContent,"preserved content "+drug+"/"+stage+"/"+id);
  check(app.el("stageDetailClinical").textContent===app.api.clinicalStageNotes[stage].medical,"medical data "+drug+"/"+stage);
  check(app.el("stageDetailNursing").textContent===app.api.clinicalStageNotes[stage].nursing,"nursing data "+drug+"/"+stage);
  check(app.el("stageDetailEvidence").textContent.includes(app.api.clinicalStageNotes[stage].sourceIds),"citation "+drug+"/"+stage);
 }
 const lastTitle=app.el("stageDetailTitle").textContent;
 for(const invalid of [-2,9,1.5,NaN,"2"]){
  app.api.showStageLearning(invalid);
  check(app.el("stageDetailTitle").textContent===lastTitle,"invalid stage prevented "+drug+"/"+String(invalid));
 }
 const modelBeforeClose=snapshot(app);
 app.fire("stageDetailCloseButton","click");previous.fire("stageDetailCloseButton","click");
 check(app.el("stageDetailPanel").hidden,"close button "+drug);
 check(app.el("canvas").focusCount===previous.el("canvas").focusCount,"close returns focus "+drug);
 check(snapshot(app)===modelBeforeClose,"close keeps model "+drug);
 for(const key of ["Home","ArrowRight","ArrowLeft","End","Enter"," ","Escape"]){
  let prevented=0;
  app.fire("canvas","keydown",{key,preventDefault(){prevented++}});
  previous.fire("canvas","keydown",{key,preventDefault(){}});
  check(snapshot(app)===snapshot(previous),"keyboard model parity "+drug+"/"+key);
  check(app.el("stageDetailTitle").textContent===previous.el("stageDetailTitle").textContent,"keyboard focus title "+drug+"/"+key);
  check(app.el("stageDetailPanel").hidden===previous.el("stageDetailPanel").hidden,"keyboard panel state "+drug+"/"+key);
  check(prevented>0,"keyboard event controlled "+drug+"/"+key);
 }
 for(let stage=0;stage<9;stage++){
  app.api.previousStep();previous.api.previousStep();
  check(snapshot(app)===snapshot(previous),"previous step preserved "+drug+"/"+stage);
 }
}
console.log("PASS v5.4.1 accordion and model parity: "+count+" deterministic checks (mock DOM/Canvas; native disclosure requires real browser validation).");
