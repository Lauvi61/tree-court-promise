export const TEACHER_PATROL={left:-3.05,right:-2.05,z:-1.85,travel:4,turn:1.8,speed:.7};
export function teacherPatrol(t){
 const p=TEACHER_PATROL,period=2*(p.travel+p.turn),u=((t%period)+period)%period;
 if(u<p.travel)return {x:p.left+(p.right-p.left)*u/p.travel,z:p.z,yaw:Math.PI/2,speed:p.speed};
 if(u<p.travel+p.turn){const a=(u-p.travel)/p.turn,e=a*a*(3-2*a);return {x:p.right,z:p.z,yaw:Math.PI/2-Math.PI*e,speed:.22};}
 if(u<2*p.travel+p.turn)return {x:p.right-(p.right-p.left)*(u-p.travel-p.turn)/p.travel,z:p.z,yaw:-Math.PI/2,speed:p.speed};
 const a=(u-2*p.travel-p.turn)/p.turn,e=a*a*(3-2*a);return {x:p.left,z:p.z,yaw:-Math.PI/2-Math.PI*e,speed:.22};
}
