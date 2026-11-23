import test from "node:test";
import assert from "node:assert/strict";
import { resolveCircleAabb, resolveCircleCircle, resolveGroundPosition, findSafeExit } from "../src/lab/movement.mjs";

test("não atravessa parede do hangar",()=>{
  const result=resolveGroundPosition(-70,-75,0.8);
  assert.equal(result.collided,true);
  assert.ok(!(result.x>-83.3&&result.x<-56.7&&result.z>-85.8&&result.z<-64.2));
});
test("sem colisão mantém posição original",()=>{
  assert.deepEqual(resolveCircleAabb(50,50,1,{x:0,z:0,width:5,depth:5}),{x:50,z:50,collided:false});
});
test("afasta círculos sobrepostos",()=>{
  const result=resolveCircleCircle(5,0,1,6,0,2);
  assert.equal(result.collided,true);
  assert.ok(Math.hypot(result.x-6,result.z)>=2.999);
});
test("círculos coincidentes não geram NaN",()=>{
  const result=resolveCircleCircle(2,3,1,2,3,1);
  assert.ok(Number.isFinite(result.x)&&Number.isFinite(result.z));
});
test("posição do jogador limitada ao mapa",()=>{
  const result=resolveGroundPosition(9999,-9999,1);
  assert.ok(result.x<=257&&result.z>=-257);
});
test("saída de veículo retorna ponto fora das construções",()=>{
  const result=findSafeExit({x:25,z:-5},0,[{x:25,z:-5,radius:4}]);
  assert.ok(result);
  assert.ok(Math.hypot(result.x-25,result.z+5)>=7.9);
});
test("saída bloqueada retorna null",()=>{
  const vehicle={x:25,z:-5};
  const blockers=[{x:33,z:-5,radius:10},{x:17,z:-5,radius:10},{x:39,z:-5,radius:10},{x:11,z:-5,radius:10}];
  assert.equal(findSafeExit(vehicle,0,blockers),null);
});
