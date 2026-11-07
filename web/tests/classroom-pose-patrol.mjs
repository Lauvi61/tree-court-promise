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
  const state=await page.evaluate(()=>window.classAudit.integrity());const first=state.characters.find(c=>c.id==='anaxa').position;await page.waitForTimeout(1800);const second=await page.evaluate(()=>window.classAudit.integrity().characters.find(c=>c.id==='anaxa').position);if(Math.abs(first[0]-second[0])<.05)throw Error('Teacher did not move');for(const c of state.characters.filter(c=>['castor','phainon'].includes(c.id)))if(c.blushLayers.some(m=>m.visible&&m.opacity>0))throw Error('Visible blush overlay');
  await page.screenshot({path: join(root, 'classroom-integrity.png')});await page.evaluate(()=>window.classAudit.reviewView([2.65,1.6,-.9],[2.65,1.25,-2.65]));await page.waitForTimeout(500);await page.screenshot({path:join(root,'hyacine-thinking.png')});
  console.log(JSON.stringify({...state, errors}, null, 2));
  if(state.characters.length!==4)throw Error('Missing character');const xs=state.desks.map(d=>Math.round(d.center[0]*1000));if(new Set(xs).size!==2)throw Error('Desk columns not aligned');await (await import('node:fs/promises')).writeFile(join(root,'integrity.json'),JSON.stringify(state,null,2));
  if (errors.length) throw new Error('errors: ' + errors.join(' | '));
  console.log('CLASSROOM_STYLE_SMOKE_OK ' + root);
} finally {
  await context.close(); await browser.close();
}
