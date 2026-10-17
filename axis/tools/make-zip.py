"""Monta o pacote do Netlify com apenas os arquivos que o site usa.

Uso, a partir da pasta axis/:
    python3 tools/make-zip.py
Gera axis-netlify.zip; arraste em https://app.netlify.com/drop.
"""
import pathlib
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
INCLUDE = ['index.html', 'robots.txt', 'sitemap.xml', '_headers', 'css', 'js', 'assets']

out = ROOT / 'axis-netlify.zip'
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for name in INCLUDE:
        path = ROOT / name
        files = [path] if path.is_file() else sorted(p for p in path.rglob('*') if p.is_file())
        for f in files:
            z.write(f, f.relative_to(ROOT).as_posix())
print(f'{out.name}: {out.stat().st_size / 1024:.0f} KB')
