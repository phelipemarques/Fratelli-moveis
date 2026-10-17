"""Gera axis-v2-visualizacao.html: o site inteiro em um arquivo, para
abrir com dois cliques ou enviar a alguém.

Uso, a partir da pasta axis-v2/:
    python3 tools/build-single-file.py

Embute CSS, os cinco scripts (na mesma ordem e no mesmo lugar: núcleo do
GSAP e abertura no <head>, o resto no fim do <body>), fontes, favicon e
as fotos que já estiverem encaixadas (uma largura média de cada, e a
versão grande da galeria). Só a imagem de compartilhamento (og:image)
fica de fora: ela só serve no site publicado.
"""
import base64
import mimetypes
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent


def uri(rel):
    path = ROOT / rel
    mime = mimetypes.guess_type(path.name)[0] or ('font/woff2' if path.suffix == '.woff2' else 'application/octet-stream')
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode()


def js(rel):
    return (ROOT / rel).read_text(encoding='utf-8').replace('</script', '<\\/script')


html = (ROOT / 'index.html').read_text(encoding='utf-8')
css = (ROOT / 'css/main.css').read_text(encoding='utf-8')
css = re.sub(r"url\('\.\./(assets/[^']+)'\)", lambda m: f"url('{uri(m.group(1))}')", css)

html = re.sub(r'\s*<link rel="preload"[^>]+>', '', html)
html = html.replace('<link rel="stylesheet" href="css/main.css">', f'<style>\n{css}</style>')
html = html.replace('href="assets/brand/favicon.svg"', f'href="{uri("assets/brand/favicon.svg")}"')

# Scripts síncronos do <head>: ficam onde estão.
for rel in ('js/vendor/gsap.min.js', 'js/intro.js'):
    html = html.replace(f'<script src="{rel}"></script>', f'<script>\n{js(rel)}\n</script>')
# Scripts adiados: vão para o fim do <body>, na mesma ordem.
tail = ''
for rel in ('js/vendor/ScrollTrigger.min.js', 'js/site.js', 'js/motion.js'):
    html = html.replace(f'<script src="{rel}" defer></script>', '')
    tail += f'<script>\n{js(rel)}\n</script>\n'
html = html.replace('</body>', tail + '</body>')

# Fotos: <source> sai; o <img> fica com uma largura só, embutida.
html = re.sub(r'<source [^>]*>', '', html)
html = re.sub(r' srcset="[^"]*"| sizes="[^"]*"', '', html)
html = re.sub(r'(src|href)="(assets/images/[^"]+)"', lambda m: f'{m.group(1)}="{uri(m.group(2))}"', html)

out = ROOT / 'axis-v2-visualizacao.html'
out.write_text(html, encoding='utf-8')
left = sorted(set(re.findall(r'(?:src|href)="((?:assets|css|js)/[^"]+)"', re.sub(r'<!--.*?-->', '', html, flags=re.S))))
print(f'{out.name}: {out.stat().st_size / 1024:.0f} KB', '· referências externas restantes:', left or 'nenhuma')
