import * as THREE from "three";
import { resolveGroundPosition, findSafeExit, BUILDINGS } from "./movement.mjs";
import { findPath } from "./navigation.mjs";
import { seatList,normalizeCrew,boardCrew,leaveCrew,crewSeat,nextAvailableSeat } from "./crew.mjs";
import { COMBAT,canEngage,selectCombatTarget,applyDamage,calculateScore,assignSquadOrder,validateOrder } from "./combat.mjs";
import { hasLineOfSight } from "./navigation.mjs";
import { FORMATIONS,formationDestination } from "./formation.mjs";
import { validateMission,startMission,advanceMission,missionProgress,presetMission } from "./mission.mjs";
import { validateRoster,defaultRoster } from "./scenario.mjs";
import {validateWaypoints,nextPatrolWaypoint} from "./patrol.mjs";
import { validateProps,propBlockers } from "./scenery.mjs";

// WMK Unit Control Lab v0.3.0 — protótipo isolado, sem alterar o jogo principal.
// Entidade, controle e assento são conceitos separados. O mundo nunca é reiniciado ao trocar.
const $=id=>document.getElementById(id);
const scene=new THREE.Scene(); scene.background=new THREE.Color("#8bbbc6");scene.fog=new THREE.Fog("#8bbbc6",135,420);
const camera=new THREE.PerspectiveCamera(63,innerWidth/innerHeight,.1,900);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,1.4));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=false;$("scene").appendChild(renderer.domElement);
const sun=new THREE.DirectionalLight(0xfff4d8,2.1);sun.position.set(-55,110,65);scene.add(sun);
scene.add(new THREE.HemisphereLight(0xe9ffff,0x526451,2.15));
const mat=(color,metalness=0)=>new THREE.MeshStandardMaterial({color,metalness,roughness:.76});
const materials={ground:mat(0x608469),runway:mat(0x586b6e),concrete:mat(0x768584),dark:mat(0x253a40),metal:mat(0x7d9292,.35),olive:mat(0x66795d),blue:mat(0x426c80),enemy:mat(0x9a5346),helmet:mat(0x778b71),glass:new THREE.MeshStandardMaterial({color:0x68adc0,transparent:true,opacity:.72,roughness:.22}),skin:mat(0xd3ae8f),yellow:mat(0xf7c475)};
const ground=new THREE.Mesh(new THREE.PlaneGeometry(550,550),materials.ground);ground.rotation.x=-Math.PI/2;scene.add(ground);
const grid=new THREE.GridHelper(550,55,0x92b6a0,0x587c6b);grid.position.y=.015;scene.add(grid);
const floor=(x,z)=>0, bound=n=>THREE.MathUtils.clamp(n,-260,260);
let activeProps=[];const propGroup=new THREE.Group();scene.add(propGroup);
const buildingsNow=()=>[...BUILDINGS,...propBlockers(activeProps)];
// Colisão arcade independente da renderização.
function groundRadius(e){return e.kind==="tank"?4.4:e.kind==="soldier"?.75:e.kind==="heli"?5.5:2}
function obstacles(except){return [...entities.values()].filter(e=>e.id!==except&&e.health>0&&e.kind==="tank").map(e=>({x:e.group.position.x,z:e.group.position.z,radius:groundRadius(e)}))}
function collide(e){
  if(e.kind==="heli"&&e.group.position.y>5)return false;
  const p=e.group.position,r=resolveGroundPosition(p.x,p.z,groundRadius(e),obstacles(e.id),buildingsNow());
  p.x=r.x;p.z=r.z;
  if(r.collided&&e.kind==="tank")e.speed=0;
  return r.collided;
}
function part(parent,geom,m,x=0,y=0,z=0,rot=[0,0,0]){const p=new THREE.Mesh(geom,m);p.position.set(x,y,z);p.rotation.set(...rot);parent.add(p);return p;}
const box=(p,w,h,d,m,x,y,z)=>part(p,new THREE.BoxGeometry(w,h,d),m,x,y,z);
function renderProps(raw){
  const prepared=validateProps(raw||[]);
  for(const child of [...propGroup.children]){
    propGroup.remove(child);
    child.traverse(o=>{if(o.isMesh)o.geometry.dispose()});
  }
  activeProps=prepared;
  const colors={building:materials.concrete,wall:materials.metal,crate:materials.olive,tower:materials.blue,barrier:materials.dark};
  for(const p of activeProps){
    const root=new THREE.Group();
    root.position.set(p.position[0],p.position[1],p.position[2]);root.rotation.y=p.yaw;
    const {width,height,depth}=p.size;
    box(root,width,height,depth,colors[p.kind],0,height/2,0);
    if(p.kind==="building"){
      box(root,width+.5,.35,depth+.5,materials.dark,0,height+.18,0);
    }else if(p.kind==="tower"){
      box(root,width*1.2,.4,depth*1.2,materials.dark,0,height+.2,0);
    }
    propGroup.add(root);
  }
}
function scenery(){
  const road=box(scene,130,.12,20,materials.runway,0,.06,-52);
  const road2=box(scene,20,.12,115,materials.runway,69,.06,-9);
  for(const [x,z,w,h,d] of [[-70,-75,25,10,20],[-32,-75,19,9,18],[80,-75,22,12,22],[100,24,18,9,22]]){
    box(scene,w,h,d,materials.concrete,x,h/2,z);
    box(scene,w+1,.6,d+1,materials.dark,x,h+.3,z);
  }
  for(let i=0;i<35;i++){
    const x=((i*67)%430)-215,z=((i*111)%430)-215;
    if(Math.abs(x)<65&&Math.abs(z)<100)continue;
    part(scene,new THREE.CylinderGeometry(.35,.55,4,6),mat(0x715d40),x,2,z);
    part(scene,new THREE.ConeGeometry(3,7,7),mat(0x356a48),x,8,z);
  }
  for(let i=0;i<8;i++)box(scene,4,3,4,materials.olive,-95+i*7,1.5,45);
  for(let i=0;i<6;i++)box(scene,4,.08,1,materials.yellow,-43+i*15,.17,-52);
}
scenery();
function modelSoldier(){
  const root=new THREE.Group();
  const torso=box(root,1.1,1.45,.65,materials.olive,0,1.9,0);
  part(root,new THREE.SphereGeometry(.38,12,9),materials.skin,0,3.0,0);
  part(root,new THREE.SphereGeometry(.52,12,8),materials.helmet,0,3.24,0);
  const arms=[],legs=[];
  for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(side*.73,2.54,-.06);
    box(arm,.30,1,.36,materials.olive,0,-.43,0);root.add(arm);arms.push(arm);
    const leg=new THREE.Group();leg.position.set(side*.31,1.24,0);
    box(leg,.34,1.17,.38,materials.dark,0,-.59,0);root.add(leg);legs.push(leg);
  }
  box(root,.15,.17,1.45,materials.metal,.27,2.04,-.7);
  root.userData.anim={arms,legs,torso};return root;
}
function modelTank(){
  const root=new THREE.Group();box(root,5,1.5,8,materials.olive,0,1.9,0);
  for(const side of [-1,1]){box(root,.9,1.4,7.7,materials.dark,side*2.65,1.2,0);
    for(const z of [-2.6,-1.3,0,1.3,2.6])part(root,new THREE.CylinderGeometry(.67,.67,.26,12),materials.metal,side*3.0,.91,z,[0,0,Math.PI/2]);
  }
  box(root,3.7,.9,4.1,materials.olive,0,3,-.2);
  const turret=new THREE.Group();turret.position.set(0,3.6,-.55);
  part(turret,new THREE.CylinderGeometry(1.65,1.8,.9,12),materials.olive);
  box(turret,.6,.55,4.7,materials.metal,0,.25,-3);
  root.add(turret);root.userData.turret=turret;return root;
}
function modelHeli(){
  const root=new THREE.Group();
  part(root,new THREE.SphereGeometry(1,15,12),materials.blue,0,0,0).scale.set(2.2,1.45,3.8);
  part(root,new THREE.SphereGeometry(1,12,9),materials.glass,0,.3,-1.7).scale.set(1.5,.9,1.8);
  box(root,.7,.5,7.8,materials.blue,0,0,5);
  box(root,2.9,.12,.6,materials.metal,0,.4,8.2);
  for(const x of [-2,2]){box(root,.15,.15,6.6,materials.dark,x,-1.65,0);
    for(const z of [-1.7,1.5])box(root,.14,1.5,.15,materials.metal,x*.75,-.85,z);}
  const rotor=new THREE.Group();rotor.position.y=1.8;root.add(rotor);
  box(rotor,16,.12,.5,materials.dark,0,0,0);box(rotor,.5,.12,16,materials.dark,0,0,0);
  const tail=new THREE.Group();tail.position.set(0,.7,8.4);root.add(tail);
  box(tail,3.1,.13,.24,materials.metal);
  root.userData.rotor=rotor;root.userData.tail=tail;return root;
}
function modelEnemy(){
  const root=new THREE.Group();
  box(root,3.2,2.4,3.2,materials.enemy,0,1.2,0);
  part(root,new THREE.ConeGeometry(2.1,2.4,4),materials.dark,0,3.4,0,[0,Math.PI/4,0]);
  return root;
}
const defaults=[
{id:"soldier-001",kind:"soldier",name:"Soldado WMK",faction:"allies",health:100,maxHealth:100,position:[0,0,24],yaw:0,speed:0,ammo:30,reserve:150,reload:0,cooldown:0,order:"hold",target:[0,0,24],seat:null},
{id:"soldier-002",kind:"soldier",name:"Soldado de apoio",faction:"allies",health:100,maxHealth:100,position:[-12,0,20],yaw:0,speed:0,ammo:30,reserve:90,reload:0,cooldown:0,order:"follow",target:[0,0,24],seat:null},
{id:"tank-001",kind:"tank",name:"Tanque Sherman (protótipo)",faction:"allies",health:230,maxHealth:230,position:[25,0,-5],yaw:0,speed:0,ammo:38,reserve:85,reload:0,cooldown:0,order:"hold",target:[25,0,-5],seat:null},
{id:"heli-001",kind:"heli",name:"Helicóptero de apoio",faction:"allies",health:160,maxHealth:160,position:[-40,13,-8],yaw:0,speed:0,ammo:260,reserve:500,reload:0,cooldown:0,order:"patrol",target:[-40,13,-55],seat:null},
{id:"enemy-001",kind:"target",name:"Alvo Hostil A",faction:"enemy",health:95,maxHealth:95,position:[-8,0,-95],yaw:0,speed:0,ammo:500,reserve:0,reload:0,cooldown:0,order:"hold",target:[-8,0,-95],seat:null},
{id:"enemy-002",kind:"target",name:"Alvo Hostil B",faction:"enemy",health:95,maxHealth:95,position:[50,0,-113],yaw:0,speed:0,ammo:500,reserve:0,reload:0,cooldown:0,order:"hold",target:[50,0,-113],seat:null},
{id:"enemy-soldier-001",kind:"soldier",name:"Patrulha Hostil 1",faction:"enemy",health:95,maxHealth:95,position:[-28,0,-123],yaw:0,speed:0,ammo:30,reserve:90,reload:0,cooldown:0,order:"attack",target:[0,0,24],seat:null},
{id:"enemy-soldier-002",kind:"soldier",name:"Patrulha Hostil 2",faction:"enemy",health:95,maxHealth:95,position:[40,0,-127],yaw:0,speed:0,ammo:30,reserve:90,reload:0,cooldown:0,order:"attack",target:[0,0,24],seat:null}
];
const defs={soldier:{maxSpeed:8,run:1.7,acceleration:12,turn:8,damage:13,rate:.13,magazine:30,reloadTime:1.6,range:180},
tank:{maxSpeed:19,run:1.2,acceleration:3.5,turn:1.1,damage:68,rate:1.3,magazine:38,reloadTime:2.8,range:280},
heli:{maxSpeed:35,run:1.3,acceleration:2.7,turn:1.1,damage:18,rate:.17,magazine:260,reloadTime:2.6,range:310},
target:{maxSpeed:0,run:0,acceleration:0,turn:0,damage:6,rate:2.6,magazine:500,reloadTime:0,range:140}};
const entities=new Map();
let activeId="soldier-001",lastSoldierId="soldier-001",currentSeat="foot",cameraYaw=0,cameraPitch=.22;
let mouseDown=false, paused=false, mapOpen=false,selectedMapId="tank-001",mapTarget=[0,0,0], missionKills=0;
let missionScore=0,squadSelection=new Set(["soldier-002","tank-001"]),combatLog=[];
let squadFormation="wedge";
let missionState=startMission(presetMission("patrol")),missionAlerted=false;
let last=performance.now(),elapsed=0,toastTime=0,shotEffects=[];
const keys=new Set(),saveKey="wmk-unit-control-lab-v030",panelKey="wmk-unit-control-layout-v030";
const vec=(p)=>new THREE.Vector3(...p),forward=y=>new THREE.Vector3(-Math.sin(y),0,-Math.cos(y));
function safeNumber(n,fallback=0,lim=1000){return Number.isFinite(n)?THREE.MathUtils.clamp(n,-lim,lim):fallback}
function validateUnit(u){
  if(!u||typeof u!=="object"||!["soldier","tank","heli","target"].includes(u.kind))throw Error("Tipo desconhecido");
  if(typeof u.id!=="string"||!/^[-a-z0-9]{1,64}$/i.test(u.id))throw Error("Identificador inválido");
  if(!Array.isArray(u.position)||u.position.length!==3||!u.position.every(Number.isFinite))throw Error("Posição inválida");
  return {...u,name:String(u.name||u.kind).slice(0,80),position:u.position.map(n=>safeNumber(n)),target:Array.isArray(u.target)&&u.target.length===3&&u.target.every(Number.isFinite)?u.target.map(n=>safeNumber(n)):u.position.slice(),
    health:Math.max(0,safeNumber(u.health,100,10000)),maxHealth:Math.max(1,safeNumber(u.maxHealth,100,10000)),
    speed:safeNumber(u.speed),yaw:safeNumber(u.yaw,0,10000),ammo:Math.max(0,Math.floor(safeNumber(u.ammo,0,10000))),
    reserve:Math.max(0,Math.floor(safeNumber(u.reserve,0,10000))),cooldown:Math.max(0,safeNumber(u.cooldown,0,1000)),reload:Math.max(0,safeNumber(u.reload,0,1000)),
    order:validateOrder(u.order),seat:null,patrolPoints:validateWaypoints(u.patrolPoints),patrolIndex:Number.isInteger(u.patrolIndex)&&u.patrolIndex>=0?u.patrolIndex:0,
    kills:Math.max(0,Math.floor(safeNumber(u.kills,0,10000))),score:Math.max(0,Math.floor(safeNumber(u.score,0,1000000))),
    holdFire:Boolean(u.holdFire),designatedTargetId:typeof u.designatedTargetId==="string"?u.designatedTargetId:null,
    crew:normalizeCrew(u.kind,u.crew),aboard:typeof u.aboard==="string"?u.aboard:null,aboardSeat:typeof u.aboardSeat==="string"?u.aboardSeat:null};
}
function createEntity(raw){
  const d=validateUnit(raw);
  const group=d.kind==="soldier"?modelSoldier():d.kind==="tank"?modelTank():d.kind==="heli"?modelHeli():modelEnemy();
  if(d.faction==="enemy"&&d.kind==="soldier"){
    box(group,1.2,.18,.9,materials.enemy,0,3.48,0);
    const marker=part(group,new THREE.ConeGeometry(.5,.85,6),materials.enemy,0,4.7,0);
    marker.rotation.y=Math.PI/6;
  }
  group.position.fromArray(d.position);group.rotation.y=d.yaw;group.visible=d.health>0;scene.add(group);
  entities.set(d.id,{...d,group,aiTime:0});
}
for(const d of defaults)createEntity(d);
function active(){return entities.get(activeId)}
function notice(txt){$("notice").textContent=txt;toastTime=4}
function isVehicle(e){return e?.kind==="tank"||e?.kind==="heli"}
function person(){return entities.get(lastSoldierId)||[...entities.values()].find(u=>u.kind==="soldier"&&u.faction==="allies")}
function unitState(e){const {group,aiTime,jumpTime,navPath,navDestination,navStatus,...data}=e;return {...data,position:e.group.position.toArray(),yaw:e.group.rotation.y}}
function snapshot(){return {schemaVersion:1,labVersion:"0.3.8",props:activeProps,activeId,lastSoldierId,currentSeat,cameraYaw,cameraPitch,missionKills,missionScore,squadSelection:[...squadSelection],squadFormation,missionState,units:[...entities.values()].map(unitState)}}
function loadSnapshot(data){
  if(!data||data.schemaVersion!==1||!Array.isArray(data.units)||data.units.length<1||data.units.length>40)throw Error("Arquivo não é um save WMK válido");
  const preparedProps=validateProps(data.props||data.missionState?.definition?.props||[]);
  const seen=new Set(),updated=data.units.map(x=>validateUnit(x));
  for(const u of updated){if(seen.has(u.id))throw Error("IDs duplicados");seen.add(u.id)}
  if(!updated.some(u=>u.kind==="soldier"&&u.faction==="allies"))throw Error("Batalha sem soldado aliado");
  const legacy=!data.labVersion||["0.3.0","0.3.1","0.3.2","0.3.3","0.3.4","0.3.5"].includes(data.labVersion);
  const items=[...entities.values()];for(const e of items){scene.remove(e.group);e.group.traverse(obj=>{if(obj.isMesh)obj.geometry.dispose()});}entities.clear();
  for(const u of updated)createEntity(u);
  renderProps(preparedProps);
  // Compatibilidade com saves da v0.3.0: adiciona a nova unidade se não existir.
  if(legacy){
    if(!entities.has("soldier-002"))createEntity(defaults.find(u=>u.id==="soldier-002"));
    for(const enemyId of ["enemy-soldier-001","enemy-soldier-002"])
      if(!entities.has(enemyId))createEntity(defaults.find(u=>u.id===enemyId));
  }
  activeId=entities.get(data.activeId)?.faction==="allies"&&entities.get(data.activeId).health>0?data.activeId:
    ([...entities.values()].find(e=>e.faction==="allies"&&e.health>0)?.id||"soldier-001");
  lastSoldierId=entities.get(data.lastSoldierId)?.kind==="soldier"?data.lastSoldierId:
    ([...entities.values()].find(u=>u.kind==="soldier"&&u.faction==="allies")?.id||"soldier-001");
  if(entities.get(activeId).kind==="soldier")lastSoldierId=activeId;
  currentSeat=entities.get(activeId).kind==="soldier"?"foot":["driver","gunner","commander","pilot","door-gunner"].includes(data.currentSeat)?data.currentSeat:entities.get(activeId).kind==="tank"?"driver":"pilot";
  // Migração e consistência: os dados de bordo dos soldados são a fonte de verdade.
  for(const vehicle of entities.values())if(isVehicle(vehicle))vehicle.crew=normalizeCrew(vehicle.kind,null);
  for(const soldier of entities.values())if(soldier.kind==="soldier"){
    const vehicle=entities.get(soldier.aboard);
    if(!isVehicle(vehicle)){soldier.aboard=null;soldier.aboardSeat=null;continue}
    const result=boardCrew(vehicle.kind,vehicle.crew,soldier.id,soldier.aboardSeat);
    if(!result.ok){soldier.aboard=null;soldier.aboardSeat=null;continue}
    vehicle.crew=result.crew;soldier.aboardSeat=result.seat;soldier.group.visible=false;
  }
  cameraYaw=safeNumber(data.cameraYaw,0,10000);cameraPitch=THREE.MathUtils.clamp(safeNumber(data.cameraPitch,.2),-.6,1.1);
  missionKills=Math.max(0,Math.floor(safeNumber(data.missionKills,0,10000)));
  missionScore=Math.max(0,Math.floor(safeNumber(data.missionScore,0,10000000)));
  squadSelection=new Set((Array.isArray(data.squadSelection)?data.squadSelection:[]).filter(id=>entities.get(id)?.faction==="allies"));
  squadFormation=FORMATIONS.includes(data.squadFormation)?data.squadFormation:"wedge";
  const formationControl=document.getElementById("squad-formation");if(formationControl)formationControl.value=squadFormation;
  for(const enemy of entities.values())if(enemy.faction==="enemy"&&enemy.kind==="target"&&enemy.health>0&&enemy.ammo===0)enemy.ammo=500;
  if(data.missionState?.definition){
    try{
      const safe=startMission(validateMission(data.missionState.definition));
      if(data.missionState.objectives && typeof data.missionState.objectives==="object"){
        for(const objective of safe.definition.objectives){
          const saved=data.missionState.objectives[objective.id];
          if(!saved || !["pending","completed","failed"].includes(saved.status))continue;
          safe.objectives[objective.id]={status:saved.status,progress:Math.max(0,Math.min(objective.duration,Number(saved.progress)||0))};
        }
      }
      safe.elapsed=Math.max(0,Math.min(999999,Number(data.missionState.elapsed)||0));
      const values=Object.values(safe.objectives);
      safe.status=values.some(v=>v.status==="failed")?"failed":
        values.every(v=>v.status==="completed")?"completed":"running";
      missionState=safe;
    }catch(e){console.warn("Missão salva ignorada",e)}
  }
  missionAlerted=missionState.status!=="running";
  renderControls();renderCrewPanel();renderSquadPanel();renderMissionPanel();
}
function saveLocal(){try{localStorage.setItem(saveKey,JSON.stringify(snapshot()));notice("Batalha salva neste navegador")}catch(e){notice("Não foi possível salvar: "+e.message)}}
function download(text,name){const href=URL.createObjectURL(new Blob([text],{type:"application/json"}));const a=document.createElement("a");a.href=href;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(href),2000)}
$("save").onclick=saveLocal;$("export").onclick=()=>download(JSON.stringify(snapshot(),null,2),"wmk-batalha-v038.json");
$("import").onclick=()=>$("file").click();$("file").onchange=async ev=>{const file=ev.target.files?.[0];if(!file)return;try{if(file.size>250000)throw Error("Máximo 250 KB");loadSnapshot(JSON.parse(await file.text()));notice("Batalha importada")}catch(e){notice("Falha na importação: "+e.message)}finally{ev.target.value=""}};
$("reset").onclick=()=>{if(!confirm("Reiniciar o laboratório e perder as alterações não exportadas?"))return;try{localStorage.removeItem(saveKey)}catch{}location.reload()};
try{const saved=localStorage.getItem(saveKey);if(saved)loadSnapshot(JSON.parse(saved))}catch(e){console.warn("Save ignorado",e);notice("Save antigo inválido; usando cenário padrão")}
let pendingScenario=null;
if(new URLSearchParams(location.search).get("mission")==="custom"){
  try{
    const mission=validateMission(JSON.parse(localStorage.getItem("wmk-ca-mission-v035")||"null"));
    pendingScenario=mission;
  }catch(e){notice("Falha ao carregar missão do editor: "+e.message)}
}
function renderControls(){
  const list=$("units-list"),select=$("order-target");list.replaceChildren();select.replaceChildren();
  for(const e of entities.values()){
    if(e.faction!=="allies")continue;
    const b=document.createElement("button");b.classList.toggle("active",e.id===activeId);
    b.textContent=e.name;
    const small=document.createElement("span");small.className="detail";
    small.textContent="HP "+Math.round(e.health)+"/"+e.maxHealth+" · "+(e.id===activeId?"JOGADOR":e.order.toUpperCase());
    b.append(small);b.disabled=e.health<=0;b.onclick=()=>assume(e.id,false);list.append(b);
    const o=document.createElement("option");o.value=e.id;o.textContent=e.name;select.append(o);
  }
  if(!entities.get(selectedMapId)||entities.get(selectedMapId).faction!=="allies")
    selectedMapId=[...entities.values()].find(u=>u.faction==="allies")?.id||"";
  select.value=selectedMapId;
  renderSquadPanel();
}
function assume(id,fromBoard=false){
  const e=entities.get(id);if(!e||e.faction!=="allies"||e.health<=0)return notice("Unidade indisponível");
  if(e.kind==="soldier"&&e.aboard){
    lastSoldierId=e.id;
    if(fromBoard){disembark();return}
    // Seleção remota do soldado ocupado requer sair do veículo primeiro.
    disembark();return;
  }
  if(e.kind==="soldier")lastSoldierId=e.id;
  if(fromBoard&&isVehicle(e)){
    const soldier=person();
    if(soldier.aboard&&soldier.aboard!==e.id)return notice("Desembarque antes de trocar de veículo.");
    const boarding=boardCrew(e.kind,e.crew,soldier.id);
    if(!boarding.ok)return notice("Não foi possível embarcar: "+boarding.reason);
    e.crew=boarding.crew;
    soldier.aboard=e.id;soldier.aboardSeat=boarding.seat;soldier.group.visible=false;
  }
  activeId=id;currentSeat=e.kind==="soldier"?"foot":(fromBoard?person().aboardSeat:(e.kind==="tank"?"driver":"pilot"));
  cameraYaw=e.group.rotation.y;
  renderControls();renderCrewPanel();notice("Assumiu "+e.name+" · "+(currentSeat==="foot"?"a pé":currentSeat));
}
function disembark(){
  const soldier=person(),vehicle=soldier.aboard?entities.get(soldier.aboard):null;
  if(!vehicle){notice("Controle remoto: pressione 1 para voltar ao soldado.");return}
  if(vehicle.kind==="heli"&&vehicle.group.position.y>5)return notice("Aterre o helicóptero antes de desembarcar.");
  if(Math.abs(vehicle.speed)>2)return notice("Pare o veículo antes de desembarcar.");
  const blockers=obstacles(vehicle.id);
  blockers.push({x:vehicle.group.position.x,z:vehicle.group.position.z,radius:groundRadius(vehicle)});
  const exit=findSafeExit(vehicle.group.position,vehicle.group.rotation.y,blockers,buildingsNow());
  if(!exit){notice("Saída bloqueada. Movimente o veículo para outra posição.");return}
  soldier.group.position.set(exit.x,0,exit.z);
  vehicle.crew=leaveCrew(vehicle.kind,vehicle.crew,soldier.id).crew;
  soldier.aboard=null;soldier.aboardSeat=null;soldier.group.visible=true;activeId=soldier.id;currentSeat="foot";
  cameraYaw=soldier.group.rotation.y;keys.clear();mouseDown=false;
  renderControls();renderCrewPanel();notice("Desembarcou: veículo preservado no mundo.");
}
function nearestVehicle(){
  const p=person().group.position;let best=null,distance=Infinity;
  for(const e of entities.values())if(isVehicle(e)&&e.health>0){
    if(e.kind==="heli"&&e.group.position.y>5)continue;
    if(Math.abs(e.speed)>2)continue;
    const d=p.distanceTo(e.group.position);if(d<distance&&d<17){best=e;distance=d}
  }
  return best;
}
function interact(){
  const e=active();
  if(e.kind==="soldier"){const near=nearestVehicle();if(!near)return notice("Aproxime-se de um tanque ou helicóptero (até 17 m)");assume(near.id,true)}
  else if(person().aboard===e.id)disembark();
  else notice("Controle remoto: pressione 1 para voltar ao soldado.");
}
function switchSeat(){
  const e=active();if(!isVehicle(e))return;
  const boarded=person().aboard===e.id?person():null;
  const next=nextAvailableSeat(e.kind,e.crew,currentSeat,boarded?.id);
  if(!next)return notice("Todos os outros postos estão ocupados.");
  if(boarded){
    const result=boardCrew(e.kind,e.crew,boarded.id,next);
    if(!result.ok)return notice(result.reason);
    e.crew=result.crew;boarded.aboardSeat=next;
  }
  currentSeat=next;
  renderCrewPanel();notice("POSTO · "+currentSeat.toUpperCase());
}
function renderCrewPanel(){
  const root=document.getElementById("crew-content");if(!root)return;
  root.replaceChildren();
  const e=active();
  if(!isVehicle(e)){root.textContent="Assuma um tanque ou helicóptero para consultar os postos.";return}
  for(const seat of seatList(e.kind)){
    const b=document.createElement("button"),occupant=e.crew?.[seat];
    b.textContent=(seat===currentSeat?"▶ ":"")+seat+" · "+(occupant?entities.get(occupant)?.name||occupant:"livre / IA");
    b.disabled=!!occupant&&occupant!==person().id&&person().aboard===e.id;
    b.onclick=()=>{
      if(seat===currentSeat)return;
      if(person().aboard===e.id){
        const result=boardCrew(e.kind,e.crew,person().id,seat);
        if(!result.ok)return notice(result.reason);
        e.crew=result.crew;person().aboardSeat=result.seat;
      }
      currentSeat=seat;renderCrewPanel();notice("POSTO · "+seat.toUpperCase());
    };
    root.appendChild(b);
  }
}
function loadMissionDefinition(raw){
  missionState=startMission(validateMission(raw));
  missionAlerted=false;
  renderMissionPanel();
  addCombatLog("Missão iniciada: "+missionState.definition.name);
  notice("MISSÃO CARREGADA · "+missionState.definition.name);
}
function renderMissionPanel(){
  const root=document.getElementById("mission-objectives"),status=document.getElementById("mission-status");
  if(!root||!status||!missionState)return;
  const progress=missionProgress(missionState);
  status.textContent=missionState.definition.name+" · "+progress.completed+"/"+progress.total+
    " concluídos · "+missionState.status.toUpperCase();
  const presetPicker=document.getElementById("mission-preset");
  if(presetPicker){
    const ids={patrol:"operacao-patrulha",base:"defesa-base",escort:"escolta-tanque"};
    presetPicker.value=Object.entries(ids).find(([key,value])=>value===missionState.definition.id)?.[0]||"custom";
  }
  root.replaceChildren();
  for(const objective of missionState.definition.objectives){
    const state=missionState.objectives[objective.id];
    const row=document.createElement("div");
    row.className="mission-objective";
    const icon=state.status==="completed"?"✓":state.status==="failed"?"✕":"○";
    row.textContent=icon+" "+objective.title+
      (state.status==="pending"&&["capture","defend"].includes(objective.type)?
        " · "+Math.round(state.progress)+"/"+objective.duration+"s":"");
    root.append(row);
  }
}
const missionSelect=document.getElementById("mission-preset");
if(missionSelect)missionSelect.onchange=()=>{
  try{
    const definition=missionSelect.value==="custom"?
      validateMission(JSON.parse(localStorage.getItem("wmk-ca-mission-v035")||"null")):
      {...presetMission(missionSelect.value),units:defaultRoster()};
    if(!definition.units)throw Error("O arquivo não contém unidades. Abra no editor e salve novamente.");
    if(!confirm("Iniciar missão e reiniciar todas as unidades deste cenário?")){renderMissionPanel();return}
    applyScenario(definition);
  }catch(e){notice("Falha ao carregar missão: "+e.message);renderMissionPanel()}
};
const missionReset=document.getElementById("mission-restart");
if(missionReset)missionReset.onclick=()=>loadMissionDefinition(missionState.definition);
function addCombatLog(message) {
  combatLog.unshift({at:Math.round(elapsed),message});
  if(combatLog.length>12)combatLog.length=12;
  const box=document.getElementById("combat-log");
  if(box)box.textContent=combatLog.slice(0,5).map(item=>item.at+"s · "+item.message).join("\n");
}
function renderSquadPanel(){
  const root=document.getElementById("squad-members");
  const targets=document.getElementById("squad-target");
  if(!root||!targets)return;
  const selectedTarget=targets.value;
  const formationControl=document.getElementById("squad-formation");
  if(formationControl)formationControl.value=squadFormation;
  root.replaceChildren();
  for(const e of entities.values())if(e.faction==="allies"){
    const label=document.createElement("label"),input=document.createElement("input");
    input.type="checkbox";input.checked=squadSelection.has(e.id);
    input.onchange=()=>{if(input.checked)squadSelection.add(e.id);else squadSelection.delete(e.id)};
    label.append(input,document.createTextNode(" "+e.name));
    root.append(label);
  }
  targets.replaceChildren();
  for(const enemy of entities.values())if(enemy.faction==="enemy"&&enemy.health>0){
    const option=document.createElement("option");option.value=enemy.id;option.textContent=enemy.name;targets.append(option);
  }
  if([...targets.options].some(o=>o.value===selectedTarget))targets.value=selectedTarget;
}
function giveSquadOrder(order){
  const ids=[...squadSelection].filter(id=>entities.get(id)?.faction==="allies");
  if(!ids.length)return notice("Marque ao menos uma unidade aliada.");
  const targetId=document.getElementById("squad-target")?.value;
  const target=entities.get(targetId);
  const goal=order==="attack"&&target?target.group.position.toArray():mapTarget;
  if(order==="attack"&&!target)return notice("Nenhum alvo hostil disponível.");
  const snapshots=assignSquadOrder([...entities.values()].map(unitState),ids,order,goal);
  for(const change of snapshots){
    if(!ids.includes(change.id))continue;
    const unit=entities.get(change.id);
    unit.order=change.order;unit.target=[...change.target];
    unit.designatedTargetId=order==="attack"?targetId:null;
    unit.holdFire=order==="hold";
    unit.navPath=[];unit.aiTime=0;
  }
  addCombatLog("Esquadrão: "+ids.length+" unidades · "+order);
  notice("Ordem de esquadrão "+order.toUpperCase()+" para "+ids.length+" unidades.");
  renderControls();
}
$("squad-formation").onchange=()=>{squadFormation=FORMATIONS.includes($("squad-formation").value)?$("squad-formation").value:"wedge";notice("Formação alterada: "+squadFormation)};
for(const button of document.querySelectorAll("[data-squad-order]"))button.onclick=()=>giveSquadOrder(button.dataset.squadOrder);
function setOrder(id,order,destination){
  const e=entities.get(id);if(!e||e.faction!=="allies")return;
  e.order=order;e.holdFire=order==="hold";e.designatedTargetId=null;
  e.navPath=[];e.aiTime=0;
  if(Array.isArray(destination))e.target=destination;
  notice("Ordem "+order.toUpperCase()+" para "+e.name);renderControls();
}
for(const button of document.querySelectorAll("[data-order]"))button.onclick=()=>setOrder($("order-target").value,button.dataset.order);
$("order-target").onchange=()=>{selectedMapId=$("order-target").value};
$("goto").onclick=()=>{selectedMapId=$("order-target").value;setOrder(selectedMapId,"patrol",mapTarget);notice("Destino marcado: veja o mapa M")};
$("quality").onchange=()=>{const q=$("quality").value;renderer.setPixelRatio(Math.min(devicePixelRatio,q==="baixo"?.7:q==="alto"?1.8:1.15));renderer.shadowMap.enabled=q==="alto"};
$("quality").dispatchEvent(new Event("change"));
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),mapCanvas=$("mapcanvas"),ctx=mapCanvas.getContext("2d");
function toggleMap(show=!mapOpen){
  mapOpen=show;$("map").classList.toggle("show",show);
  if(show){keys.clear();mouseDown=false;if(document.pointerLockElement)document.exitPointerLock()}
  renderMap();
}
$("map-close").onclick=()=>toggleMap(false);
$("map-assume").onclick=()=>{assume(selectedMapId,false);toggleMap(false)};
$("map-hold").onclick=()=>setOrder(selectedMapId,"hold");
$("map-patrol").onclick=()=>setOrder(selectedMapId,"patrol",mapTarget);
$("map-attack").onclick=()=>{giveSquadOrder("attack");renderMap()};
function worldToMap(x,z){return [mapCanvas.width/2+x*1.35,mapCanvas.height/2+z*1.35]}
function mapToWorld(x,y){return [(x-mapCanvas.width/2)/1.35,0,(y-mapCanvas.height/2)/1.35]}
function renderMap(){
  ctx.clearRect(0,0,mapCanvas.width,mapCanvas.height);ctx.fillStyle="#173b38";ctx.fillRect(0,0,mapCanvas.width,mapCanvas.height);
  ctx.strokeStyle="#386f68";for(let x=0;x<mapCanvas.width;x+=54){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,mapCanvas.height);ctx.stroke()}
  for(let y=0;y<mapCanvas.height;y+=54){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(mapCanvas.width,y);ctx.stroke()}
  for(const e of entities.values()){
    if(e.health<=0)continue;const [x,y]=worldToMap(e.group.position.x,e.group.position.z);
    ctx.fillStyle=e.faction==="enemy"?"#fa716f":e.id===activeId?"#fff3a1":"#70e6c7";
    ctx.beginPath();ctx.arc(x,y,e.id===activeId?9:7,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#ebf9f4";ctx.font="13px system-ui";ctx.fillText(e.name,x+13,y+4);
    if(e.id===selectedMapId){ctx.strokeStyle="#ffce63";ctx.lineWidth=2;ctx.strokeRect(x-12,y-12,24,24)}
    if(e.patrolPoints?.length){
      ctx.strokeStyle=e.faction==="enemy"?"#f39a91":"#e9d596";ctx.lineWidth=1.4;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(x,y);
      e.patrolPoints.forEach((point,i)=>{const [px,py]=worldToMap(point[0],point[2]);ctx.lineTo(px,py)});
      ctx.stroke();ctx.setLineDash([]);
    }
    if(e.id===selectedMapId&&e.navPath?.length){
      ctx.strokeStyle="#f1d580";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);
      for(const waypoint of e.navPath){const [px,py]=worldToMap(waypoint.x,waypoint.z);ctx.lineTo(px,py)}
      ctx.stroke();
    }
  }
  for(const enemy of entities.values())if(enemy.faction==="enemy"&&enemy.health>0&&enemy.id===document.getElementById("squad-target")?.value){
    const [x,z]=worldToMap(enemy.group.position.x,enemy.group.position.z);
    ctx.strokeStyle="#ffcd82";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,z,17,0,Math.PI*2);ctx.stroke();
  }
  if(missionState){
    for(const o of missionState.definition.objectives){
      const [ox,oy]=worldToMap(o.position[0],o.position[2]);
      ctx.strokeStyle=missionState.objectives[o.id].status==="completed"?"#7fe0ba":"#f7d38a";
      ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(ox,oy,o.radius*1.35,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle="#fff2bd";ctx.font="11px system-ui";ctx.fillText(o.title,ox+9,oy-9);
    }
  }
  for(const prop of activeProps){
    const [px,pz]=worldToMap(prop.position[0],prop.position[2]);
    ctx.save();ctx.translate(px,pz);ctx.rotate(prop.yaw);
    ctx.fillStyle="#789da2";ctx.fillRect(-prop.size.width*.675,-prop.size.depth*.675,prop.size.width*1.35,prop.size.depth*1.35);ctx.restore();
    ctx.font="10px system-ui";ctx.fillStyle="#bde3e3";ctx.fillText(prop.name,px+5,pz-5);
  }
  const [tx,ty]=worldToMap(mapTarget[0],mapTarget[2]);
  ctx.strokeStyle="#ffcb77";ctx.beginPath();ctx.moveTo(tx-9,ty);ctx.lineTo(tx+9,ty);ctx.moveTo(tx,ty-9);ctx.lineTo(tx,ty+9);ctx.stroke();
}
mapCanvas.addEventListener("click",e=>{
  const rect=mapCanvas.getBoundingClientRect();const x=(e.clientX-rect.left)/rect.width*mapCanvas.width,y=(e.clientY-rect.top)/rect.height*mapCanvas.height;
  let nearest=null,d=20;
  for(const u of entities.values())if(u.faction==="allies"){const [ux,uy]=worldToMap(u.group.position.x,u.group.position.z),dist=Math.hypot(x-ux,y-uy);if(dist<d){nearest=u;d=dist}}
  if(nearest){selectedMapId=nearest.id;$("order-target").value=selectedMapId;notice("Selecionado: "+nearest.name)}
  else {mapTarget=mapToWorld(x,y);notice("Destino marcado no mapa")}
  renderMap();
});
const wasPressed=new Set();
window.addEventListener("keydown",ev=>{
  if(["INPUT","SELECT","TEXTAREA"].includes(document.activeElement?.tagName))return;
  if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(ev.code))ev.preventDefault();
  if(!ev.repeat){
    if(ev.code==="KeyM"){toggleMap();return}
    if(ev.code==="Escape"){if(mapOpen)toggleMap(false);else if(document.pointerLockElement)document.exitPointerLock();return}
    if(ev.code==="KeyK"){if(document.pointerLockElement)document.exitPointerLock();else renderer.domElement.requestPointerLock?.();return}
    if(ev.code==="KeyE"&&!mapOpen)interact();
    if(ev.code==="KeyF"&&!mapOpen)switchSeat();
    if(ev.code==="KeyR"&&!mapOpen)reloadActive();
    if(["Digit1","Digit2","Digit3","Digit4"].includes(ev.code)&&!mapOpen){
      const allies=[...entities.values()].filter(u=>u.faction==="allies");
      const soldiers=allies.filter(u=>u.kind==="soldier");
      const id={Digit1:soldiers[0]?.id,Digit2:allies.find(u=>u.kind==="tank")?.id,
        Digit3:allies.find(u=>u.kind==="heli")?.id,Digit4:soldiers[1]?.id}[ev.code];
      if(id)assume(id,false);else notice("Nenhuma unidade dessa classe no cenário");
    }
  }
  keys.add(ev.code);
});
window.addEventListener("keyup",ev=>keys.delete(ev.code));window.addEventListener("blur",()=>{keys.clear();mouseDown=false});
renderer.domElement.addEventListener("pointerdown",e=>{if(e.button===0)mouseDown=true});
window.addEventListener("pointerup",()=>mouseDown=false);renderer.domElement.addEventListener("contextmenu",e=>e.preventDefault());
window.addEventListener("mousemove",ev=>{
  if(mapOpen||!(document.pointerLockElement===renderer.domElement||ev.buttons===2))return;
  cameraYaw-=ev.movementX*.0027;
  cameraPitch=THREE.MathUtils.clamp(cameraPitch-ev.movementY*.0021,-.45,1.0);
});
function reloadActive(){
  const e=active(),cfg=defs[e.kind];if(!cfg||e.reload>0||e.ammo>=cfg.magazine||e.reserve<=0)return;
  e.reload=cfg.reloadTime;notice("Recarregando "+e.name);
}
const projectiles=[];
function applyScenario(raw){
  const definition=validateMission(raw);
  if(!definition.units)throw Error("Missão sem definição de unidades");
  const roster=validateRoster(definition.units);
  const props=validateProps(definition.props||[]);
  // Validação completa primeiro: nunca apagar a batalha se o cenário for inválido.
  if(!roster.some(u=>u.faction==="allies"&&u.kind==="soldier"&&u.health>0))
    throw Error("A missão precisa de um soldado aliado vivo.");
  for(const projectile of projectiles){scene.remove(projectile.mesh);projectile.mesh.geometry.dispose()}
  projectiles.length=0;
  for(const e of entities.values()){
    scene.remove(e.group);
    e.group.traverse(obj=>{if(obj.isMesh)obj.geometry.dispose()});
  }
  entities.clear();
  renderProps(props);
  for(const unit of roster)createEntity({...unit,speed:0,cooldown:0,reload:0,seat:null});
  lastSoldierId=roster.find(u=>u.kind==="soldier"&&u.faction==="allies"&&u.health>0).id;
  activeId=lastSoldierId;currentSeat="foot";cameraYaw=entities.get(activeId).group.rotation.y;
  missionKills=0;missionScore=0;missionState=startMission(definition);missionAlerted=false;
  squadSelection=new Set(roster.filter(u=>u.faction==="allies"&&u.id!==activeId).map(u=>u.id));
  selectedMapId=activeId;keys.clear();mouseDown=false;
  renderControls();renderCrewPanel();renderSquadPanel();renderMissionPanel();
  notice("CENÁRIO CARREGADO · "+roster.length+" unidades · "+definition.objectives.length+" objetivos");
}

