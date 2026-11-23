// WMK Unit Control Lab — colisões 2D simplificadas para jogos arcade.
// Funções puras, independentes de Three.js, testadas com node:test.
export const BUILDINGS = Object.freeze([
  { x: -70, z: -75, width: 25, depth: 20 },
  { x: -32, z: -75, width: 19, depth: 18 },
  { x: 80, z: -75, width: 22, depth: 22 },
  { x: 100, z: 24, width: 18, depth: 22 }
]);

export function resolveCircleAabb(x, z, radius, box) {
  const halfW = box.width / 2, halfD = box.depth / 2;
  const left = box.x - halfW, right = box.x + halfW;
  const top = box.z - halfD, bottom = box.z + halfD;
  const nearestX = Math.max(left, Math.min(x, right));
  const nearestZ = Math.max(top, Math.min(z, bottom));
  const dx = x - nearestX, dz = z - nearestZ;
  const dsq = dx * dx + dz * dz;
  if (dsq >= radius * radius) return { x, z, collided: false };
  if (dsq > 0.0000001) {
    const scale = radius / Math.sqrt(dsq);
    return { x: nearestX + dx * scale, z: nearestZ + dz * scale, collided: true };
  }
  // Centro dentro do retângulo: expulsar pela face mais próxima.
  const options = [
    {distance: Math.abs(x-left), x:left-radius, z},
    {distance: Math.abs(right-x), x:right+radius, z},
    {distance: Math.abs(z-top), x, z:top-radius},
    {distance: Math.abs(bottom-z), x, z:bottom+radius}
  ];
  const closest = options.sort((a,b)=>a.distance-b.distance)[0];
  return { x: closest.x, z: closest.z, collided: true };
}

export function resolveCircleCircle(x, z, radius, otherX, otherZ, otherRadius) {
  const dx=x-otherX,dz=z-otherZ,minDist=radius+otherRadius;
  if(dx*dx+dz*dz>=minDist*minDist)return {x,z,collided:false};
  const distance=Math.hypot(dx,dz);
  if(distance<0.00001)return {x:otherX+minDist,z:otherZ,collided:true};
  return {x:otherX+dx/distance*minDist,z:otherZ+dz/distance*minDist,collided:true};
}

export function resolveGroundPosition(x,z,radius,otherUnits=[]) {
  let px=Math.max(-258+radius,Math.min(258-radius,x));
  let pz=Math.max(-258+radius,Math.min(258-radius,z));
  let collided=false;
  for(let iteration=0;iteration<3;iteration++){
    let changed=false;
    for(const b of BUILDINGS){
      const result=resolveCircleAabb(px,pz,radius,b);
      if(result.collided){px=result.x;pz=result.z;changed=true;collided=true}
    }
    for(const u of otherUnits){
      const result=resolveCircleCircle(px,pz,radius,u.x,u.z,u.radius);
      if(result.collided){px=result.x;pz=result.z;changed=true;collided=true}
    }
    if(!changed)break;
  }
  return {x:px,z:pz,collided};
}

export function findSafeExit(vehiclePosition,vehicleYaw,otherUnits=[]) {
  const x=vehiclePosition.x,z=vehiclePosition.z;
  const sideX=Math.cos(vehicleYaw),sideZ=-Math.sin(vehicleYaw);
  for(const multiplier of [1,-1,1.7,-1.7]){
    const dist=8*Math.abs(multiplier);
    const result=resolveGroundPosition(x+sideX*dist*Math.sign(multiplier),z+sideZ*dist*Math.sign(multiplier),.8,otherUnits);
    if(!result.collided)return {x:result.x,z:result.z};
  }
  return null;
}
