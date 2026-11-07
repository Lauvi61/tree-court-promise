import {evaluateCourseExercise} from './course-exercises.js';
// 停笔检验只记录真实作答，不锁定章节；看解释、切换课时不计刷题。
export function mountCourseCheckpoints(p,stage,host,{state,record,notify,favorite=()=>''}){
 const items=(p.course?.checkpoints||[]).filter(x=>x.stage===stage);if(!items.length)return;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const section=document.createElement('section');section.className='course-checkpoints';section.setAttribute('aria-label','停笔检验');
 section.innerHTML=`<h3>停笔推一步</h3><p class="muted small">先选推理依据，再对照解释；可以重试，也可按自己的节奏继续。</p>${items.map(x=>`<fieldset data-checkpoint="${esc(x.id)}"><legend>${esc(x.question)}</legend>${favorite({kind:"exercise",point:p.id,item:x.id})}<div class="checkpoint-choices">${x.choices.map((t,i)=>`<button type="button" data-response="${i}" aria-pressed="false">${esc(t)}</button>`).join('')}</div><div class="checkpoint-feedback" role="status"></div></fieldset>`).join('')}`;
 host.querySelector('.network-stage-nav').after(section);
 for(const x of items){
  const field=[...section.querySelectorAll('[data-checkpoint]')].find(e=>e.dataset.checkpoint===x.id),started=performance.now();
  const draw=last=>{if(!last)return;field.querySelectorAll('[data-response]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.response)===last.response)));field.querySelector('.checkpoint-feedback').innerHTML=`<p><strong>${last.correct?'这条推理成立':'再检查这一步的条件'}</strong></p><p>${esc(x.explanation)}</p><p class="muted small">可修改后再试；不扣好感，不中断课堂。</p>`;};
  draw(state().course_attempts?.[`${p.id}:${x.id}`]?.at(-1));
  field.querySelectorAll('[data-response]').forEach(b=>b.onclick=()=>{try{
   const response=Number(b.dataset.response),correct=evaluateCourseExercise(x,response);
   record('course_attempt',{point_id:p.id,exercise_id:x.id,response,response_ms:Math.min(900000,Math.round(performance.now()-started))});
   draw({response,correct});
  }catch(error){notify(error.message);}});
 }
}