function combatView(e){return {...e,position:e.group.position.toArray()}}
function visibleCombat(attacker,target){
  if(attacker.kind==="heli"||target.kind==="heli")return true; // Los aéreo simplificado
  return hasLineOfSight({x:attacker.group.position.x,z:attacker.group.position.z},
    {x:target.group.position.x,z:target.group.position.z},
    {radius:.12,obstacles:obstacles(attacker.id).filter(b=>
      Math.hypot(b.x-target.group.position.x,b.z-target.group.position.z)>b.radius+.5),buildings:buildingsNow()});
}
function createShot(shooter,direction,{damage,velocity,life=3,color=materials.yellow}={}){
  const origin=shooter.group.position.clone();
  origin.y+=shooter.kind==="soldier"?2.15:shooter.kind==="tank"?4.1:shooter.kind==="target"?2.5:1;
  const bullet=part(scene,new THREE.SphereGeometry(.23,6,4),color,origin.x,origin.y,origin.z);
  projectiles.push({mesh:bullet,velocity:direction.normalize().multiplyScalar(velocity||120),
    damage,life,owner:shooter.id,faction:shooter.faction});
}
function fire(){
  const e=active(),cfg=defs[e.kind];
  if(e.health<=0||e.cooldown>0||e.reload>0||e.ammo<=0||
      currentSeat==="driver"||currentSeat==="commander")return;
  e.cooldown=cfg.rate;e.ammo--;
  const dir=forward(cameraYaw).add(new THREE.Vector3(0,Math.tan(cameraPitch)*.35,0)).normalize();
  createShot(e,dir,{velocity:e.kind==="tank"?105:155,damage:cfg.damage});
  if(e.kind==="tank"&&e.group.userData.turret)
    e.group.userData.turret.rotation.y=cameraYaw-e.group.rotation.y;
}
function onDestroyed(target,owner){
  target.group.visible=false;
  if(target.faction==="enemy"){
    missionKills++;
    addCombatLog(target.name+" neutralizado por "+(owner?.name||"desconhecido"));
    if([...entities.values()].every(e=>e.faction!=="enemy"||e.health<=0)){
      addCombatLog("Todos os inimigos neutralizados");
      if(missionState?.status==="running")notice("TODOS OS INIMIGOS NEUTRALIZADOS · Verifique os objetivos restantes");
    }
  }
  else addCombatLog("ALIADO PERDIDO · "+target.name);
  if(owner){owner.kills=(owner.kills||0)+1}
  if(target.kind==="tank"||target.kind==="heli"){
    for(const occupantId of Object.values(target.crew||{})){
      const occupant=entities.get(occupantId);
      if(!occupant)continue;
      occupant.aboard=null;occupant.aboardSeat=null;
      const safe=resolveGroundPosition(target.group.position.x+9,target.group.position.z+9,.8,obstacles(target.id),buildingsNow());
      occupant.group.position.set(safe.x,0,safe.z);
      occupant.group.visible=occupant.health>0;
    }
    target.crew=normalizeCrew(target.kind,null);
  }
  if(target.id===activeId){
    const replacement=[...entities.values()].find(u=>u.faction==="allies"&&u.health>0&&
      u.kind==="soldier"&&!u.aboard) || [...entities.values()].find(u=>u.faction==="allies"&&u.health>0);
    if(replacement){activeId=replacement.id;currentSeat=replacement.kind==="soldier"?"foot":replacement.kind==="tank"?"driver":"pilot";
      if(replacement.kind==="soldier")lastSoldierId=replacement.id;
      renderControls();renderCrewPanel();
      notice("Unidade perdida! Assumindo "+replacement.name);
    }else{mouseDown=false;notice("SEM UNIDADES ALIADAS · Reinicie o laboratório.");}
  }
  renderSquadPanel();
}
function dealDamage(target,amount,owner){
  if(target.health<=0)return;
  const result=applyDamage(target,amount);
  target.health=result.health;
  if(owner){
    const score=calculateScore({damage:result.applied,killed:result.destroyed,kind:target.kind});
    owner.score=(owner.score||0)+score;
    if(owner.faction==="allies")missionScore+=score;
  }
  if(result.destroyed)onDestroyed(target,owner);
}
function updateShots(dt){
  for(let i=projectiles.length-1;i>=0;i--){
    const p=projectiles[i],before=p.mesh.position.clone(),after=before.clone().addScaledVector(p.velocity,dt);
    p.mesh.position.copy(after);p.life-=dt;
    let hit=null;
    const segment=new THREE.Line3(before,after),closest=new THREE.Vector3();
    for(const e of entities.values()){
      if(e.faction===p.faction||e.health<=0||e.aboard||e.id===p.owner)continue;
      const center=e.group.position.clone();
      center.y+=e.kind==="soldier"?1.7:e.kind==="tank"?2.5:e.kind==="target"?2:0;
      segment.closestPointToPoint(center,true,closest);
      const radius=e.kind==="soldier"?1.2:e.kind==="tank"?4.6:e.kind==="heli"?3.3:3.1;
      if(closest.distanceTo(center)<=radius){hit=e;break}
    }
    if(hit){dealDamage(hit,p.damage,entities.get(p.owner));p.life=0}
    if(p.life<=0||after.y<-.5||Math.hypot(after.x,after.z)>350){
      scene.remove(p.mesh);p.mesh.geometry.dispose();projectiles.splice(i,1)
    }
  }
}
function updateBotCombat(dt){
  for(const bot of entities.values()){
    if(bot.health<=0||bot.aboard||bot.id===activeId)continue;
    if(bot.faction==="allies"&&!["attack","defend","follow","patrol"].includes(bot.order))continue;
    const cfg=COMBAT[bot.kind];if(!cfg||cfg.range<=0||bot.ammo<=0||bot.reload>0||bot.cooldown>0)continue;
    const possible=[...entities.values()].filter(e=>e.faction!==bot.faction&&e.health>0);
    const target=selectCombatTarget(combatView(bot),possible.map(combatView),{
      designatedTargetId:bot.designatedTargetId,
      visibility:(_,t)=>visibleCombat(bot,entities.get(t.id))
    });
    if(!target)continue;
    const enemy=entities.get(target.id);
    const origin=bot.group.position.clone(),aim=enemy.group.position.clone();
    aim.y+=enemy.kind==="soldier"?1.5:enemy.kind==="tank"?2.5:enemy.kind==="target"?2:0;
    origin.y+=bot.kind==="soldier"?2.15:bot.kind==="tank"?4.1:bot.kind==="target"?2.5:1;
    const direction=aim.sub(origin);
    if(direction.lengthSq()<.1)continue;
    bot.cooldown=cfg.interval;bot.ammo--;
    createShot(bot,direction,{damage:cfg.damage,velocity:cfg.velocity,
      color:bot.faction==="enemy"?materials.enemy:materials.yellow});
    if(bot.kind==="tank"&&bot.group.userData.turret){
      const desired=Math.atan2(-direction.x,-direction.z);
      bot.group.userData.turret.rotation.y=desired-bot.group.rotation.y;
    }
  }
}
function updateSoldier(e,dt,now){
  if(e.aboard){e.group.visible=false;return}
  if(e.health<=0)return;
  if(e.id!==activeId){botUpdate(e,dt);return}
  if(mapOpen)return;
  let x=(keys.has("KeyD")?1:0)-(keys.has("KeyA")?1:0),z=(keys.has("KeyS")?1:0)-(keys.has("KeyW")?1:0);
  const dir=new THREE.Vector3(x,0,z);if(dir.length()>0)dir.normalize();
  const right=new THREE.Vector3(Math.cos(cameraYaw),0,-Math.sin(cameraYaw)),fr=forward(cameraYaw);
  const move=right.multiplyScalar(dir.x).addScaledVector(fr,-dir.z);
  const moving=move.lengthSq()>.001;const run=keys.has("ShiftLeft")||keys.has("ShiftRight");
  if(moving){e.group.position.addScaledVector(move,(run?defs.soldier.maxSpeed*defs.soldier.run:defs.soldier.maxSpeed)*dt);
    e.group.rotation.y=Math.atan2(-move.x,-move.z)}
  collide(e);
  e.group.position.x=bound(e.group.position.x);e.group.position.z=bound(e.group.position.z);
  e.group.position.y=0;e.position=e.group.position.toArray();
  const anim=e.group.userData.anim,phase=now*(run?13:8),stride=moving?Math.sin(phase)*.6:0;
  anim.legs[0].rotation.x=stride;anim.legs[1].rotation.x=-stride;
  anim.arms[0].rotation.x=-stride*.5;anim.arms[1].rotation.x=stride*.5;
  e.group.scale.y=keys.has("KeyC")?.68:1;
  if(keys.has("Space")&&e.jumpTime==null)e.jumpTime=.48;
  if(e.jumpTime!=null){e.jumpTime-=dt;const t=.48-e.jumpTime;e.group.position.y=Math.max(0,Math.sin(t/.48*Math.PI)*1.8);if(e.jumpTime<=0)e.jumpTime=null}
}
function botUpdate(e,dt){
  if(e.health<=0||e.aboard)return;
  const p=e.group.position;
  if(e.kind==="heli"){
    // Aeronaves seguem rota aérea direta nesta fase, sem grade terrestre.
    e.group.userData.rotor.rotation.y+=dt*24;
    e.group.userData.tail.rotation.x+=dt*28;
    p.y=THREE.MathUtils.lerp(p.y,12,Math.min(1,dt*1.8));
    if(e.order==="hold")return;
    if(e.order==="patrol"&&e.patrolPoints?.length){
      const next=nextPatrolWaypoint(e.patrolPoints,e.patrolIndex,p.toArray(),9);
      e.patrolIndex=next.index;e.target=next.target;
    }
    const target=e.order==="follow"?active().group.position.toArray():e.target;
    const dir=new THREE.Vector3(target[0]-p.x,0,target[2]-p.z);
    if(dir.length()>9){
      dir.normalize();p.x=bound(p.x+dir.x*10*dt);p.z=bound(p.z+dir.z*10*dt);
      e.group.rotation.y=Math.atan2(-dir.x,-dir.z);
    }else if(e.order==="patrol"&&!e.patrolPoints?.length)e.target=[-e.target[0],12,-e.target[2]];
    return;
  }
  if(e.order==="hold"){e.navPath=[];e.navStatus="parado";return}
  if(e.order==="patrol"&&e.patrolPoints?.length){
    const next=nextPatrolWaypoint(e.patrolPoints,e.patrolIndex,p.toArray(),4);
    e.patrolIndex=next.index;e.target=next.target;
  }
  const following=e.order==="follow";
  const attacking=e.order==="attack";
  let designated=attacking?entities.get(e.designatedTargetId):null;
  if(attacking&&(!designated||designated.health<=0)){
    const candidates=[...entities.values()].filter(u=>u.faction!==e.faction&&u.health>0&&!u.aboard);
    candidates.sort((a,b)=>e.group.position.distanceToSquared(a.group.position)-e.group.position.distanceToSquared(b.group.position));
    designated=candidates[0]||null;
    e.designatedTargetId=designated?.id||null;
  }
  if(attacking&&!designated){
    e.navPath=[];e.navStatus="sem adversários";return;
  }
  let target=following?active().group.position.toArray():attacking?designated.group.position.toArray():e.target;
  if(!Array.isArray(target))return;
  let targetX=target[0],targetZ=target[2];
  if(following){
    const index=[...squadSelection].filter(id=>id!==activeId&&entities.get(id)?.faction==="allies").indexOf(e.id);
    if(index>=0){
      const desired=formationDestination({x:active().group.position.x,z:active().group.position.z,yaw:active().group.rotation.y},index,squadFormation,e.kind==="tank"?13:7);
      targetX=desired.x;targetZ=desired.z;
    }else if(isVehicle(active())){
      targetX+=Math.cos(active().group.rotation.y)*12;
      targetZ-=Math.sin(active().group.rotation.y)*12;
    }else{targetX+=3;targetZ+=3}
  }
  const distance=Math.hypot(targetX-p.x,targetZ-p.z);
  const threshold=following?5:attacking?Math.min(25,COMBAT[e.kind]?.range*.45||12):3;
  if(distance<=threshold){
    e.navPath=[];e.navStatus=attacking?"em alcance":"no destino";
    if(!following&&e.order==="patrol"&&!e.patrolPoints?.length)e.target=[-e.target[0],e.target[1],-e.target[2]];
    return;
  }
  const destination={x:targetX,z:targetZ};
  e.aiTime=(e.aiTime||0)-dt;
  if(e.aiTime<=0||!e.navDestination||Math.hypot(e.navDestination.x-targetX,e.navDestination.z-targetZ)>6){
    e.aiTime=1.7;
    // O tanque estacionado alvo é excluído se estiver sendo seguido por uma unidade terrestre,
    // mas o objetivo é deslocado 12 unidades para fora da carroceria.
    e.navPath=findPath({x:p.x,z:p.z},destination,{
      radius:groundRadius(e),cellSize:e.kind==="tank"?8:6,
      obstacles:obstacles(e.id),buildings:buildingsNow()
    });
    e.navDestination=destination;
    e.navStatus=e.navPath.length?"navegando":"sem rota";
  }
  if(!e.navPath?.length)return;
  let waypoint=e.navPath[0];
  const waypointDistance=Math.hypot(waypoint.x-p.x,waypoint.z-p.z);
  if(waypointDistance<2.1){
    e.navPath.shift();waypoint=e.navPath[0];
    if(!waypoint)return;
  }
  const dx=waypoint.x-p.x,dz=waypoint.z-p.z,magnitude=Math.hypot(dx,dz);
  if(magnitude>0.0001){
    const movement=Math.min(magnitude,(e.kind==="tank"?6:3.7)*dt);
    p.x=bound(p.x+dx/magnitude*movement);
    p.z=bound(p.z+dz/magnitude*movement);
    collide(e);
    e.group.rotation.y=Math.atan2(-dx,-dz);
  }
  if(e.kind==="tank"||e.kind==="soldier")p.y=0;
}
function updateVehicle(e,dt){
  if(e.id!==activeId){botUpdate(e,dt);return}
  const stats=defs[e.kind],driving=!mapOpen&&(currentSeat==="driver"||currentSeat==="pilot");
  if(driving){
    const input=(keys.has("KeyW")?1:0)-(keys.has("KeyS")?1:0);
    e.speed=THREE.MathUtils.lerp(e.speed,input*stats.maxSpeed*(keys.has("ShiftLeft")?stats.run:1),Math.min(1,stats.acceleration*dt));
    const turning=(keys.has("KeyA")?1:0)-(keys.has("KeyD")?1:0);
    e.group.rotation.y+=turning*stats.turn*dt*(Math.abs(e.speed)<1?.5:1);
    const dir=forward(e.group.rotation.y);
    e.group.position.addScaledVector(dir,e.speed*dt);
    e.group.position.x=bound(e.group.position.x);e.group.position.z=bound(e.group.position.z);
    collide(e);
    cameraYaw=THREE.MathUtils.lerp(cameraYaw,e.group.rotation.y,Math.min(1,dt*2));
    if(e.kind==="heli"){
      const vertical=(keys.has("KeyQ")?1:0)-(keys.has("KeyC")?1:0);
      e.group.position.y=THREE.MathUtils.clamp(e.group.position.y+vertical*13*dt,4,80);
    }else e.group.position.y=0;
  }
  if(e.kind==="heli"){e.group.userData.rotor.rotation.y+=dt*26;e.group.userData.tail.rotation.x+=dt*33}
  if(e.kind==="tank"&&e.group.userData.turret&&currentSeat==="gunner"){
    const turret=e.group.userData.turret;turret.rotation.y=cameraYaw-e.group.rotation.y;
  }
}
function updateCamera(dt){
  const e=active();if(!e)return;
  const target=e.group.position.clone();target.y+=e.kind==="soldier"?2.0:e.kind==="tank"?3.5:1.0;
  const distance=e.kind==="soldier"?9:e.kind==="tank"?(currentSeat==="gunner"?11:22):(currentSeat==="door-gunner"?12:29);
  const height=e.kind==="soldier"?3.4:e.kind==="tank"?8:11;
  const dest=target.clone().add(new THREE.Vector3(Math.sin(cameraYaw)*distance,height+Math.sin(cameraPitch)*distance,Math.cos(cameraYaw)*distance));
  camera.position.lerp(dest,Math.min(1,dt*8));camera.lookAt(target.clone().add(forward(cameraYaw).multiplyScalar(e.kind==="soldier"?5:8)));
}
let debugTimer=0;
function updateHUD(){
  const e=active();if(!e)return;
  $("hud").textContent=e.name+" · "+(currentSeat==="foot"?"TERCEIRA PESSOA":currentSeat.toUpperCase())+
    " · HP "+Math.ceil(e.health)+"/"+e.maxHealth+
    " · MUNIÇÃO "+e.ammo+"/"+e.reserve+
    " · "+(e.reload>0?"RECARREGANDO":"PRONTO")+
    " · ALVOS "+missionKills+"/"+[...entities.values()].filter(u=>u.faction==="enemy").length+" · PONTOS "+missionScore;
  $("debug-text").innerHTML="<b>Ativo:</b> "+e.id+"<br><b>Posto:</b> "+currentSeat+
    "<br><b>Controlador:</b> jogador"+
    "<br><b>Posição:</b> "+e.group.position.toArray().map(v=>v.toFixed(1)).join(", ")+
    "<br><b>Velocidade:</b> "+e.speed.toFixed(1)+
    "<br><b>Estado soldado:</b> "+(person().aboard?"a bordo "+person().aboard:"a pé")+
    "<br><b>Blindados aliados:</b> "+[...entities.values()].filter(u=>u.kind==="tank"&&u.faction==="allies").length+
    "<br><b>Helicópteros aliados:</b> "+[...entities.values()].filter(u=>u.kind==="heli"&&u.faction==="allies").length+
    "<br><b>IA selecionada:</b> "+(entities.get(selectedMapId)?.navStatus||"sem navegação")+
    "<br><b>Eliminações:</b> "+(e.kills||0)+" · Pontos: "+(e.score||0)+
    "<br><b>FPS:</b> "+Math.round(1/Math.max(.0001,frameDt));
  const near=e.kind==="soldier"?nearestVehicle():null;
  if(near&&toastTime<=0)$("notice").textContent="Pressione E para entrar em "+near.name;
  // A lista de unidades é atualizada nos eventos, não em todo refresh do HUD.
}
let frameDt=.016,frameCount=0;
function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min((now-last)/1000,.04);last=now;frameDt=dt||.016;elapsed+=dt;
  // A simulação segue ativa no mapa tático; somente a entrada do jogador fica bloqueada.
  for(const e of entities.values()){
    e.cooldown=Math.max(0,e.cooldown-dt);
    if(e.reload>0){e.reload-=dt;if(e.reload<=0){
      const n=Math.max(0,Math.min(defs[e.kind].magazine-e.ammo,e.reserve));
      e.ammo+=n;e.reserve-=n;
      if(e.id===activeId)notice("Recarregado: "+e.name);
    }}
    if(e.id!==activeId&&e.reload<=0&&e.ammo===0&&e.reserve>0&&defs[e.kind].reloadTime>0){
      e.reload=defs[e.kind].reloadTime;
    }
    if(e.kind==="soldier")updateSoldier(e,dt,elapsed);
    else if(isVehicle(e))updateVehicle(e,dt);
  }
  if(mouseDown&&!mapOpen)fire();
  updateBotCombat(dt);
  updateShots(dt);
  if(missionState?.status==="running"){
    missionState=advanceMission(missionState,[...entities.values()].map(unitState),dt);
    if(missionState.status!=="running"&&!missionAlerted){
      missionAlerted=true;
      addCombatLog(missionState.status==="completed"?"MISSÃO CONCLUÍDA":"MISSÃO FRACASSOU");
      notice(missionState.status==="completed"?"TODOS OS OBJETIVOS CUMPRIDOS":"MISSÃO FRACASSOU");
    }
  }
  updateCamera(dt);renderer.render(scene,camera);
  debugTimer+=dt;if(debugTimer>.25){updateHUD();renderMissionPanel();if(mapOpen)renderMap();debugTimer=0}
  if(toastTime>0)toastTime-=dt;
}
window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
for(const p of document.querySelectorAll(".panel")){
  let dragging=null;const header=p.querySelector("h2");
  header.addEventListener("pointerdown",e=>{if(e.button!==0)return;dragging={x:e.clientX,y:e.clientY,l:p.offsetLeft,t:p.offsetTop};header.setPointerCapture(e.pointerId)});
  header.addEventListener("pointermove",e=>{if(!dragging)return;p.style.left=Math.max(0,Math.min(innerWidth-80,dragging.l+e.clientX-dragging.x))+"px";p.style.top=Math.max(0,Math.min(innerHeight-60,dragging.t+e.clientY-dragging.y))+"px";p.style.right="auto";p.style.bottom="auto"});
  header.addEventListener("pointerup",()=>{dragging=null;saveLayout()});
  p.addEventListener("pointerup",saveLayout);
}
function saveLayout(){const layout={};for(const p of document.querySelectorAll(".panel"))layout[p.id]={x:p.offsetLeft,y:p.offsetTop,w:p.offsetWidth,h:p.offsetHeight};try{localStorage.setItem(panelKey,JSON.stringify(layout))}catch{}}
try{const layout=JSON.parse(localStorage.getItem(panelKey)||"{}");for(const p of document.querySelectorAll(".panel"))if(layout[p.id]){const d=layout[p.id];p.style.left=Math.max(0,d.x)+"px";p.style.top=Math.max(0,d.y)+"px";p.style.width=d.w+"px";p.style.height=d.h+"px";p.style.right="auto";p.style.bottom="auto"}}catch{}
$("layouts").onclick=()=>{try{localStorage.removeItem(panelKey)}catch{}location.reload()};
window.addEventListener("beforeunload",()=>{try{localStorage.setItem(saveKey,JSON.stringify(snapshot()))}catch{}});
if(pendingScenario){
  try{
    if(pendingScenario.units)applyScenario(pendingScenario);
    else loadMissionDefinition(pendingScenario);
  }catch(e){console.error("Cenário personalizado inválido",e);notice("ERRO NO CENÁRIO: "+e.message)}
}
renderControls();renderCrewPanel();renderMissionPanel();requestAnimationFrame(animate);
