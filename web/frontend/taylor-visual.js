// 有限多项式的数值观察与理论余项界分开；不产生学习、答题或好感事件。
const degrees=new Set([1,3,5,9]);
export function taylorSineSample(x,n){
 if(!Number.isFinite(x)||Math.abs(x)>4||!degrees.has(n))throw new RangeError('图示仅支持[-4,4]和1、3、5、9阶');
 let polynomial=0,term=x;
 for(let k=1;k<=n;k+=2){polynomial+=term;term*=-x*x/((k+1)*(k+2));}
 let factorial=1;for(let k=2;k<=n+2;k++)factorial*=k;
 return {x,n,polynomial,value:Math.sin(x),numericError:Math.abs(polynomial-Math.sin(x)),bound:Math.abs(x)**(n+2)/factorial};
}
export function mountTaylorVisual(panel){
 panel.innerHTML='<h3>多项式靠近正弦，误差有多大？</h3><label>保留的最高奇次项<select id="taylor-degree"><option value="1">一次：x</option><option value="3">三次：x−x³/6</option><option value="5" selected>五次：再加x⁵/120</option><option value="9">九次：继续交替展开</option></select></label><label>观察输入x（图示区间−4到4）<input id="taylor-input" type="range" min="-4" max="4" step="0.05" value="1"></label><div id="taylor-plot"></div><p id="taylor-result" role="status"></p><p id="taylor-bound"></p><p class="muted small">红线为sin x，蓝线为截断多项式。这里只画有限区间；曲线采样和浮点数值差不代替证明。理论界来自sin各阶导数绝对值≤1，且下一偶次项为0。切换控件不计作答。</p>';
 const degree=panel.querySelector('#taylor-degree'),input=panel.querySelector('#taylor-input');
 const draw=()=>{const n=Number(degree.value),x=Number(input.value),s=taylorSineSample(x,n);
  const values=Array.from({length:161},(_,i)=>taylorSineSample(-4+i*.05,n)),height=Math.max(1.2,...values.map(v=>Math.abs(v.polynomial)))*1.1;
  const X=x=>40+(x+4)*62.5,Y=y=>125-y/height*100,path=key=>values.map((v,i)=>`${i?'L':'M'}${X(v.x)},${Y(v[key])}`).join(' ');
  panel.querySelector('#taylor-plot').innerHTML=`<svg viewBox="0 0 580 280" role="img" aria-label="正弦与${n}次截断多项式在负4到4上的对照"><path d="M40 125H540 M290 20V230" fill="none" stroke="#9a9f8d"/><path d="${path('value')}" stroke="#ac604f" fill="none" stroke-width="2"/><path d="${path('polynomial')}" stroke="#4b7895" fill="none" stroke-width="2"/><path d="M${X(x)} ${Y(s.value)}V${Y(s.polynomial)}" stroke="#a18142" stroke-width="3"/><circle cx="${X(x)}" cy="${Y(s.value)}" r="3" fill="#ac604f"/><circle cx="${X(x)}" cy="${Y(s.polynomial)}" r="3" fill="#4b7895"/><text x="42" y="252" font-size="14" fill="#284c3a">横轴−4到4；纵轴约±${height.toFixed(2)}</text></svg>`;
  panel.querySelector('#taylor-result').textContent=`x=${x.toFixed(2)}，P${n}(x)=${s.polynomial.toFixed(7)}，sin x=${s.value.toFixed(7)}；数值差（浮点计算）≈${s.numericError.toExponential(3)}。`;
  panel.querySelector('#taylor-bound').textContent=`用${n+1}阶公式（其偶次项系数为0）：|R|≤|x|^${n+2}/${n+2}!，本点理论界为${s.bound.toExponential(3)}。这是满足条件后的证明界，不是从曲线距离猜出的结果。`;
 };degree.onchange=draw;input.oninput=draw;draw();
}
