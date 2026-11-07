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
  const state=await page.evaluate(()=>window.classAudit.integrity());let previous=null,maxAngle=0;const samples=[];
  let minDoorGap=Infinity;
  for(let i=0;i<120;i++){if(i===30)await page.getByRole('button',{name:'打开教室门',exact:true}).click();if(i===80)await page.getByRole('button',{name:'关闭教室门',exact:true}).click();const snapshot=await page.evaluate(()=>window.classAudit.integrity()),c=snapshot.characters.find(c=>c.id==='anaxa');const d=snapshot.door,dx=Math.max(0,Math.abs(c.position[0]-d.center[0])-d.size[0]/2),dz=Math.max(0,Math.abs(c.position[2]-d.center[2])-d.size[2]/2);minDoorGap=Math.min(minDoorGap,Math.hypot(dx,dz)-.55);if(previous){const dot=Math.min(1,Math.abs(c.headQuaternion.reduce((v,q,j)=>v+q*previous[j],0)));maxAngle=Math.max(maxAngle,2*Math.acos(dot));}previous=c.headQuaternion;samples.push(c.yaw);await page.waitForTimeout(100);}
  if(minDoorGap<.08)throw Error('Teacher/door clearance too small: '+minDoorGap);console.log('TEACHER_DOOR_SWEEP_CLEARANCE',minDoorGap);if(maxAngle>.35)throw Error('Head snapped or accumulated rotation: '+maxAngle);if(Math.max(...samples)-Math.min(...samples)<2)throw Error('No turn observed');console.log('TEACHER_HEAD_TURN_BOUNDED',maxAngle);
  await page.evaluate(()=>window.classAudit.focus('anaxa'));await page.waitForTimeout(1200);await page.screenshot({path:join(root,'teacher-separated-view.png')});await page.evaluate(()=>{window.classAudit.speech('anaxa',true);window.classAudit.update({word:'视角保持验证'});});if(await page.locator('.scene-host').getAttribute('data-view')!=='anaxa')throw Error('Teacher view overridden by narration');await page.screenshot({path: join(root, 'classroom-integrity.png')});await page.evaluate(()=>window.classAudit.reviewView([2.65,1.6,-.9],[2.65,1.25,-2.65]));await page.waitForTimeout(500);await page.screenshot({path:join(root,'hyacine-thinking.png')});
  console.log(JSON.stringify({...state, errors}, null, 2));
  if(state.characters.length!==4)throw Error('Missing character');const xs=state.desks.map(d=>Math.round(d.center[0]*1000));if(new Set(xs).size!==2)throw Error('Desk columns not aligned');await (await import('node:fs/promises')).writeFile(join(root,'integrity.json'),JSON.stringify(state,null,2));
  if (errors.length) throw new Error('errors: ' + errors.join(' | '));
  console.log('CLASSROOM_STYLE_SMOKE_OK ' + root);
} finally {
  await context.close(); await browser.close();
}
