// 实体黑板采用与网页相同的例题／公式双栏；按完整内容测量字号，不截断步骤。
export function drawLessonBoard(ctx,m){
 ctx.fillStyle='#254e3b';ctx.fillRect(0,0,1536,640);ctx.fillStyle='#eee8cb';ctx.font='24px Microsoft YaHei';ctx.fillText('神悟树庭 / 例题与公式对照',55,40);
 let size=48;while(size>20){ctx.font=size+'px Microsoft YaHei';if(ctx.measureText(m.title).width<1410)break;size--;}ctx.fillText(m.title,55,108);
 ctx.strokeStyle='#a7c6a3';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(960,145);ctx.lineTo(960,610);ctx.stroke();
 const wrap=(text,width,font)=>{ctx.font=font+'px Microsoft YaHei';const rows=[];for(const p of String(text).split('\n')){let row='';for(const c of p){if(ctx.measureText(row+c).width>width){rows.push(row);row='';}row+=c;}rows.push(row);}return rows;};
 const column=(text,x,width)=>{let font=30,rows=wrap(text,width,font);while(rows.length*(font+10)>440&&font>8){font--;rows=wrap(text,width,font);}ctx.font=font+'px Microsoft YaHei';rows.forEach((s,i)=>ctx.fillText(s,x,175+i*(font+10)));};
 const stage=m.stage??1;const left=stage===0?'概念与公式\n'+m.formula:stage===2?'独立检验\n'+(m.transferQuestion||m.question):'经典例题\n'+m.question+'\n'+m.steps.map((s,i)=>(i+1)+'. '+s.text).join('\n')+'\n解答结论：'+m.answer;
 column(left,55,855);
 column('公式与结论\n'+m.formula+'\n\n知识点结论\n'+m.conclusion+'\n\n适用条件与边界\n'+m.condition,995,485);
}
