#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parada do Mano — prévia em arquivo único.

Gera parada-do-mano-visualizacao.html: folha de estilo, JavaScript, fontes
e imagens embutidas no próprio arquivo. Abre com dois cliques, sem servidor
e sem as pastas ao lado. Serve para mostrar e aprovar; o site de publicação
continua sendo o index.html com a pasta assets/ (ver tools/make-zip.py).

    python3 tools/build-preview.py
"""
import base64
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGENS = os.path.join(RAIZ, 'assets', 'images')
SAIDA = os.path.join(RAIZ, 'parada-do-mano-visualizacao.html')
TIPOS = {'.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
         '.woff2': 'font/woff2', '.png': 'image/png'}

_cache = {}


def uri(caminho):
    if caminho not in _cache:
        tipo = TIPOS.get(os.path.splitext(caminho)[1], 'application/octet-stream')
        with open(caminho, 'rb') as f:
            _cache[caminho] = 'data:%s;base64,%s' % (tipo, base64.b64encode(f.read()).decode('ascii'))
    return _cache[caminho]


def maior_versao(nome):
    """buffet-arroz-480.webp -> buffet-arroz-1200.webp (a maior que existir)."""
    m = re.match(r'(.+)-(\d+)\.webp$', nome)
    if not m:
        return nome
    base = m.group(1)
    larguras = [int(x.group(1)) for x in (re.match(re.escape(base) + r'-(\d+)\.webp$', n)
                                          for n in os.listdir(IMAGENS)) if x]
    return '%s-%d.webp' % (base, max(larguras))


def main():
    html = open(os.path.join(RAIZ, 'index.html'), encoding='utf-8').read()

    css = open(os.path.join(RAIZ, 'assets', 'css', 'style.css'), encoding='utf-8').read()
    css = re.sub(r"url\('\.\./fonts/([^']+)'\)",
                 lambda m: "url('%s')" % uri(os.path.join(RAIZ, 'assets', 'fonts', m.group(1))), css)
    html = html.replace('<link rel="stylesheet" href="assets/css/style.css">', '<style>\n' + css + '\n</style>')

    js = open(os.path.join(RAIZ, 'assets', 'js', 'main.js'), encoding='utf-8').read()
    html = html.replace('<script src="assets/js/main.js" defer></script>', '')
    html = html.replace('</body>', '<script>\n' + js.replace('</script>', '<\\/script>') + '\n</script>\n</body>')

    # preloads perdem a função: tudo já está dentro do arquivo
    html = re.sub(r'\s*<link rel="preload"[^>]*>', '', html)
    # sem srcset: cada imagem entra uma vez, na maior versão
    html = re.sub(r'\s(srcset|sizes)="[^"]*"', '', html)
    html = re.sub(r'src="assets/images/([\w.-]+)"',
                  lambda m: 'src="%s"' % uri(os.path.join(IMAGENS, maior_versao(m.group(1)))), html)
    html = re.sub(r'"assets/images/([\w.-]+)"',
                  lambda m: '"%s"' % uri(os.path.join(IMAGENS, m.group(1))), html)

    html = html.replace('<html lang="pt-BR" class="no-js">',
                        '<!-- PRÉVIA EM ARQUIVO ÚNICO, gerada por tools/build-preview.py.\n'
                        '     Para publicar, use o index.html com a pasta assets/. -->\n'
                        '<html lang="pt-BR" class="no-js">')

    with open(SAIDA, 'w', encoding='utf-8') as f:
        f.write(html)
    sobrou = sorted(set(re.findall(r'(?:src|href)="(?!data:|#|https?:)([^"]+)"', html)))
    print('%s — %.1f MB, %d arquivos embutidos' % (os.path.basename(SAIDA), os.path.getsize(SAIDA) / 1e6, len(_cache)))
    print('referências locais restantes:', sobrou or 'nenhuma')


if __name__ == '__main__':
    main()
