import test from "node:test";
import assert from "node:assert/strict";
import {validateMission,startMission,advanceMission,missionProgress,presetMission} from "../src/lab/mission.mjs";
const unit=(id,position,health=100,faction="allies")=>({id,position,health,faction});
test("três presets prontos e validados",()=>{
  for(const p of ["patrol","base","escort"])assert.ok(validateMission(presetMission(p)));
});
test("eliminar alvo conclui etapa uma única vez",()=>{
  const m=presetMission("patrol");
  let state=startMission(m);
  state=advanceMission(state,[unit("enemy-001",[-8,0,-95],0,"enemy")],.1);
  assert.equal(state.objectives["alvo-a"].status,"completed");
  state=advanceMission(state,[unit("enemy-001",[-8,0,-95],0,"enemy")],.1);
  assert.equal(missionProgress(state).completed,1);
});
test("captura exige presença pelo tempo previsto",()=>{
  const raw=presetMission("patrol");
  raw.objectives=[raw.objectives.find(o=>o.type==="capture")];
  let state=startMission(raw);
  state=advanceMission(state,[unit("soldier-001",[-8,0,-94])],5);
  assert.equal(state.objectives["ponto-a"].status,"pending");
  state=advanceMission(state,[unit("soldier-001",[-8,0,-94])],3);
  assert.equal(state.status,"completed");
});
test("captura reinicia progresso ao abandonar área",()=>{
  const raw=presetMission("patrol");
  raw.objectives=[raw.objectives.find(o=>o.type==="capture")];
  let state=startMission(raw);
  state=advanceMission(state,[unit("soldier-001",[-8,0,-95])],6);
  state=advanceMission(state,[unit("soldier-001",[90,0,90])],.1);
  assert.equal(state.objectives["ponto-a"].progress,0);
});
test("defesa falha se unidade protegida for destruída",()=>{
  const raw=presetMission("base");raw.objectives=[raw.objectives[0]];
  const state=advanceMission(startMission(raw),[unit("soldier-001",[0,0,24],0)],2);
  assert.equal(state.status,"failed");
});
test("escolta exige unidade indicada viva no destino",()=>{
  const raw=presetMission("escort");
  let state=startMission(raw);
  state=advanceMission(state,[unit("tank-001",[75,0,-48],0)],.1);
  assert.equal(state.status,"failed");
  state=startMission(raw);
  state=advanceMission(state,[unit("soldier-001",[75,0,-48]),unit("tank-001",[75,0,-48])],.1);
  assert.equal(state.status,"completed");
});
test("importação recusa objetivo duplicado, destino inválido e tipo desconhecido",()=>{
  const raw=presetMission("patrol");
  raw.objectives.push({...raw.objectives[0]});
  assert.throws(()=>validateMission(raw),/repetido/);
  raw.objectives.pop();raw.objectives[0].position=[999,0,0];
  assert.throws(()=>validateMission(raw),/Coordenadas/);
  raw.objectives[0].position=[0,0,0];raw.objectives[0].type="hack";
  assert.throws(()=>validateMission(raw),/Tipo/);
});
test("estado concluído não contabiliza progresso novamente",()=>{
  const raw=presetMission("escort");
  const done=advanceMission(startMission(raw),[unit("tank-001",[75,0,-48])],1);
  assert.strictEqual(advanceMission(done,[],2),done);
});


test("cenário com unidades customizadas é validado e mantido na missão",async()=>{
 const {defaultRoster}=await import("../src/lab/scenario.mjs");
 const mission=presetMission("patrol");mission.units=defaultRoster();
 const checked=validateMission(mission);
 assert.equal(checked.units.length,8);
 assert.deepEqual(checked.units.find(u=>u.id==="tank-001").position,[25,0,-5]);
});
test("objetivos não podem apontar para unidades inexistentes",async()=>{
 const {defaultRoster}=await import("../src/lab/scenario.mjs");
 const mission=presetMission("patrol");mission.units=defaultRoster();
 mission.objectives[0].targetId="unknown-666";
 assert.throws(()=>validateMission(mission),/inexistente/);
});
test("objetivo eliminar não pode apontar para aliado",async()=>{
 const {defaultRoster}=await import("../src/lab/scenario.mjs");
 const mission=presetMission("patrol");mission.units=defaultRoster();
 mission.objectives[0].targetId="soldier-001";
 assert.throws(()=>validateMission(mission),/inimigo/);
});
test("missão personalizada exige soldado aliado",async()=>{
 const {defaultRoster}=await import("../src/lab/scenario.mjs");
 const mission=presetMission("escort");mission.units=defaultRoster().filter(u=>u.kind!=="soldier"||u.faction!=="allies");
 assert.throws(()=>validateMission(mission),/soldado aliado/);
});
test("legado sem units segue válido para migração",()=>{
 const mission=presetMission("escort");
 assert.equal(validateMission(mission).units,undefined);
});

test("missão personalizada preserva objetos de cenário e rotação",async()=>{
 const {createProp}=await import("../src/lab/scenery.mjs");
 const {defaultRoster}=await import("../src/lab/scenario.mjs");
 const mission=presetMission("escort");
 mission.units=defaultRoster();
 const prop=createProp("tower","torre-controle",[65,0,-30]);prop.yaw=Math.PI/4;
 mission.props=[prop];
 const parsed=validateMission(mission);
 assert.equal(parsed.props.length,1);
 assert.equal(parsed.props[0].id,"torre-controle");
 assert.ok(Math.abs(parsed.props[0].yaw-Math.PI/4)<1e-12);
});
test("não permite objetos de cenário repetidos no JSON da missão",async()=>{
 const {createProp}=await import("../src/lab/scenery.mjs");
 const mission=presetMission("escort");
 const p=createProp("wall","muro-1",[30,0,40]);
 mission.props=[p,{...p}];
 assert.throws(()=>validateMission(mission),/duplicado/);
});
