#!/usr/bin/env python3
"""Gera entrega/gro-cascavel-v2-producao.zip: só o que vai para a hospedagem.

Entram a página, a 404, os cabeçalhos, os arquivos de indexação e assets/.
Ficam de fora documentação, ferramentas, capturas e originais de fotos.

Uso, a partir da pasta gro-cascavel-v2:
    python3 tools/empacotar.py
"""
import pathlib
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "entrega" / "gro-cascavel-v2-producao.zip"
ARQUIVOS = ["index.html", "404.html", "_headers", "robots.txt", "sitemap.xml", "site.webmanifest"]

OUT.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for nome in ARQUIVOS:
        z.write(ROOT / nome, nome)
    for p in sorted((ROOT / "assets").rglob("*")):
        if p.is_file() and p.name != ".DS_Store":
            z.write(p, p.relative_to(ROOT).as_posix())
    total = len(z.namelist())
print(f"{OUT.relative_to(ROOT)}: {total} arquivos, {OUT.stat().st_size / 1024:.0f} KB")
