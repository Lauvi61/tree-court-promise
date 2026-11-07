import test from 'node:test';import assert from 'node:assert/strict';
import {parabolicSlice} from '../frontend/double-integral-visual.js';
test('同一区域横竖截线满足全部边界，竖切在x=1换下界',()=>{
 for(let i=0;i<=100;i++){
  const y=-1+3*i/100,h=parabolicSlice('horizontal',y);assert.ok(h.high>=h.low-1e-12);
  for(const x of [h.low,h.high,(h.low+h.high)/2]){assert.ok(x>=y*y-1e-12);assert.ok(x<=y+2+1e-12);}
  const x=4*i/100,v=parabolicSlice('vertical',x);
  assert.ok(v.high>=v.low-1e-12);
  for(const z of [v.low,v.high,(v.low+v.high)/2]){assert.ok(z*z<=x+1e-12);assert.ok(x<=z+2+1e-12);}
  if(x<=1)assert.ok(Math.abs(v.integral)<1e-12);
 }
 assert.equal(parabolicSlice('vertical',1).low,-1);assert.equal(parabolicSlice('vertical',2).low,0);
 assert.ok(parabolicSlice('horizontal',-.5).integral<0);
});
test('两种截线独立数值积分都收敛到45/8；非法参数不伪造图形',()=>{
 const integrate=(order,a,b,n)=>{let sum=0;for(let i=0;i<n;i++)sum+=parabolicSlice(order,a+(i+.5)*(b-a)/n).integral;return sum*(b-a)/n;};
 assert.ok(Math.abs(integrate('horizontal',-1,2,5000)-45/8)<1e-6);
 assert.ok(Math.abs(integrate('vertical',0,4,5000)-45/8)<1e-6);
 for(const [o,v] of [['other',1],['horizontal',NaN],['horizontal',3],['vertical',-1],['vertical',Infinity]])assert.throws(()=>parabolicSlice(o,v),RangeError);
});
