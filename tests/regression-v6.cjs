const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8'),html=read('index.html'),base=read('backups/v5.9.1.html');let count=0;
const ok=(v,m)=>{assert.ok(v,m);count++};
for(const [i,m] of [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].entries()){new vm.Script(m[1],{filename:'v6-script-'+i});count++;}
function segment(text,start,end){const i=text.indexOf(start),j=text.indexOf(end,i+start.length);assert.ok(i>=0&&j>i,start);return text.slice(i,j);}
for(const [start,end] of [
 ['const initialPhysiology=','function createZeroEffect'],
 ['const firstClinicalScenario={','// =============================\n// RAAS 단계 데이터'],
 ['const stageData=[','const clinicalStageNotes='],
 ['const clinicalStageNotes=','function isStepBlocked'],
 ['function isStepBlocked','function calculatePhysiology(){'],
 ['const scenarioLabExamples=','function resetScenarioActions(){']
])ok(segment(html,start,end)===segment(base,start,end),'protected data/engine unchanged '+start);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);ok(new Set(ids).size===ids.length,'unique static IDs');
ok(html===read('backups/v6.0-candidate.html'),'candidate backup exact');
console.log('PASS v6 '+count+' real Node syntax, protected data/engine and backup checks');
