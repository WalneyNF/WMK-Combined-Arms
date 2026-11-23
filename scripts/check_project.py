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
assert version["version"] == "0.1.0"
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
print("OK: arquivos, documentação, JSON e sintaxe JavaScript.")
