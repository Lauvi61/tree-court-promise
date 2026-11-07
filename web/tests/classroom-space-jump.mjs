import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
const modules = process.env.TREECOURT_NODE_MODULES || join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const require = createRequire(join(modules, 'package.json'));
const {chromium} = require('playwright');
const root = join(process.cwd(), 'web/.runtime/classroom-style'); await mkdir(root, {recursive: true});
const base = process.env.TREECOURT_URL || 'http://127.0.0.1:8765';
const browser = await chromium.launch({channel: 'msedge', headless: true});
const context = await browser.newContext({viewport: {width: 1440, height: 1000}});
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push('console: ' + m.text()); });
try {
  await page.goto(base, {waitUntil: 'domcontentloaded'});
  await page.locator('#hero-start').waitFor({timeout: 30000});
  await page.locator('#hero-start').click();
  await page.locator('[data-enter]').first().waitFor({timeout: 20000});
  await page.locator('[data-enter]').first().click();
  await page.waitForFunction(() => document.querySelector('.scene-host')?.dataset.ready === 'true', null, {timeout: 90000}).catch(() => {});
  await page.waitForTimeout(1500);
  await page.evaluate(async()=>{const host=document.querySelector('.scene-host');delete host.dataset.ready;const m=await import('/static/scene.bundle.js');window.classAudit=await m.mountScene(host);window.classAudit.walk();});
  await page.waitForFunction(()=>document.querySelector('.scene-host')?.dataset.ready==='true',null,{timeout:90000});await page.waitForTimeout(1800);
  const state=await page.evaluate(()=>window.classAudit.integrity());
  const before=await page.locator('.scene-host').getAttribute('data-player');await page.keyboard.press('Space');await page.waitForTimeout(180);const peak=JSON.parse(await page.locator('.scene-host').getAttribute('data-player'));await page.waitForTimeout(650);const landed=JSON.parse(await page.locator('.scene-host').getAttribute('data-player'));if(peak[1]<JSON.parse(before)[1]+.15||Math.abs(landed[1]-JSON.parse(before)[1])>.02)throw Error('Jump failed');
  await page.evaluate(()=>window.classAudit.board());await page.waitForTimeout(500);if(await page.locator('.scene-host').getAttribute('data-view')!=='board')throw Error('Board view missing');await page.screenshot({path:join(root,'teaching-board.png')});

  await page.evaluate(()=>window.classAudit.walk());await page.waitForTimeout(500);await page.screenshot({path:join(root,'classroom-space.png')});
  console.log(JSON.stringify({...state, errors}, null, 2));
  if(state.characters.length!==4)throw Error('Missing character');const xs=state.desks.map(d=>Math.round(d.center[0]*1000));if(new Set(xs).size!==2)throw Error('Desk columns not aligned');await (await import('node:fs/promises')).writeFile(join(root,'integrity.json'),JSON.stringify(state,null,2));
  if (errors.length) throw new Error('errors: ' + errors.join(' | '));
  console.log('CLASSROOM_STYLE_SMOKE_OK ' + root);
} finally {
  await context.close(); await browser.close();
}
