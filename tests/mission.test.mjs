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
