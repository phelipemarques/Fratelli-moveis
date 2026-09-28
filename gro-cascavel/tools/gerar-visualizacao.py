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
