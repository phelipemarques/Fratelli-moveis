#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fratelli Moveis — versao de arquivo unico, so para visualizar.

Gera um HTML que carrega tudo de dentro de si mesmo: folha de estilo,
JavaScript, fontes e imagens viram data URI. Nao depende de pasta nenhuma
ao lado, nao depende de servidor, e abre com dois cliques em qualquer
navegador.

NAO e o arquivo de publicacao. O site que vai para o Netlify continua
sendo o index.html com as pastas — este aqui e maior, nao tem srcset
(serve sempre a imagem maior) e nao tem os arquivos de apoio.

Ficou bem mais simples do que era. Ate a V9 este arquivo precisava
achatar seis modulos ES e os 687 KB do Three.js num unico <script
type="module">, porque o navegador recusa BAIXAR um modulo de file://.
Com o armario 3D fora, sobram dois arquivos de JavaScript comuns, que
entram embutidos como qualquer outro script.

    python3 tools/build-single-file.py
"""

import base64
import mimetypes
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'fratelli-moveis-reimaginada-visualizacao.html')


def uri(caminho):
    tipo, _ = mimetypes.guess_type(caminho)
    if caminho.endswith('.webp'):
        tipo = 'image/webp'
    elif caminho.endswith('.woff2'):
        tipo = 'font/woff2'
    with open(caminho, 'rb') as f:
        return 'data:%s;base64,%s' % (tipo or 'application/octet-stream',
                                      base64.b64encode(f.read()).decode('ascii'))


def maior_webp():
    """Para cada imagem, a maior versao WebP disponivel."""
    pasta = os.path.join(RAIZ, 'assets', 'images')
    melhor = {}
    for nome in os.listdir(pasta):
        m = re.match(r'(.+?)-(\d+)\.webp$', nome)
        if not m:
            continue
        base, larg = m.group(1), int(m.group(2))
        if base not in melhor or larg > melhor[base][0]:
            melhor[base] = (larg, nome)
    return {b: v[1] for b, v in melhor.items()}


def main():
    html = open(os.path.join(RAIZ, 'index.html'), encoding='utf-8').read()
    webp = maior_webp()
    cache = {}

    def para_uri(nome):
        if nome not in cache:
            cache[nome] = uri(os.path.join(RAIZ, 'assets', 'images', nome))
        return cache[nome]

    def substituta(arquivo):
        """Do nome de um arquivo de imagem para a maior versao WebP dele."""
        m = re.match(r'(.+?)-\d+\.(webp|jpg)$', arquivo)
        base = m.group(1) if m else os.path.splitext(arquivo)[0]
        return webp.get(base)

    # ---- folha de estilo, com as fontes embutidas dentro dela ----
    css = open(os.path.join(RAIZ, 'css', 'main.css'), encoding='utf-8').read()
    css = re.sub(
        r"url\('\.\./assets/fonts/([^']+)'\)",
        lambda m: "url('%s')" % uri(os.path.join(RAIZ, 'assets', 'fonts', m.group(1))),
        css)
    html = html.replace('<link rel="stylesheet" href="css/main.css">',
                        '<style>\n' + css + '\n</style>')

    # ---- JavaScript ----
    js = open(os.path.join(RAIZ, 'js', 'main.js'), encoding='utf-8').read()
    html = re.sub(
        r'<script src="js/main\.js"[^>]*></script>',
        lambda m: '<script>\n' + js.replace('</script>', '<\\/script>') + '\n</script>',
        html)

    # ---- os preloads perdem a funcao: o conteudo ja esta no arquivo ----
    html = re.sub(r'\s*<link rel="preload"[^>]*>', '', html)

    # ---- <picture>: sem srcset, uma imagem so, embutida ----
    def limpa_picture(m):
        bloco = m.group(0)
        bloco = re.sub(r'\s*<source[^>]*>', '', bloco)

        def troca_src(s):
            alvo = substituta(s.group(1))
            return 'src="%s"' % para_uri(alvo) if alvo else s.group(0)

        bloco = re.sub(r'src="assets/images/([\w.-]+)"', troca_src, bloco)
        bloco = re.sub(r'\s*(srcset|sizes)="[^"]*"', '', bloco)
        return bloco

    html = re.sub(r'<picture>.*?</picture>', limpa_picture, html, flags=re.S)

    # ---- video ----
    # O filme tambem entra embutido, senao este arquivo deixaria de ser
    # autossuficiente, que e a unica razao de ele existir. Isso vale so
    # aqui: no pacote de publicacao o video e um arquivo separado, para o
    # navegador poder buscar o pedaco que precisa e so quando precisa.
    video = os.path.join(RAIZ, 'assets', 'video', 'fratelli-brand-film.mp4')
    if os.path.exists(video):
        html = html.replace('src="assets/video/fratelli-brand-film.mp4"',
                            'src="%s"' % uri(video))

    # ---- js/reveal.js ----
    # A versao reimaginada nao tem mais o capitulo 3D, entao nao ha mais
    # nada para achatar: os modulos ES e os 687 KB do Three.js sairam
    # junto com o armario. Sobra um arquivo comum, que entra embutido
    # como qualquer outro script.
    alvo = '<script src="js/reveal.js" defer></script>'
    assert alvo in html, 'nao achei a tag de js/reveal.js'
    corpo = open(os.path.join(RAIZ, 'js', 'reveal.js'), encoding='utf-8').read()
    html = html.replace(alvo,
        '<script>\n' + corpo.replace('</script>', '<\\/script>') + '\n</script>')

    # ---- a previa NUNCA pode ser indexada ----
    # Cinto e suspensorio: o index.html ja sai com noindex, mas se um dia
    # ele for liberado para publicacao, a previa NAO deve ir junto. Ela e
    # um arquivo solto, que circula por e-mail e por pasta compartilhada.
    if 'name="robots"' in html:
        html = re.sub(r'<meta name="robots" content="[^"]*">',
                      '<meta name="robots" content="noindex, nofollow">', html)
    else:
        html = html.replace('</title>',
                            '</title>\n<meta name="robots" content="noindex, nofollow">')

    # ---- icone ----
    html = html.replace('href="assets/images/favicon.svg"',
                        'href="%s"' % uri(os.path.join(RAIZ, 'assets', 'images', 'favicon.svg')))

    # ---- aviso no topo do arquivo ----
    html = html.replace('<html lang="pt-BR" class="no-js">',
                        '<!-- VERSAO DE VISUALIZACAO: tudo embutido num arquivo so, para abrir\n'
                        '     sem servidor e sem as pastas ao lado. O site de publicacao e o\n'
                        '     index.html do pacote, com css/, js/ e assets/.\n'
                        '     Gerado por tools/build-single-file.py. -->\n'
                        '<html lang="pt-BR" class="no-js">')

    with open(SAIDA, 'w', encoding='utf-8') as f:
        f.write(html)

    sobrou = re.findall(r'(?:src|href)="(?!data:|#|https?:|mailto:)([^"]+)"', html)
    print('%s — %.1f MB' % (os.path.basename(SAIDA), os.path.getsize(SAIDA) / 1e6))
    print('%d imagens embutidas' % len(cache))
    print('referencias externas restantes:', sorted(set(sobrou)) or 'nenhuma')


if __name__ == '__main__':
    main()
