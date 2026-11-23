import test from "node:test";
import assert from "node:assert/strict";
import { findPath,blocked,hasLineOfSight } from "../src/lab/navigation.mjs";
const point=(x,z)=>({x,z});
test("caminho sem obstáculos termina exatamente no destino",()=>{
 const route=findPath(point(0,0),point(48,48));
 assert.ok(route.length>0);assert.deepEqual(route.at(-1),point(48,48));
});
test("A* contorna hangar e mantém segurança contra paredes",()=>{
 const from=point(-120,-75),to=point(-20,-75);
 assert.equal(hasLineOfSight(from,to,{radius:1}),false);
 const path=findPath(from,to,{radius:1});
 assert.ok(path.length>1,"deve haver desvio");
 let previous=from;
 for(const p of path){
   assert.equal(blocked(p.x,p.z,1),false);
   assert.ok(hasLineOfSight(previous,p,{radius:1}),"segmento sem atravessar paredes");
   previous=p;
 }
});
test("caminho contorna tanque estacionado",()=>{
 const obstacles=[{x:0,z:0,radius:7}];
 const from=point(-36,0),to=point(36,0);
 const path=findPath(from,to,{radius:1,obstacles});
 assert.ok(path.length>1);
 let prev=from;
 for(const p of path){assert.ok(hasLineOfSight(prev,p,{radius:1,obstacles}));prev=p}
});
test("destino bloqueado devolve caminho vazio",()=>{
 assert.deepEqual(findPath(point(0,0),point(-70,-75)),[]);
});
test("entrada de dados inválidos não bloqueia motor",()=>{
 assert.deepEqual(findPath(point(NaN,0),point(40,0)),[]);
 assert.deepEqual(findPath(point(0,0),point(20,0),{cellSize:0}),[]);
});
test("o mapa impede acesso fora dos limites",()=>{
 assert.equal(blocked(270,0,1),true);
 assert.deepEqual(findPath(point(0,0),point(280,0)),[]);
});
