// RAAS v5.5.2: structural/version/UX copy regression, actual Node.js runtime.
// Historical suites test the simulation/clinical engine separately.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const now=read('index.html'),frozen=read('backups/v5.5.2.html'),before=read('backups/v5.5.1.html');
let checks=0;function check(ok,message){checks++;assert.ok(ok,message)}
function extract(s,pat,message){const m=s.match(pat);check(!!m,message);return m?.[1]?.trim()}
check(now===frozen,'frozen backup byte-for-byte equal to live HTML');
check(extract(now,/<title>\s*([^<]+)\s*<\/title>/,'title present')==='RAAS Simulator v5.5.2','document title version');
check(extract(now,/<h1>\s*([^<]+)\s*<\/h1>/,'h1 present')==='RAAS Simulator v5.5.2','visible title version');
check(now.includes('<span class="scenario-tag">v5.5.2 · 임상 적용</span>'),'scenario badge version');
const script=s=>s.match(/<script>([\s\S]*?)<\/script>/)?.[1];
check(!!script(now),'inline script exists');
check(script(now)===script(before),'entire simulation/clinical/script unchanged from v5.5.1');
new vm.Script(script(now),{filename:'index.html:simulator'});check(true,'JavaScript syntax valid');
const html=now.split('<script>')[0];
const help=extract(html,/(<dialog id="helpDialog"[\s\S]*?<\/dialog>)/,'help dialog present');
for(const word of ['① 시뮬레이터','② 학습','③ 임상 적용','CKD/ACEi(3문항)','HFrEF/MRA(2문항)','다시 풀기·다른 사례 선택·학습 종료','새로고침','K⁺','GFR','참고문헌 (APA 7판)'])check(help.includes(word),'help retains '+word);
check(!help.includes('상단의 <strong>임상 시나리오</strong>'),'removed stale upper-tab name');
check(!help.includes('7-1. 기존 임상 사례 안내'),'removed redundant section');
const primary=extract(html,/<div class="study-mode-primary"[^>]*>([\s\S]*?)<\/div>/,'primary nav group');
const secondary=extract(html,/<div class="study-mode-secondary"[^>]*>([\s\S]*?)<\/div>/,'secondary nav group');
for(const id of ['normalModeButton','learningModeButton','scenarioModeButton']){check(primary.includes('id="'+id+'"'),'primary '+id);check(!secondary.includes('id="'+id+'"'),'secondary excludes '+id)}
for(const id of ['globalHelpButton','modelPolicyButton']){check(secondary.includes('id="'+id+'"'),'secondary '+id);check(!primary.includes('id="'+id+'"'),'primary excludes '+id)}
check(html.includes('role="group" aria-label="주요 학습 영역"'),'primary screen reader group');
check(html.includes('role="group" aria-label="도움말과 모델 안내"'),'secondary screen reader group');
for(const style of ['.study-mode-primary button[aria-pressed="true"]','.study-mode-secondary{padding:4px','.study-mode-secondary{border-left:0;border-top:1px'])check(html.includes(style),'CSS '+style);
const ids=[...html.replace(/<style>[\s\S]*?<\/style>/,'').matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
check(ids.length===new Set(ids).size,'unique HTML element ids');
for(const id of ['modelPolicyDialog','helpDialog','changelogDialog','scenarioTakeawaysDialog','canvas','physiologyGraph'])check(html.includes('id="'+id+'"'),'retained '+id);
const history=extract(html,/(<dialog id="changelogDialog"[\s\S]*?<\/dialog>)/,'changelog dialog');
check(history.includes('v5.5.2 — 제목'),'added release history');
check(history.includes('v5.5.1 — 본문'),'kept historical release');
check(!help.includes('일반 학습으로 돌아가면 답안이 초기화'),'no obsolete rule in current help');
console.log('PASS v5.5.2 '+checks+' Node CLI structural / version / help / nav / JS freeze checks. Browser QA separate.');
