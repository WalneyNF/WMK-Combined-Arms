import test from "node:test";
import assert from "node:assert/strict";
import {validateWaypoints,nextPatrolWaypoint,appendWaypoint} from "../src/lab/patrol.mjs";
test("rota vazia é permitida, waypoint inválido é rejeitado",()=>{
 assert.deepEqual(validateWaypoints([]),[]);
 assert.throws(()=>validateWaypoints([[Infinity,0,0]]),/inválido/);
 assert.throws(()=>validateWaypoints([[270,0,0]]),/inválido/);
});
test("ordem cíclica avança quando chega ao waypoint",()=>{
 const route=[[0,0,0],[20,0,-10],[30,0,30]];
 const step=nextPatrolWaypoint(route,0,[1,0,1]);
 assert.deepEqual(step,{index:1,target:[20,0,-10],arrived:true});
 const next=nextPatrolWaypoint(route,2,[30,0,30]);
 assert.equal(next.index,0);
});
test("unidade ainda distante mantém o ponto atual",()=>{
 const state=nextPatrolWaypoint([[10,0,10],[20,0,20]],0,[0,0,0]);
 assert.equal(state.index,0);assert.equal(state.arrived,false);
});
test("inserção de waypoint não altera o original",()=>{
 const original=[[1,0,1]];const appended=appendWaypoint(original,[2,0,2]);
 assert.equal(original.length,1);assert.equal(appended.length,2);
});
test("limite de 24 impede rotas excessivas",()=>{
 const route=Array.from({length:24},(_,i)=>[i,0,i]);
 assert.throws(()=>appendWaypoint(route,[100,0,100]),/Limite/);
});
