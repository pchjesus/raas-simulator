// Run: node tests/regression-v4.6.cjs — mock DOM/Canvas; no actual browser visual test.
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
function app(html){
 const nodes={},calls=[];
 const ctx=new Proxy({}, {get(t,k){return t[k]??((...a)=>calls.push([k,...a]))},set(t,k,v){t[k]=v;return true}});
 const el=id=>nodes[id]??={id,value:"none",textContent:"",innerHTML:"",open:false,hidden:true,width:900,height:380,clientWidth:900,clientHeight:380,offsetWidth:904,offsetHeight:384,clientLeft:2,clientTop:2,events:{},addEventListener(k,f){(this.events[k]??=[]).push(f)},getContext(){return ctx},focus(){},showModal(){this.open=true},close(){this.open=false;(this.events.close??[]).forEach(f=>f())},getBoundingClientRect(){return {left:0,top:0,width:904,height:384,right:904,bottom:384}}};
 const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];if(!js)throw Error("No JS");
 const api=new Function("document",js+`\nreturn {state,physiology,drugData,stageData,nextStep,previousStep,applyDrug,removeDrug,resetAll,resetProgress,getStageColor,calculatePhysiologyAtStep:typeof calculatePhysiologyAtStep==='function'?calculatePhysiologyAtStep:null,drawPathway,isStepBlocked,showStageLearning};`)({getElementById:el});
 return {api,el,calls,fire(id,type,arg){(el(id).events[type]??[]).forEach(f=>f(arg))}};
}
const baseline=app(fs.readFileSync(path.join(root,"backups","v4.5.html"),"utf8"));
const current=app(fs.readFileSync(path.join(root,"index.html"),"utf8"));
let checks=0;function assert(x,m){checks++;if(!x)throw Error("FAIL: "+m)}
const keys=["bp","sodium","volume","gfr"];
for(let step=-1;step<9;step++){
 baseline.api.resetAll();for(let i=0;i<=step;i++)baseline.api.nextStep();
 assert(JSON.stringify(current.api.calculatePhysiologyAtStep(step,"none"))===JSON.stringify(baseline.api.physiology),"unmedicated v4.5 parity step "+step);
}
const maps={acei:[4,6,7],arb:[4,6,7],beta:[4,6,7],aldo:[6,7],loop:[7],thiazide:[7]};
for(const [id,suppressed] of Object.entries(maps)){
 assert(JSON.stringify(current.api.drugData[id].suppressedRaasSteps)===JSON.stringify(suppressed),"data "+id);
 for(let step=-1;step<9;step++){
  const result=current.api.calculatePhysiologyAtStep(step,id);
  for(const key of keys){
   let sum=0;
   for(let i=0;i<=step;i++)if(!suppressed.includes(i))sum+=current.api.stageData[i].effect[key];
   assert(result.raasEffect[key]===sum,"RAAS "+id+" "+step+" "+key);
   assert(result.drugEffect[key]===current.api.drugData[id].physiologyEffect[key],"drug value "+id+" "+key);
   assert(result.current[key]===result.baseline[key]+result.effect[key],"total "+id+" "+key);
  }
 }
 current.api.resetAll();current.el("drugSelect").value=id;current.api.applyDrug();
 assert(current.api.state.drug.limitStep===8,"no next-step restriction "+id);
 for(let i=0;i<9;i++)current.api.nextStep();
 assert(current.api.state.progress.currentStep===8 && current.api.state.progress.maxReachedStep===8,"all stages "+id);
 assert(JSON.stringify(current.api.physiology)===JSON.stringify(current.api.calculatePhysiologyAtStep(8,id)),"current computed "+id);
 for(let i=0;i<9;i++)current.api.previousStep();
 assert(current.api.state.progress.currentStep===-1&&current.api.state.progress.maxReachedStep===8,"previous retains max "+id);
 assert(JSON.stringify(current.api.physiology)===JSON.stringify(current.api.calculatePhysiologyAtStep(8,id)),"previous retains physiology "+id);
 current.api.removeDrug();
 assert(current.api.state.drug.appliedDrug==="none","remove "+id);
 current.api.resetAll();
}
for(let i=0;i<3;i++)current.api.nextStep();
current.el("drugSelect").value="acei";current.api.applyDrug();
assert(current.api.state.drug.drugAppliedStep===2,"application timestamp");
for(let i=0;i<6;i++)current.api.nextStep();
assert(current.api.state.progress.currentStep===8,"midstream application reaches end");
current.el("drugSelect").value="arb";current.api.applyDrug();
assert(current.api.state.drug.appliedDrug==="arb"&&current.api.state.progress.maxReachedStep===8,"replacement");
for(let i=0;i<9;i++){
 const state=JSON.stringify(current.api.state),phys=JSON.stringify(current.api.physiology);
 current.api.showStageLearning(i);
 assert(JSON.stringify(current.api.state)===state&&JSON.stringify(current.api.physiology)===phys,"learning read only "+i);
}
const prev=JSON.stringify(current.api.state);
current.fire("helpOpenButton","click",{});
current.fire("helpCloseButton","click",{});
assert(JSON.stringify(current.api.state)===prev,"help read-only");
current.api.resetProgress();
assert(current.api.state.progress.currentStep===-1&&current.api.state.progress.maxReachedStep===-1&&current.api.state.drug.appliedDrug==="arb","progress reset keeps drug");
current.api.resetAll();
assert(current.api.state.progress.maxReachedStep===-1&&current.api.state.drug.appliedDrug==="none","full reset");
console.log("PASS v4.6 regression: "+checks+" checks");
