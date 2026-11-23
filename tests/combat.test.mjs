import test from "node:test";
import assert from "node:assert/strict";
import {COMBAT,canEngage,selectCombatTarget,applyDamage,calculateScore,assignSquadOrder} from "../src/lab/combat.mjs";
const ally={id:"soldier-a",kind:"soldier",faction:"allies",health:100,ammo:30,reload:0,cooldown:0,position:[0,0,0],order:"attack"};
const foe=(id,z,health=90)=>({id,kind:"target",faction:"enemy",health,position:[0,0,z]});
test("detecta o inimigo mais proximo no raio",()=>{
 const got=selectCombatTarget(ally,[foe("longe",155),foe("perto",48),foe("medio",70)]);
 assert.equal(got.id,"perto");
});
test("ordem de ataque marca alvo prioritario se visivel",()=>{
 const got=selectCombatTarget(ally,[foe("perto",40),foe("prioritario",80)],{designatedTargetId:"prioritario"});
 assert.equal(got.id,"prioritario");
});
test("nao atira em aliados, mortos, fora do alcance ou sem municao",()=>{
 assert.equal(canEngage(ally,{...foe("outro",30),faction:"allies"}),false);
 assert.equal(canEngage(ally,foe("fora",COMBAT.soldier.range+1)),false);
 assert.equal(canEngage(ally,foe("morto",30,0)),false);
 assert.equal(canEngage({...ally,ammo:0},foe("a",30)),false);
 assert.equal(canEngage({...ally,cooldown:1},foe("a",30)),false);
 assert.equal(canEngage({...ally,aboard:"tank-001"},foe("a",30)),false);
 assert.equal(canEngage(ally,foe("a",30),{visibility:false}),false);
});
test("dano limitado a vida existente e destruicao unica",()=>{
 assert.deepEqual(applyDamage({health:35},50),{health:0,applied:35,destroyed:true});
 assert.deepEqual(applyDamage({health:0},50),{health:0,applied:0,destroyed:false});
 assert.deepEqual(applyDamage({health:35},-9),{health:35,applied:0,destroyed:false});
});
test("score nao conta pontos negativos",()=>{
 assert.equal(calculateScore({damage:-4,killed:false}),0);
 assert.ok(calculateScore({damage:20,killed:true})>20);
});
test("ordens em grupo nao alteram unidades inimigas nem instancias originais",()=>{
 const list=[ally,{...ally,id:"soldier-b",position:[10,0,4]},{...foe("enemy",50),order:"hold"}];
 const result=assignSquadOrder(list,["soldier-a","soldier-b","enemy"],"attack",[20,0,40]);
 assert.equal(result[0].order,"attack");
 assert.deepEqual(result[1].target,[20,0,40]);
 assert.equal(result[2].order,"hold");
 assert.notEqual(result[1],list[1]);
 assert.equal(list[1].target,undefined);
});
test("rejeita ordem desconhecida e destino invalido",()=>{
 assert.throws(()=>assignSquadOrder([ally],["soldier-a"],"explode"));
 assert.throws(()=>assignSquadOrder([ally],["soldier-a"],"patrol",[NaN,0,0]));
});
