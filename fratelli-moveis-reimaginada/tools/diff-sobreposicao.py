#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Compara os pares de quadros gravados por tools/teste-sobreposicao.js.

Duas perguntas, e so a segunda reprova:

1. A cena esta ATRAS deste texto?
   Conta os pixels que mudaram quando a cena foi escondida. E uma
   medida informativa: o piso da cena 3D e quase preto, e aparecer
   atras de um texto claro nao prejudica ninguem. Dizer "sobrepos" so
   porque um pixel mudou seria alarme falso.

2. O texto continua LEGIVEL?
   Esta reprova. Mede o contraste real entre a cor do texto e o fundo
   que esta efetivamente atras dele, com a cena presente.

   O truque para nao confundir o fundo com as proprias letras: o
   quadro SEM a cena mostra o fundo desenhado. Os pixels escuros ali
   sao fundo; os claros sao glifo. Essa mascara e aplicada ao quadro
   COM a cena, e o que se mede e a luminancia do fundo — a dos
   glifos nao entra na conta.

   Usa-se o percentil 95 do fundo, nao o maximo: um pixel solitario de
   antialias nao deve condenar um bloco inteiro.

Limiares: 4,5:1 para texto normal e 3,0:1 para texto grande, que sao
os da WCAG 2.1 AA.
"""
import json
import os
import re
import sys

from PIL import Image, ImageChops


def luminancia(r, g, b):
    """Luminancia relativa da WCAG, de 0 a 1."""
    def canal(v):
        v = v / 255.0
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)


def cor_css(txt):
    m = re.findall(r'[\d.]+', txt or '')
    if len(m) >= 3:
        return (float(m[0]), float(m[1]), float(m[2]))
    return (244, 241, 236)          # off-white da marca, como padrao


def contraste(l1, l2):
    a, b = max(l1, l2), min(l1, l2)
    return (a + 0.05) / (b + 0.05)


def avaliar(com, sem, r, cor, grande):
    caixa = (max(0, int(r['left'])), max(0, int(r['top'])),
             min(com.width, int(r['right']) + 1),
             min(com.height, int(r['bottom']) + 1))
    if caixa[2] <= caixa[0] or caixa[3] <= caixa[1]:
        return None

    A = com.crop(caixa).convert('RGB')
    B = sem.crop(caixa).convert('RGB')
    pa = list(A.getdata())
    pb = list(B.getdata())
    total = len(pa)
    if not total:
        return None

    lt = luminancia(*cor_css(cor))

    mudou = 0
    fundo = []
    for i in range(total):
        xa, xb = pa[i], pb[i]
        if abs(xa[0] - xb[0]) + abs(xa[1] - xb[1]) + abs(xa[2] - xb[2]) > 24:
            mudou += 1
        # mascara de fundo: escuro no quadro SEM a cena = nao e glifo
        if luminancia(*xb) < 0.20:
            fundo.append(luminancia(*xa))

    if fundo:
        fundo.sort()
        pior = fundo[min(len(fundo) - 1, int(len(fundo) * 0.95))]
        razao = contraste(lt, pior)
    else:
        razao = None

    return {
        'pixelsAlterados': round(mudou / total * 100.0, 2),
        'contraste': round(razao, 2) if razao is not None else None,
        'exigido': 3.0 if grande else 4.5,
        'legivel': (razao is None) or (razao >= (3.0 if grande else 4.5)),
    }


def main():
    dados = json.load(open(sys.argv[1]))
    pares = dados['pares']

    for tela in dados['telas']:
        for a in tela.get('amostras', []):
            com_p = os.path.join(pares, a['marca'] + '-com.png')
            sem_p = os.path.join(pares, a['marca'] + '-sem.png')
            if not (os.path.exists(com_p) and os.path.exists(sem_p)):
                a['legivel'] = False
                continue
            com = Image.open(com_p)
            sem = Image.open(sem_p)
            por = []
            for b in a.get('blocos', []):
                v = avaliar(com, sem, b, b.get('cor'), b.get('grande'))
                if v:
                    v['classe'] = b['classe']
                    por.append(v)
            a['porBloco'] = por
            a['piorPixel'] = round(max([p['pixelsAlterados'] for p in por], default=0.0), 2)
            legiveis = [p['contraste'] for p in por if p['contraste'] is not None]
            a['piorContraste'] = round(min(legiveis), 2) if legiveis else None
            a['legivel'] = all(p['legivel'] for p in por)
            del a['blocos']

    print(json.dumps(dados, indent=1, ensure_ascii=False))


if __name__ == '__main__':
    main()
