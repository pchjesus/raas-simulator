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
const previous=boot(fs.readFileSync(path.join(root,"backups","v4.9.html"),"utf8"));
const currentHTML=fs.readFileSync(path.join(root,"index.html"),"utf8");
const now=boot(currentHTML);
let count=0;
function check(condition,name){count++;if(!condition)throw Error("FAIL v4.10 "+name);}
function snapshot(app){
    return JSON.stringify({
        state:app.api.state,physiology:app.api.physiology,
        stage:app.api.stageData,drug:app.api.drugData,
        colors:app.api.stageData.map((_,i)=>app.api.getStageColor(i)),
        graph:["bp","sodium","volume","gfr"].map(k=>app.api.getGraphSeries(k))
    });
}
check(currentHTML.includes("RAAS Simulator v4.10"),"version");
check(currentHTML.includes('id="changelogDialog"'),"patch dialog present");
check(currentHTML.includes('id="helpDialog"'),"help dialog present");
check(currentHTML.includes('id="helpCloseButton"')&&currentHTML.includes('id="changelogCloseButton"'),"X close buttons");
check(currentHTML.includes('aria-controls="changelogDialog"')&&currentHTML.includes('aria-controls="helpDialog"'),"accessible triggers");
check(currentHTML.includes('reference-1')&&currentHTML.includes('reference-4'),"references");
check(currentHTML.includes("신장 관류압")&&currentHTML.includes("고칼륨혈증"),"clinical language");
check(currentHTML.includes("reference-only"),"scenario safeguard present");
check(snapshot(now)===snapshot(previous),"initial v4.9 parity");
check(now.api.clinicalStageNotes.length===9,"nine stage notes");
check(Object.keys(now.api.clinicalDrugNotes).length===6,"six drug notes");
for(const [i,note] of now.api.clinicalStageNotes.entries()){
    check(note.medical.length>80,"stage medical substantial "+i);
    check(note.nursing.length>55,"stage nursing substantial "+i);
    check(/\[\d+\]/.test(note.sourceIds),"stage source "+i);
}
for(const [id,note] of Object.entries(now.api.clinicalDrugNotes)){
    check(note.medical.length>50,"drug medical substantial "+id);
    check(note.nursing.length>50,"drug nursing substantial "+id);
    check(/\[\d+\]/.test(note.sourceIds),"drug source "+id);
}
for(const [trigger,dialogName,closeName] of [
    ["helpOpenButton","helpDialog","helpCloseButton"],
    ["changelogOpenButton","changelogDialog","changelogCloseButton"]]){
    const d=now.el(dialogName),b=now.el(trigger),s=snapshot(now);
    const graph=now.calls.physiologyGraph??0;
    now.fire(trigger,"click");
    check(d.open,"dialog opened "+dialogName);
    now.fire(dialogName,"click",{target:{},clientX:25,clientY:25});
    check(d.open,"content target does not close "+dialogName);
    now.fire(dialogName,"click",{target:d,clientX:400,clientY:450});
    check(d.open,"inside rect keeps open "+dialogName);
    now.fire(dialogName,"click",{target:d,clientX:50,clientY:50});
    check(!d.open,"backdrop closes "+dialogName);
    check(b.focusCount===1,"backdrop focus restored "+dialogName);
    now.fire(trigger,"click");check(d.open,"reopen "+dialogName);
    now.fire(closeName,"click");check(!d.open,"X closes "+dialogName);
    check(b.focusCount===2,"X focus restored "+dialogName);
    now.fire(trigger,"click");check(d.open,"reopen for escape "+dialogName);
    d.close(); // native Escape fires dialog close event; mock mimics browser close
    check(!d.open&&b.focusCount===3,"escape close and focus "+dialogName);
    check(snapshot(now)===s,"modal state immutable "+dialogName);
    check((now.calls.physiologyGraph??0)===graph,"modal graph not redrawn "+dialogName);
}
const meds=["none","acei","arb","beta","aldo","loop","thiazide"];
for(const med of meds){
    previous.api.resetAll();now.api.resetAll();
    previous.el("drugSelect").value=med;now.el("drugSelect").value=med;
    previous.api.applyDrug();now.api.applyDrug();
    for(let i=0;i<9;i++){previous.api.nextStep();now.api.nextStep();}
    check(snapshot(now)===snapshot(previous),"all stages before clicks "+med);
    for(let i=0;i<9;i++){
        const old=snapshot(now),graph=now.calls.physiologyGraph??0;
        now.api.showStageLearning(i);
        check(now.el("stageDetailPanel").hidden===false,"open panel "+med+" "+i);
        check(now.el("stageDetailClinical").textContent===now.api.clinicalStageNotes[i].medical,"clinical panel "+med+" "+i);
        check(now.el("stageDetailNursing").textContent===now.api.clinicalStageNotes[i].nursing,"nursing panel "+med+" "+i);
        check(now.el("stageDetailEvidence").textContent.includes("설명서의 참고문헌"),"source panel "+med+" "+i);
        const associated=Object.keys(now.api.drugData).filter(id=>id!=="none"&&now.api.drugData[id].blockStep===i);
        const text=now.el("stageDetailDrugClinical").textContent;
        check(associated.length?associated.every(id=>text.includes(now.api.clinicalDrugNotes[id].medical)):text.includes("직접 표시된 약물은 없습니다"),"drug learning "+med+" "+i);
        check(snapshot(now)===old,"read only clinical content "+med+" "+i);
        check((now.calls.physiologyGraph??0)===graph,"no graph redraw "+med+" "+i);
    }
    previous.api.resetAll();now.api.resetAll();
    check(snapshot(now)===snapshot(previous),"reset parity "+med);
}
console.log("PASS v4.10 clinical notes & modal behavior: "+count+" deterministic checks (mock DOM/Canvas).");
