// 使用隔离数据库验证错题与收藏的实际入口。
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {join} from 'node:path';

const require=createRequire(join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json'));
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const base='http://127.0.0.1:8779';
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 const {catalog}=await (await page.request.get(base+'/api/catalog')).json();
 const chapter=catalog.subjects.find(s=>s.id==='calculus').chapters[0];
 const point=catalog.points.find(p=>p.id===chapter.points[0]);
 const q=point.course.exercises[0];
 await page.goto(base+'/#library');
 await page.locator('#hub-subject').selectOption('calculus');
 await page.locator(`[data-hub-practice="${chapter.id}"]`).click();
 const exercise=page.locator('[data-hub-exercise="0"]');
 await exercise.getByRole('button',{name:'收藏这道题'}).click();
 await exercise.locator('[name="response"]').fill('-999');
 await exercise.getByRole('button',{name:'核对推演'}).click();
 await exercise.getByText('再检查一次条件').waitFor();
 await page.locator('#hub-chapter-test').click();
 for(const id of chapter.test_points){
  const test=catalog.points.find(p=>p.id===id).test;
  await page.locator(`#chapter-test [name="${id}"][value="${(test.answer+1)%test.choices.length}"]`).check();
 }
 await page.locator('#chapter-test button[type="submit"]').click();
 await page.locator('.test-review').first().waitFor();
 await page.locator('#modal-close').click();
 await page.getByRole('link',{name:'错题本'}).click();
 await page.getByRole('heading',{name:q.question,exact:true}).first().waitFor();
 await page.getByText('章节检测 ·', {exact:false}).first().waitFor();
 await page.getByRole('link',{name:'收藏夹'}).click();
 await page.getByRole('heading',{name:q.question,exact:true}).waitFor();
 await page.reload();
 await page.getByRole('button',{name:'回到题目'}).click();
 await exercise.locator('[name="response"]').fill(String(q.answer));
 await exercise.getByRole('button',{name:'核对推演'}).click();
 await exercise.getByText('推演成立',{exact:true}).waitFor();
 await page.getByRole('link',{name:'错题本'}).click();
 await page.getByText('最近已答对',{exact:false}).first().waitFor();

 await page.getByRole('link',{name:/考试区/}).click();
 await page.locator('[data-level="cs408"]').click();
 await page.locator('[data-start="cs408-2026"][data-mode="practice"]').click();
 const first=page.locator('.exam-question').filter({has:page.locator('[data-answer="1"]')});
 await first.getByRole('button',{name:'收藏原卷第1题'}).click();
 await page.locator('[data-answer="1"]').selectOption('B');
 await page.locator('[data-answer="2"]').selectOption('D');
 await page.locator('[data-answer="41"]').fill('这里是未完成的推导。');
 assert.equal(await page.locator('.exam-question-wrong').count(),0);
 page.once('dialog',d=>d.accept());
 await page.locator('#exam-submit').click();
 await first.getByText('答错 · 参考 A').waitFor();
 const written=page.locator('.exam-question').filter({has:page.locator('[data-answer="41"]')});
 await written.getByRole('button',{name:'自评为错题'}).click();
 await written.getByRole('button',{name:'撤销错题标记'}).waitFor();
 await page.getByRole('link',{name:'错题本'}).click();
 await page.locator('#question-source').selectOption('exam');
 await page.locator('.question-review-card h2').getByText(/第 41 题/).waitFor();
 assert.equal(await page.locator('.question-review-card').count(),2);
 await page.getByRole('link',{name:'收藏夹'}).click();
 const examCard=page.locator('.question-review-card').filter({hasText:'第 1 题'});
 await examCard.getByRole('button',{name:'查看原卷答卷'}).click();
 await first.getByText('答错 · 参考 A').waitFor();
 await page.getByRole('link',{name:'收藏夹'}).click();
 await examCard.getByRole('button',{name:'收藏这道题'}).click();
 assert.equal(await examCard.count(),0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 assert.deepEqual(errors,[]);
 console.log('QUESTION_LIBRARY_BROWSER_OK');
}finally{
 await browser.close();
}
