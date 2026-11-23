import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
const html=readFileSync(new URL("../map-builder-3d.html",import.meta.url),"utf8");
const source=readFileSync(new URL("../src/lab/map-builder-3d.js",import.meta.url),"utf8");
test("map builder 3D tem JS disponível e sintaxe válida",()=>{
 assert.match(html,/src="\.\/src\/lab\/map-builder-3d\.js"/);
 const result=spawnSync(process.execPath,["--check","--input-type=module"],{input:source,encoding:"utf8"});
 assert.equal(result.status,0,result.stderr);
});
test("map builder 3D tem seleção, gizmos, clonagem e persistência",()=>{
 for(const name of ["move","rotate","scale","duplicate","delete","save","export","add","view"])
  assert.match(html,new RegExp('id="'+name+'"'));
 assert.match(source,/new TransformControls/);
 assert.match(source,/gizmo\.attach/);
 assert.match(source,/validateMission\(mission\)/);
 assert.match(source,/gizmo\.setTranslationSnap/);
});
