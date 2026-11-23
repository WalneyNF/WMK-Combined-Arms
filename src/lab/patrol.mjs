// WMK Combined Arms — patrulhas por waypoints, sem dependências do motor 3D.
export function validateWaypoints(points) {
  if (points === undefined || points === null) return [];
  if (!Array.isArray(points) || points.length > 24) throw new Error("Waypoints: máximo de 24 pontos");
  return points.map((point,index) => {
    if (!Array.isArray(point) || point.length !== 3 || !point.every(Number.isFinite) ||
      Math.abs(point[0]) > 255 || Math.abs(point[2]) > 255 || point[1] < 0 || point[1] > 80)
      throw new Error("Waypoint inválido na posição "+index);
    return [...point];
  });
}
export function nextPatrolWaypoint(points,index,position,radius=4) {
  const route=validateWaypoints(points);
  if (!route.length) return {index:0,target:null,arrived:false};
  const safeIndex=Number.isInteger(index)&&index>=0?index%route.length:0;
  const current=route[safeIndex];
  const distance=Math.hypot(position[0]-current[0],position[2]-current[2]);
  if (distance > radius) return {index:safeIndex,target:current,arrived:false};
  const next=(safeIndex+1)%route.length;
  return {index:next,target:route[next],arrived:true};
}
export function appendWaypoint(points,point) {
  const route=validateWaypoints(points);
  if (route.length>=24) throw new Error("Limite de 24 waypoints");
  return validateWaypoints([...route,point]);
}
