import test from "node:test";
import assert from "node:assert/strict";
import { seatList,normalizeCrew,crewSeat,boardCrew,leaveCrew,nextAvailableSeat } from "../src/lab/crew.mjs";

test("tanque dispõe de três postos, helicóptero de dois",()=>{
 assert.deepEqual(seatList("tank"),["driver","gunner","commander"]);
 assert.deepEqual(seatList("heli"),["pilot","door-gunner"]);
});
test("soldado ocupa motorista e muda para atirador sem duplicar",()=>{
 let r=boardCrew("tank",null,"soldier-001","driver");
 assert.equal(r.ok,true);assert.equal(crewSeat(r.crew,"soldier-001"),"driver");
 r=boardCrew("tank",r.crew,"soldier-001","gunner");
 assert.equal(r.ok,true);
 assert.equal(r.crew.driver,null);assert.equal(r.crew.gunner,"soldier-001");
});
test("não admite dois soldados no mesmo posto",()=>{
 const first=boardCrew("tank",null,"soldier-001","driver");
 const second=boardCrew("tank",first.crew,"soldier-002","driver");
 assert.equal(second.ok,false);
 assert.deepEqual(second.crew,first.crew);
});
test("segundo soldado encontra outro posto livre",()=>{
 const a=boardCrew("tank",null,"soldier-001","driver");
 const b=boardCrew("tank",a.crew,"soldier-002");
 assert.equal(b.ok,true);assert.equal(b.seat,"gunner");
});
test("troca pula postos ocupados",()=>{
 const a=boardCrew("tank",null,"soldier-001","driver");
 const b=boardCrew("tank",a.crew,"soldier-002","gunner");
 assert.equal(nextAvailableSeat("tank",b.crew,"driver","soldier-001"),"commander");
});
test("desembarque libera apenas o ocupante correspondente",()=>{
 const a=boardCrew("tank",null,"soldier-001","driver");
 const b=boardCrew("tank",a.crew,"soldier-002","gunner");
 const result=leaveCrew("tank",b.crew,"soldier-001");
 assert.equal(result.crew.driver,null);
 assert.equal(result.crew.gunner,"soldier-002");
});
test("dados inválidos e duplicados não são mantidos no save",()=>{
 const crew=normalizeCrew("heli",{pilot:"soldier-001","door-gunner":"soldier-001",invalid:"x"});
 assert.equal(crew.pilot,"soldier-001");
 assert.equal(crew["door-gunner"],null);
 assert.equal("invalid" in crew,false);
});
