// 数理与计算机使用严谨板书；英语内容继续沿用原记忆线索。
export const isTechnical=p=>['calculus','linear','probability','cs408'].includes(p?.subject);
export function boardSections(p){
 const c=p.course||{},ex=c.worked_example;
 return [{heading:'公式与定义',text:c.board||p.quick_meaning||p.summary},
 {heading:'结论与适用条件',text:c.board_condition||(c.textbook||[]).find(s=>/边界|条件|误区/.test(s.heading))?.text||p.summary},
 {heading:'经典例子',text:ex?`${ex.question}\n${(ex.steps||[]).map(s=>s.text).join('；')}\n结论：${ex.answer}`:p.example?`${p.example.en}\n${p.example.zh}`:p.prompt}].filter(s=>s.text);
}
export const boardText=p=>isTechnical(p)?boardSections(p).map(s=>`${s.heading}：${s.text}`).join('\n'):p.course?.board||p.memoryHook;
export const lessonSections=p=>isTechnical(p)?[...(p.course?.textbook||[]).filter(s=>!/记忆|联想/.test(s.heading)),...boardSections(p)]:p.course?.textbook||[];
export const reviewText=p=>isTechnical(p)?boardText(p):p.memoryHook;
export function boardModel(p){
 if(!isTechnical(p))return null;
 const c=p.course||{},ex=c.worked_example,sections=boardSections(p);
 return {title:p.concept,question:ex?.question||p.example?.en||p.prompt,steps:ex?.steps?.map(s=>({label:s.label,text:s.text}))||[],answer:String(ex?.answer??p.example?.zh??''),formula:sections[0]?.text||'',conclusion:p.summary||'',condition:sections[1]?.text||''};
}
const escapeBoard=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function boardMarkup(p){
 const m=boardModel(p);if(!m)return `<div class="network-board">${escapeBoard(boardText(p))}</div>`;
 return `<section class="network-board lesson-blackboard" aria-label="例题与公式对照板书"><div class="board-example"><h3>经典例题</h3><p>${escapeBoard(m.question)}</p><ol>${m.steps.map(s=>`<li><strong>${escapeBoard(s.label)}</strong><p>${escapeBoard(s.text)}</p></li>`).join('')}</ol><p class="board-answer"><strong>解答结论：</strong>${escapeBoard(m.answer)}</p></div><aside class="board-formulas"><h3>公式与结论</h3><p>${escapeBoard(m.formula)}</p><h4>知识点结论</h4><p>${escapeBoard(m.conclusion)}</p><h4>适用条件 · 易错边界</h4><p>${escapeBoard(m.condition)}</p></aside></section>`;
}
