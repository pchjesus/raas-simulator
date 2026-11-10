'use strict';
// Build a self-contained, review-only v7.1 HTML file from the exact candidate sources.
// No production deploy, server, clone of the engine logic, or edited clinical data.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('index.html');
const verifiedV6 = read('backups/v6.0-content-ia.html');
if (!app.includes('<title>RAAS.LAB — RAAS Simulator v7</title>')) {
  throw new Error('Expected v7 root is missing. Offline preview would be invalid.');
}
if (!verifiedV6.includes('id="scenarioStudyView"') || !verifiedV6.includes('id="physiologyGraph"')) {
  throw new Error('Expected frozen v6 clinical and graph source is missing.');
}
const original = 'inert src="backups/v6.0-content-ia.html"';
if (app.split(original).length !== 2) throw new Error('Expected one original v6 iframe source');
const encodeAttribute = raw => raw.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const embedded = 'inert srcdoc="' + encodeAttribute(verifiedV6) + '"';
let html = app.replace(original, embedded);
html = html.replace('<title>RAAS.LAB — RAAS Simulator v7</title>', 
  '<title>RAAS.LAB — v7.1 interactive offline preview</title>');
// srcdoc and parent file URL share an inherited origin; the v6 script and Canvas remain authoritative.
const target = path.join(root, 'artifacts', 'v7.1', 'raas-v7.1-interactive-preview.html');
fs.mkdirSync(path.dirname(target), {recursive:true});
fs.writeFileSync(target, html, 'utf8');
console.log('Created offline preview: ' + target + ' (' + Buffer.byteLength(html) + ' bytes)');
