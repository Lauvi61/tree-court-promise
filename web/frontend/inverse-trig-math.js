// 图示只求主值，不把相同三角值误当成相同角。
export function principalSineAngle(theta){
 if(!Number.isFinite(theta))throw Error('角必须是有限实数');
 return Math.asin(Math.sin(theta));
}
