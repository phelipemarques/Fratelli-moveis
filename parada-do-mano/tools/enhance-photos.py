#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parada do Mano — tratamento das fotos de referência enviadas.

As fotos chegaram como prints e recortes do Instagram, com 280 a 750 px.
Este script recorta cada foto de dentro dos prints, tira o ruído de
compressão, amplia 4x e faz um ajuste leve de contraste e cor. O resultado
vai para tools/source/<slot>.jpg, de onde o prepare-images.py gera as
versões do site.

A ampliação usa o EDSR (rede neural de super-resolução do OpenCV), que
reconstrói bordas sem inventar textura nova — a comida continua sendo a
mesma da foto. Sem o modelo, cai para Lanczos.

    pip install opencv-contrib-python-headless pillow numpy
    curl -L -o tools/models/EDSR_x4.pb \
      https://raw.githubusercontent.com/Saafke/EDSR_Tensorflow/master/models/EDSR_x4.pb
    curl -L -o tools/models/EDSR_x2.pb \
      https://raw.githubusercontent.com/Saafke/EDSR_Tensorflow/master/models/EDSR_x2.pb
    python3 tools/enhance-photos.py           # prints do Instagram (4x)
    python3 tools/enhance-photos.py novas     # fotos enviadas em 1122x1402 (2x)

Quando o restaurante mandar os arquivos originais em alta, eles entram
direto em tools/source/<slot>.jpg e este script deixa de ser necessário.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(RAIZ, 'tools', 'source', 'referencias')
DESTINO = os.path.join(RAIZ, 'tools', 'source')
MODELOS = os.path.join(RAIZ, 'tools', 'models')

# slot de destino: (arquivo de referência, caixa de recorte em px do print)
RECORTES = {
    'buffet-arroz':      ('buffet-arroz-saladas.png', None),
    'buffet-saladas':    ('buffet-saladas-ovos.webp', None),
    'buffet-legumes':    ('buffet-legumes.png', None),
    'buffet-decoradas':  ('instagram-grade.webp', (454, 26, 764, 414)),   # sem o ícone de carrossel
    'buffet-quentes':    ('instagram-grade.webp', (142, 492, 453, 690)),  # só a foto, sem a arte do post
    'churrasco-espeto':  ('instagram-grade.webp', (454, 442, 764, 830)),
    'fogao-lenha':       ('instagram-grade.webp', (765, 502, 1076, 700)),  # entre o adesivo e a legenda do story
    'post-feijoada':     ('instagram-grade.webp', (142, 0, 453, 414)),    # post inteiro, como foi publicado
    'post-rodizio':      ('instagram-grade.webp', (765, 0, 1076, 244)),   # só o título: o preço fica de fora
    'fachada':           ('instagram-perfil.webp', (925, 492, 1122, 628)),  # só a fachada: sem a arte do ônibus
}

LOGO = ('instagram-perfil.webp', (254, 50, 404, 200))

# Fotos enviadas em 16/10 em 1122x1402, já limpas: ampliação 2x, sem tirar ruído.
NOVAS = {
    'cafe-da-manha':   ('nova-cafe-da-manha.webp', None),
    'buffet-salao':    ('nova-buffet-salao.webp', None),
    'prato-carnes':    ('nova-prato-carnes.webp', None),
    'feijoada-buffet': ('nova-feijoada.webp', None),
    'saladas-buffet':  ('nova-saladas.webp', None),
    # a churrasqueira com os espetos, ao fundo da foto do salão
    'churrasqueira':   ('nova-buffet-salao.webp', (700, 200, 1122, 728)),
}


def carregar(nome, caixa):
    img = Image.open(os.path.join(REF, nome)).convert('RGB')
    return img.crop(caixa) if caixa else img


def ampliar(img, escala=4, limpar=True):
    try:
        import cv2
        modelo = os.path.join(MODELOS, 'EDSR_x%d.pb' % escala)
        if not os.path.exists(modelo):
            raise FileNotFoundError(modelo)
        sr = cv2.dnn_superres.DnnSuperResImpl_create()
        sr.readModel(modelo)
        sr.setModel('edsr', escala)
        bgr = cv2.cvtColor(np.asarray(img), cv2.COLOR_RGB2BGR)
        if limpar:
            # tira os blocos de compressão antes de ampliar, senão eles crescem junto
            bgr = cv2.fastNlMeansDenoisingColored(bgr, None, 3, 3, 7, 21)
        out = sr.upsample(bgr)
        return Image.fromarray(cv2.cvtColor(out, cv2.COLOR_BGR2RGB)), 'EDSR %dx' % escala
    except Exception as erro:  # sem OpenCV ou sem o modelo
        print('  (sem EDSR: %s — usando Lanczos)' % erro)
        return img.resize((img.width * escala, img.height * escala), Image.LANCZOS), 'Lanczos %dx' % escala


def ajustar(img):
    """Ajuste leve: nada que mude a cor da comida.
    O autocontraste age só na luminância (preserve_tone), para não mexer no
    equilíbrio de cor — por canal, ele esfriava o amarelo do arroz."""
    img = ImageOps.autocontrast(img, cutoff=0.3, preserve_tone=True)
    img = ImageEnhance.Color(img).enhance(1.04)
    return img.filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=3))


def main():
    so = sys.argv[1:]
    if 'novas' in so:
        for slot, (nome, caixa) in NOVAS.items():
            img = carregar(nome, caixa)
            grande, metodo = ampliar(img, 2, limpar=False)
            grande = ajustar(grande)
            grande.save(os.path.join(DESTINO, slot + '.jpg'), 'JPEG', quality=92, subsampling=0)
            print('%-18s %4dx%-4d -> %4dx%-4d  %s' % (slot, img.width, img.height, grande.width, grande.height, metodo), flush=True)
        return
    for slot, (nome, caixa) in RECORTES.items():
        img = carregar(nome, caixa)
        grande, metodo = ampliar(img)
        grande = ajustar(grande)
        grande.save(os.path.join(DESTINO, slot + '.jpg'), 'JPEG', quality=92, subsampling=0)
        print('%-18s %4dx%-4d -> %4dx%-4d  %s' % (slot, img.width, img.height, grande.width, grande.height, metodo))

    # logo oficial: recorte do avatar do perfil, com o círculo isolado do fundo
    nome, caixa = LOGO
    img = carregar(nome, caixa)
    grande, metodo = ampliar(img)
    grande = ajustar(grande)
    mascara = Image.new('L', (grande.width * 4, grande.height * 4), 0)
    ImageDraw.Draw(mascara).ellipse((6, 6, mascara.width - 6, mascara.height - 6), fill=255)
    mascara = mascara.resize(grande.size, Image.LANCZOS)
    grande.putalpha(mascara)
    grande.save(os.path.join(DESTINO, 'logo.png'))
    print('%-18s %4dx%-4d -> %4dx%-4d  %s' % ('logo', img.width, img.height, grande.width, grande.height, metodo))


if __name__ == '__main__':
    sys.exit(main())
