// Run node tests/regression-v4.8.cjs; deterministic fake DOM/Canvas/timers.
const fs=require("node:fs"),path=require("node:path");
function app(html){
 const elements={},trace={},timers=new Map();let seq=0;
 const el=id=>elements[id]??={
  value:id==="graphVariable"?"bp":"none",textContent:id==="flowDemoStatus"?"시연 대기":"",
  hidden:true,open:false,innerHTML:"",attrs:{},events:{},
  width:id==="physiologyGraph"?1000:900,height:id==="physiologyGraph"?290:380,
  clientWidth:900,clientHeight:380,offsetWidth:904,offsetHeight:384,clientLeft:2,clientTop:2,
  addEventListener(k,f){(this.events[k]??=[]).push(f);},setAttribute(k,v){this.attrs[k]=v;},
  getContext(){const log=(trace[id]??=[]);return new Proxy({},{
    get(t,k){return t[k]??((...args)=>log.push({method:k,args,stroke:t.strokeStyle}));},
    set(t,k,v){t[k]=v;return true;}});},
  showModal(){this.open=true;},close(){this.open=false;},focus(){},
  getBoundingClientRect(){return {left:0,top:0,width:904,height:384,right:904,bottom:384};}
 };
 const start=html.indexOf("<script>")+8,end=html.indexOf("</script>",start);
 const js=html.slice(start,end);
 const api=new Function("document","setInterval","clearInterval",js+
   "\nreturn {state,physiology,stageData,drugData,getStageColor,getGraphSeries,resetAll,nextStep,applyDrug,showStageLearning,flowDemo:typeof flowDemo==='object'?flowDemo:null};")(
   {getElementById:el},(fn,ms)=>{const id=++seq;timers.set(id,{fn,ms});return id;},id=>timers.delete(id));
 return {api,el,trace,timers,click(id){(el(id).events.click??[]).forEach(fn=>fn({}));},
  tick(){for(const timer of Array.from(timers.values()))timer.fn();},
  change(id){(el(id).events.change??[]).forEach(fn=>fn({}));}
 };
}
const dir=path.join(__dirname,"..");
const old=app(fs.readFileSync(path.join(dir,"backups","v4.7.1.html"),"utf8"));
const now=app(fs.readFileSync(path.join(dir,"index.html"),"utf8"));
let count=0;function ok(v,m){count++;if(!v)throw Error("FAIL "+m);}
const snapshot=a=>JSON.stringify({state:a.api.state,phys:a.api.physiology,
 colors:a.api.stageData.map((_,i)=>a.api.getStageColor(i)),graph:a.api.getGraphSeries("bp")});
function hasDemoMarker(start,idx){return now.trace.canvas.slice(start).some(x=>
 x.method==="strokeRect"&&x.stroke==="#225e78"&&x.args[0]===36+95*idx&&x.args[1]===56);}
ok(now.api.flowDemo.index===-1&&now.timers.size===0,"initial off");
for(const drug of ["none","acei","arb","beta","aldo","loop","thiazide"]){
 old.api.resetAll();now.api.resetAll();
 old.el("drugSelect").value=drug;now.el("drugSelect").value=drug;
 old.api.applyDrug();now.api.applyDrug();
 for(let i=0;i<5;i++){old.api.nextStep();now.api.nextStep();}
 let expected=snapshot(now);ok(expected===snapshot(old),"before play "+drug);
 const offset=now.trace.canvas.length;
 now.click("flowDemoToggle");
 ok(now.api.flowDemo.index===0&&now.timers.size===1&&hasDemoMarker(offset,0),"play "+drug);
 ok(now.el("flowDemoToggle").attrs["aria-pressed"]==="true","aria playing "+drug);
 for(let i=1;i<=4;i++){const start=now.trace.canvas.length;now.tick();
  ok(now.api.flowDemo.index===i&&hasDemoMarker(start,i),"frame "+i+" "+drug);
  ok(snapshot(now)===expected,"no changes "+i+" "+drug);}
 now.click("flowDemoToggle");
 ok(now.timers.size===0&&now.api.flowDemo.paused,"paused "+drug);
 now.tick();ok(now.api.flowDemo.index===4,"paused holds "+drug);
 now.click("flowDemoToggle");ok(now.timers.size===1,"resume "+drug);
 old.api.showStageLearning(2);now.api.showStageLearning(2);
 ok(snapshot(now)===snapshot(old),"learning untouched "+drug);
 old.api.nextStep();now.api.nextStep();now.change("graphVariable");
 ok(snapshot(now)===snapshot(old),"existing progress+graph "+drug);
 for(let i=5;i<=8;i++){now.tick();ok(now.api.flowDemo.index===i,"continue "+i+" "+drug);}
 now.tick();ok(now.timers.size===0&&now.el("flowDemoStatus").textContent.includes("완료"),"finished "+drug);
 now.click("flowDemoToggle");ok(now.api.flowDemo.index===0&&now.timers.size===1,"replay "+drug);
 now.click("flowDemoStop");ok(now.api.flowDemo.index===-1&&now.timers.size===0,"stop "+drug);
 ok(snapshot(now)===snapshot(old),"after play same "+drug);
}
now.click("flowDemoToggle");now.click("flowDemoToggle");
ok(now.api.flowDemo.paused&&now.timers.size===0,"paused after button");
now.click("flowDemoStop");ok(now.api.flowDemo.index===-1&&!now.api.flowDemo.paused,"stop after pause");
console.log("PASS v4.8 read-only path demo: "+count+" deterministic tests across seven drug scenarios");
