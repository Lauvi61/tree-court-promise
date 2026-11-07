// 只展示给定公式的前若干项；证明来自公式，不因移动滑块记作答或学习完成。
export function mountSqueezeVisual(panel){
 panel.innerHTML='<h3>区间变窄，是否一定收敛？</h3><label>对照情形<select id="squeeze-mode"><option value="convergent">两端都趋于 1</option><option value="drifting">宽度趋零，但整体向右上方移动</option></select></label><label>显示前 N 项<input id="squeeze-count" type="range" min="4" max="40" value="20"></label><div id="squeeze-plot"></div><p id="squeeze-result" role="status"></p><p class="muted small">蓝点为中间项，竖线两端为上下界。有限图示不能证明极限；请核对下方对所有 n 有效的公式。改变图示不计作答。</p>';
 const mode=panel.querySelector('#squeeze-mode'),count=panel.querySelector('#squeeze-count');
 const draw=()=>{const n=Number(count.value),drifting=mode.value==='drifting',base=drifting?n+2:2.2;const x=k=>35+510*k/n,y=v=>230-v/base*205;
  const dots=Array.from({length:n},(_,i)=>{const k=i+1,c=drifting?k:1,a=drifting?k:1+Math.sin(k)/(2*k);return `<path d="M${x(k)} ${y(c-1/k)}V${y(c+1/k)}" stroke="#9aaf87" stroke-width="2"/><circle cx="${x(k)}" cy="${y(a)}" r="3" fill="#285b49"/>`;}).join('');
  panel.querySelector('#squeeze-plot').innerHTML=`<svg viewBox="0 0 580 270" role="img" aria-label="上下界与中间数列的前${n}项"><path d="M35 15V230H555" stroke="#939f8d" fill="none"/><text x="40" y="18" fill="#284c3a" font-size="13">${drifting?'纵轴 0～'+base:'纵轴 0～2.2'}</text>${dots}<text x="450" y="255" font-size="13" fill="#284c3a">n=1…${n}</text></svg>`;
  panel.querySelector('#squeeze-result').textContent=drifting?'l_n=n-1/n，a_n=n，u_n=n+1/n。宽度 2/n→0，但上下界及中间项均趋于正无穷，不能推出有限极限。':'l_n=1-1/n，a_n=1+sin(n)/(2n)，u_n=1+1/n。由 |sin n|≤1，夹住关系对所有 n≥1 成立，且两端都趋于 1，所以 a_n→1。';
 };mode.onchange=draw;count.oninput=draw;draw();
}
