#!/usr/bin/env python3
"""
Gera uma versão do site em um único arquivo HTML, para abrir com dois cliques
ou mandar por WhatsApp/e-mail para aprovação.

CSS, JavaScript, fontes e ícone entram embutidos no arquivo. A imagem de
compartilhamento (og:image) fica de fora: ela só funciona com o site publicado.

Uso:   python3 tools/build-single-file.py
Saída: queiroz-cosechen-visualizacao.html, na pasta do site
"""
import base64
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(ROOT, "queiroz-cosechen-visualizacao.html")


def ler(rel, modo="r"):
    with open(os.path.join(ROOT, rel), modo) as f:
        return f.read()


def data_uri(rel, mime):
    return "data:%s;base64,%s" % (mime, base64.b64encode(ler(rel, "rb")).decode("ascii"))


def main():
    html = ler("index.html")
    css = ler("assets/css/main.css")
    js = ler("assets/js/main.js")

    # Fontes dentro do CSS
    for nome in ("manrope-latin.woff2", "manrope-latin-ext.woff2"):
        css = css.replace('url("../fonts/%s")' % nome,
                          'url("%s")' % data_uri("assets/fonts/" + nome, "font/woff2"))
    if "../fonts/" in css:
        sys.exit("sobrou referência de fonte não embutida no CSS")

    trocas = [
        ('<link rel="stylesheet" href="assets/css/main.css">', "<style>\n%s\n</style>" % css),
        ('<script src="assets/js/main.js" defer></script>', "<script>\n%s\n</script>" % js),
        ('href="assets/images/favicon.svg"', 'href="%s"' % data_uri("assets/images/favicon.svg", "image/svg+xml")),
    ]
    for antes, depois in trocas:
        if antes not in html:
            sys.exit("não encontrei no index.html: %s" % antes)
        html = html.replace(antes, depois)

    # Sem arquivos externos: o preload da fonte e a og:image deixam de fazer sentido
    html = re.sub(r'\s*<link rel="preload"[^>]*>', "", html)
    html = re.sub(r'\s*<!-- PRODUÇÃO: trocar por URL absoluta[^>]*-->', "", html)
    html = re.sub(r'\s*<meta property="og:image(?::\w+)?"[^>]*>', "", html)
    html = html.replace('<meta name="twitter:card" content="summary_large_image">',
                        '<meta name="twitter:card" content="summary">')

    # Comentários de desenvolvimento (marcas de PRODUÇÃO, foto futura) não vão para a prévia
    html = re.sub(r"\s*<!--.*?-->", "", html, flags=re.S)

    restos = re.findall(r'(?:src|href)="assets/[^"]*"', html)
    if restos:
        sys.exit("ainda há caminhos para assets/: %s" % restos)

    with open(SAIDA, "w") as f:
        f.write(html)
    print("%s — %.0f KB" % (os.path.basename(SAIDA), os.path.getsize(SAIDA) / 1024))


if __name__ == "__main__":
    main()
