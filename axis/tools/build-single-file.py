"""Gera uma versão do site em arquivo único, para visualizar ou enviar.

Uso, a partir da pasta axis/:
    python3 tools/build-single-file.py
Gera axis-visualizacao.html com CSS, JavaScript, fontes e favicon
embutidos. Abre direto no navegador, sem servidor.
"""
import base64
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent


def data_uri(path, mime):
    return f'data:{mime};base64,' + base64.b64encode((ROOT / path).read_bytes()).decode()


html = (ROOT / 'index.html').read_text(encoding='utf-8')
css = (ROOT / 'css/main.css').read_text(encoding='utf-8')
css = re.sub(r"url\('\.\./(assets/fonts/[^']+\.woff2)'\)",
             lambda m: f"url('{data_uri(m.group(1), 'font/woff2')}')", css)

html = re.sub(r'\s*<link rel="preload"[^>]+>', '', html)
html = html.replace('<link rel="stylesheet" href="css/main.css">', f'<style>\n{css}</style>')
html = html.replace('href="assets/brand/favicon.svg"', f'href="{data_uri("assets/brand/favicon.svg", "image/svg+xml")}"')
for src in ('js/vendor/gsap.min.js', 'js/main.js'):
    js = (ROOT / src).read_text(encoding='utf-8').replace('</script', '<\\/script')
    # Scripts embutidos não aceitam defer: vão para o fim do <body>.
    html = html.replace(f'<script src="{src}" defer></script>', '')
    html = html.replace('</body>', f'<script>\n{js}\n</script>\n</body>')

out = ROOT / 'axis-visualizacao.html'
out.write_text(html, encoding='utf-8')
print(f'{out.name}: {out.stat().st_size / 1024:.0f} KB')
