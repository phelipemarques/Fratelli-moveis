#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parada do Mano — vídeos feitos com as fotos reais do restaurante.

Gera três arquivos:
  assets/video/parada-do-mano-abertura.mp4   960x960, sem texto, em loop — fundo da abertura do site
  parada-do-mano-video-vertical.mp4          1080x1920, com textos — Reels, Stories e status do WhatsApp
  parada-do-mano-video-horizontal.mp4        1920x1080, com textos — Facebook, YouTube, telão

Cada foto ganha um movimento lento de câmera (aproximação e deslocamento),
as cenas se fundem umas nas outras e os textos usam as fontes e cores do
site. Nada é gerado por IA: todo quadro sai das fotos em tools/source/.
Os vídeos não têm trilha sonora — música, só com licença (dá para pôr a
trilha direto no Instagram, que já tem músicas liberadas).

    python3 tools/make-film.py            (precisa de Pillow e ffmpeg)
"""
import math
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTE = os.path.join(RAIZ, 'tools', 'source')
FONTES = os.path.join(RAIZ, 'tools', 'fonts-ttf')
FPS = 30
FUSAO = 0.8  # segundos de fusão entre cenas

COAL = (11, 9, 8)
ORANGE = (255, 130, 28)
GOLD = (245, 166, 35)
CREAM = (255, 243, 226)

_fotos = {}


def foto(nome):
    if nome not in _fotos:
        _fotos[nome] = Image.open(os.path.join(FONTE, nome + '.jpg')).convert('RGB')
    return _fotos[nome]


def fonte(nome, tam):
    return ImageFont.truetype(os.path.join(FONTES, nome + '.ttf'), max(8, int(tam)))


def suave(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


# ---------------------------------------------------------------- cenas

def quadro_foto(cena, p, W, H):
    """Recorte da foto com aproximação e deslocamento (p de 0 a 1)."""
    img = foto(cena['foto'])
    iw, ih = img.size
    alvo = W / H
    # maior retângulo na proporção do vídeo que cabe na foto
    if iw / ih > alvo:
        bw, bh = ih * alvo, ih
    else:
        bw, bh = iw, iw / alvo
    e = suave(p) if cena.get('suave', True) else p
    z = cena.get('z0', 1.0) + (cena.get('z1', 1.12) - cena.get('z0', 1.0)) * e
    cw, ch = bw / z, bh / z
    (x0, y0), (x1, y1) = cena.get('de', (0.5, 0.5)), cena.get('para', (0.5, 0.5))
    cx = (x0 + (x1 - x0) * e) * iw
    cy = (y0 + (y1 - y0) * e) * ih
    cx = min(max(cx, cw / 2), iw - cw / 2)
    cy = min(max(cy, ch / 2), ih - ch / 2)
    caixa = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
    return img.transform((W, H), Image.EXTENT, caixa, Image.BICUBIC)


def fundo_brasa(W, H, intensidade=0.5):
    img = Image.new('RGB', (W, H), COAL)
    g = Image.radial_gradient('L').resize((int(W * 1.6), int(H * 1.0)))
    g = g.point(lambda v: int(max(0, 255 - v * 2) * intensidade))
    m = Image.new('L', (W, H), 0)
    m.paste(g, (int(W / 2 - W * 0.8), int(H - H * 0.5)))
    return Image.composite(Image.new('RGB', (W, H), (218, 89, 21)), img, m)


def colar_texto(base, linhas, t, W, H, posicao='baixo', escuro=True):
    """Linhas de texto que sobem e aparecem uma depois da outra."""
    u = min(W, H)
    if escuro and posicao == 'baixo':
        scrim = Image.linear_gradient('L').resize((W, int(H * 0.6))).point(lambda v: int(v * 0.85))
        base.paste(COAL, (0, H - scrim.height), scrim)
    camada = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(camada)
    blocos = []
    margem = u * 0.075
    for ln in linhas:
        tam = u * ln['tam']
        f = fonte(ln['fonte'], tam)
        extra = ln.get('espaco', 0) * u * (len(ln['texto']) - 1)
        # encolhe a linha até caber entre as margens
        while f.getlength(ln['texto']) + extra > W - 2 * margem and tam > 10:
            tam *= 0.95
            f = fonte(ln['fonte'], tam)
        blocos.append((ln, f, f.getbbox(ln['texto'])))
    altura = sum((b[3] - b[1]) + u * 0.022 for _, _, b in blocos)
    if posicao == 'baixo':
        # no vertical, a legenda e os botões do Instagram cobrem o rodapé: o texto sobe
        y = H - (H * 0.2 if H > W else margem * 1.4) - altura
    else:
        y = H / 2 - altura / 2
    for i, (ln, f, b) in enumerate(blocos):
        a = suave((t - 0.25 - i * 0.22) / 0.55)
        dy = (1 - a) * u * 0.04
        cor = ln.get('cor', CREAM) + (int(255 * a),)
        if posicao == 'centro':
            x = W / 2 - (b[2] - b[0]) / 2 - b[0]
        else:
            x = margem - b[0]
        if ln.get('espaco'):
            # rótulo espaçado (só caixa alta curta)
            larg = sum(d.textlength(c, font=f) for c in ln['texto']) + ln['espaco'] * u * (len(ln['texto']) - 1)
            xx = W / 2 - larg / 2 if posicao == 'centro' else margem
            for c in ln['texto']:
                d.text((xx, y - b[1] + dy), c, font=f, fill=cor)
                xx += d.textlength(c, font=f) + ln['espaco'] * u
        else:
            d.text((x, y - b[1] + dy), ln['texto'], font=f, fill=cor)
        y += (b[3] - b[1]) + u * 0.022
    base.paste(camada, (0, 0), camada)
    return base


def quadro_cartao(cena, t, W, H):
    if cena.get('fundo') == 'laranja':
        img = Image.new('RGB', (W, H), ORANGE)
    else:
        img = fundo_brasa(W, H, 0.55)
    u = min(W, H)
    if cena.get('logo'):
        logo = Image.open(os.path.join(FONTE, 'logo.png')).convert('RGBA')
        a = suave(t / 0.7)
        tam = int(u * 0.34 * (0.9 + 0.1 * a))
        lg = logo.resize((tam, tam), Image.LANCZOS)
        alfa = lg.split()[3].point(lambda v: int(v * a))
        y = int(H / 2 - tam - u * 0.04) if cena['linhas'] else int(H / 2 - tam / 2)
        img.paste(lg, (int(W / 2 - tam / 2), y), alfa)
        # o texto entra logo abaixo do logo: a área de centralização desce meio logo
        colar_texto(img, cena['linhas'], t - 0.35, W, H + tam + int(u * 0.1), 'centro', escuro=False)
        return img
    return colar_texto(img, cena['linhas'], t, W, H, 'centro', escuro=False)


def quadro(cena, t, W, H):
    if cena['tipo'] == 'foto':
        img = quadro_foto(cena, t / (cena['dur'] + FUSAO), W, H)
        if cena.get('linhas'):
            colar_texto(img, cena['linhas'], t, W, H, 'baixo')
        return img
    return quadro_cartao(cena, t, W, H)


# ---------------------------------------------------------------- montagem

def render(cenas, W, H, saida, loop=False, crf=22):
    inicios, acc = [], 0.0
    for c in cenas:
        inicios.append(acc)
        acc += c['dur']
    total = acc if loop else acc + FUSAO
    n = int(round(total * FPS))
    cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '%dx%d' % (W, H),
           '-r', str(FPS), '-i', '-', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf),
           '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-profile:v', 'high', saida]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for k in range(n):
        t = k / FPS
        camadas = []
        for i, c in enumerate(cenas):
            for desloc in ((0.0, total) if loop else (0.0,)):
                local = t + desloc - inicios[i]
                if 0 <= local < c['dur'] + FUSAO:
                    alfa = 1.0 if (i == 0 and not loop) else suave(local / FUSAO)
                    camadas.append((inicios[i] - desloc, alfa, c, local))
        camadas.sort(key=lambda x: x[0])
        img = None
        for _, alfa, c, local in camadas:
            q = quadro(c, local, W, H)
            img = q if img is None or alfa >= 1 else Image.blend(img, q, alfa)
        # o primeiro quadro do vídeo, e o último, saem do preto (exceto no loop)
        if not loop:
            ent = suave(t / 0.5)
            sai = suave((total - t) / 0.6)
            f = min(ent, sai)
            if f < 1:
                img = Image.blend(Image.new('RGB', (W, H), COAL), img, f)
        proc.stdin.write(img.tobytes())
    proc.stdin.close()
    proc.wait()
    print('%s — %dx%d, %.1f s, %.1f MB' % (os.path.relpath(saida, RAIZ), W, H, total, os.path.getsize(saida) / 1e6))


def L(texto, tam, fonte_='anton-400', cor=CREAM, espaco=None):
    d = {'texto': texto, 'tam': tam, 'fonte': fonte_, 'cor': cor}
    if espaco:
        d['espaco'] = espaco
    return d


def roteiro_com_texto(vertical):
    k = 1.3 if vertical else 1.0  # no celular o texto precisa ser maior
    rot = lambda s: L(s, 0.042 * k, 'barlow-condensed-600', ORANGE, espaco=0.012)
    return [
        {'tipo': 'cartao', 'dur': 2.6, 'logo': True, 'linhas': [
            L('PARADA DO MANO', 0.11 * k),
            L('RESTAURANTE E LANCHONETE', 0.04 * k, 'barlow-condensed-600', ORANGE, espaco=0.012)]},
        {'tipo': 'foto', 'foto': 'churrasqueira', 'dur': 3.0, 'z0': 1.0, 'z1': 1.15,
         'de': (0.5, 0.55), 'para': (0.5, 0.45),
         'linhas': [rot('BR-277 · CASCAVEL/PR'), L('DO FOGO', 0.13 * k), L('À MESA.', 0.13 * k, cor=ORANGE)]},
        {'tipo': 'foto', 'foto': 'buffet-salao', 'dur': 3.2, 'z0': 1.0, 'z1': 1.14,
         'de': (0.5, 0.6), 'para': (0.5, 0.5),
         'linhas': [rot('ALMOÇO'), L('BUFFET COMPLETO', 0.1 * k), L('com variedade todos os dias', 0.045 * k, 'barlow-600')]},
        {'tipo': 'foto', 'foto': 'saladas-buffet', 'dur': 2.8, 'z0': 1.12, 'z1': 1.0,
         'de': (0.45, 0.5), 'para': (0.5, 0.55),
         'linhas': [L('SALADAS', 0.1 * k), L('montadas com capricho', 0.045 * k, 'barlow-600')]},
        {'tipo': 'foto', 'foto': 'cafe-da-manha', 'dur': 2.8, 'z0': 1.0, 'z1': 1.12,
         'de': (0.45, 0.6), 'para': (0.5, 0.5),
         'linhas': [rot('A PARTIR DAS 06H'), L('CAFÉ DA MANHÃ', 0.1 * k), L('para começar bem o dia', 0.045 * k, 'barlow-600')]},
        {'tipo': 'foto', 'foto': 'prato-carnes', 'dur': 3.0, 'z0': 1.0, 'z1': 1.14,
         'de': (0.5, 0.65), 'para': (0.5, 0.55),
         'linhas': [rot('NO ALMOÇO E NA JANTA'), L('COMIDA CASEIRA', 0.1 * k), L('de segunda a domingo', 0.045 * k, 'barlow-600')]},
        {'tipo': 'foto', 'foto': 'feijoada-buffet', 'dur': 3.0, 'z0': 1.12, 'z1': 1.0,
         'de': (0.5, 0.4), 'para': (0.5, 0.5),
         'linhas': [rot('QUARTA E SÁBADO'), L('FEIJOADA', 0.12 * k)]},
        {'tipo': 'cartao', 'fundo': 'laranja', 'dur': 3.0, 'linhas': [
            L('DOMINGO', 0.05 * k, 'barlow-condensed-600', COAL, espaco=0.014),
            L('ESPETO CORRIDO', 0.11 * k, cor=COAL),
            L('bom churrasco, bons momentos', 0.045 * k, 'barlow-600', COAL)]},
        {'tipo': 'cartao', 'dur': 3.6, 'logo': True, 'linhas': [
            L('SEG A DOM · 06H ÀS 23H30', 0.06 * k),
            L('BR-277, KM 594 · CASCAVEL/PR', 0.045 * k, 'barlow-condensed-600', ORANGE, espaco=0.006),
            L('WHATSAPP (45) 99825-8916', 0.045 * k, 'barlow-condensed-600', GOLD, espaco=0.006)]},
    ]


def roteiro_abertura():
    return [
        {'tipo': 'foto', 'foto': 'buffet-salao', 'dur': 3.6, 'z0': 1.0, 'z1': 1.14, 'de': (0.5, 0.6), 'para': (0.6, 0.45)},
        {'tipo': 'foto', 'foto': 'churrasqueira', 'dur': 3.2, 'z0': 1.0, 'z1': 1.12, 'de': (0.5, 0.55), 'para': (0.5, 0.45)},
        {'tipo': 'foto', 'foto': 'prato-carnes', 'dur': 3.4, 'z0': 1.0, 'z1': 1.14, 'de': (0.5, 0.65), 'para': (0.5, 0.55)},
        {'tipo': 'foto', 'foto': 'feijoada-buffet', 'dur': 3.2, 'z0': 1.12, 'z1': 1.0, 'de': (0.5, 0.4), 'para': (0.5, 0.5)},
        {'tipo': 'foto', 'foto': 'saladas-buffet', 'dur': 3.2, 'z0': 1.0, 'z1': 1.12, 'de': (0.45, 0.55), 'para': (0.55, 0.5)},
    ]


def main():
    os.makedirs(os.path.join(RAIZ, 'assets', 'video'), exist_ok=True)
    so = sys.argv[1:] or ['abertura', 'vertical', 'horizontal']
    if 'abertura' in so:
        render(roteiro_abertura(), 960, 960,
               os.path.join(RAIZ, 'assets', 'video', 'parada-do-mano-abertura.mp4'), loop=True, crf=30)
    if 'vertical' in so:
        render(roteiro_com_texto(True), 1080, 1920, os.path.join(RAIZ, 'parada-do-mano-video-vertical.mp4'))
    if 'horizontal' in so:
        render(roteiro_com_texto(False), 1920, 1080, os.path.join(RAIZ, 'parada-do-mano-video-horizontal.mp4'))


if __name__ == '__main__':
    main()
