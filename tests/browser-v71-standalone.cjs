'use strict';
// The downloadable standalone candidate must really work on file:// without a server.
const {chromium} = require('playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const assert = require('node:assert/strict');
const target = path.resolve(__dirname, '../artifacts/v7.1/raas-v7.1-interactive-preview.html');
(async () => {
  const browser = await chromium.launch();
  let checks = 0;
  const check = (condition, description) => {assert.ok(condition, description); checks++};
  try {
    for (const width of [390,1440]) {
      const page = await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('dialog', dialog => dialog.accept());
      await page.goto(pathToFileURL(target).href, {waitUntil:'load'});
      await page.waitForFunction(() => document.getElementById('v7EngineStatus')?.textContent.includes('연결됨'), {timeout:20000});
      const original = () => page.evaluate(() => document.getElementById('v7EngineFrame').contentWindow.RAASV6);
      check(await page.locator('#v7EngineFrame').getAttribute('srcdoc') !== null, 'inlined original frame '+width);
      check(await page.locator('#v7EngineStatus').innerText().then(v => v.includes('연결됨')), 'same-origin bridge '+width);
      check(await page.evaluate(() => document.getElementById('v7EngineFrame').contentWindow.RAASV6.snapshot().current.bp) === 120, 'authoritative baseline '+width);
      await page.locator('button[data-nav="explore"]:visible').first().click();
      await page.locator('#modeCompact').click();
      check(await page.locator('#v7ApplyDrug').isVisible(), 'working compact controls '+width);
      await page.locator('[data-drug="acei"]').first().click();
      await page.locator('#v7ApplyDrug').click();
      check(await page.evaluate(() => document.getElementById('v7EngineFrame').contentWindow.RAASV6.snapshot().current.bp) === 105, 'actual ACEi original output '+width);
      await page.locator('#v7RemoveDrug').click();
      check(await page.evaluate(() => document.getElementById('v7EngineFrame').contentWindow.RAASV6.snapshot().current.bp) === 120, 'drug removal '+width);
      await page.locator('button[data-nav="learn"]:visible').first().click();
      check(await page.locator('#lessonMedical').isVisible(), 'source-backed medical teaching '+width);
      await page.locator('button[data-nav="cases"]:visible').first().click();
      await page.locator('#v7StartClinical').click();
      check(await page.locator('#v71ClinicalWorkspace').isVisible(), 'v7 clinical workspace '+width);
      check(await page.evaluate(() => {const c=document.getElementById('v7EngineFrame').contentWindow.RAASV6.clinicalView();return c.phase==='judgement'&&c.lab===null&&c.judgementFeedback===null}), 'no answer/Lab pre-reveal '+width);
      await page.locator('#v71AnswerOptions .v71-choice').first().click();
      await page.locator('#v71Submit').click();
      check(await page.locator('#v71AnswerFeedback').isVisible(), 'original clinical judgment feedback '+width);
      check(await page.locator('#v71ClinicalLab').isHidden(), 'Lab stays hidden after judgment '+width);
      await page.locator('#v71Continue').click();
      await page.locator('#v71AnswerOptions .v71-choice').first().click();
      await page.locator('#v71Submit').click();
      check(await page.locator('#v71ClinicalLab').isVisible(), 'original gated Lab after action '+width);
      check(errors.length===0, 'no JS runtime errors '+width+': '+errors.join('; '));
      await page.close();
    }
    console.log('PASS v7.1 standalone preview '+checks+' file:// Chromium assertions (390/1440); local HTTP server unnecessary.');
  } finally {await browser.close()}
})().catch(error => {console.error(error);process.exitCode=1});
