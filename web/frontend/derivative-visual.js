// 割线只能展示有限增量；是否可导由旁边的完整差商公式判断，不写学习事件。
export function mountDerivativeVisual(panel){
 panel.innerHTML='<h3>同一固定点，从左右观察割线</h3><label>函数<select id="derivative-function"><option value="square">f(x)=x²，固定点 a=2</option><option value="absolute">f(x)=|x|，固定点 a=0</option></select></label><label>输入增量方向<select id="derivative-side"><option value="1">正增量：从右靠近</option><option value="-1">负增量：从左靠近</option></select></label><label>缩小增量（始终非零）<input id="derivative-scale" type="range" min="0" max="3" step="0.1" value="1"></label><div id="derivative-plot"></div><p id="derivative-result" role="status"></p><p id="derivative-proof"></p><p class="muted small">蓝线为割线。平方函数的虚线是有限斜率切线；绝对值函数用左右差商检验，不画一条虚假的双侧切线。有限图示只辅助观察，切换不计作答。</p>';
 const fn=panel.querySelector('#derivative-function'),side=panel.querySelector('#derivative-side'),scale=panel.querySelector('#derivative-scale');
 const draw=()=>{const absolute=fn.value==='absolute',a=absolute?0:2,f=x=>absolute?Math.abs(x):x*x,h=Number(side.value)*10**(-Number(scale.value)),slope=absolute?(h>0?1:-1):4+h;
  const X=x=>290+(x-a)*220,Y=y=>160-(y-f(a))*(absolute?80:20);
  const path=Array.from({length:101},(_,i)=>{const x=a-1.1+2.2*i/100;return `${i?'L':'M'}${X(x)},${Y(f(x))}`;}).join(' ');
  const line=m=>`M${X(a-1.1)},${Y(f(a)-1.1*m)}L${X(a+1.1)},${Y(f(a)+1.1*m)}`;
  panel.querySelector('#derivative-plot').innerHTML=`<svg viewBox="0 0 580 260" role="img" aria-label="${absolute?'绝对值函数':'平方函数'}的${h>0?'右':'左'}侧割线"><path d="M35 160H550 M290 25V235" stroke="#aaa893" fill="none"/><path d="${path}" stroke="#285b49" stroke-width="3" fill="none"/>${absolute?'':`<path d="${line(4)}" stroke="#a58152" stroke-dasharray="6 4" fill="none"/>`}<path d="${line(slope)}" stroke="#557c9c" stroke-width="2" fill="none"/><circle cx="290" cy="160" r="5" fill="#285b49"/><circle cx="${X(a+h)}" cy="${Y(f(a+h))}" r="5" fill="#b05c45"/><text x="300" y="250" font-size="14" fill="#284c3a">固定点 a=${a}</text></svg>`;
  panel.querySelector('#derivative-result').textContent=`固定点 (${a}, ${f(a)})；图中水平参考线为 y=${f(a)}，横纵比例已缩放。h=${h.toFixed(4)}，f(a+h)−f(a)=${(f(a+h)-f(a)).toFixed(6)}，割线斜率=${slope.toFixed(4)}。`;
  panel.querySelector('#derivative-proof').textContent=absolute?'完整公式：|h|/h 在 h>0 时恒为 1，在 h<0 时恒为 −1。左右有限极限不相等，所以在 0 不可导；对称差商为零不能代替这个检验。':'完整公式：[(2+h)²−4]/h=4+h（h≠0）。不论从正侧还是负侧，只要 h→0，差商都趋于 4，因此 f′(2)=4。';
 };fn.onchange=draw;side.onchange=draw;scale.oninput=draw;draw();
}
