// Regressões estáticas para o jogo principal. Não substituem teste visual em navegador.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const inline=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1]||"";
test("script módulo do jogo principal mantém sintaxe válida",()=>{
 const result=spawnSync(process.execPath,["--check","--input-type=module"],{input:inline,encoding:"utf8"});
 assert.equal(result.status,0,result.stderr);
});
test("soldado recebe altura de segurança no spawn e a cada atualização",()=>{
 assert.match(inline,/type==="soldier"\)y=Math\.max\(0,y\)\+0\.45/);
 assert.match(inline,/player\.type==="soldier"\?\.45:0/);
});
test("submarino tem câmera submersa e torpedos não são removidos em -4m",()=>{
 assert.match(inline,/player\.type==="sub"\?3\.5:stats\.cameraHeight/);
 assert.match(inline,/player\.type==="sub"\?-65:-4/);
 assert.match(inline,/projectile\.minY\?\?-4/);
 assert.match(inline,/sub:\{x:20,z:535,yaw:0,depth:6\}/);
});
test("AAP possui tiro balístico, gravidade, mira de cima e alternância V",()=>{
 assert.match(inline,/function fireAAP\(/);
 assert.match(inline,/gravity=32/);
 assert.match(inline,/artillery:true/);
 assert.match(inline,/function toggleAAPView\(/);
 assert.match(inline,/event\.code==="KeyV"/);
 assert.match(inline,/aapStrategicMode/);
});
