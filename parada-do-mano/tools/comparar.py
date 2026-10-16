#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parada do Mano — capturas lado a lado de duas versões, a partir de tools/medir.mjs.

    node tools/medir.mjs http://127.0.0.1:8131/ v3 medidas/
    node tools/medir.mjs http://127.0.0.1:8130/ v4 medidas/
    python3 tools/comparar.py medidas/ v3 v4 comparacao/

Gera comparacao/{largura}-{n}-{seção}.jpg (antes | depois) para cada seção e
comparacao/{largura}-9-pagina-inteira.jpg com a altura da página e a linha onde
começa o cardápio em cada versão.
"""
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTE = os.path.join(RAIZ, 'tools', 'fonts-ttf')
SECOES = ['0-primeira-tela', '2-sobre', '3-cardapio', '4-buffet', '5-churrasco', '6-feijoada', '7-galeria', '8-contato']
TELAS = {1440: '1440x900', 768: '768x1024', 390: '390x844', 320: '320x568'}
FUNDO, TEXTO, LARANJA = (23, 17, 13), (255, 243, 226), (255, 130, 28)


def fonte(tam):
    for nome in ('barlow-condensed-600.ttf', 'barlow-600.ttf'):
        p = os.path.join(FONTE, nome)
        if os.path.exists(p):
            return ImageFont.truetype(p, tam)
    return ImageFont.load_default()


def lado_a_lado(a, b, rot_a, rot_b, sub_a='', sub_b='', linhas=None, max_alt=None):
    if max_alt:
        esc = min(1.0, max_alt / max(a.height, b.height))
        if esc < 1:
            a = a.resize((round(a.width * esc), round(a.height * esc)), Image.LANCZOS)
            b = b.resize((round(b.width * esc), round(b.height * esc)), Image.LANCZOS)
            linhas = [None if l is None else round(l * esc) for l in (linhas or [None, None])]
    topo, gap = 64, 24
    w = a.width + b.width + gap * 3
    h = topo + max(a.height, b.height) + gap
    tela = Image.new('RGB', (w, h), FUNDO)
    d = ImageDraw.Draw(tela)
    f, fs = fonte(28), fonte(18)
    for x, img, rot, sub, k in ((gap, a, rot_a, sub_a, 0), (gap * 2 + a.width, b, rot_b, sub_b, 1)):
        tela.paste(img, (x, topo))
        d.text((x, 14), rot, font=f, fill=LARANJA if k else TEXTO)
        if sub:
            d.text((x + d.textlength(rot, font=f) + 14, 22), sub, font=fs, fill=TEXTO)
        if linhas and linhas[k] is not None:
            y = topo + linhas[k]
            d.line([(x - 8, y), (x + img.width + 8, y)], fill=LARANJA, width=3)
            d.text((x + 6, y + 4), 'cardápio', font=fs, fill=LARANJA)
    return tela


def main():
    pasta, va, vb, saida = sys.argv[1:5]
    os.makedirs(saida, exist_ok=True)
    med = {v: json.load(open(os.path.join(pasta, '%s-medidas.json' % v), encoding='utf-8')) for v in (va, vb)}
    feitas = 0
    for largura, tela in TELAS.items():
        for sec in SECOES:
            nome = '%s-' + '%d-%s.png' % (largura, sec)
            pa, pb = (os.path.join(pasta, nome % v) for v in (va, vb))
            if not (os.path.exists(pa) and os.path.exists(pb)):
                continue
            img = lado_a_lado(Image.open(pa).convert('RGB'), Image.open(pb).convert('RGB'), va.upper(), vb.upper(), max_alt=2400)
            img.save(os.path.join(saida, '%d-%s.jpg' % (largura, sec)), quality=84, optimize=True)
            feitas += 1
        pa, pb = (os.path.join(pasta, '%s-%d-9-pagina.png' % (v, largura)) for v in (va, vb))
        if os.path.exists(pa) and os.path.exists(pb):
            m = [med[v]['medidas'][tela] for v in (va, vb)]
            subs = ['%d px · cardápio a %d px' % (x['altura'], x['tops']['cardapio']) for x in m]
            img = lado_a_lado(Image.open(pa).convert('RGB'), Image.open(pb).convert('RGB'), va.upper(), vb.upper(),
                              subs[0], subs[1], [x['tops']['cardapio'] for x in m], max_alt=3600)
            img.save(os.path.join(saida, '%d-9-pagina-inteira.jpg' % largura), quality=80, optimize=True)
            feitas += 1
    print('%d comparações em %s' % (feitas, saida))


if __name__ == '__main__':
    main()
