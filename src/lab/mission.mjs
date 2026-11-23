// WMK Combined Arms — contrato de missões v0.3.5. Independente do motor gráfico.
// O editor, os testes e o laboratório utilizam exatamente o mesmo esquema.
export const OBJECTIVE_TYPES=Object.freeze(["eliminate","capture","defend","escort"]);
const idOk=s=>typeof s==="string" && /^[a-zA-Z0-9_-]{1,64}$/.test(s);
const finite=(v)=>typeof v==="number"&&Number.isFinite(v);
export function validateMission(raw){
  if(!raw||typeof raw!=="object"||raw.schemaVersion!==1)throw Error("schemaVersion deve ser 1");
  if(!idOk(raw.id))throw Error("ID da missão inválido");
  if(typeof raw.name!=="string"||!raw.name.trim()||raw.name.length>100)throw Error("Nome da missão inválido");
  if(!Array.isArray(raw.objectives)||!raw.objectives.length||raw.objectives.length>25)throw Error("A missão requer de 1 a 25 objetivos");
  const seen=new Set();
  const objectives=raw.objectives.map(o=>{
    if(!o||!idOk(o.id)||seen.has(o.id))throw Error("Objetivo com ID inválido ou repetido");
    seen.add(o.id);
    if(!OBJECTIVE_TYPES.includes(o.type))throw Error("Tipo de objetivo não reconhecido");
    if(!Array.isArray(o.position)||o.position.length!==3||!o.position.every(finite)||
      Math.abs(o.position[0])>255||Math.abs(o.position[2])>255)throw Error("Coordenadas inválidas em "+o.id);
    if(!finite(o.radius)||o.radius<3||o.radius>100)throw Error("Raio deve ser de 3 a 100 em "+o.id);
    if(!finite(o.duration)||o.duration<1||o.duration>3600)throw Error("Duração deve ser de 1 a 3600 em "+o.id);
    if(o.type==="eliminate"&&(!idOk(o.targetId)))throw Error("Alvo obrigatório em "+o.id);
    if((o.type==="escort"||o.type==="defend")&&!idOk(o.targetId))throw Error("Unidade protegida obrigatória em "+o.id);
    return {
      id:o.id,type:o.type,
      title:typeof o.title==="string"&&o.title.trim()?o.title.slice(0,100):o.type,
      position:[...o.position],radius:o.radius,duration:o.duration,
      targetId:idOk(o.targetId)?o.targetId:null
    };
  });
  return {schemaVersion:1,id:raw.id,name:raw.name.trim(),description:String(raw.description||"").slice(0,1000),
    objectives};
}
export function startMission(mission){
  const definition=validateMission(mission);
  return {definition,status:"running",elapsed:0,objectives:Object.fromEntries(
    definition.objectives.map(o=>[o.id,{status:"pending",progress:0}])
  )};
}
const distanceXZ=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const alive=u=>u&&u.health>0;
export function advanceMission(previous,units,dt){
  if(!previous||previous.status!=="running")return previous;
  if(!finite(dt)||dt<0||dt>10)throw Error("Delta time inválido");
  const byId=new Map((units||[]).map(u=>[u.id,u]));
  const next={...previous,elapsed:previous.elapsed+dt,objectives:{...previous.objectives}};
  for(const o of previous.definition.objectives){
    const last=previous.objectives[o.id];
    if(last.status!=="pending")continue;
    const protectedUnit=byId.get(o.targetId);
    const friendly=(units||[]).some(u=>u.faction==="allies"&&alive(u)&&!u.aboard&&
      Array.isArray(u.position)&&distanceXZ(u.position,o.position)<=o.radius);
    let status="pending",progress=last.progress;
    switch(o.type){
      case "eliminate":
        if(protectedUnit&&protectedUnit.health<=0)status="completed";
        break;
      case "capture":
        progress=friendly?Math.min(o.duration,progress+dt):0;
        if(progress>=o.duration)status="completed";
        break;
      case "defend":
        if(!alive(protectedUnit))status="failed";
        else if(friendly)progress=Math.min(o.duration,progress+dt);
        if(progress>=o.duration)status="completed";
        break;
      case "escort":
        if(!alive(protectedUnit))status="failed";
        else if(Array.isArray(protectedUnit.position)&&distanceXZ(protectedUnit.position,o.position)<=o.radius)
          status="completed";
        break;
    }
    next.objectives[o.id]={status,progress};
  }
  const values=Object.values(next.objectives);
  if(values.some(v=>v.status==="failed"))next.status="failed";
  else if(values.every(v=>v.status==="completed"))next.status="completed";
  return next;
}
export function missionProgress(state){
  if(!state)return {completed:0,total:0,percent:0};
  const entries=Object.values(state.objectives);
  const completed=entries.filter(o=>o.status==="completed").length;
  return {completed,total:entries.length,percent:entries.length?Math.round(100*completed/entries.length):0};
}
export const MISSION_PRESETS=Object.freeze({
  patrol:{
    schemaVersion:1,id:"operacao-patrulha",name:"Operação Patrulha",description:"Eliminar duas posições hostis e capturar o ponto de comando.",
    objectives:[
      {id:"alvo-a",type:"eliminate",title:"Neutralizar posição A",targetId:"enemy-001",position:[-8,0,-95],radius:18,duration:1},
      {id:"alvo-b",type:"eliminate",title:"Neutralizar posição B",targetId:"enemy-002",position:[50,0,-113],radius:18,duration:1},
      {id:"ponto-a",type:"capture",title:"Capturar o posto avançado",targetId:null,position:[-8,0,-95],radius:20,duration:8}
    ]},
  base:{
    schemaVersion:1,id:"defesa-base",name:"Defesa da Base",description:"Proteger o soldado principal por 45 segundos e eliminar a patrulha hostil.",
    objectives:[
      {id:"base-viva",type:"defend",title:"Proteger comandante",targetId:"soldier-001",position:[0,0,24],radius:45,duration:45},
      {id:"patrulha",type:"eliminate",title:"Destruir patrulha inimiga",targetId:"enemy-soldier-001",position:[-28,0,-123],radius:15,duration:1}
    ]},
  escort:{
    schemaVersion:1,id:"escolta-tanque",name:"Escolta Blindada",description:"Levar o tanque até a zona de extração mantendo-o operacional.",
    objectives:[
      {id:"chegada",type:"escort",title:"Levar tanque ao destino",targetId:"tank-001",position:[75,0,-48],radius:18,duration:1}
    ]}
});
export function presetMission(key){
  if(!Object.hasOwn(MISSION_PRESETS,key))throw Error("Preset inexistente");
  return validateMission(structuredClone(MISSION_PRESETS[key]));
}
