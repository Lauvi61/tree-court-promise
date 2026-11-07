import test from 'node:test';import assert from 'node:assert/strict';
import {taylorSineSample} from '../frontend/taylor-visual.js';
test('正弦截断的理论误差界覆盖观察区间，零点与奇对称正确',()=>{
 for(const n of [1,3,5,9]){
  const zero=taylorSineSample(0,n);assert.equal(zero.polynomial,0);assert.equal(zero.bound,0);
  for(let i=1;i<=80;i++){
   const x=i/20,a=taylorSineSample(x,n),b=taylorSineSample(-x,n);
   assert.equal(a.polynomial,-b.polynomial);assert.equal(a.bound,b.bound);
   assert.ok(a.numericError<=a.bound+1e-12,`${n},${x}`);
  }
 }
 const s=taylorSineSample(1,5);assert.ok(Math.abs(s.polynomial-101/120)<1e-15);assert.equal(s.bound,1/5040);
 assert.ok(taylorSineSample(4,3).numericError>taylorSineSample(4,1).numericError);
});
test('图示拒绝非有限输入和未提供的阶数，不将不支持范围伪造成图像',()=>{
 for(const x of [NaN,Infinity,-Infinity,4.1])assert.throws(()=>taylorSineSample(x,5),RangeError);
 for(const n of [0,2,6,NaN])assert.throws(()=>taylorSineSample(1,n),RangeError);
});
