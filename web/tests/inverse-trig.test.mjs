import test from 'node:test';import assert from 'node:assert/strict';import {principalSineAngle} from '../frontend/inverse-trig-math.js';
test('主值角保留正弦而不无条件返回原角，所有样本都在闭主值区间',()=>{
 for(let i=-800;i<=800;i++){
  const theta=i*Math.PI/100,phi=principalSineAngle(theta);assert.ok(phi>=-Math.PI/2&&phi<=Math.PI/2);assert.ok(Math.abs(Math.sin(phi)-Math.sin(theta))<1e-12);
 }
 assert.ok(Math.abs(principalSineAngle(5*Math.PI/6)-Math.PI/6)<1e-12);
 assert.ok(Math.abs(principalSineAngle(2)-(Math.PI-2))<1e-12);
 assert.equal(principalSineAngle(Math.PI/2),Math.PI/2);
 for(const x of [NaN,Infinity,-Infinity])assert.throws(()=>principalSineAngle(x));
});
