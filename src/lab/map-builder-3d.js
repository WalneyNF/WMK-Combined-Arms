import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {TransformControls} from "three/addons/controls/TransformControls.js";
import {validateMission,presetMission} from "./mission.mjs";
import {defaultRoster} from "./scenario.mjs";
import {validateProps,createProp,nextPropId} from "./scenery.mjs";

// WMK Map Builder 3D v0.3.8. Edita a mesma missão JSON do Mission Studio.
const $=id=>document.getElementById(id),storeKey="wmk-ca-mission-v035";
let mission;
try{mission=validateMission(JSON.parse(localStorage.getItem(storeKey)||"null"))}
catch{mission=presetMission("patrol")}
mission.units??=defaultRoster();mission.props??=[];
let selectedId=null,editing=false;
const scene=new THREE.Scene();scene.background=new THREE.Color("#83aab1");
scene.fog=new THREE.Fog("#83aab1",160,510);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,800);
camera.position.set(90,95,120);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.4));renderer.setSize(innerWidth,innerHeight);
$("view").appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe6ffff,0x638061,2.2));
const sunlight=new THREE.DirectionalLight(0xfff2d4,2.1);sunlight.position.set(-60,115,60);scene.add(sunlight);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(530,530),new THREE.MeshStandardMaterial({color:0x567b62,roughness:.9}));
ground.rotation.x=-Math.PI/2;scene.add(ground);
const grid=new THREE.GridHelper(510,51,0xb3dbc1,0x567f6c);grid.position.y=.02;scene.add(grid);
const orbit=new OrbitControls(camera,renderer.domElement);
orbit.target.set(0,0,0);orbit.enableDamping=true;orbit.maxPolarAngle=Math.PI*.49;
orbit.minDistance=5;orbit.maxDistance=380;orbit.update();
const gizmo=new TransformControls(camera,renderer.domElement);
scene.add(typeof gizmo.getHelper==="function"?gizmo.getHelper():gizmo);
gizmo.setMode("translate");gizmo.setSize(1.25);
gizmo.addEventListener("dragging-changed",event=>orbit.enabled=!event.value);
const collection=new THREE.Group();scene.add(collection);
const meshes=new Map();
const mats={
 building:new THREE.MeshStandardMaterial({color:0x92a19f,roughness:.8}),
 wall:new THREE.MeshStandardMaterial({color:0x778a91,roughness:.9}),
 crate:new THREE.MeshStandardMaterial({color:0xb9a47b,roughness:.75}),
 tower:new THREE.MeshStandardMaterial({color:0x7394a4,roughness:.8}),
 barrier:new THREE.MeshStandardMaterial({color:0x5a6976,roughness:.85})
};
function message(text){$("status").textContent=text}
function makeObject(p){
 const root=new THREE.Group();root.userData.propId=p.id;
 const body=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mats[p.kind]);
 body.position.y=.5;root.add(body);
 root.position.fromArray(p.position);root.rotation.y=p.yaw;
 root.scale.set(p.size.width,p.size.height,p.size.depth);
 return root;
}
function rebuild(){
 gizmo.detach();selectedId=null;
 for(const child of [...collection.children]){collection.remove(child);child.traverse(o=>{if(o.isMesh)o.geometry.dispose()})}
 meshes.clear();
 for(const prop of mission.props){const root=makeObject(prop);collection.add(root);meshes.set(prop.id,root)}
 listObjects();showDetails();
}
const data=()=>mission.props.find(p=>p.id===selectedId);
function listObjects(){
 const list=$("objects");list.replaceChildren();
 for(const prop of mission.props){
  const button=document.createElement("button");button.className="entry"+(prop.id===selectedId?" active":"");
  button.textContent=prop.name;
  const sub=document.createElement("small");sub.textContent=prop.kind+" · "+prop.id;
  button.append(sub);button.onclick=()=>select(prop.id);list.append(button);
 }
}
function showDetails(){
 const p=data();
 if(!p){$("details").textContent="Selecione uma construção.";return}
 $("details").textContent="ID: "+p.id+
 "\nTipo: "+p.kind+
 "\nPosição XYZ: "+p.position.map(n=>n.toFixed(1)).join(", ")+
 "\nRotação Y: "+(p.yaw*180/Math.PI).toFixed(1)+"°"+
 "\nDimensões: "+[p.size.width,p.size.height,p.size.depth].map(n=>n.toFixed(1)).join(" × ");
}
function select(id){
 selectedId=meshes.has(id)?id:null;
 if(selectedId)gizmo.attach(meshes.get(selectedId));else gizmo.detach();
 listObjects();showDetails();
}
function sync(){
 const p=data(),root=meshes.get(selectedId);if(!p||!root)return;
 p.position=[THREE.MathUtils.clamp(root.position.x,-255,255),
  THREE.MathUtils.clamp(root.position.y,0,80),THREE.MathUtils.clamp(root.position.z,-255,255)];
 root.position.fromArray(p.position);p.yaw=root.rotation.y;
 for(const [key,axis] of [["width","x"],["height","y"],["depth","z"]]){
  p.size[key]=THREE.MathUtils.clamp(Math.abs(root.scale[axis]),.5,120);
  root.scale[axis]=p.size[key];
 }
 showDetails();
}
gizmo.addEventListener("objectChange",sync);
function mode(m){
 gizmo.setMode(m);
 for(const [id,value] of [["move","translate"],["rotate","rotate"],["scale","scale"]])
  $(id).classList.toggle("active",m===value);
 message("Modo "+(m==="translate"?"Mover":m==="rotate"?"Rotacionar":"Escalar"));
}
$("move").onclick=()=>mode("translate");
$("rotate").onclick=()=>mode("rotate");
$("scale").onclick=()=>mode("scale");
function setSnap(){
 const step=Number($("snap").value);
 gizmo.setTranslationSnap(step||null);
 gizmo.setScaleSnap(step||null);
 gizmo.setRotationSnap(step?THREE.MathUtils.degToRad(15):null);
}
$("snap").onchange=setSnap;setSnap();
$("add").onclick=()=>{
 if(mission.props.length>=120)return message("Limite de 120 objetos.");
 const kind=$("new-kind").value,id=nextPropId(mission.props,kind);
 const prop=createProp(kind,id,[0,0,0]);mission.props.push(prop);
 const root=makeObject(prop);collection.add(root);meshes.set(id,root);
 select(id);message("Objeto criado: "+id);
};
$("duplicate").onclick=()=>{
 const p=data();if(!p)return message("Selecione um objeto.");
 if(mission.props.length>=120)return message("Limite de 120 objetos.");
 const copy=structuredClone(p);copy.id=nextPropId(mission.props,p.kind);
 copy.name=p.name+" (cópia)";copy.position[0]=Math.min(250,copy.position[0]+8);
 mission.props.push(copy);
 const root=makeObject(copy);collection.add(root);meshes.set(copy.id,root);
 select(copy.id);message("Duplicado: "+copy.id);
};
$("delete").onclick=()=>{
 if(!selectedId)return;
 mission.props=mission.props.filter(p=>p.id!==selectedId);
 rebuild();message("Objeto removido.");
};
function save(){
 try{
  mission.props=validateProps(mission.props);
  localStorage.setItem(storeKey,JSON.stringify(validateMission(mission)));
  message("Missão e construções salvas. Abra o Mission Studio para continuar.");
 }catch(error){message("Não foi possível salvar: "+error.message)}
}
$("save").onclick=save;
$("export").onclick=()=>{
 try{
  const result=JSON.stringify(validateMission(mission),null,2);
  const url=URL.createObjectURL(new Blob([result],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download="wmk-mapa-"+mission.id+".json";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);message("Missão JSON exportada.");
 }catch(error){message("Exportação inválida: "+error.message)}
};
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
renderer.domElement.addEventListener("pointerdown",event=>{
 if(event.button!==0||gizmo.dragging)return;
 const rect=renderer.domElement.getBoundingClientRect();
 mouse.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
 raycaster.setFromCamera(mouse,camera);
 const hits=raycaster.intersectObjects(collection.children,true);
 if(hits.length){
  let obj=hits[0].object;
  while(obj.parent&&obj.parent!==collection)obj=obj.parent;
  if(obj.userData.propId)select(obj.userData.propId);
 }
});
window.addEventListener("keydown",event=>{
 if(["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName))return;
 if(event.ctrlKey&&event.code==="KeyS"){event.preventDefault();save();return}
 if(event.ctrlKey&&event.code==="KeyD"){event.preventDefault();$("duplicate").click();return}
 if(event.code==="Delete")$("delete").click();
 if(event.code==="KeyG")mode("translate");
 if(event.code==="KeyR")mode("rotate");
 if(event.code==="KeyS")mode("scale");
});
window.addEventListener("resize",()=>{
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
});
function animate(){requestAnimationFrame(animate);orbit.update();renderer.render(scene,camera)}
rebuild();requestAnimationFrame(animate);
