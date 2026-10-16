#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parada do Mano — prévia em arquivo único (V5).

Gera parada-do-mano-v5-visualizacao.html: folha de estilo, JavaScript, fontes,
imagens e o vídeo da abertura dentro do próprio arquivo. Abre com dois cliques,
sem servidor e sem as pastas ao lado. Serve para mostrar e aprovar; o site de
publicação continua sendo o index.html com a pasta assets/ (ver tools/make-zip.py).

Diferenças em relação ao site de produção, todas para manter o arquivo leve:
  - cada imagem entra direto no src, na largura que o HTML usa por padrão
    (sem srcset e sem AVIF) — as fotos aparecem mesmo com JavaScript desligado;
  - a foto ampliada da galeria usa a versão de 800 px;
  - só o WebM do vídeo da abertura entra (é o menor dos dois formatos);
  - a imagem de compartilhamento (og:image) não é embutida: numa prévia local
    ela não serve para nada, e em produção ela precisa ser uma URL absoluta.

    python3 tools/build-preview.py
"""
import base64
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGENS = os.path.join(RAIZ, 'assets', 'images')
SAIDA = os.path.join(RAIZ, 'parada-do-mano-v5-visualizacao.html')
TIPOS = {'.mp4': 'video/mp4', '.webm': 'video/webm', '.webp': 'image/webp', '.avif': 'image/avif',
         '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png',
         '.ico': 'image/x-icon'}

_cache = {}


def uri(caminho):
    if caminho not in _cache:
        tipo = TIPOS.get(os.path.splitext(caminho)[1], 'application/octet-stream')
        with open(caminho, 'rb') as f:
            _cache[caminho] = 'data:%s;base64,%s' % (tipo, base64.b64encode(f.read()).decode('ascii'))
    return _cache[caminho]


def versao(nome, largura):
    """buffet-salao-1200.webp -> buffet-salao-800.webp, se existir."""
    m = re.match(r'(.+)-\d+\.webp$', nome)
    if m and os.path.exists(os.path.join(IMAGENS, '%s-%d.webp' % (m.group(1), largura))):
        return '%s-%d.webp' % (m.group(1), largura)
    return nome


def main():
    html = open(os.path.join(RAIZ, 'index.html'), encoding='utf-8').read()

    css = open(os.path.join(RAIZ, 'assets', 'css', 'style.css'), encoding='utf-8').read()
    css = re.sub(r"url\('\.\./fonts/([^']+)'\)",
                 lambda m: "url('%s')" % uri(os.path.join(RAIZ, 'assets', 'fonts', m.group(1))), css)
    html = html.replace('<link rel="stylesheet" href="assets/css/style.css">', '<style>\n' + css + '\n</style>')

    # JavaScript no fim do <body>, na mesma ordem do site: GSAP, ScrollTrigger, main, cinema.
    # Na prévia as bibliotecas já estão no arquivo; cinema.js vê que existem e não busca nada.
    blocos = []
    for rel in ('assets/js/vendor/gsap.min.js', 'assets/js/vendor/ScrollTrigger.min.js',
                'assets/js/main.js', 'assets/js/cinema.js'):
        codigo = open(os.path.join(RAIZ, *rel.split('/')), encoding='utf-8').read()
        blocos.append('<script>\n' + codigo.replace('</script>', '<\\/script>') + '\n</script>')
        html = html.replace('<script src="%s" defer></script>' % rel, '')
    html = html.replace("['assets/js/vendor/gsap.min.js', 'assets/js/vendor/ScrollTrigger.min.js'].forEach", '[].forEach')
    html = html.replace('</body>', '\n'.join(blocos) + '\n</body>')

    # o que não faz sentido num arquivo local
    html = re.sub(r'\s*<link rel="preload"[^>]*>', '', html)
    html = re.sub(r'\s*<link rel="apple-touch-icon"[^>]*>', '', html)
    html = re.sub(r'\s*<source type="image/avif"[^>]*>', '', html)
    # fotos das categorias fechadas: na prévia tudo já está dentro do arquivo, então
    # entram direto (sem a cópia de <noscript>)
    html = re.sub(r'\s*<noscript><img [^>]*></noscript>', '', html)
    html = html.replace(' data-src="assets/images/', ' src="assets/images/')
    html = re.sub(r'\sdata-srcset="[^"]*"', '', html)
    html = re.sub(r'\s(srcset|sizes)="[^"]*"', '', html)

    # imagens: direto no src, sem depender de JavaScript
    html = re.sub(r'src="assets/images/([\w.-]+)"',
                  lambda m: 'src="%s"' % uri(os.path.join(IMAGENS, m.group(1))), html)
    html = re.sub(r'href="assets/images/([\w.-]+)" data-full="assets/images/([\w.-]+)"',
                  lambda m: 'href="%s" data-full="%s"' % ((uri(os.path.join(IMAGENS, versao(m.group(2), 800))),) * 2), html)
    html = re.sub(r'<link rel="icon" href="(favicon\.ico)"',
                  lambda m: '<link rel="icon" href="%s"' % uri(os.path.join(RAIZ, m.group(1))), html)
    html = re.sub(r'\s*<link rel="icon" href="assets/images/logo-192\.png"[^>]*>', '', html)
    # a foto ampliada da galeria já é a de 800 px: a versão "pequena" é a mesma
    html = re.sub(r'\s*data-full-sm="[^"]*"', '', html)

    # vídeo da abertura: só o WebM (menor; Chrome, Edge, Firefox e Safari recente tocam).
    # Onde não tocar, a abertura fica com a foto, como no celular.
    html = re.sub(r'\s*data-src-mp4="[^"]*"', '', html)
    html = re.sub(r'data-src-webm="assets/videos/([\w.-]+)"',
                  lambda m: 'data-src-webm="%s"' % uri(os.path.join(RAIZ, 'assets', 'videos', m.group(1))), html)

    html = html.replace('<html lang="pt-BR" class="no-js">',
                        '<!-- PRÉVIA EM ARQUIVO ÚNICO (V5), gerada por tools/build-preview.py.\n'
                        '     Para publicar, use o index.html com a pasta assets/. -->\n'
                        '<html lang="pt-BR" class="no-js">')

    with open(SAIDA, 'w', encoding='utf-8') as f:
        f.write(html)
    sobrou = sorted(set(re.findall(r'(?:src|href|data-full|data-src-mp4|data-src-webm)="(?!data:|#|https?:)([^"]+)"', html)))
    print('%s — %.1f MB (%.1f MiB), %d arquivos embutidos' % (
        os.path.basename(SAIDA), os.path.getsize(SAIDA) / 1e6, os.path.getsize(SAIDA) / 1048576, len(_cache)))
    print('referências locais restantes:', sobrou or 'nenhuma')


if __name__ == '__main__':
    main()
