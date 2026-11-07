import {allChapters} from './course-ui.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={exercise:'课程练习',point:'知识点练习',chapter:'章节检测',vocab:'词汇练习',exam:'原卷试题'};
const questionKey=ref=>JSON.stringify([ref.kind,ref.point,ref.item??'']);
const reference=({kind,point,item,title,session_id,page})=>({kind,point,item,title,session_id,page});

export function collectPracticeMistakes(state){
 const result=[];
 const collect=(ref,attempts)=>{
  const wrong=attempts.filter(attempt=>!attempt.correct);
  if(wrong.length)result.push({...ref,...wrong.at(-1),count:wrong.length,mastered:attempts.at(-1).correct});
 };
 for(const [point,attempts] of Object.entries(state.attempts))collect({kind:'point',point},attempts);
 for(const [id,attempts] of Object.entries(state.course_attempts)){
  const separator=id.indexOf(':');
  collect({kind:'exercise',point:id.slice(0,separator),item:id.slice(separator+1)},attempts);
 }
 for(const [point,attempts] of Object.entries(state.chapter_question_attempts||{}))
  collect({kind:'chapter',point},attempts);
 for(const [point,attempts] of Object.entries(state.vocabulary_attempts))
  collect({kind:'vocab',point,item:'spelling'},attempts.filter(a=>a.mode==='spelling'));
 return result;
}

