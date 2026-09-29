#!/usr/bin/env python3
"""Gera visualizacao/index.html: o site inteiro num arquivo só.

CSS, JavaScript, fontes e ícones ficam embutidos, então o arquivo abre com
dois cliques, sem servidor, e pode ser enviado por e-mail ou WhatsApp para
aprovação. Não é a versão de produção: a política de segurança (CSP) é
retirada, porque ela proíbe justamente o CSS e o JS embutidos.

Uso, a partir da pasta gro-cascavel:
    python3 tools/gerar-visualizacao.py
"""
import base64
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "visualizacao" / "index.html"


def data_uri(path, mime):
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


html = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "assets/css/main.css").read_text(encoding="utf-8")
js = (ROOT / "assets/js/main.js").read_text(encoding="utf-8")

# Fontes dentro do CSS
css = re.sub(
    r'url\("\.\./fonts/([^"]+)"\)',
    lambda m: f'url("{data_uri(ROOT / "assets/fonts" / m.group(1), "font/woff2")}")',
    css,
)

# Registros reais: vai só o JPG, embutido (são pequenos, 84 a 206 px).
html = re.sub(r'<source type="image/(?:avif|webp)" srcset="assets/images/registros/[^"]+">', "", html)
html = re.sub(
    r'src="assets/images/registros/([^"]+\.jpg)"',
    lambda m: f'src="{data_uri(ROOT / "assets/images/registros" / m.group(1), "image/jpeg")}"',
    html,
)

# Comentários do HTML não servem para a visualização
html = re.sub(r"\s*<!--(?!\s*Versão de visualização).*?-->", "", html, flags=re.S)

# Fotos ilustrativas: embute o JPG maior de cada uma, se já foi importado
# (tools/importar-fotos.py). Se ainda não existe, o espaço fica verde.
def embutir_foto(m):
    classe, nome, largura, resto = m.group(1), m.group(2), m.group(3), m.group(4)
    alt = re.search(r'alt="([^"]*)"', resto).group(1)
    dims = re.search(r'width="(\d+)" height="(\d+)"', resto)
    maiores = sorted((ROOT / "assets/images/fotos").glob(f"{nome}-*.jpg"),
                     key=lambda p: int(p.stem.rsplit("-", 1)[1]))
    if maiores:
        src = data_uri(maiores[-1], "image/jpeg")
        return (f'<picture class="{classe}"><img src="{src}" width="{dims.group(1)}" '
                f'height="{dims.group(2)}" alt="{alt}" decoding="async"></picture>')
    return (f'<picture class="{classe} is-missing"><img width="{dims.group(1)}" '
            f'height="{dims.group(2)}" alt="{alt}"></picture>')

html = re.sub(
    r'<picture class="([^"]*foto[^"]*)"><source[^>]*srcset="assets/images/fotos/([a-z]+)-(\d+)\.avif[^>]*>.*?(<img [^>]*>)</picture>',
    embutir_foto, html, flags=re.S)

html = re.sub(r'\s*<meta http-equiv="Content-Security-Policy"[^>]*>', "", html)
html = re.sub(r'\s*<link rel="preload"[^>]*>', "", html)
html = re.sub(r'\s*<link rel="manifest"[^>]*>', "", html)
html = html.replace(
    '<link rel="icon" href="assets/images/favicon.svg" type="image/svg+xml">',
    f'<link rel="icon" href="{data_uri(ROOT / "assets/images/favicon.svg", "image/svg+xml")}" type="image/svg+xml">',
)
html = html.replace(
    '<link rel="apple-touch-icon" href="assets/images/apple-touch-icon.png">', ""
)
html = html.replace(
    '<link rel="stylesheet" href="assets/css/main.css">', f"<style>\n{css}\n</style>"
)
html = html.replace(
    '<script src="assets/js/main.js" defer></script>', f"<script>\n{js}\n</script>"
)
html = html.replace(
    "<head>",
    "<head>\n  <!-- Versão de visualização em arquivo único, gerada por tools/gerar-visualizacao.py. "
    "Para publicar, use a pasta gro-cascavel/, não este arquivo. -->",
    1,
)

assert "assets/" not in html.split("</head>")[1].replace("og-gro-cascavel", ""), "ainda há referência a assets/"
OUT.parent.mkdir(exist_ok=True)
OUT.write_text(html, encoding="utf-8")
print(f"{OUT.relative_to(ROOT)}: {OUT.stat().st_size / 1024:.0f} KB")
