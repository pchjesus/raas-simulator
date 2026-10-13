// v4.7: compare to v4.6 model and ensure chart is read-only.
// Run: node tests/regression-v4.7.cjs (mock DOM/Canvas; no browser visual claim)
const fs=require("node:fs"),path=require("node:path");
function boot(source){
 const nodes={},log={};
 function el(id){return nodes[id]??={
  id,value:id==="graphVariable"?"bp":"none",textContent:"",innerHTML:"",
  hidden:true,open:false,width:id==="physiologyGraph"?1000:900,
  height:id==="physiologyGraph"?290:380,clientWidth:900,clientHeight:380,
  offsetWidth:904,offsetHeight:384,clientLeft:2,clientTop:2,events:{},
  addEventListener(k,fn){(this.events[k]??=[]).push(fn);},
  getContext(){return new Proxy({},{get(o,k){return o[k]??((...a)=>(log[id]??=[]).push([k,...a]));},set(o,k,v){o[k]=v;return true;}});},
  showModal(){this.open=true;},close(){this.open=false;(this.events.close??[]).forEach(f=>f());},
  focus(){},getBoundingClientRect(){return{left:0,top:0,width:904,height:384,right:904,bottom:384};}
 };}
 const js=source.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 if(!js)throw Error("Missing inline JS");
 const api=new Function("document",js+`
 return {state,physiology,nextStep,previousStep,applyDrug,removeDrug,resetProgress,
 resetAll,showStageLearning,calculatePhysiologyAtStep,
 getGraphSeries:typeof getGraphSeries==='function'?getGraphSeries:null,
 drawPhysiologyGraph:typeof drawPhysiologyGraph==='function'?drawPhysiologyGraph:null};`)({getElementById:el});
 return {api,el,log,fire(id,k,arg){(el(id).events[k]??[]).forEach(f=>f(arg));}};
}
const root=path.join(__dirname,"..");
const v46=boot(fs.readFileSync(path.join(root,"backups","v4.6.html"),"utf8"));
// Historical v4.7 parity must compare the frozen v4.7 artifact, not latest UI copy.
const v47=boot(fs.readFileSync(path.join(root,"backups","v4.7.html"),"utf8"));
let checks=0;function check(ok,label){checks++;if(!ok)throw Error("FAIL "+label);}
function snapshot(a){return JSON.stringify({
 state:a.api.state,phys:a.api.physiology,
 ui:["bpInfo","naInfo","volumeInfo","gfrInfo","stageDetailTitle",
 "stageDetailEffect","stageDetailDrugs"].map(id=>[a.el(id).innerHTML,a.el(id).textContent,a.el(id).hidden])
});}
function both(name,fn){fn(v46);fn(v47);check(snapshot(v46)===snapshot(v47),"v4.6 parity "+name);}
check((v47.log.physiologyGraph??[]).length>40,"graph initialized");
const drugs=["none","acei","aldo","arb","beta","loop","thiazide"];
const variables=["bp","sodium","volume","gfr"];
for(const drug of drugs){
 both("reset before "+drug,a=>a.api.resetAll());
 both("apply "+drug,a=>{a.el("drugSelect").value=drug;a.api.applyDrug();});
 for(let i=0;i<9;i++)both("progress "+drug+" "+i,a=>a.api.nextStep());
 for(const key of variables){
  const before=snapshot(v47),trace=v47.log.physiologyGraph.length;
  v47.el("graphVariable").value=key;
  v47.fire("graphVariable","change",{});
  check(snapshot(v47)===before,"graph selector state unchanged "+drug+key);
  check(v47.log.physiologyGraph.length>trace,"graph redraw "+drug+key);
  const values=v47.api.getGraphSeries(key,drug);
  check(values.normal.length===9&&values.treated.length===9,"9 points "+drug+key);
  check(values.normal.every(Number.isFinite)&&values.treated.every(Number.isFinite),"finite values "+drug+key);
  for(let j=0;j<9;j++){
   check(values.normal[j]===v47.api.calculatePhysiologyAtStep(j,"none").current[key],"normal point "+drug+key+j);
   check(values.treated[j]===v47.api.calculatePhysiologyAtStep(j,drug).current[key],"med point "+drug+key+j);
  }
 }
 for(let i=0;i<5;i++)both("previous "+drug+i,a=>a.api.previousStep());
 for(let i=0;i<9;i++)both("learning "+drug+i,a=>a.api.showStageLearning(i));
 both("drug remove "+drug,a=>a.api.removeDrug());
 both("progress reset "+drug,a=>a.api.resetProgress());
}
both("final reset",a=>a.api.resetAll());
const state=snapshot(v47);v47.fire("helpOpenButton","click",{});
v47.fire("helpCloseButton","click",{});
check(snapshot(v47)===state,"help unchanged");
console.log("PASS v4.7 graph: "+checks+" checks, v4.6 behavior parity across 7 drug states");
