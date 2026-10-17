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

O capitulo 3D entra aqui tambem. Modulos ES nao podem ser BAIXADOS de
file:// (o navegador bloqueia por CORS), mas um modulo ESCRITO dentro da
pagina roda sem problema — desde que nao tenha nenhum `import` dentro.
Entao os tres arquivos de js/3d/ sao achatados num unico <script
type="module">: o `export{...}` do Three.js vira um objeto comum, o
`import * as THREE` do opening.js sai (THREE ja esta no escopo) e o
`import('./opening.js')` do boot.js vira uma chamada direta.

    python3 tools/build-single-file.py
"""

import base64
import mimetypes
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'fratelli-moveis-v3-visualizacao.html')


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


def modulo_3d():
    """Os tres arquivos de js/3d/ num unico modulo sem nenhum `import`.

    E a unica forma de a cena rodar a partir de file://: o navegador
    recusa BAIXAR um modulo dessa origem, mas executa o que esta escrito
    na propria pagina. Nada aqui muda a cena — so o jeito de ligar as
    pecas. O pacote de publicacao continua com os tres arquivos
    separados e com o import dinamico, que e o que mantem os 671 KB do
    Three.js fora dos aparelhos que nao vao usa-los.
    """
    pasta = os.path.join(RAIZ, 'js', '3d')

    def ler(nome):
        return open(os.path.join(pasta, nome), encoding='utf-8').read()

    # --- Three.js: o `export{a as Nome, ...}` final vira um objeto ---
    three = ler('three.module.min.js')
    corte = three.rindex('export{')
    cabeca, lista = three[:corte], three[corte + len('export{'):].rstrip()
    assert lista.endswith('};'), 'o export do Three.js nao termina como esperado'
    pares = []
    for item in lista[:-2].split(','):
        item = item.strip()
        origem, _, destino = item.partition(' as ')
        pares.append('%s:%s' % (destino or origem, origem))
    three = cabeca + 'const THREE={' + ','.join(pares) + '};'

    # --- a cena: THREE ja esta no escopo, e nada precisa ser exportado ---
    cena = ler('opening.js')
    alvo = "import * as THREE from './three.module.min.js';"
    assert alvo in cena
    cena = cena.replace(alvo, '/* THREE ja esta no escopo deste modulo */')
    assert 'export function criarAbertura' in cena
    cena = cena.replace('export function criarAbertura', 'function criarAbertura')

    # --- a ligacao: o import dinamico vira chamada direta ---
    boot = ler('boot.js')
    alvo = "  import('./opening.js').then(function (mod) {"
    assert alvo in boot
    boot = boot.replace(alvo, '  try { (function (mod) {')
    alvo = """  }).catch(function () {
    /* Falha ao baixar o m\u00f3dulo: a fotografia continua l\u00e1, a se\u00e7\u00e3o
       continua inteira, e nada no console assusta o visitante. */
    secao.setAttribute('data-perfil', 'B');
  });"""
    assert alvo in boot, 'o .catch do boot.js nao foi encontrado'
    boot = boot.replace(alvo, """  }({ criarAbertura: criarAbertura })); } catch (e) {
    /* Falha ao montar: a fotografia continua l\u00e1, a se\u00e7\u00e3o continua
       inteira, e nada no console assusta o visitante. */
    secao.setAttribute('data-perfil', 'B');
  }""")

    licenca = ler('THREE-LICENSE.txt').strip()
    return ('/* Three.js r169 — MIT. Licenca completa:\n'
            + licenca + '\n*/\n' + three + '\n' + cena + '\n' + boot)


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

    # ---- o capitulo 3D, achatado num modulo embutido ----
    html = html.replace(
        '<script type="module" src="js/3d/boot.js"></script>',
        '<script type="module">\n' + modulo_3d().replace('</script>', '<\\/script>')
        + '\n</script>')

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
