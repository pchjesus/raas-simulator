// RAAS v4.5 regression — Node.js built-ins only (no npm install)
// Run: node tests/regression-v4.5.cjs
// Compares previous v4.4 to v4.5 model/UI in a simulated DOM+Canvas.
// Actual browser layout, pixels, touch, and native focus behavior are NOT covered.
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const baselineHTML = fs.readFileSync(path.join(root, "backups", "v4.4.html"), "utf8");
const candidateHTML = fs.readFileSync(path.join(root, "index.html"), "utf8");
function createHarness(html) {
  const nodes = {}, canvasCalls = [];
  const ctx = new Proxy({}, {
    get(target, key) {
      return target[key] ?? ((...args) => canvasCalls.push([key, ...args]));
    },
    set(target, key, value) { target[key] = value; return true; }
  });
  function node(id) {
    return nodes[id] ??= {
      id, value: "none", innerHTML: "", textContent: "", hidden: true, open: false,
      width: 900, height: 380, clientWidth: 900, clientHeight: 380,
      offsetWidth: 904, offsetHeight: 384, clientLeft: 2, clientTop: 2,
      events: {},
      addEventListener(key, fn) { (this.events[key] ??= []).push(fn); },
      showModal() { this.open = true; },
      close() { this.open = false; (this.events.close ?? []).forEach(fn => fn()); },
      focus() {},
      getContext() { return ctx; },
      getBoundingClientRect() {
        return { left: 0, top: 0, right: 904, bottom: 384, width: 904, height: 384 };
      }
    };
  }
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw new Error("Missing inline JS");
  const api = new Function("document", script + `
    return { state, physiology, drugData, stageData, nextStep, previousStep,
      applyDrug, removeDrug, resetProgress, resetAll, showStageLearning,
      getStageColor, drawPathway };
  `)({getElementById: node});
  return {
    api, node, canvasCalls,
    fire(id, type, event) { (node(id).events[type] ?? []).forEach(fn => fn(event)); }
  };
}
const old = createHarness(baselineHTML);
const updated = createHarness(candidateHTML);
let checks = 0;
function check(value, message) {
  checks++;
  if (!value) throw new Error("Regression failed: " + message);
}
function snapshot(env) {
  return JSON.stringify({
    state: env.api.state,
    physiology: env.api.physiology,
    stepColors: env.api.stageData.map((_, i) => env.api.getStageColor(i)),
    ui: ["bpInfo", "naInfo", "volumeInfo", "gfrInfo",
      "stageDetailTitle", "stageDetailSummary", "stageDetailLearning",
      "stageDetailEffect", "stageDetailDrugs", "stageLearningHint"].map(id => {
        const el = env.node(id);
        return [el.textContent, el.innerHTML, el.hidden];
      })
  });
}
function action(name, run) {
  run(old); run(updated);
  check(snapshot(old) === snapshot(updated), name);
}
function comparePathway(name) {
  const beforeOld = old.canvasCalls.length;
  const beforeNew = updated.canvasCalls.length;
  old.api.drawPathway(); updated.api.drawPathway();
  check(JSON.stringify(old.canvasCalls.slice(beforeOld)) ===
    JSON.stringify(updated.canvasCalls.slice(beforeNew)), "pathway " + name);
}
comparePathway("initial");
for (let i = 0; i < 9; i++) action("forward " + i, e => e.api.nextStep());
for (let i = 0; i < 5; i++) action("backward " + i, e => e.api.previousStep());
const medIds = ["acei", "aldo", "arb", "beta", "loop", "thiazide"];
for (const id of medIds) {
  const markStart = updated.canvasCalls.length;
  action("apply " + id, e => {
    e.node("drugSelect").value = id;
    e.api.applyDrug();
  });
  const calls = updated.canvasCalls.slice(markStart);
  const nodeMarker = ["aldo", "beta", "loop", "thiazide"].includes(id);
  check(calls.some(c => c[0] === "arc") === nodeMarker, "marker type " + id);
  check(calls.some(c => c[0] === "fillText" &&
    String(c[1]).includes("약물 작용:")), "mechanism label " + id);
  comparePathway(id);
  action("drugged next " + id, e => e.api.nextStep());
  action("remove " + id, e => e.api.removeDrug());
}
for (let i = 0; i < 9; i++) {
  action("stage click " + i, e => e.fire("canvas", "click", {
    clientX: 35 + i * 95 + 43, clientY: 92
  }));
}
action("outside click", e => e.fire("canvas", "click",
  {clientX: 5, clientY: 5}));
for (const key of ["ArrowRight", "ArrowLeft", "Home", "End", "Enter", " "]) {
  action("stage key " + key, e => e.fire("canvas", "keydown",
    {key, preventDefault() {}}));
}
action("help open", e => e.fire("helpOpenButton", "click", {}));
action("help close", e => e.fire("helpCloseButton", "click", {}));
action("learning close", e => e.fire("stageDetailCloseButton", "click", {}));
action("reset progress", e => e.api.resetProgress());
action("reset all", e => e.api.resetAll());
let seed = 314159265;
const rand = () => seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
const candidates = [...medIds, "none"];
for (let i = 0; i < 1600; i++) {
  const operation = rand() % 15;
  const drug = candidates[rand() % candidates.length];
  const stage = rand() % 9;
  action("mixed " + i, e => {
    if (operation < 4) e.api.nextStep();
    else if (operation < 6) e.api.previousStep();
    else if (operation < 9) {
      e.node("drugSelect").value = drug; e.api.applyDrug();
    } else if (operation === 9) e.api.removeDrug();
    else if (operation === 10) e.api.resetProgress();
    else if (operation === 11) e.api.resetAll();
    else if (operation === 12) e.api.showStageLearning(stage);
    else if (operation === 13) e.fire("canvas", "click",
      {clientX: 35 + stage * 95 + 43, clientY: 92});
    else e.fire("canvas", "keydown",
      {key: "ArrowRight", preventDefault() {}});
  });
  if (i % 80 === 0) comparePathway("mixed " + i);
}
check(updated.api.drugData.acei.visualization.afterStep === 3 &&
  updated.api.drugData.arb.visualization.afterStep === 4, "connection anchors");
check(updated.api.drugData.loop.visualization.step === 7 &&
  updated.api.drugData.thiazide.visualization.step === 7, "diuretic anchors");
check(candidateHTML.includes("RAAS Simulator v4.5"), "display version");
console.log("PASS RAAS v4.5 mock DOM/Canvas regression: " +
  checks + " checks; 1600 deterministic mixed operations");
