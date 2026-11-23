#!/usr/bin/env python3
"""Verificações estáticas do WMK Combined Arms (sem dependências externas)."""
from pathlib import Path
import json
import re
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
index = (root / "index.html").read_text(encoding="utf-8")
assert '<script type="module">' in index, "script módulo ausente"
assert 'import * as THREE from "three"' in index, "Three.js ausente"
assert 'WMK COMBINED ARMS' in index, "marca WMK ausente"
assert 'wmk-quality-select' in index, "seletor de qualidade ausente"
assert 'Walney Moreira Klein' in index, "créditos ausentes"
for name in ("roadmap.html", "LICENSE", "README.md", "version.json"):
    assert (root / name).is_file(), f"arquivo ausente: {name}"
for html in [root / "roadmap.html", *sorted((root / "manuais").glob("*.html"))]:
    content = html.read_text(encoding="utf-8")
    assert "<!DOCTYPE html>" in content, f"HTML sem doctype: {html}"
    assert "</html>" in content, f"HTML incompleto: {html}"
for file in (root / "data" / "exemplos").glob("*.json"):
    data = json.loads(file.read_text(encoding="utf-8"))
    assert data.get("schemaVersion") == 1, f"versão de schema inválida: {file}"
    assert data.get("id"), f"id ausente: {file}"
version = json.loads((root / "version.json").read_text(encoding="utf-8"))
assert version["version"] == "0.2.0"
for unit_type in ("heli","tank","ship","soldier","artillery","plane","sub","apc"):
    unit = json.loads((root / "data" / "units" / (unit_type+".json")).read_text(encoding="utf-8"))
    assert unit["type"] == unit_type and unit["schemaVersion"] == 1
    assert unit["maxSpeed"] > 0 and unit["maxHp"] > 0
    assert f'switchVehicle("{unit_type}")' in index or unit_type in index
assert "unitRegistry" in index and "storeUnit()" in index
modules = []
for html_source in (index, (root / "studio.html").read_text(encoding="utf-8")):
    found = re.findall(r'<script type="module">([\s\S]*?)</script>', html_source)
    assert len(found) == 1, "esperado exatamente um script módulo por arquivo"
    modules.extend(found)
try:
    checks = [subprocess.run(
        ["node", "--check", "--input-type=module"],
        input=module, text=True, capture_output=True, check=False
    ) for module in modules]
except FileNotFoundError:
    print("AVISO: Node.js não disponível; verificação sintática JS ignorada.")
else:
    for check in checks:
        if check.returncode:
            print(check.stderr)
            sys.exit(check.returncode)
# Laboratório: módulo externo, página e elementos de interação.
lab_html=(root / "unit-control-lab.html").read_text(encoding="utf-8")
lab_js=(root / "src" / "lab" / "unit-control.js").read_text(encoding="utf-8")
assert '<!DOCTYPE html>' in lab_html and '</html>' in lab_html
assert 'src="./src/lab/unit-control.js"' in lab_html
for element_id in ("units-list","mapcanvas","order-target","debug-text","file","save","export","import"):
    assert f'id="{element_id}"' in lab_html, f"Controle ausente no laboratório: {element_id}"
for symbol in ("modelSoldier", "modelTank", "modelHeli", "function assume(", "function disembark(", "function switchSeat(", "function toggleMap(", "function saveLocal(", "function botUpdate("):
    assert symbol in lab_js, f"Recurso não encontrado: {symbol}"
assert (root / "manuais" / "unit-control-lab.html").is_file()
# Contratos específicos da v0.3.2 — módulos separados, UI de tripulação e A*.
assert (root / "src" / "lab" / "navigation.mjs").is_file()
assert (root / "src" / "lab" / "crew.mjs").is_file()
assert 'id="crew-content"' in lab_html
assert 'from "./navigation.mjs"' in lab_js and 'from "./crew.mjs"' in lab_js
for symbol in ("findPath(", "renderCrewPanel(", "boardCrew(", "leaveCrew(", "nextAvailableSeat("):
    assert symbol in lab_js, f"Integracao da v0.3.2 ausente: {symbol}"
for test_file in ("movement.test.mjs","navigation.test.mjs","crew.test.mjs"):
    assert (root / "tests" / test_file).is_file()

try:
    check_lab=subprocess.run(["node","--check","--input-type=module"],input=lab_js,text=True,capture_output=True,check=False)
except FileNotFoundError:
    print("AVISO: Node.js indisponível para laboratório.")
else:
    if check_lab.returncode:
        print(check_lab.stderr)
        sys.exit(check_lab.returncode)
print("OK: arquivos, documentação, JSON e sintaxe JavaScript.")
