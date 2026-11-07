// 点值与邻近极限分开显示；观察控件不写答题、好感或完成事件。
export function mountContinuityVisual(panel){
 panel.innerHTML='<h3>同样的邻近值，零点接上了吗？</h3><label>外层在零的取值<select id="continuity-point-value"><option value="0">标准 sgn：f(0)=0</option><option value="1">修改分段函数：f(0)=1</option></select></label><label>追踪输入 x<input id="continuity-input" type="range" min="-1" max="1" step="0.05" value="-0.5"></label><p id="continuity-chain" role="status"></p><div id="continuity-plot"></div><p id="continuity-result"></p><p class="muted small">图中两段横线都是 H(x)=f(x²)。空心点表示邻近极限的位置，实心点表示 H(0)。公式保证每个 x≠0 都有 x²>0、H(x)=1；有限图示仅辅助观察。改变控件不计作答。</p>';
 const point=panel.querySelector('#continuity-point-value'),input=panel.querySelector('#continuity-input');
 const draw=()=>{const atZero=Number(point.value),x=Number(input.value),u=x*x,h=x===0?atZero:1;
  panel.querySelector('#continuity-chain').textContent=`输入 x=${x.toFixed(2)} → 内层 u=x²=${u.toFixed(4)} → 外层 f(u)=${h}。零点：0 → 0 → ${atZero}。`;
  panel.querySelector('#continuity-plot').innerHTML=`<svg viewBox="0 0 580 210" role="img" aria-label="复合函数附近恒为1，零点取${atZero}"><path d="M35 160H550 M290 25V180" fill="none" stroke="#969f8d"/><path d="M40 60H284 M296 60H545" fill="none" stroke="#285b49" stroke-width="3"/><circle cx="290" cy="60" r="6" fill="#fffdf4" stroke="#285b49" stroke-width="2"/><circle cx="290" cy="${atZero?60:160}" r="5" fill="#a95745"/><circle cx="${290+x*245}" cy="${h?60:160}" r="4" fill="#b58c31"/><text x="48" y="47" font-size="15" fill="#284c3a">H(x)=1（x≠0）</text><text x="310" y="${atZero?92:150}" font-size="15" fill="#854436">H(0)=${atZero}</text><text x="290" y="200" text-anchor="middle" font-size="15" fill="#284c3a">x=0</text></svg>`;
  panel.querySelector('#continuity-result').textContent=atZero?'左右极限=1，点值=1，所以连续。外层仍在 u=0 跳跃；只有复合所经过的非负输入被送到了同一个值。':'左右极限=1，点值=0，所以可去间断。把输入滑到零：点值并不是用附近输出自动填上的。';
 };point.onchange=draw;input.oninput=draw;draw();
}
