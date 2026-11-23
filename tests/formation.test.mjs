import test from "node:test";
import assert from "node:assert/strict";
import {formationOffset,formationDestination,FORMATIONS} from "../src/lab/formation.mjs";
test("três tipos de formação são reconhecidos",()=>assert.deepEqual(FORMATIONS,["column","line","wedge"]));
test("coluna mantém alinhamento",()=>{assert.deepEqual(formationOffset(0,"column"),{right:0,back:7});assert.deepEqual(formationOffset(2,"column"),{right:0,back:21})});
test("linha intercala direita e esquerda",()=>{assert.deepEqual(formationOffset(0,"line"),{right:-7,back:7});assert.deepEqual(formationOffset(1,"line"),{right:7,back:7})});
test("cunha afasta os soldados em dois flancos",()=>{assert.deepEqual(formationOffset(0,"wedge"),{right:-7,back:7});assert.deepEqual(formationOffset(2,"wedge"),{right:-14,back:14})});
test("formação acompanha guinada do líder",()=>{const p=formationDestination({x:0,z:0,yaw:Math.PI/2},0,"column");assert.ok(Math.abs(p.x-7)<1e-8);assert.ok(Math.abs(p.z)<1e-8)});
test("dados inválidos são rejeitados",()=>{assert.throws(()=>formationOffset(-1));assert.throws(()=>formationOffset(2,"triangulo"));assert.throws(()=>formationOffset(0,"line",0))});
