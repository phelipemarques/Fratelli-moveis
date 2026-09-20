#!/usr/bin/env python3
"""
Prepara as imagens de projeto a partir dos arquivos enviados pelo cliente.

Entrada:  tools/source/{dormitorio,closet,banheiro}.jpg
Saida:    assets/img/projeto-*-{largura}.{webp,jpg}

As imagens sao renderizacoes 3D dos projetos, nao fotografias de ambientes
executados. O tratamento aqui e de acabamento, nao de invencao: limpa artefato
de compressao, devolve definicao e acerta o tom. Nenhum detalhe e criado, e
nada e ampliado alem do tamanho original.

Nao mexe nas imagens da abertura: essas sao geradas por prepare-images.py.

Requer: opencv-python-headless, numpy, pillow.
Uso: python3 tools/prepare-project-images.py
"""
import os
import sys

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools", "source")
OUT = os.path.join(ROOT, "assets", "images")

# (arquivo, recorte (x0,y0,x1,y1), nome de saida, larguras, forca)
#
# Forca 0 significa so recortar e redimensionar, sem acabamento nenhum. E o caso
# das imagens em que o cliente pediu para nao mexer na qualidade.
# Os recortes tiram as bordas pretas do arquivo e ajustam para a proporcao que
# o quadro usa na pagina, sem esticar a imagem.
#
# A forca e por imagem de proposito. O closet e um render difuso, visto atraves
# do vidro das portas: a mesma dose que assenta bem no dormitorio endurece o
# tecido e satura a madeira. Quem ja nasceu macio continua macio.
JOBS = [
    ("closet.jpg",     (60, 38, 1600, 904),  "projeto-closet",     [1540, 1200, 800], 0.55),  # 16:9
    ("dormitorio.jpg", (27, 0, 1061, 1293),  "projeto-dormitorio", [1034, 700, 480], 1.00),   # 4:5
    ("banheiro.jpg",   (288, 0, 1600, 875),  "projeto-banheiro",   [1312, 900, 640], 0.65),   # 3:2

    # Entregues depois, com pedido de nao alterar a qualidade: so recorte.
    ("home-office.jpg", (0, 0, 1308, 872),    "projeto-home-office", [1308, 900, 640], 0.0),   # 3:2
    ("sala.jpg",        (23, 0, 1577, 874),   "projeto-sala",        [1554, 1200, 800], 0.0),  # 16:9
    ("painel-tv.jpg",   (0, 60, 1080, 1410),  "projeto-painel-tv",   [1080, 700, 480], 0.0),   # 4:5

    # Cartoes da faixa de ambientes: todos em 4:5, no maximo 352 px na tela.
    ("amb-dormitorio.jpg",  (22, 0, 1058, 1295), "ambiente-dormitorio",  [1036, 704, 480], 0.0),
    ("amb-closet.jpg",      (620, 0, 1359, 924), "ambiente-closet",      [739, 480], 0.0),
    ("amb-home-office.jpg", (600, 0, 1302, 878), "ambiente-home-office", [702, 480], 0.0),
    # Fotografia de cozinha executada. Chegou com 368x420: e o tamanho que ha,
    # e nao ha o que ampliar. Serve para um cartao pequeno, nada maior.
    ("amb-cozinha.jpg",     (0, 0, 336, 420),    "ambiente-cozinha",     [336], 0.0),

    # Showroom da Fratelli: fotografia, com a placa da empresa na parede.
    ("showroom.jpg",    (125, 0, 1128, 1254), "sobre-showroom",      [1003, 748, 500], 0.0),
    # Imagens de referencia, nao documentacao de obra. Ver PENDENCIAS.md.
    ("ref-sala.jpg",    (360, 0, 1179, 1024), "ambiente-sala",       [819, 704, 480], 0.0),
    ("ref-gourmet.jpg", (380, 0, 1199, 1024), "ambiente-gourmet",    [819, 704, 480], 0.0),
]


def restore(img, k=1.0):
    """Acabamento: limpa o bloco do JPEG, devolve definicao e assenta o tom.

    `k` e a forca do tratamento, de 0 a 1.
    """
    # 1. Artefato de compressao. O bilateral suaviza o bloco sem comer a aresta.
    clean = cv2.bilateralFilter(img, 7, 26, 26)

    # 2. O ruido de cor incomoda mais que o de luz; trata separado, em LAB.
    lab = cv2.cvtColor(clean, cv2.COLOR_BGR2LAB)
    L, a, b = cv2.split(lab)
    a = cv2.medianBlur(a, 5)
    b = cv2.medianBlur(b, 5)

    # 3. Definicao, so no canal de luz, para nao puxar franja colorida.
    blur = cv2.GaussianBlur(L, (0, 0), 1.3)
    L = cv2.addWeighted(L, 1 + 0.40 * k, blur, -0.40 * k, 0)

    # 4. Contraste local suave, com limite baixo para nao endurecer a cena.
    L = cv2.createCLAHE(clipLimit=1.0 + 0.4 * k, tileGridSize=(8, 8)).apply(L)

    out = cv2.cvtColor(cv2.merge([L, a, b]), cv2.COLOR_LAB2BGR).astype(np.float32)

    # 5. Curva em S discreta: assenta a sombra e abre a alta luz. O sinal
    #    importa — somar o seno achataria o contraste em vez de firmar.
    x = np.arange(256, dtype=np.float32) / 255.0
    curve = np.clip(x - 0.05 * k * np.sin(2 * np.pi * x), 0, 1)
    lut = (curve * 255).astype(np.uint8)
    out = cv2.LUT(np.clip(out, 0, 255).astype(np.uint8), lut).astype(np.float32)

    # 6. Equilibrio quente muito leve, para conversar com o off-white do site.
    out[:, :, 0] *= 0.992   # azul
    out[:, :, 2] *= 1.008   # vermelho

    return np.clip(out, 0, 255).astype(np.uint8)


def main():
    os.makedirs(OUT, exist_ok=True)
    made = []
    for name, box, stem, widths, k in JOBS:
        path = os.path.join(SRC, name)
        if not os.path.exists(path):
            sys.exit("imagem de origem nao encontrada: %s" % path)

        img = cv2.imread(path)
        x0, y0, x1, y1 = box
        img = img[y0:y1, x0:x1]
        if k > 0:
            img = restore(img, k)

        pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
        native = pil.width
        for w in widths:
            if w > native:      # nunca amplia: nao ha detalhe para recuperar
                continue
            resized = pil if w == native else pil.resize(
                (w, round(pil.height * w / native)), Image.LANCZOS)
            for ext, params in (("jpg", dict(quality=84, optimize=True, progressive=True)),
                                ("webp", dict(quality=84, method=6))):
                f = os.path.join(OUT, "%s-%d.%s" % (stem, w, ext))
                resized.save(f, **params)
                made.append((os.path.basename(f), resized.size, os.path.getsize(f)))

    for f, size, n in made:
        print("  %-30s %4dx%-4d %7.1f KB" % (f, size[0], size[1], n / 1024))


if __name__ == "__main__":
    main()
