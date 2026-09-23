#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fratelli Moveis — filme institucional.

Coloca o video em assets/video/ e tira o poster do proprio filme.

O poster e o PRIMEIRO quadro, nao um quadro bonito qualquer: assim a
troca entre a imagem parada e o video em movimento nao tem salto nenhum.
Por sorte o primeiro quadro tambem e o da sala, que e o que se queria.

    python3 tools/prepare-film.py <arquivo.mp4>
"""

import os
import shutil
import sys

import cv2

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO = os.path.join(RAIZ, 'assets', 'video', 'fratelli-brand-film.mp4')
POSTER = os.path.join(RAIZ, 'assets', 'images', 'fratelli-film-poster.webp')
Q_WEBP = 82


def main():
    if len(sys.argv) < 2:
        raise SystemExit('uso: python3 tools/prepare-film.py <arquivo.mp4>')
    origem = sys.argv[1]
    if not os.path.exists(origem):
        raise SystemExit('nao achei ' + origem)

    os.makedirs(os.path.dirname(VIDEO), exist_ok=True)
    shutil.copyfile(origem, VIDEO)

    cap = cv2.VideoCapture(VIDEO)
    if not cap.isOpened():
        raise SystemExit('nao consegui abrir o video')

    larg = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    alt = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    ok, quadro = cap.read()
    cap.release()
    if not ok:
        raise SystemExit('nao consegui ler o primeiro quadro')

    cv2.imwrite(POSTER, quadro, [cv2.IMWRITE_WEBP_QUALITY, Q_WEBP])

    print('video   %s — %.1f MB, %dx%d, %.0f fps, %.1f s'
          % (os.path.relpath(VIDEO, RAIZ), os.path.getsize(VIDEO) / 1e6,
             larg, alt, fps, n / fps if fps else 0))
    print('poster  %s — %.0f KB (primeiro quadro)'
          % (os.path.relpath(POSTER, RAIZ), os.path.getsize(POSTER) / 1024))


if __name__ == '__main__':
    main()
