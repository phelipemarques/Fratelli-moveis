#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prepara as imagens da secao ARCHITECTURAL REVEAL.

Duas imagens, e as duas foram dimensionadas por MEDICAO, nao por gosto.

1. A MADEIRA (tools/ref/26.jpg)

   Fotografia real de uma folha de nogueira, enviada pelo cliente como
   referencia de material. Medindo a nitidez em faixas de 100 px (desvio
   do laplaciano vertical), ela cai de 13,6 em x=700 para 3,0 a partir de
   x=1400: a foto tem profundidade de campo curta e so a faixa esquerda
   esta em foco.

   Entao o recorte vai ate x=1560 e nao ate a borda. O painel nasce com
   840 px de largura, o que sustenta ~420 px de tela em densidade 2x.
   E por isso que a cena 01 abre num quadro ESTREITO: nao e estilo, e o
   que a fotografia aguenta sem ficar mole.

   ATENCAO: imagem de procedencia nao confirmada. Ver PENDENCIAS.md.

2. O CLOSET (tools/source/closet.jpg)

   O original tem 1600x943 -- so 4% maior que o que a V9 ja entregava.
   NAO EXISTE arquivo de maior resolucao neste projeto, e nao ha nenhum
   super-resolutor no ambiente (sem torch, sem dnn_superres). Portanto
   nao ha restauracao a fazer: ampliar seria inventar detalhe.

   O que da para fazer e aproveitar os 60 px que a V9 descartava no
   recorte e entregar 1570 de largura. Com o quadro limitado a 820 px de
   tela, isso da 1,91x de densidade -- praticamente 2x.

Requer: opencv-python-headless, numpy, pillow.
Uso: python3 tools/prepare-reimaginada.py
"""
import os
import cv2
import numpy as np
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'assets', 'images')


def acabamento(bgr, forca):
    """Limpa ruido de compressao e devolve microcontraste. Nao inventa
    detalhe: e um filtro de acabamento, e com forca 0 nao faz nada."""
    if forca <= 0:
        return bgr
    limpo = cv2.bilateralFilter(bgr, 5, 28, 9)
    borrado = cv2.GaussianBlur(limpo, (0, 0), 1.1)
    nitido = cv2.addWeighted(limpo, 1 + 0.55 * forca, borrado, -0.55 * forca, 0)
    return np.clip(nitido, 0, 255).astype(np.uint8)


def gravar(img_rgb, nome, larguras, qualidade=84):
    base = Image.fromarray(img_rgb)
    for w in larguras:
        h = round(base.height * w / base.width)
        r = base.resize((w, h), Image.LANCZOS)
        alvo = os.path.join(SAIDA, '%s-%d' % (nome, w))
        r.save(alvo + '.jpg', quality=qualidade, optimize=True, progressive=True)
        r.save(alvo + '.webp', quality=qualidade, method=6)
        try:
            r.save(alvo + '.avif', quality=qualidade - 8)
        except Exception:
            pass
        print('   %-34s %dx%d' % (os.path.basename(alvo), w, h))


def main():
    print('MADEIRA — nogueira, recorte dentro da zona em foco')
    src = cv2.imread(os.path.join(RAIZ, 'tools', 'ref', '26.jpg'))
    corte = src[870:1995, 700:1560]          # 860 x 1125
    corte = acabamento(corte, 0.35)
    gravar(cv2.cvtColor(corte, cv2.COLOR_BGR2RGB), 'material-nogueira',
           [840, 560, 420, 300], 86)

    print('CLOSET — reenquadrado a partir do original de 1600x943')
    src = cv2.imread(os.path.join(RAIZ, 'tools', 'source', 'closet.jpg'))
    # 16:9 aproveitando toda a largura util do original
    corte = src[26:909, 20:1590]             # 1570 x 883
    corte = acabamento(corte, 0.55)
    gravar(cv2.cvtColor(corte, cv2.COLOR_BGR2RGB), 'reveal-closet',
           [1570, 1200, 900, 600, 400], 84)


if __name__ == '__main__':
    main()
