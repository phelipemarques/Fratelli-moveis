"""Encaixa as fotos reais da AXIS no site.

Uso, a partir da pasta axis-v2/:
    python3 -m pip install pillow      # uma vez (Pillow 11.3+ grava AVIF)
    python3 tools/fotos.py

1. Coloque cada foto original em tools/fotos/ com o nome do espaço,
   por exemplo tools/fotos/hero-musculacao.jpg. Os nomes estão em
   tools/fotos/slots.json.
2. Ajuste o "alt" do espaço em slots.json para descrever a foto.
3. Rode o script. Para cada foto encontrada, ele:
   - corrige a orientação, gera AVIF e WebP nas larguras do espaço em
     assets/images/ (e uma versão grande para o lightbox da galeria);
   - troca, no index.html, o bloco entre <!-- FOTO:nome --> e
     <!-- /FOTO:nome --> por um <picture> com width/height, srcset,
     sizes e carregamento adiado (exceto na abertura);
   - mostra um quadro da galeria que estava escondido à espera de foto.
Espaços sem foto continuam com a moldura "Foto real". Rodar de novo é
seguro: o bloco é regravado a partir do zero.

Use só fotos com autorização de uso de imagem. Não use pessoas
identificáveis sem consentimento.
"""
import html
import json
import pathlib
import re
import sys

from PIL import Image, ImageOps, features

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'tools' / 'fotos'
OUT = ROOT / 'assets' / 'images'
INDEX = ROOT / 'index.html'
LIGHTBOX_W = 1800
AVIF = features.check('avif')


def find_source(name):
    for ext in ('.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG'):
        p = SRC / (name + ext)
        if p.exists():
            return p
    return None


def save(im, base, w):
    h = round(im.height * w / im.width)
    r = im.resize((w, h), Image.LANCZOS) if w < im.width else im
    r.save(OUT / f'{base}-{w}.webp', 'WEBP', quality=78, method=6)
    if AVIF:
        r.save(OUT / f'{base}-{w}.avif', 'AVIF', quality=55)
    return r.size


def picture(name, cfg, im):
    widths = [w for w in cfg['widths'] if w <= im.width] or [im.width]
    sizes = [save(im, name, w) for w in widths]
    w0, h0 = sizes[-1]
    srcset = lambda ext: ', '.join(f'assets/images/{name}-{w}.{ext} {w}w' for w in widths)
    eager = cfg.get('eager')
    load = 'fetchpriority="high"' if eager else 'loading="lazy"'
    alt = html.escape(cfg['alt'], quote=True)
    pic = '<picture>'
    if AVIF:
        pic += f'<source type="image/avif" srcset="{srcset("avif")}" sizes="{cfg["sizes"]}">'
    pic += (f'<img class="media" src="assets/images/{name}-{widths[len(widths) // 2]}.webp" '
            f'srcset="{srcset("webp")}" sizes="{cfg["sizes"]}" width="{w0}" height="{h0}" '
            f'{load} decoding="async" alt="{alt}"></picture>')
    if cfg.get('lightbox'):
        big = min(LIGHTBOX_W, im.width)
        save(im, name, big)
        pic = f'<a class="g-link" href="assets/images/{name}-{big}.webp" data-lightbox>{pic}</a>'
    return pic


def main():
    slots = {k: v for k, v in json.loads((SRC / 'slots.json').read_text(encoding='utf-8')).items() if not k.startswith('_')}
    page = INDEX.read_text(encoding='utf-8')
    OUT.mkdir(parents=True, exist_ok=True)
    done = []
    for name, cfg in slots.items():
        src = find_source(name)
        if not src:
            continue
        im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
        block = re.compile(r'(<!-- FOTO:%s -->)(.*?)(\s*<!-- /FOTO:%s -->)' % (re.escape(name), re.escape(name)), re.S)
        m = block.search(page)
        if not m:
            print(f'aviso: {name} não tem marcador no index.html', file=sys.stderr)
            continue
        indent = re.search(r'\n([ \t]*)<!-- FOTO:', page[:m.end(1)]).group(1)
        page = page[:m.start(2)] + '\n' + indent + picture(name, cfg, im) + page[m.end(2):]
        # Quadro opcional da galeria: aparece quando recebe foto.
        page = re.sub(r'(<figure [^>]*?) data-optional hidden(>\s*<!-- FOTO:%s -->)' % re.escape(name), r'\1\2', page)
        done.append(name)
    INDEX.write_text(page, encoding='utf-8')
    print(f'{len(done)} foto(s) encaixada(s): {", ".join(done) or "nenhuma"}'
          f'{"" if AVIF else " (sem AVIF: atualize o Pillow)"}')


if __name__ == '__main__':
    main()
