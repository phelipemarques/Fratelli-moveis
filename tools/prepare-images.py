#!/usr/bin/env python3
"""
Prepara as imagens do hero a partir do material recebido.

Entrada:  tools/source/1.jpg  (captura 1280x960 enviada pelo cliente, com a
          interface do mockup gravada sobre a fotografia)
Saida:    assets/img/hero-*.jpg|webp  +  assets/img/og-cover.jpg

O script remove os textos de interface gravados na captura por inpainting
multiescala, reconstroi o grao da imagem e gera os recortes de desktop e de
celular. Requer: opencv-python-headless, numpy, pillow.

Uso: python3 tools/prepare-images.py
"""
import os
import sys

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools", "source", "1.jpg")
OUT = os.path.join(ROOT, "assets", "images")

# Caixas que contem texto de interface gravado na captura (x0, y0, x1, y1).
UI_BOXES = [
    (64, 34, 202, 84),       # marca FRATELLI / MOVEIS
    (736, 36, 1208, 64),     # itens de navegacao
    (726, 60, 828, 76),      # tracinho do item ativo
    (84, 498, 236, 526),     # sobretitulo
    (86, 524, 348, 688),     # titulo em tres linhas
    (82, 686, 258, 744),     # paragrafo de apoio
    (80, 766, 350, 804),     # linha de acoes
    (76, 868, 190, 900),     # marcador de localizacao
    (1082, 874, 1220, 900),  # aviso de rolagem
    (1216, 854, 1236, 926),  # fio vertical
]

# Regiao fora de foco onde o reparo e mais extenso; recebe acabamento extra.
REPAIR_ZONE = (40, 360, 400, 860)


def build_mask(src):
    gray = cv2.cvtColor(src, cv2.COLOR_BGR2GRAY)
    mask = np.zeros(gray.shape, np.uint8)
    for x0, y0, x1, y1 in UI_BOXES:
        patch = gray[y0:y1, x0:x1]
        background = cv2.medianBlur(patch, 31).astype(np.int16)
        strokes = ((patch.astype(np.int16) - background) > 7).astype(np.uint8) * 255
        strokes = cv2.morphologyEx(
            strokes, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        )
        strokes = cv2.dilate(
            strokes, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
        )
        mask[y0:y1, x0:x1] = np.maximum(mask[y0:y1, x0:x1], strokes)
    return mask


def multiscale_fill(img, mask, levels):
    """Inpainting em escala reduzida: tracos largos viram tracos finos.

    A imagem ja chega com um preenchimento bruto aplicado. Sem isso, reduzir a
    escala espalharia o branco do texto pelos pixels vizinhos e a area reparada
    sairia mais clara que o entorno.
    """
    small_img, small_mask = img, mask
    for _ in range(levels):
        small_img = cv2.pyrDown(small_img)
        small_mask = cv2.dilate(cv2.pyrDown(small_mask), np.ones((3, 3), np.uint8))
        small_mask = (small_mask > 8).astype(np.uint8) * 255
    filled = cv2.inpaint(small_img, small_mask, 6, cv2.INPAINT_TELEA)
    for _ in range(levels):
        filled = cv2.pyrUp(filled)
    return cv2.resize(filled, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_CUBIC)


