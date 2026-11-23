// WMK Combined Arms — instâncias de unidades de uma missão (v0.3.6).
// Os IDs, tipos e atributos de cada unidade são serializados e validados.
// A renderização e os controles são responsabilidade do laboratório Three.js.
export const UNIT_KINDS=Object.freeze(["soldier","tank","heli","target"]);
export const FACTIONS=Object.freeze(["allies","enemy"]);
const validId=id=>typeof id==="string"&&/^[a-zA-Z0-9_-]{1,64}$/.test(id);
const finite=x=>typeof x==="number"&&Number.isFinite(x);
const defaults=Object.freeze({
  soldier:Object.freeze({maxHealth:100,ammo:30,reserve:90}),
  tank:Object.freeze({maxHealth:230,ammo:38,reserve:85}),
  heli:Object.freeze({maxHealth:160,ammo:260,reserve:500}),
  target:Object.freeze({maxHealth:95,ammo:500,reserve:0})
});
export function validateSpawn(raw){
  if(!raw||typeof raw!=="object")throw Error("Unidade inválida");
  if(!validId(raw.id))throw Error("ID de unidade inválido");
  if(!UNIT_KINDS.includes(raw.kind))throw Error("Tipo de unidade desconhecido: "+raw.kind);
  if(!FACTIONS.includes(raw.faction))throw Error("Facção inválida em "+raw.id);
  if(typeof raw.name!=="string"||!raw.name.trim()||raw.name.length>90)throw Error("Nome inválido em "+raw.id);
  if(!Array.isArray(raw.position)||raw.position.length!==3||!raw.position.every(finite))
    throw Error("Posição inválida em "+raw.id);
  const [x,y,z]=raw.position;
  if(Math.abs(x)>255||Math.abs(z)>255||y<0||y>80)throw Error("Posição fora do mapa em "+raw.id);
  if(!finite(raw.yaw)||Math.abs(raw.yaw)>Math.PI*200)throw Error("Rotação inválida em "+raw.id);
  const stats=defaults[raw.kind];
  const maxHealth=raw.maxHealth??stats.maxHealth;
  const health=raw.health??maxHealth;
  const ammo=raw.ammo??stats.ammo;
  const reserve=raw.reserve??stats.reserve;
  for(const [name,value] of Object.entries({maxHealth,health,ammo,reserve})){
    if(!finite(value)||value<0||value>10000)throw Error(name+" inválido em "+raw.id);
  }
  if(maxHealth<1||health>maxHealth)throw Error("Integridade inválida em "+raw.id);
  if(!Number.isInteger(ammo)||!Number.isInteger(reserve))throw Error("Munição deve ser inteira em "+raw.id);
  const validOrders=["hold","follow","patrol","attack","defend"];
  if(raw.order!=null&&!validOrders.includes(raw.order))throw Error("Ordem desconhecida em "+raw.id);
  return {
    id:raw.id,kind:raw.kind,name:raw.name.trim(),faction:raw.faction,
    position:[x,y,z],yaw:raw.yaw,maxHealth,health,ammo,reserve,
    order:raw.order||"hold",
    target:Array.isArray(raw.target)&&raw.target.length===3&&raw.target.every(finite)?
      [...raw.target]:[x,y,z]
  };
}
export function validateRoster(raw,{allowEmpty=false}={}){
  if(!Array.isArray(raw)||raw.length>(allowEmpty?40:40)||(!allowEmpty&&!raw.length))
    throw Error("O cenário precisa de 1 a 40 unidades");
  const seen=new Set();
  return raw.map(u=>{
    const validated=validateSpawn(u);
    if(seen.has(validated.id))throw Error("ID repetido: "+validated.id);
    seen.add(validated.id);
    return validated;
  });
}
export const DEFAULT_SPAWNS=Object.freeze([
 {id:"soldier-001",kind:"soldier",name:"Soldado WMK",faction:"allies",position:[0,0,24],yaw:0,order:"hold"},
 {id:"soldier-002",kind:"soldier",name:"Soldado de apoio",faction:"allies",position:[-12,0,20],yaw:0,order:"follow"},
 {id:"tank-001",kind:"tank",name:"Tanque Sherman (protótipo)",faction:"allies",position:[25,0,-5],yaw:0,order:"hold"},
 {id:"heli-001",kind:"heli",name:"Helicóptero de apoio",faction:"allies",position:[-40,13,-8],yaw:0,order:"patrol",target:[-40,13,-55]},
 {id:"enemy-001",kind:"target",name:"Posição hostil A",faction:"enemy",position:[-8,0,-95],yaw:0,order:"hold"},
 {id:"enemy-002",kind:"target",name:"Posição hostil B",faction:"enemy",position:[50,0,-113],yaw:0,order:"hold"},
 {id:"enemy-soldier-001",kind:"soldier",name:"Patrulha hostil A",faction:"enemy",position:[-28,0,-123],yaw:0,order:"attack"},
 {id:"enemy-soldier-002",kind:"soldier",name:"Patrulha hostil B",faction:"enemy",position:[40,0,-127],yaw:0,order:"attack"}
]);
export function defaultRoster(){return validateRoster(structuredClone(DEFAULT_SPAWNS))}
export function nextSpawnId(roster,kind,faction){
  const prefix=(faction==="enemy"?"enemy-":"")+kind+"-";
  let n=1;
  while(roster.some(unit=>unit.id===prefix+String(n).padStart(3,"0")))n++;
  return prefix+String(n).padStart(3,"0");
}
