"""Gera as fontes do site a partir das originais (Fontsource, SIL OFL 1.1).

O que faz, sem mudar o desenho das letras:
- recorta para o latim usado em português (+ aspas, travessões, setas, €, ™);
- mantém só os recursos tipográficos padrão (kern, ligaduras, números tabulares);
- limita o eixo de peso ao que o CSS usa:
    Inter 400–700, Oswald 300–600, Dancing Script só 700 (vira fonte estática).

Resultado na V4: 119 KB → 76 KB.

Os arquivos saem com um trecho do hash no nome (oswald.1a2b3c4d.woff2) e o
script atualiza style.css e index.html. Assim o vercel.json pode mandar
guardar as fontes em cache por um ano sem risco de servir uma versão velha.

Requer fontTools:  pip install fonttools brotli
Uso:               python3 tools/otimizar-fontes.py
"""
import hashlib
import re
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "tools" / "source" / "fonts"
DESTINO = RAIZ / "assets" / "fonts"

UNICODES = (
    list(range(0x20, 0x7F)) + list(range(0xA0, 0x100))
    + [0x131, 0x152, 0x153, 0x2C6, 0x2DA, 0x2DC, 0x2013, 0x2014, 0x2018, 0x2019,
       0x201A, 0x201C, 0x201D, 0x201E, 0x2022, 0x2026, 0x20AC, 0x2122,
       0x2190, 0x2191, 0x2192, 0x2193]
)
RECURSOS = ["kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk", "rlig", "clig", "case", "tnum", "lnum"]

FONTES = [
    ("inter-latin-wght-normal.woff2", "inter", (400, 700)),
    ("oswald-latin-wght-normal.woff2", "oswald", (300, 600)),
    ("dancing-script-latin-wght-normal.woff2", "dancing-script-700", 700),
]
REFERENCIAS = [RAIZ / "assets" / "css" / "style.css", RAIZ / "index.html"]


def main() -> None:
    for origem, destino, peso in FONTES:
        fonte = TTFont(ORIGEM / origem, lazy=False)
        opcoes = subset.Options()
        opcoes.layout_features = RECURSOS
        opcoes.name_IDs = ["*"]
        opcoes.notdef_outline = True
        recorte = subset.Subsetter(opcoes)
        recorte.populate(unicodes=UNICODES)
        recorte.subset(fonte)
        fonte = instancer.instantiateVariableFont(fonte, {"wght": peso})
        fonte.flavor = "woff2"
        temporario = DESTINO / f"{destino}.tmp"
        fonte.save(temporario)
        hash8 = hashlib.md5(temporario.read_bytes()).hexdigest()[:8]
        for velho in DESTINO.glob(f"{destino}.*.woff2"):
            velho.unlink()
        final = DESTINO / f"{destino}.{hash8}.woff2"
        temporario.rename(final)
        padrao = re.compile(re.escape(destino) + r"(\.[0-9a-f]{8})?\.woff2")
        for arquivo in REFERENCIAS:
            texto = arquivo.read_text(encoding="utf-8")
            arquivo.write_text(padrao.sub(final.name, texto), encoding="utf-8")
        antes = (ORIGEM / origem).stat().st_size // 1024
        print(f"{final.name:36s} {antes} KB → {final.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
