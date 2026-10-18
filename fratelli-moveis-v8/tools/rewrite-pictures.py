#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Reescreve os <picture> do index.html a partir de tools/imagens-v6.json.

O enquadramento e o `sizes` de cada foto ja foram decididos e aprovados;
o que muda aqui e so a escada de arquivos: AVIF na frente, WebP atras,
JPEG como ultimo recurso, e as larguras que o original realmente tem.

    python3 tools/rewrite-pictures.py
"""

import json
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFESTO = os.path.join(RAIZ, 'tools', 'imagens-v6.json')
PAGINA = os.path.join(RAIZ, 'index.html')

with open(MANIFESTO) as f:
    FOTOS = {r['raiz']: r for r in json.load(f)}


def escada(raiz, ext):
    """`srcset` de uma foto num formato, da menor largura para a maior."""
    r = FOTOS[raiz]
    itens = []
    for larg in sorted(r['larguras']):
        nome = '%s-%d.%s' % (raiz, larg, ext)
        if any(a['nome'] == nome for a in r['arquivos']):
            itens.append('assets/images/%s %dw' % (nome, larg))
    return ', '.join(itens)


def maior(raiz, ext):
    r = FOTOS[raiz]
    cands = [a for a in r['arquivos'] if a['nome'].endswith('.' + ext)]
    if not cands:
        return None
    return max(cands, key=lambda a: a['w'])


def raiz_de(url):
    """De `assets/images/projeto-sala-1200.webp` para `projeto-sala`."""
    nome = url.rsplit('/', 1)[-1]
    m = re.match(r'(.+)-\d+\.(?:avif|webp|jpg|jpeg)$', nome)
    return m.group(1) if m else None


def reescreve(bloco):
    """Troca as <source> e acerta o <img> de um <picture>."""
    img = re.search(r'<img\b[^>]*>', bloco, re.S)
    if not img:
        return bloco
    img = img.group(0)

    src = re.search(r'src="([^"]+)"', img)
    if not src:
        return bloco
    raiz = raiz_de(src.group(1))
    if raiz not in FOTOS:
        return bloco

    recuo = re.match(r'\s*', bloco).group(0)
    dentro = recuo + '  '

    # As <source> com `media` sao direcao de arte (um recorte por
    # formato de tela) e precisam ser preservadas como regra, nao como
    # lista de arquivos. Reconstroi cada grupo de media separadamente.
    fontes = re.findall(r'<source\b[^>]*>', bloco, re.S)
    grupos = []           # [(media ou None, sizes, raiz)]
    for f in fontes:
        m = re.search(r'media="([^"]+)"', f)
        s = re.search(r'sizes="([^"]+)"', f)
        ss = re.search(r'srcset="([^"]+)"', f)
        if not ss:
            continue
        r = raiz_de(ss.group(1).split()[0])
        chave = (m.group(1) if m else None, s.group(1) if s else None, r)
        if chave not in grupos and r in FOTOS:
            grupos.append(chave)
    if not grupos:
        grupos = [(None, None, raiz)]

    linhas = []
    for media, sizes, r in grupos:
        for ext, tipo in (('avif', 'image/avif'), ('webp', 'image/webp')):
            sset = escada(r, ext)
            if not sset:
                continue
            attrs = ['type="%s"' % tipo]
            if media:
                attrs.insert(0, 'media="%s"' % media)
            linhas.append('%s<source %s\n%s        srcset="%s"%s>'
                          % (dentro, ' '.join(attrs), dentro, sset,
                             '\n%s        sizes="%s"' % (dentro, sizes) if sizes else ''))
        # fallback JPEG do recorte alternativo: o <img> so cobre o padrao
        if media:
            jp = maior(r, 'jpg')
            if jp:
                attrs = ['media="%s"' % media, 'type="image/jpeg"']
                linhas.append('%s<source %s\n%s        srcset="assets/images/%s %dw"%s>'
                              % (dentro, ' '.join(attrs), dentro, jp['nome'], jp['w'],
                                 '\n%s        sizes="%s"' % (dentro, sizes) if sizes else ''))

    jp = maior(raiz, 'jpg')
    novo_img = img
    if jp:
        novo_img = re.sub(r'src="[^"]+"', 'src="assets/images/%s"' % jp['nome'], novo_img)
        novo_img = re.sub(r'width="\d+"', 'width="%d"' % jp['w'], novo_img)
        novo_img = re.sub(r'height="\d+"', 'height="%d"' % jp['h'], novo_img)

    return ('%s<picture>\n%s\n%s%s\n%s</picture>'
            % (recuo, '\n'.join(linhas), dentro, novo_img.strip(), recuo))


def main():
    html = open(PAGINA, encoding='utf-8').read()
    antes = html.count('<picture>')
    html = re.sub(r'[ \t]*<picture>.*?</picture>', lambda m: reescreve(m.group(0)),
                  html, flags=re.S)

    # O preload do hero acompanha a nova escada. AVIF primeiro: se o
    # navegador nao entender, ele ignora o preload e busca o WebP na
    # hora de pintar — nao fica sem imagem.
    r = FOTOS['hero-sala']
    maior_avif = maior('hero-sala', 'avif')
    html = re.sub(
        r'<link rel="preload" as="image"[^>]*>',
        '<link rel="preload" as="image" type="image/avif"\n'
        '      href="assets/images/%s"\n'
        '      imagesrcset="%s"\n'
        '      imagesizes="100vw" media="(min-width: 741px)" fetchpriority="high">'
        % (maior_avif['nome'], escada('hero-sala', 'avif')),
        html)

    with open(PAGINA, 'w', encoding='utf-8') as f:
        f.write(html)

    depois = html.count('<source')
    print('%d <picture> reescritos, %d <source> no total' % (antes, depois))
    sobrou = sorted(set(re.findall(r'assets/images/([\w.-]+)', html)))
    faltando = [n for n in sobrou
                if not os.path.exists(os.path.join(RAIZ, 'assets', 'images', n))]
    print('arquivos referenciados que NAO existem:', faltando or 'nenhum')
    if faltando:
        sys.exit(1)


if __name__ == '__main__':
    main()
