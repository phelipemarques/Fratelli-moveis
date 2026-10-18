#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fratelli Moveis — fotografia do hero.

Gera as versoes responsivas da sala com painel de TV a partir de
tools/source/ref-sala.jpg, que e a maior versao dessa cena que existe no
projeto (1536x1024).

Duas familias:

  hero-sala-*           enquadramento cheio, para telas largas. O painel e
                        o ripado ficam a direita e a esquerda sobra para o
                        texto, como na referencia.
  hero-sala-retrato-*   recorte vertical sobre o painel e o ripado, para
                        celular. Sem ele, o corte de object-fit numa tela
                        estreita deixaria so a cortina.

Nada e ampliado alem do tamanho nativo.

    python3 tools/prepare-hero.py
"""

import os

import cv2

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTE = os.path.join(RAIZ, 'tools', 'source', 'ref-sala.jpg')
DESTINO = os.path.join(RAIZ, 'assets', 'images')

Q_WEBP = 86
Q_JPEG = 86

LARGURAS = [1536, 1200, 960, 640]
LARGURAS_RETRATO = [780, 600, 480]

# Recorte do retrato: comeca depois da cortina e vai ate o fim do ripado.
# Mantem os nichos iluminados, a TV, o aparador suspenso e a faixa de luz.
RECORTE_RETRATO = (560, 0, 1400, 1024)     # esquerda, topo, direita, base


def escreve(img, base, larguras, jpeg_em):
    h0, w0 = img.shape[:2]
    saidas = []
    for larg in larguras:
        if larg > w0:
            continue
        alt = int(round(h0 * larg / float(w0)))
        red = cv2.resize(img, (larg, alt), interpolation=cv2.INTER_AREA) if larg != w0 else img
        cv2.imwrite(os.path.join(DESTINO, '%s-%d.webp' % (base, larg)), red,
                    [cv2.IMWRITE_WEBP_QUALITY, Q_WEBP])
        if larg == jpeg_em:
            cv2.imwrite(os.path.join(DESTINO, '%s-%d.jpg' % (base, larg)), red,
                        [cv2.IMWRITE_JPEG_QUALITY, Q_JPEG, cv2.IMWRITE_JPEG_PROGRESSIVE, 1])
        saidas.append((larg, alt))
    return saidas


def main():
    img = cv2.imread(FONTE, cv2.IMREAD_COLOR)
    if img is None:
        raise SystemExit('nao achei ' + FONTE)
    h0, w0 = img.shape[:2]
    print('fonte %dx%d' % (w0, h0))

    largas = escreve(img, 'hero-sala', LARGURAS, LARGURAS[0])
    print('  hero-sala          ' + ', '.join('%dx%d' % s for s in largas))

    e, t, d, b = RECORTE_RETRATO
    retrato = img[t:b, e:d]
    verticais = escreve(retrato, 'hero-sala-retrato', LARGURAS_RETRATO, LARGURAS_RETRATO[0])
    print('  hero-sala-retrato  ' + ', '.join('%dx%d' % s for s in verticais))

    total = sum(os.path.getsize(os.path.join(DESTINO, f))
                for f in os.listdir(DESTINO) if f.startswith('hero-sala'))
    print('  total %.0f KB' % (total / 1024))


if __name__ == '__main__':
    main()
