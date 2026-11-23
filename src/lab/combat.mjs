// WMK Combined Arms — regras puras de combate tático (laboratório v0.3.3).
// Sem Three.js: testáveis em Node e reutilizáveis pelo motor do jogo.
export const COMBAT = Object.freeze({
 soldier: Object.freeze({range:120,damage:9,interval:.8,velocity:150,alertRadius:145}),
 tank: Object.freeze({range:235,damage:42,interval:3.2,velocity:120,alertRadius:250}),
 heli: Object.freeze({range:200,damage:13,interval:1.1,velocity:165,alertRadius:235}),
 target: Object.freeze({range:140,damage:6,interval:2.6,velocity:110,alertRadius:155})
});
export const SQUAD_ORDERS=Object.freeze(["hold","patrol","follow","attack","defend"]);
export function validateOrder(order) {
  return SQUAD_ORDERS.includes(order)?order:"hold";
}
export function canEngage(attacker,target,{maxRange,visibility=true}={}) {
  if(!attacker||!target||attacker.id===target.id||
    attacker.health<=0||target.health<=0||attacker.faction===target.faction||
    attacker.aboard||attacker.ammo<=0||attacker.reload>0||attacker.cooldown>0||
    attacker.order==="hold"&&attacker.holdFire===true)return false;
  const range=maxRange??COMBAT[attacker.kind]?.range??0;
  if(!Number.isFinite(range)||range<=0||visibility===false)return false;
  const a=attacker.position,b=target.position;
  if(!Array.isArray(a)||!Array.isArray(b))return false;
  return Math.hypot(a[0]-b[0],a[2]-b[2])<=range;
}
export function selectCombatTarget(attacker,targets,{visibility=()=>true,designatedTargetId=null}={}) {
  if(!attacker||!Array.isArray(targets))return null;
  const valid=targets.filter(t=>canEngage(attacker,t,{visibility:visibility(attacker,t)}));
  if(designatedTargetId){
    const designated=valid.find(t=>t.id===designatedTargetId);
    if(designated)return designated;
  }
  valid.sort((a,b)=>Math.hypot(a.position[0]-attacker.position[0],a.position[2]-attacker.position[2])-
    Math.hypot(b.position[0]-attacker.position[0],b.position[2]-attacker.position[2]));
  return valid[0]??null;
}
export function applyDamage(target,amount) {
  const original=Number.isFinite(target.health)?target.health:0;
  const damage=Number.isFinite(amount)?Math.max(0,amount):0;
  const health=Math.max(0,original-damage);
  return {health,applied:original-health,destroyed:original>0&&health===0};
}
export function calculateScore({damage=0,killed=false,kind="target"}={}) {
  const base=Math.max(0,Math.round(damage));
  return base+(killed?(kind==="tank"?200:kind==="heli"?180:100):0);
}
export function assignSquadOrder(units,unitIds,order,target=null) {
  const kind=validateOrder(order);
  if(kind!==order)throw new Error("Ordem desconhecida");
  if(!Array.isArray(unitIds))throw new Error("Seleção inválida");
  if(target&&(!Array.isArray(target)||target.length!==3||!target.every(Number.isFinite)))throw new Error("Destino inválido");
  const ids=new Set(unitIds);
  return units.map(unit=>(ids.has(unit.id)&&unit.faction==="allies"&&unit.health>0)?
    {...unit,order:kind,target:target?[...target]:unit.target}:unit);
}
