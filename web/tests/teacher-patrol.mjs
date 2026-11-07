import assert from 'node:assert/strict';import {teacherPatrol} from '../renderer/teacher-patrol.mjs';
for(let t=0;t<24;t+=.01){const p=teacherPatrol(t),q=teacherPatrol(t+.01);assert.ok(p.x-.45> .35-4);assert.ok(p.x+.45< .35-1.4);assert.ok(p.z+.5< -1.3);assert.ok(p.z-.5> -2.5);assert.ok(Math.abs(p.x-q.x)<.004);}
console.log('TEACHER_FRONT_SIDE_LANE_CLEAR');
