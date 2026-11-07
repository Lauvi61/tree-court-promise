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
  const frames=state.frontGeometry.filter(g=>/^Door_Frame/.test(g.name)),boards=state.frontGeometry.filter(g=>/^Reference_Board_/.test(g.name));if(frames.length!==3)throw Error('Duplicate door trim');const gap=Math.min(...boards.map(b=>b.min[0]))-Math.max(...frames.map(b=>b.max[0]));if(gap<.4)throw Error('Door frame intersects board: '+gap);console.log('LIVE_DOOR_BOARD_GAP',gap);
  await page.screenshot({path: join(root, 'classroom-integrity.png')});
  for(const [name,position,target] of [['door',[-1.8,1.8,-.4],[-3.2,1.6,-3.25]],['feet',[2.1,.5,1.5],[1.2,.2,.55]],['garment',[2.2,1.3,-.1],[1.2,.9,-.68]],['wall',[-2,1.1,-2],[-2,.7,-3.2]]]){
   await page.evaluate(({position,target})=>window.classAudit.reviewView(position,target),{position,target});await page.waitForTimeout(400);await page.screenshot({path:join(root,name+'-repair.png')});
   if(name==='wall')console.log('WALL_HIT',JSON.stringify(await page.evaluate(()=>window.classAudit.rayInfo(.294,.206))));if(name==='door'){await page.getByRole('button',{name:'打开教室门',exact:true}).click();await page.waitForTimeout(1000);await page.screenshot({path:join(root,'door-open-repair.png')});}
  }

  console.log(JSON.stringify({characters:state.characters.length,door:state.door,errors}, null, 2));
  if(state.characters.length!==4)throw Error('Missing character');const xs=state.desks.map(d=>Math.round(d.center[0]*1000));if(new Set(xs).size!==2)throw Error('Desk columns not aligned');await (await import('node:fs/promises')).writeFile(join(root,'integrity.json'),JSON.stringify(state,null,2));
  if (errors.length) throw new Error('errors: ' + errors.join(' | '));
  console.log('CLASSROOM_STYLE_SMOKE_OK ' + root);
} finally {
  await context.close(); await browser.close();
}
