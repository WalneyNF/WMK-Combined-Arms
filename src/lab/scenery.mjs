// WMK Combined Arms — objetos 3D de cenário e footprints 2D (v0.3.7).
// O terreno estático de treinamento permanece; estes objetos são adicionais.
export const PROP_KINDS=Object.freeze(["building","wall","crate","tower","barrier"]);
const presets=Object.freeze({
  building:{width:16,height:9,depth:13},
  wall:{width:14,height:4,depth:1.5},
  crate:{width:3,height:3,depth:3},
  tower:{width:6,height:15,depth:6},
  barrier:{width:7,height:2,depth:1.5}
});
const idOk=x=>typeof x==="string"&&/^[A-Za-z0-9_-]{1,64}$/.test(x);
export function createProp(kind,id,position=[0,0,0]){
 if(!Object.hasOwn(presets,kind))throw Error("Tipo de objeto inválido");
 return {id,kind,name:kind+" "+id,position:[...position],yaw:0,size:{...presets[kind]},collidable:true};
}
export function validateProp(p){
 if(!p||typeof p!=="object"||!idOk(p.id))throw Error("ID do objeto inválido");
 if(!PROP_KINDS.includes(p.kind))throw Error("Tipo de objeto inválido em "+p.id);
 if(typeof p.name!=="string"||!p.name.trim()||p.name.length>90)throw Error("Nome de objeto inválido em "+p.id);
 if(!Array.isArray(p.position)||p.position.length!==3||!p.position.every(Number.isFinite))throw Error("Posição inválida em "+p.id);
 if(Math.abs(p.position[0])>255||Math.abs(p.position[2])>255||p.position[1]<0||p.position[1]>80)throw Error("Objeto fora do mapa: "+p.id);
 if(!Number.isFinite(p.yaw)||Math.abs(p.yaw)>Math.PI*200)throw Error("Rotação inválida em "+p.id);
 if(!p.size||!["width","height","depth"].every(k=>Number.isFinite(p.size[k])&&p.size[k]>=.5&&p.size[k]<=120))
  throw Error("Dimensões inválidas em "+p.id);
 return {id:p.id,kind:p.kind,name:p.name,position:[...p.position],yaw:p.yaw,
   size:{width:p.size.width,height:p.size.height,depth:p.size.depth},collidable:p.collidable!==false};
}
export function validateProps(items){
 if(!Array.isArray(items)||items.length>120)throw Error("Limite de 120 objetos do mapa");
 const seen=new Set();
 return items.map(p=>{const o=validateProp(p);if(seen.has(o.id))throw Error("Objeto duplicado: "+o.id);seen.add(o.id);return o});
}
export function propFootprint(p){
 const {width,depth}=p.size,angle=p.yaw;
 // AABB conservadora calculada a partir da rotação no mundo XZ.
 return {x:p.position[0],z:p.position[2],
  width:Math.abs(width*Math.cos(angle))+Math.abs(depth*Math.sin(angle)),
  depth:Math.abs(width*Math.sin(angle))+Math.abs(depth*Math.cos(angle))};
}
export function propBlockers(props){return (props||[]).filter(p=>p.collidable!==false).map(propFootprint)}
export function nextPropId(items,kind){
 let n=1,id;
 do{id="wmk-"+kind+"-"+String(n++).padStart(3,"0")}while(items.some(p=>p.id===id));
 return id;
}
