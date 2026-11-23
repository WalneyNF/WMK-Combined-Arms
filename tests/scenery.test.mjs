import test from "node:test";
import assert from "node:assert/strict";
import {createProp,validateProps,propFootprint,propBlockers,nextPropId} from "../src/lab/scenery.mjs";
import {resolveGroundPosition} from "../src/lab/movement.mjs";
import {findPath,hasLineOfSight} from "../src/lab/navigation.mjs";
test("objetos possuem dimensões e identificadores próprios",()=>{
 const a=createProp("building","wmk-building-001",[65,0,65]);
 const b=createProp("wall","wmk-wall-001",[15,0,15]);
 assert.equal(a.size.height,9);assert.equal(b.size.height,4);
 assert.equal(validateProps([a,b]).length,2);
});
test("objetos duplicados ou fora do mapa são rejeitados",()=>{
 const a=createProp("crate","caixa",[70,0,70]);
 assert.throws(()=>validateProps([a,a]),/duplicado/);
 assert.throws(()=>validateProps([{...a,position:[300,0,0]}]),/fora/);
 assert.throws(()=>validateProps([{...a,size:{width:-3,height:3,depth:3}}]),/Dimensões/);
});
test("clonagem encontra ID livre",()=>{
 const a=createProp("crate","wmk-crate-001");
 assert.equal(nextPropId([a],"crate"),"wmk-crate-002");
});
test("colisão utiliza objetos adicionais",()=>{
 const prop=createProp("building","hangar",[45,0,45]);
 const buildings=propBlockers([prop]);
 const without=resolveGroundPosition(45,45,1,[]);
 const withProp=resolveGroundPosition(45,45,1,[],buildings);
 assert.notDeepEqual([withProp.x,withProp.z],[without.x,without.z]);
});
test("navegação contorna paredes adicionadas ao mapa",()=>{
 const prop=createProp("wall","muralha",[0,0,90]);
 prop.size.width=40;prop.size.depth=3;
 const buildings=propBlockers([prop]);
 const a={x:-35,z:90},b={x:35,z:90};
 assert.equal(hasLineOfSight(a,b,{buildings}),false);
 const path=findPath(a,b,{buildings});
 assert.ok(path.length>1);
});
test("rotação aumenta footprint conservadora",()=>{
 const prop=createProp("wall","p",[0,0,0]);
 const before=propFootprint(prop);
 prop.yaw=Math.PI/4;
 const after=propFootprint(prop);
 assert.ok(after.depth>before.depth);
});
