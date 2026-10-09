// v4.7.1 learning focus regression; node tests/regression-v4.7.1.cjs
// Mock DOM/Canvas, NOT actual browser visual or native keyboard focus testing.
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"index.html"),"utf8");
function harness(html){
 const els={},calls={};
 const el=id=>els[id]??={id,value:id==="graphVariable"?"bp":"none",
  hidden:true,open:false,textContent:"",innerHTML:"",focusCount:0,
  width:id==="physiologyGraph"?1000:900,height:id==="physiologyGraph"?290:380,
  clientWidth:900,clientHeight:380,offsetWidth:904,offsetHeight:384,
  clientLeft:2,clientTop:2,events:{},
  addEventListener(k,fn){(this.events[k]??=[]).push(fn);},
  focus(){this.focusCount++;},showModal(){this.open=true;},
  close(){this.open=false;(this.events.close??[]).forEach(f=>f());},
  getBoundingClientRect(){return{left:0,top:0,width:904,height:384,right:904,bottom:384};},
  getContext(){const log=calls[id]??=[];return new Proxy({},{
   get(o,k){return o[k]??((...args)=>log.push({name:k,args,stroke:o.strokeStyle}));},
   set(o,k,v){o[k]=v;return true;}
  });}
 };
 const begin=html.indexOf("<script>"),end=html.indexOf("</script>",begin);
 if(begin<0||end<0)throw Error("Missing inline script");
 const js=html.slice(begin+8,end);
 const api=new Function("document",js+"; return {state,physiology,stageData,drugData,showStageLearning,getStageColor,getGraphSeries,nextStep,applyDrug,removeDrug,resetAll};")({getElementById:el});
 return {api,el,calls,fire(id,k,arg){(el(id).events[k]??[]).forEach(f=>f(arg));}};
}
const old=harness(fs.readFileSync(path.join(root,"backups","v4.7.html"),"utf8"));
const now=harness(source);
let count=0;function assert(x,msg){count++;if(!x)throw Error("FAIL "+msg);}
const snapshot=h=>JSON.stringify({s:h.api.state,p:h.api.physiology,colors:h.api.stageData.map((_,i)=>h.api.getStageColor(i)),graph:h.api.getGraphSeries("bp")});
const recent=(h,begin)=>(h.calls.canvas??[]).slice(begin);
function marker(items,index){
 return items.some(item=>item.name==="strokeRect"&&item.args[0]===38+95*index&&item.args[1]===58&&item.stroke==="#11654b");
}
assert(now.el("stageDetailPanel").hidden,"initial hidden");
assert(source.includes('id="stageKeyboardGuide"'),"persistent keyboard guide");
assert(source.includes("1-1. 키보드로 단계 학습하기"),"keyboard instructions in dialog");
assert(source.includes("case \"Escape\":"),"Esc supported");
for(let i=0;i<9;i++){
 const state=snapshot(now),graph=(now.calls.physiologyGraph??[]).length,begin=(now.calls.canvas??[]).length;
 const ev={clientX:35+i*95+43,clientY:92};
 now.fire("canvas","click",ev);old.fire("canvas","click",ev);
 assert(snapshot(now)===state&&snapshot(now)===snapshot(old),"mouse read only "+i);
 assert(marker(recent(now,begin),i),"mouse selection marker "+i);
 assert(now.el("stageDetailTitle").textContent===old.el("stageDetailTitle").textContent,"same learning text "+i);
 assert(recent(now,begin).filter(r=>r.name==="fillRect"&&r.args[1]===55).length===9,"base colors drawn "+i);
 assert((now.calls.physiologyGraph??[]).length===graph,"mouse no graph redraw "+i);
}
let start=(now.calls.canvas??[]).length;let prevented=0;
now.fire("canvas","keydown",{key:"Escape",preventDefault(){prevented++;}});
assert(prevented===1&&now.el("stageDetailPanel").hidden,"Escape closes");
assert(!recent(now,start).some(r=>r.name==="strokeRect"&&r.stroke==="#11654b"),"Escape removes selection");
assert(now.el("stageLearningHint").textContent.includes("상자를 클릭"),"Escape hint reset");
for(const [key,index] of [["Home",0],["ArrowRight",1],["ArrowLeft",0],["End",8],["Enter",8],[" ",8],["ArrowRight",8]]){
 const state=snapshot(now),graph=(now.calls.physiologyGraph??[]).length;
 start=(now.calls.canvas??[]).length;let accepted=false;
 now.fire("canvas","keydown",{key,preventDefault(){accepted=true;}});
 assert(accepted&&now.el("stageDetailTitle").textContent.startsWith((index+1)+". "),"key selects "+key);
 assert(marker(recent(now,start),index),"key selection marker "+key);
 assert(snapshot(now)===state,"key read only "+key);
 assert((now.calls.physiologyGraph??[]).length===graph,"key no graph redraw "+key);
}
start=(now.calls.canvas??[]).length;const priorFocus=now.el("canvas").focusCount;
now.fire("stageDetailCloseButton","click",{});
assert(now.el("stageDetailPanel").hidden,"close button hides panel");
assert(now.el("canvas").focusCount===priorFocus+1,"focus returned");
assert(!recent(now,start).some(r=>r.name==="strokeRect"&&r.stroke==="#11654b"),"close clears marker");
now.fire("canvas","keydown",{key:"ArrowLeft",preventDefault(){}});
assert(now.el("stageDetailTitle").textContent.startsWith("9. "),"unselected left selects last");
for(const id of ["acei","aldo","arb","beta","loop","thiazide"]){
 now.api.resetAll();now.el("drugSelect").value=id;now.api.applyDrug();
 for(let i=0;i<9;i++)now.api.nextStep();
 const state=snapshot(now),graph=(now.calls.physiologyGraph??[]).length;
 now.api.showStageLearning(5);
 assert(snapshot(now)===state,"drug state unchanged "+id);
 assert(now.api.getStageColor(now.api.drugData[id].blockStep)==="#ffe066","drug yellow priority "+id);
 assert((now.calls.physiologyGraph??[]).length===graph,"drug learning graph unchanged "+id);
 now.api.removeDrug();
}
now.api.resetAll();
assert(now.api.state.progress.maxReachedStep===-1&&now.api.state.drug.appliedDrug==="none","reset");
console.log("PASS v4.7.1 learning keyboard regression: "+count+" checks");
