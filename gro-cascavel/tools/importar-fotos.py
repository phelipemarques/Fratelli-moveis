#!/usr/bin/env python3
"""Prepara as fotos do site a partir dos arquivos originais.

Só fotos reais da GRO (equipe, estrutura, treinamentos, atendimento).
Coloque os originais em fotos-originais/ com estes nomes (qualquer extensão
de imagem): hero, fachada, medicina, seguranca, treinamentos, assessoria, empresas.
Não precisa ter todos: o script processa os que existirem.
O script gera, em assets/images/fotos/, cada foto em duas larguras e três
formatos (AVIF, WebP, JPG). Nunca amplia: se o original for menor que a
largura pedida, usa o tamanho original.

Uso, a partir da pasta gro-cascavel:
    python3 tools/importar-fotos.py
"""
import pathlib
import sys

from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "fotos-originais"
OUT = ROOT / "assets" / "images" / "fotos"

# nome: larguras usadas no srcset do index.html
FOTOS = {
    "hero": (1200, 2400),
    "fachada": (800, 1600),
    "medicina": (800, 1400),
    "seguranca": (800, 1400),
    "treinamentos": (800, 1400),
    "assessoria": (800, 1400),
    "empresas": (1000, 2000),
}

OUT.mkdir(parents=True, exist_ok=True)
faltando = []
for nome, larguras in FOTOS.items():
    arquivos = [p for p in SRC.glob(nome + ".*") if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp", ".avif")]
    if not arquivos:
        faltando.append(nome)
        continue
    im = ImageOps.exif_transpose(Image.open(arquivos[0])).convert("RGB")
    for w in larguras:
        alvo = min(w, im.width)
        h = round(im.height * alvo / im.width)
        r = im.resize((alvo, h), Image.LANCZOS) if alvo != im.width else im
        base = OUT / f"{nome}-{w}"
        r.save(base.with_suffix(".jpg"), quality=82, optimize=True, progressive=True)
        r.save(base.with_suffix(".webp"), quality=80, method=6)
        r.save(base.with_suffix(".avif"), quality=60)
        aviso = "" if alvo == w else f" (original tem só {im.width} px)"
        print(f"{nome}-{w}: {alvo}x{h}{aviso}")

if faltando:
    print("Sem original (tudo bem, o site funciona sem):", ", ".join(faltando))
