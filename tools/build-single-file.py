#!/usr/bin/env python3
"""
Gera uma versao do site em um unico arquivo HTML.

CSS, JavaScript, fontes e imagens entram embutidos, entao o arquivo abre com
dois cliques, funciona offline e pode ser hospedado em qualquer lugar sem levar
pasta junto.

Diferencas em relacao ao site da pasta, todas deliberadas:
  - so o subconjunto latino das fontes (cobre o portugues; o latin-ext sai)
  - so as imagens em WebP, sem a reserva em JPEG
  - uma variante de imagem por enquadramento, em vez do conjunto responsivo
  - sem og:image, que precisa de um endereco publico para funcionar

Uso: python3 tools/build-single-file.py
Saida: dist/fratelli-moveis.html
"""
import base64
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "dist")
OUT = os.path.join(OUT_DIR, "fratelli-moveis.html")

CSS_ORDER = ["tokens.css", "base.css", "layout.css", "components.css", "motion.css"]
JS_ORDER = [
    "assets/vendor/gsap.min.js",
    "assets/vendor/ScrollTrigger.min.js",
    "assets/js/nav.js",
    "assets/js/motion.js",
]


def read(rel, binary=False):
    path = os.path.join(ROOT, rel)
    with open(path, "rb" if binary else "r", encoding=None if binary else "utf-8") as f:
        return f.read()


def data_uri(rel, mime):
    return "data:%s;base64,%s" % (mime, base64.b64encode(read(rel, True)).decode("ascii"))


def build_css():
    parts = []
    for name in CSS_ORDER:
        css = read("assets/css/" + name)
        if name == "base.css":
            # O latin-ext sai: o portugues inteiro cabe no subconjunto latino.
            css = re.sub(
                r"@font-face\s*\{[^}]*?latin-ext\.woff2[^}]*?\}\s*", "", css, flags=re.S
            )
            for family in ("newsreader", "inter"):
                css = css.replace(
                    "url('../fonts/%s-latin.woff2')" % family,
                    "url(%s)" % data_uri("assets/fonts/%s-latin.woff2" % family, "font/woff2"),
                )
        parts.append("/* ===== %s ===== */\n%s" % (name, css))
    css = "\n".join(parts)
    if "../fonts/" in css or "../img/" in css:
        sys.exit("sobrou referencia externa no CSS")
    return css


def build_html():
    html = read("index.html")

    # Pre-carregamentos apontam para arquivos que nao existem mais aqui.
    html = re.sub(r'\n<link rel="preload"[^>]*>', "", html)
    html = re.sub(r'\n<meta property="og:image[^>]*>', "", html)

    # Folhas de estilo viram um bloco so.
    # Substituicao por funcao: o conteudo tem contrabarras que o re leria
    # como sequencias de escape se fosse passado como texto de troca.
    style = "\n<style>\n%s\n</style>" % build_css()
    html = re.sub(r'(\n<link rel="stylesheet"[^>]*>)+', lambda m: style, html, count=1)

    html = html.replace(
        'href="assets/img/favicon.svg" type="image/svg+xml"',
        'href="%s" type="image/svg+xml"' % data_uri("assets/img/favicon.svg", "image/svg+xml"),
    )

    # Cada <picture> vira uma imagem so, embutida. O conjunto responsivo nao
    # cabe aqui: seriam varias copias do mesmo quadro dentro do arquivo.
    # A excecao e a abertura, que mantem o recorte vertical do celular.
    def inline_picture(match):
        block = match.group(0)
        img = re.search(r"<img\b[^>]*>", block, re.S).group(0)
        jpg = re.search(r'src="assets/img/([^"]+)\.jpg"', img).group(1)
        webp = "assets/img/%s.webp" % jpg
        if not os.path.exists(os.path.join(ROOT, webp)):
            sys.exit("sem WebP correspondente para %s" % jpg)
        img = re.sub(r'src="assets/img/[^"]+"',
                     lambda m: 'src="%s"' % data_uri(webp, "image/webp"), img)
        extra = ""
        if "hero-wide" in jpg:
            extra = ('\n        <source media="(max-width: 740px)" type="image/webp" srcset="%s">'
                     % data_uri("assets/img/hero-portrait-640.webp", "image/webp"))
        return "<picture>%s\n        %s\n      </picture>" % (extra, img)

    html = re.sub(r"<picture>.*?</picture>", inline_picture, html, flags=re.S)

    # Scripts embutidos, na mesma ordem. Sem src, `onerror` perde a funcao:
    # a rede de seguranca que resta e o tempo limite dentro do nav.js.
    scripts = "\n".join(
        "<script>\n%s\n</script>" % read(rel).rstrip() for rel in JS_ORDER
    )
    html = re.sub(r'(\n<script src="assets/[^>]*></script>)+', lambda m: "\n" + scripts, html, count=1)

    leftovers = re.findall(r'(?:src|href)="(assets/[^"]+)"', html)
    if leftovers:
        sys.exit("sobrou referencia externa: %s" % leftovers)
    return html


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    html = build_html()
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)
    print("%s — %.0f KB" % (os.path.relpath(OUT, ROOT), os.path.getsize(OUT) / 1024))


if __name__ == "__main__":
    main()