export function createQuestionLibrary({content,catalog,state,api,read,write,key,profile,tabs,open,notify}){
 const storageKey=()=>`${key}.questionFavorites.${profile()}`;
 const favorites=()=>read(storageKey(),{});
 const saved=ref=>Object.hasOwn(favorites(),questionKey(ref));
 const buttonText=active=>active?'★ 已收藏':'☆ 收藏';
 const button=(ref,label='收藏这道题')=>{
  const active=saved(ref);
  return `<button type="button" class="question-favorite text-button" data-favorite-question="${esc(JSON.stringify(reference(ref)))}" aria-label="${esc(label)}" aria-pressed="${active}">${buttonText(active)}</button>`;
 };
 document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-favorite-question]');
  if(!button)return;
  const ref=JSON.parse(button.dataset.favoriteQuestion),id=questionKey(ref),items=favorites();
  const active=!Object.hasOwn(items,id);
  if(active)items[id]={...reference(ref),at:new Date().toISOString()};
  else delete items[id];
  if(!write(storageKey(),items)){notify('收藏未能保存，请检查设备存储。');return;}
  if(content.querySelector('[data-question-library="favorites"]')){
   content.querySelector(`[data-question-library="favorites"]`).dispatchEvent(new Event('favoriteschanged'));
  }else{
   for(const control of document.querySelectorAll('[data-favorite-question]')){
    if(questionKey(JSON.parse(control.dataset.favoriteQuestion))!==id)continue;
    control.setAttribute('aria-pressed',String(active));
    control.textContent=buttonText(active);
   }
  }
 });

 function describe(ref,points,chapters,words){
  const {kind,item}=ref;
  if(kind==='exam')return {title:`${ref.title} · ${({writing:'写作',translation:'翻译'})[item]||`第 ${item} 题`}`,answer:ref.expected};
  if(kind==='vocab'){
   const word=words.get(ref.point);
   return {title:word?`根据释义拼写：${word.meaning}`:'词汇拼写练习',answer:word?.word};
  }
  const point=points.get(ref.point),chapter=chapters.get(point?.chapter);
  const exercise=kind==='exercise'?point?.course?.exercises.find(q=>q.id===item):kind==='chapter'?point?.test:null;
  const title=exercise?.question||(kind==='point'?point?.prompt:null)||point?.concept||'原题暂不可用';
  const answer=exercise?(exercise.type==='choice'||kind==='chapter'?exercise.choices[exercise.answer]:exercise.answer):point?.clues.find(c=>c.correct)?.text;
  return {title,answer,chapter:chapter?.title,chapterId:chapter?.id,explanation:exercise?.explanation};
 }
 function render(mode){
  const isMistakes=mode==='mistakes';
  const points=new Map(catalog().points.map(p=>[p.id,p]));
  const chapters=new Map(allChapters(catalog()).map(c=>[c.id,c]));
  const words=new Map((catalog().vocabulary_banks?.cet4?.entries||[]).map(w=>[w.id,w]));
  let exam=[],page=0;
  const limit=25;
  content.innerHTML=`<section data-question-library="${mode}"><p class="eyebrow">KNOWLEDGE LIBRARY · REVIEW</p><h1>智库 · ${isMistakes?'错题本':'收藏夹'}</h1>${tabs(mode)}
  <p class="muted">${isMistakes?'练习和章节检测的错题自动归档。已核对参考答案的原卷客观题在交卷后收录，其他题可在答卷中自评。':'做题时可以收藏，之后从这里回到题目。收藏保存在当前设备。'}</p>
  <div class="notes-controls"><label>题目来源<select id="question-source"><option value="">全部</option><option value="practice">课程与词汇</option><option value="exam">原卷</option></select></label>
  ${isMistakes?'<label><input id="question-unresolved" type="checkbox"> 隐藏已答对的课程错题</label>':''}</div>
  <p id="question-library-status" role="status"></p><div id="question-library-list" class="question-library-list"></div>
  <div class="button-row"><button type="button" class="button light" id="questions-prev">上一页</button><span id="question-library-page"></span><button type="button" class="button light" id="questions-next">下一页</button></div></section>`;
  const root=content.querySelector('[data-question-library]');
  const draw=()=>{
   const items=isMistakes?[...collectPracticeMistakes(state()),...exam]:Object.values(favorites());
   const source=root.querySelector('#question-source').value;
   const filtered=items.filter(item=>(!source||(source==='exam')===(item.kind==='exam'))&&(!root.querySelector('#question-unresolved')?.checked||!item.mastered))
    .sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
   const max=Math.max(0,Math.ceil(filtered.length/limit)-1);
   page=Math.min(page,max);
   const shown=filtered.slice(page*limit,(page+1)*limit);
   const list=root.querySelector('#question-library-list');
   list.innerHTML=shown.map((ref,i)=>{
    const info=describe(ref,points,chapters,words);
    const point=points.get(ref.point);
    const response=ref.kind==='point'?point?.clues.find(c=>c.id===ref.clue_id)?.text:
     ref.kind==='chapter'?point?.test?.choices[ref.response]:
     ref.kind==='exercise'&&typeof ref.response==='number'?point?.course?.exercises.find(e=>e.id===ref.item)?.choices?.[ref.response]:ref.response;
    return `<article class="question-review-card"><small>${esc(labels[ref.kind])}${info.chapter?` · ${esc(info.chapter)}`:''}${isMistakes?` · 错 ${ref.count} 次${ref.mastered?' · 最近已答对':''}`:''}</small><h2>${esc(info.title)}</h2>
    ${isMistakes?`<p>上次错答：${esc(response|| (ref.kind==='exam'?'未作答':'见原题'))}</p>${info.answer!=null?`<p>参考答案：${esc(info.answer)}</p>`:''}${info.explanation?`<p class="muted">${esc(info.explanation)}</p>`:''}`:''}
    <div class="button-row"><button type="button" class="button light" data-open-question="${i}">${ref.kind==='exam'?'查看原卷答卷':'回到题目'}</button>${button(ref)}</div></article>`;
   }).join('')||`<p class="empty-state">${isMistakes?'这里还没有符合条件的错题。':'这里还没有符合条件的收藏。'}</p>`;
   for(const control of list.querySelectorAll('[data-open-question]'))
    control.onclick=()=>open(shown[Number(control.dataset.openQuestion)]);
   root.querySelector('#question-library-page').textContent=`${filtered.length} 道 · ${page+1}/${max+1}`;
   root.querySelector('#questions-prev').disabled=page===0;
   root.querySelector('#questions-next').disabled=page===max;
  };
  root.onchange=()=>{page=0;draw();};
  root.addEventListener('favoriteschanged',draw);
  root.querySelector('#questions-prev').onclick=()=>{page--;draw();};
  root.querySelector('#questions-next').onclick=()=>{page++;draw();};
  draw();
  if(!isMistakes)return;
  const status=root.querySelector('#question-library-status');
  status.textContent='正在读取原卷错题…';
  api('/api/exams/mistakes').then(({items})=>{
   if(!root.isConnected)return;
   const byQuestion=new Map();
   for(const item of items.sort((a,b)=>b.at-a.at)){
    const ref={...item,kind:'exam',point:item.paper_id,at:new Date(item.at*1000).toISOString()};
    const id=questionKey(ref),prior=byQuestion.get(id);
    if(prior)prior.count++;
    else byQuestion.set(id,{...ref,count:1});
   }
   exam=[...byQuestion.values()];
   status.textContent='';
   draw();
  }).catch(()=>{if(root.isConnected)status.textContent='原卷错题暂时无法读取，课程错题仍可查看。';});
 }
 return {button,render};
}
