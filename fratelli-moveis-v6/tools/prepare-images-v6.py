#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fratelli Moveis V6 — refaz todas as fotografias a partir dos originais.

O que muda em relacao a V3:

  1. AVIF entra na frente do WebP. Mesma imagem, arquivo menor.
  2. As escadas de largura ficam mais densas onde a foto aparece grande
     (o lightbox abre em tela cheia; um cartao de 352 px nao e o unico
     uso daquela imagem).
  3. Cada imagem e medida contra o seu ORIGINAL. Onde o original ja e o
     teto, o script diz isso em vez de ampliar e fingir detalhe.

Os recortes sao os mesmos da V3, de proposito: a direcao de arte ja foi
aprovada e esta tarefa e de qualidade de arquivo, nao de enquadramento.

    python3 tools/prepare-images-v6.py
"""

import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTE = os.path.join(RAIZ, 'tools', 'source')
SAIDA = os.path.join(RAIZ, 'assets', 'images')

# (origem, recorte, nome, larguras desejadas, forca do acabamento, uso)
#
# As larguras sao DESEJADAS: o script corta a lista no tamanho nativo do
# recorte. Nunca amplia — ampliar nao devolve detalhe, so devolve pixel.
TRABALHOS = [
    ('closet.jpg',      (60, 38, 1600, 904),  'projeto-closet',
     [1540, 1200, 900, 600, 400], 0.55, 'abertura em 100vw + portfolio em 92vw'),
    ('dormitorio.jpg',  (27, 0, 1061, 1293),  'projeto-dormitorio',
     [1034, 820, 620, 480, 360], 1.00, 'portfolio 40vw + lightbox'),
    ('banheiro.jpg',    (288, 0, 1600, 875),  'projeto-banheiro',
     [1312, 1040, 820, 640, 440], 0.65, 'portfolio 52vw + lightbox'),

    # Entregues com pedido de nao alterar a qualidade: so recorte.
    ('home-office.jpg', (0, 0, 1308, 872),    'projeto-home-office',
     [1308, 1040, 820, 640, 440], 0.0, 'portfolio 56vw + lightbox'),
    ('sala.jpg',        (23, 0, 1577, 874),   'projeto-sala',
     [1554, 1200, 900, 600, 400], 0.0, 'portfolio 52vw + lightbox'),
    ('painel-tv.jpg',   (0, 60, 1080, 1410),  'projeto-painel-tv',
     [1080, 860, 640, 480, 360], 0.0, 'portfolio 40vw + lightbox'),

    # Faixa de ambientes: cartao de 352 px na tela, mas o lightbox abre
    # a MESMA imagem em tela cheia. Por isso a escada sobe ate o nativo.
    ('amb-dormitorio.jpg',  (22, 0, 1058, 1295), 'ambiente-dormitorio',
     [1036, 820, 620, 480, 360], 0.0, 'cartao 22rem + lightbox'),
    ('amb-closet.jpg',      (620, 0, 1359, 924), 'ambiente-closet',
     [739, 600, 480, 360], 0.0, 'cartao 22rem + lightbox'),
    ('amb-home-office.jpg', (600, 0, 1302, 878), 'ambiente-home-office',
     [702, 580, 460, 360], 0.0, 'cartao 22rem + lightbox'),
    # Cozinha executada. O ORIGINAL tem 368x420. Nao ha o que ampliar.
    ('amb-cozinha.jpg',     (0, 0, 336, 420),    'ambiente-cozinha',
     [336, 252], 0.0, 'cartao 22rem — abaixo do necessario, ver IMAGENS-V6.md'),

    ('showroom.jpg',    (125, 0, 1128, 1254), 'sobre-showroom',
     [1003, 800, 620, 480], 0.0, 'sobre 28vw + lightbox'),
    # Imagens de referencia, nao documentacao de obra. Ver PENDENCIAS.md.
    ('ref-sala.jpg',    (360, 0, 1179, 1024), 'ambiente-sala',
     [819, 660, 520, 400], 0.0, 'cartao 22rem + lightbox'),
    ('ref-gourmet.jpg', (380, 0, 1199, 1024), 'ambiente-gourmet',
     [819, 660, 520, 400], 0.0, 'cartao 22rem + lightbox'),
]

# O hero e a mesma fotografia da sala, em dois enquadramentos.
HERO = [
    ('ref-sala.jpg', (0, 0, 1536, 1024), 'hero-sala',
     [1536, 1280, 1024, 768, 560], 0.0, 'hero 100vw, paisagem'),
    ('ref-sala.jpg', (560, 0, 1400, 1024), 'hero-sala-retrato',
     [780, 620, 500, 390], 0.0, 'hero 100vw, retrato'),
]


def acabamento(img, k=1.0):
    """Limpa o bloco do JPEG, devolve definicao e assenta o tom.

    Identico ao da V3. `k` e a forca, de 0 a 1; 0 nao toca em nada.
    Moderado de proposito: HDR, supernitidez e halo estragam fotografia
    de arquitetura mais rapido do que salvam.
    """
    limpo = cv2.bilateralFilter(img, 7, 26, 26)
    lab = cv2.cvtColor(limpo, cv2.COLOR_BGR2LAB)
    L, a, b = cv2.split(lab)
    a = cv2.medianBlur(a, 5)
    b = cv2.medianBlur(b, 5)
    borrado = cv2.GaussianBlur(L, (0, 0), 1.3)
    L = cv2.addWeighted(L, 1 + 0.40 * k, borrado, -0.40 * k, 0)
    L = cv2.createCLAHE(clipLimit=1.0 + 0.4 * k, tileGridSize=(8, 8)).apply(L)
    out = cv2.cvtColor(cv2.merge([L, a, b]), cv2.COLOR_LAB2BGR).astype(np.float32)
    x = np.arange(256, dtype=np.float32) / 255.0
    lut = (np.clip(x - 0.05 * k * np.sin(2 * np.pi * x), 0, 1) * 255).astype(np.uint8)
    out = cv2.LUT(np.clip(out, 0, 255).astype(np.uint8), lut).astype(np.float32)
    out[:, :, 0] *= 0.992   # azul
    out[:, :, 2] *= 1.008   # vermelho
    return np.clip(out, 0, 255).astype(np.uint8)


FORMATOS = (
    ('avif', dict(quality=58, speed=4)),
    ('webp', dict(quality=84, method=6)),
    ('jpg',  dict(quality=84, optimize=True, progressive=True)),
)


def gerar(trabalhos, relatorio):
    for nome, caixa, raiz, larguras, k, uso in trabalhos:
        caminho = os.path.join(FONTE, nome)
        if not os.path.exists(caminho):
            sys.exit('original nao encontrado: %s' % caminho)

        bruto = cv2.imread(caminho)
        orig_w, orig_h = bruto.shape[1], bruto.shape[0]
        x0, y0, x1, y1 = caixa
        img = bruto[y0:y1, x0:x1]
        if k > 0:
            img = acabamento(img, k)

        pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        nativo = pil.width
        # nunca amplia: o que nao esta no original nao existe
        usadas = [w for w in larguras if w <= nativo]
        if not usadas:
            usadas = [nativo]

        arquivos = []
        for w in usadas:
            red = pil if w == nativo else pil.resize(
                (w, round(pil.height * w / nativo)), Image.LANCZOS)
            for ext, params in FORMATOS:
                # JPEG so no maior: e fallback, nao escada
                if ext == 'jpg' and w != max(usadas):
                    continue
                f = os.path.join(SAIDA, '%s-%d.%s' % (raiz, w, ext))
                red.save(f, **params)
                arquivos.append((os.path.basename(f), red.size, os.path.getsize(f)))

        relatorio.append({
            'raiz': raiz,
            'origem': nome,
            'original': [orig_w, orig_h],
            'recorte': [x1 - x0, y1 - y0],
            'nativo': [pil.width, pil.height],
            'larguras': usadas,
            'descartadas': [w for w in larguras if w > nativo],
            'forca': k,
            'uso': uso,
            'arquivos': [{'nome': f, 'w': s[0], 'h': s[1], 'bytes': n}
                         for f, s, n in arquivos],
        })


def main():
    os.makedirs(SAIDA, exist_ok=True)
    relatorio = []
    gerar(TRABALHOS, relatorio)
    gerar(HERO, relatorio)

    with open(os.path.join(RAIZ, 'tools', 'imagens-v6.json'), 'w') as f:
        json.dump(relatorio, f, indent=1)

    total = 0
    for r in relatorio:
        peso = sum(a['bytes'] for a in r['arquivos'])
        total += peso
        alerta = '  <- TETO DO ORIGINAL' if r['descartadas'] else ''
        print('%-24s nativo %4dx%-4d  %d larguras  %6.1f KB%s'
              % (r['raiz'], r['nativo'][0], r['nativo'][1],
                 len(r['larguras']), peso / 1024, alerta))
    print('\ntotal das fotografias: %.1f MB' % (total / 1e6))


if __name__ == '__main__':
    main()
