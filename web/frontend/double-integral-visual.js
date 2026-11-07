// 同一抛物线区域的两种截线；控件不提交作答或学习事件。
export function parabolicSlice(order,t){
 const horizontal=order==='horizontal';
 if(!['horizontal','vertical'].includes(order)||!Number.isFinite(t)||t<(horizontal?-1:0)||t>(horizontal?2:4))throw new RangeError('截线参数超出区域投影');
 const low=horizontal?t*t:Math.max(-Math.sqrt(t),t-2),high=horizontal?t+2:Math.sqrt(t);
 const integral=t*(high*high-low*low)/2;
 return {order,t,low,high,integral};
}
export function mountDoubleIntegralVisual(panel){
 panel.innerHTML='<h3>同一块区域，横切还是竖切？</h3><p>D由x=y²与x=y+2围成，被积函数为xy。</p><label>截线方向<select id="double-slice-order"><option value="horizontal">固定y，先对x积分</option><option value="vertical">固定x，先对y积分</option></select></label><label>移动截线<input id="double-slice-value" type="range" min="-1" max="2" step="0.02" value="0.5"></label><div id="double-slice-plot"></div><p id="double-slice-result" role="status"></p><p id="double-slice-formula"></p><p class="muted small">截线结果可为负，它是xy的有向累加，不表示负的实际质量。完整积分为45/8；这里的有限图像不代替积分证明。方向和位置变化不计作答。</p>';
 const select=panel.querySelector('#double-slice-order'),input=panel.querySelector('#double-slice-value');
 const X=x=>50+x*110,Y=y=>250-y*85;
 const boundary=[...Array.from({length:81},(_,i)=>{const y=-1+3*i/80;return[y*y,y];}),...Array.from({length:81},(_,i)=>{const y=2-3*i/80;return[y+2,y];})];
 const draw=()=>{const s=parabolicSlice(select.value,Number(input.value)),h=s.order==='horizontal';
  const start=h?[s.low,s.t]:[s.t,s.low],end=h?[s.high,s.t]:[s.t,s.high];
  panel.querySelector('#double-slice-plot').innerHTML=`<svg viewBox="0 0 550 370" role="img" aria-label="抛物线与直线所围区域的${h?'横':'竖'}截线"><path d="M25 250H525 M50 25V345" stroke="#8b9789" fill="none"/><polygon points="${boundary.map(([x,y])=>`${X(x)},${Y(y)}`).join(' ')}" fill="#b6d6bc" fill-opacity=".6" stroke="#54796a"/><path d="M${X(start[0])} ${Y(start[1])}L${X(end[0])} ${Y(end[1])}" stroke="#b06842" stroke-width="5"/><text x="330" y="355" font-size="14" fill="#284c3a">x：0到4；y：−1到2</text><text x="90" y="52" font-size="14" fill="#284c3a">左边界x=y²；右边界x=y+2</text></svg>`;
  panel.querySelector('#double-slice-result').textContent=`固定${h?'y':'x'}=${s.t.toFixed(2)}，${h?'x':'y'}从${s.low.toFixed(4)}到${s.high.toFixed(4)}；该截线上的内层积分=${s.integral.toFixed(6)}（浮点显示）。`;
  panel.querySelector('#double-slice-formula').textContent=h?'横切：∫[−1,2]dy∫[y²,y+2]xy dx，一段即可。':'竖切：x∈[0,1]时y从−√x到√x；x∈[1,4]时y从x−2到√x。内层下界在x=1改变，需要分段。';
 };
 select.onchange=()=>{const h=select.value==='horizontal';input.min=h?'-1':'0';input.max=h?'2':'4';input.value=h?'0.5':'2';draw();};input.oninput=draw;draw();
}
