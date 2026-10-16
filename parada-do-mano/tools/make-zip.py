#!/usr/bin/env python3
"""
Monta parada-do-mano-site.zip: só o que o site usa em produção
(index.html, robots.txt e assets/). Ficam de fora documentação,
ferramentas, fotos originais e a prévia em arquivo único.

    python3 tools/make-zip.py
"""
import os
import zipfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'parada-do-mano-site.zip')
ARQUIVOS = ['index.html', 'robots.txt']
PASTAS = ['assets']


def main():
    itens = list(ARQUIVOS)
    for pasta in PASTAS:
        for dirpath, _, nomes in os.walk(os.path.join(RAIZ, pasta)):
            for n in sorted(nomes):
                itens.append(os.path.relpath(os.path.join(dirpath, n), RAIZ))
    if os.path.exists(SAIDA):
        os.remove(SAIDA)
    with zipfile.ZipFile(SAIDA, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for rel in sorted(itens):
            z.write(os.path.join(RAIZ, rel), os.path.join('parada-do-mano', rel))
    print('%s — %d arquivos, %.2f MB' % (os.path.basename(SAIDA), len(itens), os.path.getsize(SAIDA) / 1e6))


if __name__ == '__main__':
    main()
