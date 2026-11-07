export function mountTeachingBoard(host){
 const el=document.createElement('section');el.className='teaching-blackboard';el.setAttribute('aria-label','随课堂进度更新的黑板');host.append(el);
 const add=(parent,tag,text,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;n.textContent=String(text??'');parent.append(n);return n;};
 return {el,draw(word,line,m){
  el.replaceChildren();add(el,'small',m?.stageLabel||'课堂板书');add(el,'h2',word||m?.title||'神悟树庭');
  const cols=document.createElement('div');cols.className='teaching-board-columns';el.append(cols);const left=document.createElement('article'),right=document.createElement('aside');cols.append(left,right);
  if(!m){add(left,'p',line||'观察，追问，再用自己的话解释。');return;}
  const stage=m.stage??1;
  if(stage===0){add(left,'h3','概念与公式');add(left,'p',m.formula);add(right,'h3','条件与边界');add(right,'p',m.condition);add(right,'h3','本节目标');add(right,'p',m.conclusion);}
  else if(stage===2){add(left,'h3','换一组条件 · 独立检验');add(left,'p',m.transferQuestion||m.question);add(right,'h3','可用公式');add(right,'p',m.formula);add(right,'h3','检查条件');add(right,'p',m.condition);}
  else{add(left,'h3','经典例题');add(left,'p',m.question);const list=document.createElement('ol');left.append(list);for(const s of m.steps||[]){const li=document.createElement('li');list.append(li);if(s.label)add(li,'strong',s.label);add(li,'p',s.text);}add(left,'p','结论：'+m.answer,'board-answer');add(right,'h3','公式与结论');add(right,'p',m.formula);add(right,'h3','条件与边界');add(right,'p',m.condition);}
 },dispose(){el.remove();}};
}
