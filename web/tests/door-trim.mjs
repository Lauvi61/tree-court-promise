import assert from 'node:assert/strict';
import * as T from '../renderer/node_modules/three/build/three.module.js';
import {upgradeRoom} from '../renderer/classroom-upgrade.mjs';
const room=new T.Group(),scene=new T.Scene();scene.add(room);
function mesh(name,w,h,d,x,y,z){const m=new T.Mesh(new T.BoxGeometry(w,h,d));m.name=name;m.position.set(x,y,z);room.add(m);return m;}
const panel=mesh('Door_Panel',1.15,2.2,.06,-4.7,1.1,-5.84);
for(const [n,x]of [['L',-5.34],['R',-4.06]])mesh('Door_Frame'+n,.1,2.34,.15,x,1.17,-5.86);
mesh('Door_FrameTop',1.4,.1,.15,-4.7,2.27,-5.86);
const ceiling=mesh('Corridor_Ceil',2.6,.06,4.6,-4.7,2.6,-8.16);
const layout={bounds:[-7.45,7.45,-6.2,6.4],player_start:[1,1.65,2],colliders:[],walkable_surfaces:[]};
const door=upgradeRoom(T,room,layout);room.updateMatrixWorld(true);
const frames=[],boards=[];room.traverse(o=>{if(o.isMesh&&/^Door_Frame/.test(o.name))frames.push(o);if(o.isMesh&&/^Reference_Board_/.test(o.name))boards.push(o);});
assert.equal(frames.length,3,'one fixed frame only');
const right=Math.max(...frames.map(o=>new T.Box3().setFromObject(o).max.x)),boardLeft=Math.min(...boards.map(o=>new T.Box3().setFromObject(o).min.x));assert.ok(boardLeft-right>.4,'frame separated from board');
const fixed=frames.concat(layout.colliders.filter(c=>/^Door_Wall_/.test(c.name)).map(c=>({box:new T.Box3(new T.Vector3(...c.center).sub(new T.Vector3(...c.size).multiplyScalar(.5)),new T.Vector3(...c.center).add(new T.Vector3(...c.size).multiplyScalar(.5)))})));
door.toggle();for(let i=0;i<150;i++){door.update(.02);room.updateMatrixWorld(true);const leaf=new T.Box3().setFromObject(panel);for(const o of fixed)assert.ok(!leaf.intersectsBox(o.box||new T.Box3().setFromObject(o)),'door clears fixed frame and wall through opening');}
assert.ok(Math.abs(door.pivot.rotation.y)>1.5);
const ray=new T.Raycaster(new T.Vector3(-3.4,1,-3.22),new T.Vector3(0,-1,0));assert.equal(ray.intersectObject(room.getObjectByName('Reference_Rounded_Stage')).length,0,'entry cutout clears door floor');
assert.equal(layout.walkable_surfaces.length,2);assert.ok(new T.Box3().setFromObject(ceiling).max.z<=-6.49*.55);
console.log('DOOR_FRAME_BOARD_SWEEP_ENTRY_OK');
