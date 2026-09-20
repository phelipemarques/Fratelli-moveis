#!/usr/bin/env python3
"""
Monta o pacote para arrastar no Netlify.

Entra no ZIP apenas o que o site usa em produção. Ficam de fora a
documentação, os scripts de preparo de imagem e os arquivos de origem.

Uso: python3 tools/make-zip.py
Saida: fratelli-moveis-netlify.zip na raiz do projeto
"""
import os
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(ROOT, "fratelli-moveis-netlify.zip")

ARQUIVOS = ["index.html", "404.html", "robots.txt", "sitemap.xml", "_headers"]
PASTAS = ["css", "js", "assets/fonts", "assets/images"]


def main():
    itens = []
    for f in ARQUIVOS:
        caminho = os.path.join(ROOT, f)
        if not os.path.exists(caminho):
            sys.exit("faltando: %s" % f)
        itens.append(f)
    for pasta in PASTAS:
        base = os.path.join(ROOT, pasta)
        if not os.path.isdir(base):
            sys.exit("faltando a pasta: %s" % pasta)
        for dirpath, _, nomes in os.walk(base):
            for n in sorted(nomes):
                itens.append(os.path.relpath(os.path.join(dirpath, n), ROOT))

    if os.path.exists(SAIDA):
        os.remove(SAIDA)
    with zipfile.ZipFile(SAIDA, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for rel in sorted(itens):
            z.write(os.path.join(ROOT, rel), rel)

    print("%s — %d arquivos, %.1f MB" % (os.path.basename(SAIDA), len(itens),
                                         os.path.getsize(SAIDA) / 1024 / 1024))
    por_pasta = {}
    for rel in itens:
        chave = rel.split("/")[0] if "/" in rel else "(raiz)"
        if chave == "assets":
            chave = "/".join(rel.split("/")[:2])
        por_pasta.setdefault(chave, [0, 0])
        por_pasta[chave][0] += 1
        por_pasta[chave][1] += os.path.getsize(os.path.join(ROOT, rel))
    for chave in sorted(por_pasta):
        n, peso = por_pasta[chave]
        print("   %-18s %3d arquivos  %7.0f KB" % (chave, n, peso / 1024))


if __name__ == "__main__":
    main()
