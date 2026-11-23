import test from "node:test";
import assert from "node:assert/strict";
import {defaultRoster,validateRoster,validateSpawn,nextSpawnId} from "../src/lab/scenario.mjs";
test("cenário inicial contém 2 soldados aliados, blindado, helicóptero e hostis",()=>{
 const units=defaultRoster();
 assert.equal(units.length,8);
 assert.ok(units.some(u=>u.id==="tank-001"));
 assert.equal(units.filter(u=>u.faction==="enemy").length,4);
});
test("instância tem dados e atributos independentes",()=>{
 const a=defaultRoster(),b=defaultRoster();
 a[0].position[0]=120;a[0].health=20;
 assert.notEqual(a[0].position[0],b[0].position[0]);
 assert.notEqual(a[0].health,b[0].health);
});
test("novo ID de unidade não colide com outros existentes",()=>{
 const units=defaultRoster();
 assert.equal(nextSpawnId(units,"soldier","allies"),"soldier-003");
 assert.equal(nextSpawnId(units,"soldier","enemy"),"enemy-soldier-003");
});
test("editores não permitem duplicação de IDs",()=>{
 const units=defaultRoster();units.push({...units[0]});
 assert.throws(()=>validateRoster(units),/repetido/);
});
test("impede unidade fora do mapa ou com tipo desconhecido",()=>{
 const u=defaultRoster()[0];
 assert.throws(()=>validateSpawn({...u,position:[300,0,0]}),/Posição fora/);
 assert.throws(()=>validateSpawn({...u,kind:"submarine"}),/Tipo de unidade/);
});
test("impede munição negativa, HP fora de limites e nome vazio",()=>{
 const u=defaultRoster()[0];
 assert.throws(()=>validateSpawn({...u,ammo:-3}),/ammo/);
 assert.throws(()=>validateSpawn({...u,health:999}),/Integridade/);
 assert.throws(()=>validateSpawn({...u,name:""}),/Nome/);
});
test("suporta arquivos legados sem unidades com opção allowEmpty",()=>{
 assert.deepEqual(validateRoster([],{allowEmpty:true}),[]);
 assert.throws(()=>validateRoster([]),/cenário/);
});
