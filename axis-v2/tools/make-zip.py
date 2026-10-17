"""Monta o pacote do Netlify só com o que o site usa.

Uso, a partir da pasta axis-v2/:
    python3 tools/make-zip.py
Gera axis-v2-netlify.zip. Publicar só com autorização da AXIS.
"""
import pathlib
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
INCLUDE = ['index.html', 'robots.txt', 'sitemap.xml', '_headers', 'css', 'js', 'assets']

out = ROOT / 'axis-v2-netlify.zip'
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for name in INCLUDE:
        path = ROOT / name
        for f in ([path] if path.is_file() else sorted(p for p in path.rglob('*') if p.is_file() and p.name != '.gitkeep')):
            z.write(f, f.relative_to(ROOT).as_posix())
print(f'{out.name}: {out.stat().st_size / 1024:.0f} KB')