def restore(src):
    rng = np.random.default_rng(11)
    h, w = src.shape[:2]
    mask = build_mask(src)

    # Passo 1: preenchimento bruto, so para tirar o branco do texto de cena.
    base = cv2.inpaint(src, cv2.dilate(mask, np.ones((3, 3), np.uint8)), 7, cv2.INPAINT_TELEA)

    # Passo 2: refino multiescala sobre a imagem ja limpa do branco.
    fill = (
        0.40 * multiscale_fill(base, mask, 4)
        + 0.35 * multiscale_fill(base, mask, 3)
        + 0.25 * base.astype(np.float32)
    )

    # Passo 3: acerto de tom de baixa frequencia. O reparo tende a clarear; esta
    # correcao devolve a media local que o entorno indica.
    low_src = cv2.GaussianBlur(src.astype(np.float32), (0, 0), 24)
    low_fill = cv2.GaussianBlur(fill, (0, 0), 24)
    keep = (mask == 0).astype(np.float32)
    keep_low = cv2.GaussianBlur(keep, (0, 0), 24)[..., None]
    correction = (low_src - low_fill) * np.clip(keep_low, 0, 1)
    fill = fill + cv2.GaussianBlur(correction, (0, 0), 18)

    flat = src[820:900, 420:820].astype(np.float32)
    sigma = float((flat - cv2.GaussianBlur(flat, (0, 0), 1.5)).std())
    fill = np.clip(fill + rng.normal(0, sigma * 0.8, (h, w, 1)), 0, 255)

    feather = cv2.GaussianBlur(
        cv2.dilate(mask, np.ones((5, 5), np.uint8)), (0, 0), 3.5
    ).astype(np.float32) / 255.0
    out = fill * feather[..., None] + src.astype(np.float32) * (1 - feather[..., None])

    # A area reparada fica no fundo desfocado da cena: um leve desfoque local
    # funde o reparo com o entorno em vez de deixar uma mancha de borda dura.
    x0, y0, x1, y1 = REPAIR_ZONE
    zone = np.zeros((h, w), np.float32)
    zone[y0:y1, x0:x1] = 1.0
    zone = cv2.GaussianBlur(zone, (0, 0), 55)
    zone *= 0.72
    out = out * (1 - zone[..., None]) + cv2.GaussianBlur(out, (0, 0), 3.2) * zone[..., None]

    return np.clip(out, 0, 255).astype(np.uint8)


def write_set(pil_img, stem, widths, quality=82):
    made = []
    for width in widths:
        ratio = width / pil_img.width
        img = pil_img.resize((width, max(1, round(pil_img.height * ratio))), Image.LANCZOS)
        for ext, params in (("jpg", {"quality": quality, "optimize": True, "progressive": True}),
                            ("webp", {"quality": quality, "method": 6})):
            path = os.path.join(OUT, f"{stem}-{width}.{ext}")
            img.save(path, **params)
            made.append(path)
    return made


def main():
    if not os.path.exists(SRC):
        sys.exit(f"imagem de origem nao encontrada: {SRC}")
    os.makedirs(OUT, exist_ok=True)

    src = cv2.imread(SRC)
    master = restore(src)
    cv2.imwrite(os.path.join(ROOT, "tools", "source", "1-restaurada.png"), master)

    rgb = Image.fromarray(cv2.cvtColor(master, cv2.COLOR_BGR2RGB))

    # Desktop: quadro completo, sem ampliacao alem do tamanho nativo (1280 px).
    write_set(rgb, "hero-wide", [1280, 960, 640])

    # Celular: recorte vertical sobre a ilha e as banquetas, nao sobre o teto.
    portrait = rgb.crop((300, 170, 940, 960))          # 640x790
    write_set(portrait, "hero-portrait", [640, 480])

    # Faixa atmosferica: outro enquadramento do mesmo ambiente, sem legenda de
    # projeto. Nao representa um trabalho distinto.
    band = rgb.crop((0, 150, 1280, 560))               # 1280x410
    write_set(band, "detail-band", [1280, 960, 640])

    # Open Graph: 1200x630 sobre o mesmo enquadramento do desktop.
    og = rgb.crop((40, 150, 1240, 780)).resize((1200, 630), Image.LANCZOS)
    og.save(os.path.join(OUT, "og-cover.jpg"), quality=84, optimize=True, progressive=True)

    for name in sorted(os.listdir(OUT)):
        print(f"  {name:28s} {os.path.getsize(os.path.join(OUT, name)) / 1024:7.1f} KB")


if __name__ == "__main__":
    main()
