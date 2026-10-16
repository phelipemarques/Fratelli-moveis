#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parada do Mano — preparo das fotografias do site.

Cada espaço de foto do site tem um nome (o "slot"), uma proporção e as
larguras em que o navegador pode pedi-lo. O index.html já aponta para os
arquivos finais (assets/images/<slot>-<largura>.webp), então trocar uma
foto nunca exige mexer no HTML:

    1. salve a foto original em tools/source/<slot>.jpg   (ou .jpeg, .png, .webp)
    2. rode   python3 tools/prepare-images.py
    3. confira o ponto de foco (FOCO, abaixo) se o corte não ficou bom

Enquanto a foto real não chega, o script desenha no lugar um quadro
escuro identificado ("FOTO REAL A INSERIR"), nas mesmas proporções.
Ele não imita comida nem ambiente: é só a marcação do espaço.

Requer Pillow (pip install pillow).
"""

import os
import random
import sys

from PIL import Image, ImageDraw, ImageFont, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEM = os.path.join(RAIZ, 'tools', 'source')
FONTES = os.path.join(RAIZ, 'tools', 'fonts-ttf')
SAIDA = os.path.join(RAIZ, 'assets', 'images')

# slot: (proporção L:A, larguras, título no quadro provisório)
SLOTS = {
    # Abertura
    'hero':                ((5, 4),  (640, 960, 1440), 'Foto de abertura: buffet ou churrasco'),
    # Sobre: os momentos do dia
    'momento-cafe':        ((4, 5),  (480, 800),       'Café da manhã'),
    'momento-almoco':      ((4, 5),  (480, 800),       'Almoço'),
    'momento-jantar':      ((4, 5),  (480, 800),       'Jantar'),
    # Buffet
    'buffet-arroz':        ((4, 5),  (480, 800, 1200), 'Arroz e acompanhamentos'),
    'buffet-saladas':      ((1, 1),  (480, 800),       'Saladas frescas'),
    'buffet-legumes':      ((4, 3),  (480, 800),       'Legumes'),
    'buffet-quentes':      ((3, 2),  (640, 960, 1280), 'Pratos quentes'),
    'buffet-feijao':       ((1, 1),  (480, 800),       'Feijão'),
    'buffet-massas':       ((4, 5),  (480, 800),       'Massas'),
    'buffet-variados':     ((3, 2),  (640, 960),       'Preparações variadas'),
    # Churrasco
    'churrasco-brasa':     ((16, 10), (800, 1280, 1920), 'Churrasqueira acesa'),
    'churrasco-espetos':   ((4, 5),  (480, 800),       'Espetos na brasa'),
    'churrasco-carnes':    ((1, 1),  (480, 800),       'Carnes servidas'),
    'post-espeto':         ((4, 5),  (480, 800),       'Post do espeto corrido de domingo'),
    # Feijoada
    'feijoada':            ((4, 5),  (480, 800, 1080), 'Feijoada — foto do post oficial'),
    # Galeria
    'galeria-salao':       ((3, 2),  (640, 1200),      'Salão do restaurante'),
    'galeria-churrasqueira': ((4, 5), (480, 960),      'Churrasqueira'),
    'galeria-buffet':      ((1, 1),  (480, 960),       'Buffet servido'),
    'galeria-carnes':      ((4, 5),  (480, 960),       'Carnes'),
    'galeria-fachada':     ((3, 2),  (640, 1200),      'Fachada na BR-277'),
    'galeria-preparo':     ((1, 1),  (480, 960),       'Preparo na cozinha'),
}

# Ponto de foco do corte, de 0 a 1 (x, y). Padrão: centro.
# Ex.: 'hero': (0.5, 0.65) puxa o corte para a parte de baixo da foto.
FOCO = {
}

# Imagem de compartilhamento (WhatsApp, Facebook): 1200x630, JPG.
# Sai da foto de abertura quando ela existir.
OG = ('og-cover', 'hero')

COR_FUNDO_1 = (23, 17, 13)       # #17110D
COR_FUNDO_2 = (11, 9, 8)         # #0B0908
COR_BRASA = (218, 89, 21)        # #DA5915
COR_LARANJA = (255, 130, 28)     # #FF821C
COR_DOURADO = (245, 166, 35)     # #F5A623
COR_CREME = (255, 243, 226)      # #FFF3E2

EXTENSOES = ('.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG')


def fonte(nome, tamanho):
    return ImageFont.truetype(os.path.join(FONTES, nome + '.ttf'), int(tamanho))


def achar_origem(slot):
    for ext in EXTENSOES:
        caminho = os.path.join(ORIGEM, slot + ext)
        if os.path.exists(caminho):
            return caminho
    return None


def cortar(img, proporcao, foco):
    """Corta a imagem na proporção pedida, centrada no ponto de foco."""
    pw, ph = proporcao
    w, h = img.size
    alvo = pw / ph
    if w / h > alvo:
        nw, nh = int(round(h * alvo)), h
    else:
        nw, nh = w, int(round(w / alvo))
    fx, fy = foco
    x = min(max(int(fx * w - nw / 2), 0), w - nw)
    y = min(max(int(fy * h - nh / 2), 0), h - nh)
    return img.crop((x, y, x + nw, y + nh))


def quebrar(desenho, texto, fnt, largura_max):
    linhas, atual = [], ''
    for palavra in texto.split():
        teste = (atual + ' ' + palavra).strip()
        if desenho.textlength(teste, font=fnt) <= largura_max or not atual:
            atual = teste
        else:
            linhas.append(atual)
            atual = palavra
    if atual:
        linhas.append(atual)
    return linhas


def espaçado(desenho, xy, texto, fnt, cor, espaco):
    """Texto com espaçamento entre letras, centrado em x."""
    x, y = xy
    total = sum(desenho.textlength(c, font=fnt) for c in texto) + espaco * (len(texto) - 1)
    x -= total / 2
    for c in texto:
        desenho.text((x, y), c, font=fnt, fill=cor)
        x += desenho.textlength(c, font=fnt) + espaco


def fundo(semente, w, h):
    """Fundo escuro com brilho âmbar vindo de baixo e granulação leve."""
    # fundo: degradê vertical + brilho âmbar vindo de baixo
    img = Image.new('RGB', (w, h), COR_FUNDO_2)
    topo = Image.new('RGB', (w, h), COR_FUNDO_1)
    mascara = Image.linear_gradient('L').resize((w, h))
    img = Image.composite(img, topo, mascara)

    bw, bh = int(w * 1.6), int(h * 1.3)
    brilho = Image.radial_gradient('L').resize((bw, bh))
    brilho = brilho.point(lambda v: int(max(0, 255 - v * 2) * 0.5))
    base = Image.new('L', (w, h), 0)
    base.paste(brilho, (int(w / 2 - bw / 2), int(h - bh / 2)))
    img = Image.composite(Image.new('RGB', (w, h), COR_BRASA), img, base)

    # textura discreta (granulação fixa, sempre igual entre execuções)
    rnd = random.Random(semente)
    ruido = Image.new('L', (w, h))
    px = ruido.load()
    for _ in range(int(w * h * 0.05)):
        px[rnd.randrange(w), rnd.randrange(h)] = rnd.randrange(30, 70)
    return Image.composite(Image.new('RGB', (w, h), COR_CREME), img, ruido.point(lambda v: v // 8))


def provisoria(slot, proporcao, largura, titulo):
    """Quadro escuro identificado, sem simular foto nenhuma."""
    pw, ph = proporcao
    w, h = largura, int(round(largura * ph / pw))
    menor = min(w, h)
    img = fundo(slot, w, h)
    d = ImageDraw.Draw(img)

    # moldura de visor: cantos em laranja
    m = int(menor * 0.06)
    t = max(2, int(menor * 0.006))
    c = int(menor * 0.09)
    for (x0, y0, dx, dy) in ((m, m, 1, 1), (w - m, m, -1, 1), (m, h - m, 1, -1), (w - m, h - m, -1, -1)):
        d.line([(x0, y0), (x0 + dx * c, y0)], fill=COR_LARANJA, width=t)
        d.line([(x0, y0), (x0, y0 + dy * c)], fill=COR_LARANJA, width=t)

    # textos
    # a foto de abertura é cortada de jeitos diferentes no celular e no
    # computador: lá o texto fica menor, para caber em qualquer recorte
    escala = 0.55 if slot == 'hero' else 1
    f_rotulo = fonte('barlow-condensed-600', menor * 0.042 * escala)
    f_titulo = fonte('anton-400', menor * 0.095 * escala)
    f_arquivo = fonte('barlow-600', menor * 0.034 * escala)

    linhas = quebrar(d, titulo.upper(), f_titulo, w * (0.4 if slot == 'hero' else 0.72))
    alt_linha = f_titulo.size * 1.12
    bloco = f_rotulo.size * 2.2 + alt_linha * len(linhas) + f_arquivo.size * 2.4
    y = h / 2 - bloco / 2

    espaçado(d, (w / 2, y), 'FOTO REAL A INSERIR', f_rotulo, COR_DOURADO, f_rotulo.size * 0.22)
    y += f_rotulo.size * 2.2
    for linha in linhas:
        lw = d.textlength(linha, font=f_titulo)
        d.text((w / 2 - lw / 2, y), linha, font=f_titulo, fill=COR_CREME)
        y += alt_linha
    y += f_arquivo.size * 1.0
    arq = 'tools/source/%s.jpg' % slot
    aw = d.textlength(arq, font=f_arquivo)
    d.text((w / 2 - aw / 2, y), arq, font=f_arquivo, fill=(176, 160, 142))
    return img


def og_provisoria():
    w, h = 1200, 630
    img = fundo('og', w, h)
    d = ImageDraw.Draw(img)
    f_nome = fonte('anton-400', 112)
    f_sub = fonte('barlow-condensed-600', 40)
    nome = 'PARADA DO MANO'
    d.text((w / 2 - d.textlength(nome, font=f_nome) / 2, 200), nome, font=f_nome, fill=COR_CREME)
    sub = 'DO FOGO À MESA · BR-277 · CASCAVEL/PR'
    espaçado(d, (w / 2, 350), sub, f_sub, COR_LARANJA, 6)
    return img


def salvar_webp(img, caminho):
    img.save(caminho, 'WEBP', quality=80, method=6)


def main():
    os.makedirs(SAIDA, exist_ok=True)
    reais, pendentes, avisos = [], [], []

    for slot, (proporcao, larguras, titulo) in SLOTS.items():
        origem = achar_origem(slot)
        if origem:
            foto = ImageOps.exif_transpose(Image.open(origem)).convert('RGB')
            foto = cortar(foto, proporcao, FOCO.get(slot, (0.5, 0.5)))
            if foto.width < larguras[-1]:
                avisos.append('%s: original com %dpx de largura, menor que os %dpx da maior versão'
                              % (slot, foto.width, larguras[-1]))
            for lw in larguras:
                lh = int(round(lw * proporcao[1] / proporcao[0]))
                salvar_webp(foto.resize((lw, lh), Image.LANCZOS),
                            os.path.join(SAIDA, '%s-%d.webp' % (slot, lw)))
            reais.append(slot)
        else:
            for lw in larguras:
                salvar_webp(provisoria(slot, proporcao, lw, titulo),
                            os.path.join(SAIDA, '%s-%d.webp' % (slot, lw)))
            pendentes.append(slot)

    # imagem de compartilhamento
    nome_og, slot_og = OG
    origem = achar_origem(slot_og)
    if origem:
        og = cortar(ImageOps.exif_transpose(Image.open(origem)).convert('RGB'),
                    (1200, 630), FOCO.get(slot_og, (0.5, 0.5))).resize((1200, 630), Image.LANCZOS)
    else:
        og = og_provisoria()
    og.save(os.path.join(SAIDA, nome_og + '.jpg'), 'JPEG', quality=84, optimize=True, progressive=True)

    with open(os.path.join(RAIZ, 'tools', 'fotos-pendentes.txt'), 'w', encoding='utf-8') as f:
        f.write('# Gerado por tools/prepare-images.py — espaços ainda sem foto real\n')
        for slot in pendentes:
            f.write('tools/source/%s.jpg   %s\n' % (slot, SLOTS[slot][2]))

    print('fotos reais: %d   quadros provisórios: %d' % (len(reais), len(pendentes)))
    for a in avisos:
        print('aviso:', a)
    if pendentes:
        print('lista dos pendentes em tools/fotos-pendentes.txt')


if __name__ == '__main__':
    sys.exit(main())
