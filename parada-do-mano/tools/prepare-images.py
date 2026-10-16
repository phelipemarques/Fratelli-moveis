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

# slot: (proporção L:A, larguras, título no quadro provisório, foto de origem)
# A foto de origem é tools/source/<origem>.jpg; quando a origem não é dita,
# vale o próprio nome do slot. Mais de um slot pode sair da mesma foto
# (a abertura e o mosaico usam a mesma foto do arroz, em cortes diferentes).
SLOTS = {
    # Abertura
    'hero':               ((5, 4),  (640, 800, 960, 1440, 1920), 'Foto de abertura', 'buffet-salao'),
    # Fotos enviadas em 16/10 (ampliadas 2x por enhance-photos.py novas)
    'buffet-salao':       ((4, 5),  (240, 480, 640, 800, 1200), 'Buffet e salão', None),
    'cafe-da-manha':      ((4, 5),  (240, 480, 640, 800, 1200), 'Café da manhã', None),
    'prato-carnes':       ((4, 5),  (240, 480, 640, 800, 1200), 'Prato com carnes', None),
    'prato-carnes-largo': ((16, 9), (960, 1440, 1920), 'Prato com carnes', 'prato-carnes'),
    'feijoada-buffet':    ((4, 5),  (480, 640, 800, 1200), 'Feijoada', None),
    'saladas-buffet':     ((4, 5),  (480, 640, 800, 1200), 'Saladas', None),
    'churrasqueira':      ((4, 5),  (480, 640, 800), 'Churrasqueira', None),
    # Arte oficial do rodízio (recorte sem o preço, de um print do Instagram)
    'post-rodizio':       ((5, 4),  (480, 800, 1200), 'Post do rodízio de domingo', None),
}

# Ponto de foco do corte, de 0 a 1 (x, y). Padrão: centro.
FOCO = {
    'hero': (0.5, 0.58),
    'prato-carnes-largo': (0.5, 0.66),
}

# Logo oficial (recorte do perfil do Instagram, ver enhance-photos.py)
LOGO = ('logo', (48, 96, 192))

# Imagem de compartilhamento (WhatsApp, Facebook): 1200x630, JPG.
# Sai da foto de abertura quando ela existir.
OG = ('og-cover', 'buffet-salao')

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
    # AVIF: ~50 % menor que o WebP com a mesma aparência; o HTML oferece os dois (<picture>)
    img.save(caminho[:-5] + '.avif', 'AVIF', quality=52)


def main():
    os.makedirs(SAIDA, exist_ok=True)
    reais, pendentes, avisos = [], [], []

    for slot, (proporcao, larguras, titulo, fonte_slot) in SLOTS.items():
        origem = achar_origem(fonte_slot or slot)
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

    gerados = {'%s-%d.%s' % (slot, lw, ext) for slot, v in SLOTS.items() for lw in v[1] for ext in ('webp', 'avif')}

    # logo oficial em PNG transparente, nos tamanhos do cabeçalho, rodapé e ícone
    nome_logo, tamanhos = LOGO
    origem_logo = achar_origem(nome_logo)
    logo = None
    if origem_logo:
        logo = Image.open(origem_logo).convert('RGBA')
        for t in tamanhos:
            reduzida = logo.resize((t, t), Image.LANCZOS)
            reduzida.save(os.path.join(SAIDA, 'logo-%d.png' % t), optimize=True)
            gerados.add('logo-%d.png' % t)
            # WebP com transparência: cabeçalho e rodapé (o PNG fica para ícone e compartilhamento)
            if t in (96, 192):
                reduzida.save(os.path.join(SAIDA, 'logo-%d.webp' % t), 'WEBP', quality=86, method=6)
                gerados.add('logo-%d.webp' % t)
    else:
        avisos.append('logo: tools/source/logo.png não encontrado')

    # imagem de compartilhamento: foto real + logo + nome
    nome_og, slot_og = OG
    origem = achar_origem(slot_og)
    if origem:
        og = cortar(ImageOps.exif_transpose(Image.open(origem)).convert('RGB'),
                    (1200, 630), FOCO.get(slot_og, (0.5, 0.5))).resize((1200, 630), Image.LANCZOS)
        # véu escuro da esquerda (onde fica o texto) para a direita
        veu = Image.new('L', (1200, 630))
        veu.putdata([int(max(0.0, 1 - x / 860) ** 0.8 * 225) for _ in range(630) for x in range(1200)])
        og = Image.composite(Image.new('RGB', og.size, COR_FUNDO_2), og, veu)
        d = ImageDraw.Draw(og)
        if logo:
            og.paste(logo.resize((170, 170), Image.LANCZOS), (70, 120), logo.resize((170, 170), Image.LANCZOS))
        d.text((70, 320), 'PARADA DO MANO', font=fonte('anton-400', 92), fill=COR_CREME)
        d.text((72, 440), 'DO FOGO À MESA · BR-277, KM 594 · CASCAVEL/PR',
                font=fonte('barlow-condensed-600', 34), fill=COR_LARANJA)
    else:
        og = og_provisoria()
    og.save(os.path.join(SAIDA, nome_og + '.jpg'), 'JPEG', quality=84, optimize=True, progressive=True)
    gerados.add(nome_og + '.jpg')

    # apaga versões que nenhum slot usa mais (de cortes ou slots antigos)
    for nome in os.listdir(SAIDA):
        if nome not in gerados:
            os.remove(os.path.join(SAIDA, nome))

    lista = os.path.join(RAIZ, 'tools', 'fotos-pendentes.txt')
    if not pendentes and os.path.exists(lista):
        os.remove(lista)
    if pendentes:
        with open(lista, 'w', encoding='utf-8') as f:
            f.write('# Gerado por tools/prepare-images.py — espaços ainda sem foto real\n')
            for slot in pendentes:
                f.write('tools/source/%s.jpg   %s\n' % (SLOTS[slot][3] or slot, SLOTS[slot][2]))

    print('com foto: %d   quadros provisórios: %d' % (len(reais), len(pendentes)))
    for a in avisos:
        print('aviso:', a)
    if pendentes:
        print('lista dos pendentes em tools/fotos-pendentes.txt')


if __name__ == '__main__':
    sys.exit(main())
