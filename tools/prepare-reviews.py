#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fratelli Moveis — secao de avaliacoes.

Le as capturas de tela das avaliacoes em tools/source/, trata a margem
externa, gera as versoes responsivas em assets/images/ e escreve a secao
inteira dentro do index.html, entre SOBRE e CONTATO.

O conteudo das avaliacoes nao passa por aqui: a imagem entra como veio.
O unico corte permitido e o da moldura externa lisa da captura, e ele
para no primeiro pixel que nao for fundo.

    python3 tools/prepare-reviews.py

Roda de novo sem problema: a secao anterior e substituida por inteiro.
"""

import os
import re
import sys

import cv2
import numpy as np

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTE = os.path.join(RAIZ, 'tools', 'source')
DESTINO = os.path.join(RAIZ, 'assets', 'images')
INDEX = os.path.join(RAIZ, 'index.html')

LARGURAS = [1080, 720, 480]
Q_WEBP = 92
Q_JPEG = 92

# A margem externa nunca perde mais que isto de cada lado. E uma trava:
# se a captura tiver pouca margem, o corte simplesmente nao acontece.
TETO_CORTE = 0.10


# ---------------------------------------------------------------------
# As avaliacoes, na ordem em que foram enviadas.
#
# `alt` descreve a captura para quem usa leitor de tela e repete o texto
# da avaliacao palavra por palavra — inclusive os emojis. Nao e resumo
# nem reescrita: e a mesma frase que esta na imagem, disponivel para quem
# nao enxerga a imagem.
#
# `arquivo` e o nome esperado dentro de tools/source/ (qualquer extensao).
# ---------------------------------------------------------------------
AVALIACOES = [
    {
        'arquivo': 'avaliacao-1',
        'slug': 'joseane',
        'nome': 'Joseane Terraplanagem 2019',
        'alt': (
            'Avaliação de Joseane Terraplanagem 2019, cinco estrelas, há três anos: '
            '\u201cMinha experiência a melhor os móveis super modernos acabamento impecável , '
            'atendimento top entrega na data prevista .sem contar a qualidade dos matérias '
            'dou nota mil super recomendo\u201d. '
            'Aspectos positivos: Receptividade, Pontualidade, Qualidade, Profissionalismo e Valor. '
            'Serviços: Mobiliário para banheiro, Mobiliário para dormitório, Móveis para quartos '
            'infantis, Mobiliário para cozinha, Móveis de sala de estar e Móveis sob medida.'
        ),
    },
    {
        'arquivo': 'avaliacao-2',
        'slug': 'wagner',
        'nome': 'Wagner Santos',
        'alt': (
            'Avaliação de Wagner Santos, cinco estrelas, há três anos: '
            '\u201cMóveis muito bom, atendimento excelente, acabamentos impecável \U0001F917 '
            'Super recomendo móveis de qualidade \U0001F91D\u201d.'
        ),
    },
    {
        'arquivo': 'avaliacao-3',
        'slug': 'maicon',
        'nome': 'Maicon Costa',
        'alt': (
            'Avaliação de Maicon Costa, cinco estrelas, há três anos: '
            '\u201cFui muito bem atendido pela Suelen, minha cozinha ficou perfeita, '
            'indico de olhos fechados!\u201d Aspectos positivos: Qualidade.'
        ),
    },
    {
        'arquivo': 'avaliacao-4',
        'slug': 'paula',
        'nome': 'Paula Susana',
        'alt': (
            'Avaliação de Paula Susana, cinco estrelas, há três anos: '
            '\u201cÓtimo atendimento, móveis de alta qualidade, entrega no prazo.\u201d'
        ),
    },
    {
        'arquivo': 'avaliacao-5',
        'slug': 'rafael',
        'nome': 'Rafael Livinali',
        'alt': (
            'Avaliação de Rafael Livinali, cinco estrelas, há três anos: '
            '\u201cTOP NOTA 10 O PESSOAL, FIZ TODA MINHA CASA COM ELES FICOU MUITO LINDO\u201d.'
        ),
    },
    # A sexta avaliação entra aqui, no mesmo formato, assim que chegar.
]


def achar(base):
    """Aceita a captura em qualquer extensao comum."""
    for ext in ('.png', '.jpg', '.jpeg', '.webp'):
        caminho = os.path.join(FONTE, base + ext)
        if os.path.exists(caminho):
            return caminho
    return None


def cortar_margem(img):
    """
    Remove a moldura externa lisa da captura.

    Anda de fora para dentro enquanto a linha (ou coluna) inteira for
    igual a cor do canto. Para no primeiro pixel diferente — que e o
    primeiro pixel de conteudo. Nunca ultrapassa TETO_CORTE de cada lado.
    """
    h, w = img.shape[:2]
    fundo = img[0, 0].astype(np.int16)

    def lisa(faixa):
        return np.abs(faixa.astype(np.int16) - fundo).max() <= 6

    topo, base, esq, dir_ = 0, h, 0, w
    lim_v, lim_h = int(h * TETO_CORTE), int(w * TETO_CORTE)

    while topo < lim_v and lisa(img[topo]):
        topo += 1
    while base > h - lim_v and lisa(img[base - 1]):
        base -= 1
    while esq < lim_h and lisa(img[:, esq]):
        esq += 1
    while dir_ > w - lim_h and lisa(img[:, dir_ - 1]):
        dir_ -= 1

    # O corte lateral e simetrico: o lado que cede menos manda nos dois.
    # Sem isto, uma captura com o menu de tres pontos na direita perderia
    # mais de um lado que do outro e o cartao ficaria fora de esquadro.
    lado = min(esq, w - dir_)
    esq, dir_ = lado, w - lado

    # Uma folga de respiro: a captura nao encosta o texto na borda do corte.
    folga = max(2, int(w * 0.006))
    topo = max(0, topo - folga)
    esq = max(0, esq - folga)
    base = min(h, base + folga)
    dir_ = min(w, dir_ + folga)

    return img[topo:base, esq:dir_], (topo, h - base, esq, w - dir_)


def gerar(item):
    origem = achar(item['arquivo'])
    if origem is None:
        return None

    img = cv2.imread(origem, cv2.IMREAD_COLOR)
    if img is None:
        raise SystemExit('nao consegui abrir ' + origem)

    img, corte = cortar_margem(img)
    h0, w0 = img.shape[:2]

    # Nunca ampliar: uma captura pequena ficaria borrada.
    larguras = [l for l in LARGURAS if l <= w0] or [w0]
    if larguras[0] != w0 and w0 < LARGURAS[0]:
        larguras = [w0] + [l for l in larguras if l < w0]

    saidas = []
    for larg in larguras:
        escala = larg / float(w0)
        alt = int(round(h0 * escala))
        interp = cv2.INTER_AREA if escala < 1 else cv2.INTER_CUBIC
        red = cv2.resize(img, (larg, alt), interpolation=interp) if escala != 1 else img.copy()

        nome = 'avaliacao-%s-%d' % (item['slug'], larg)
        cv2.imwrite(os.path.join(DESTINO, nome + '.webp'), red,
                    [cv2.IMWRITE_WEBP_QUALITY, Q_WEBP])
        saidas.append((larg, alt, nome))

    # Um unico JPEG, na maior largura, para quem nao tem WebP.
    maior = saidas[0]
    cv2.imwrite(os.path.join(DESTINO, maior[2] + '.jpg'), 
                cv2.resize(img, (maior[0], maior[1]), interpolation=cv2.INTER_AREA)
                if maior[0] != w0 else img,
                [cv2.IMWRITE_JPEG_QUALITY, Q_JPEG, cv2.IMWRITE_JPEG_PROGRESSIVE, 1])

    return {
        'item': item,
        'saidas': saidas,
        'largura': maior[0],
        'altura': maior[1],
        'corte': corte,
        'origem': (w0 + corte[2] + corte[3], h0 + corte[0] + corte[1]),
    }


def equilibrar(cartoes):
    """
    Reparte os cartoes entre duas colunas pela altura relativa de cada um,
    preservando a ordem de leitura dentro de cada coluna. A cada passo o
    proximo cartao vai para a coluna mais curta — o que evita o vao que um
    grid fixo de 2 x 3 deixaria embaixo da coluna mais leve.
    """
    # Cada cartao carrega, alem da imagem, o proprio preenchimento, a borda
    # e o espaco ate o cartao seguinte. Ignorar isso faz a coluna com mais
    # cartoes terminar bem mais embaixo, mesmo com as imagens equilibradas.
    # O valor e a soma disso dividida pela largura tipica de uma coluna.
    SOBRECARGA = 0.10

    colunas = [[], []]
    somas = [0.0, 0.0]
    for c in cartoes:
        peso = c['altura'] / float(c['largura']) + SOBRECARGA
        i = 0 if somas[0] <= somas[1] else 1
        colunas[i].append(c)
        somas[i] += peso
    return colunas, somas


ESTRELA = ('<svg viewBox="0 0 24 24" role="presentation" focusable="false">'
           '<path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 '
           '6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95z"/></svg>')


def markup_cartao(c):
    item = c['item']
    srcset = ', '.join('assets/images/%s.webp %dw' % (n, l) for l, a, n in c['saidas'])
    maior = c['saidas'][0][2]
    return (
        '          <li class="review" data-reveal>\n'
        '            <figure class="review__card">\n'
        '              <picture>\n'
        '                <source type="image/webp" srcset="%s"\n'
        '                        sizes="(min-width: 1320px) 560px, (min-width: 768px) 44vw, 91vw">\n'
        '                <img class="review__shot" src="assets/images/%s.jpg"\n'
        '                     width="%d" height="%d" loading="lazy" decoding="async"\n'
        '                     alt="%s">\n'
        '              </picture>\n'
        '            </figure>\n'
        '          </li>\n'
    ) % (srcset, maior, c['largura'], c['altura'],
         item['alt'].replace('"', '&quot;'))


def markup(colunas):
    estrelas = ''.join(ESTRELA for _ in range(5))
    partes = []
    partes.append(
        '  <!-- ========================= AVALIAÇÕES ========================= -->\n'
        '  <!-- As avaliações são capturas de tela reais, exibidas como imagem.\n'
        '       Nenhum texto foi reescrito, resumido ou criado. O texto de cada\n'
        '       uma está repetido no atributo alt, palavra por palavra, para\n'
        '       leitores de tela. Gerado por tools/prepare-reviews.py. -->\n'
        '  <section class="reviews" id="avaliacoes" aria-labelledby="avaliacoes-titulo">\n'
        '    <div class="shell">\n'
        '      <div class="section-head">\n'
        '        <p class="eyebrow" data-reveal>Avaliações</p>\n'
        '        <h2 class="section-head__title" id="avaliacoes-titulo" data-split>A confiança de quem já escolheu a Fratelli.</h2>\n'
        '        <p class="reviews__score" data-reveal>\n'
        '          <span class="reviews__stars" aria-hidden="true">' + estrelas + '</span>\n'
        '          <span><b>5,0</b> de 5 na avaliação dos clientes.</span>\n'
        '        </p>\n'
        '      </div>\n'
        '      <div class="reviews__cols">\n'
    )
    for coluna in colunas:
        partes.append('        <ul class="reviews__col">\n')
        for c in coluna:
            partes.append(markup_cartao(c))
        partes.append('        </ul>\n')
    partes.append(
        '      </div>\n'
        '    </div>\n'
        '  </section>\n\n'
    )
    return ''.join(partes)


ABRE = '  <!-- ========================= AVALIAÇÕES ========================= -->'
MARCA_CONTATO = '  <!-- =========================== CONTATO =========================== -->'


def escrever(secao):
    html = open(INDEX, encoding='utf-8').read()

    # Se a secao ja existe, sai por inteiro antes de entrar de novo.
    i = html.find(ABRE)
    if i != -1:
        j = html.find(MARCA_CONTATO, i)
        if j == -1:
            raise SystemExit('secao antiga encontrada sem o marcador de contato depois dela')
        html = html[:i] + html[j:]

    if html.count(MARCA_CONTATO) != 1:
        raise SystemExit('esperava exatamente um marcador de CONTATO')

    open(INDEX, 'w', encoding='utf-8').write(html.replace(MARCA_CONTATO, secao + MARCA_CONTATO))


def main():
    if not os.path.isdir(DESTINO):
        raise SystemExit('nao achei assets/images')

    cartoes = []
    faltando = []
    for item in AVALIACOES:
        c = gerar(item)
        if c is None:
            faltando.append(item['arquivo'])
        else:
            cartoes.append(c)

    if not cartoes:
        raise SystemExit('nenhuma captura encontrada em tools/source/')

    colunas, somas = equilibrar(cartoes)
    escrever(markup(colunas))

    print('%d avaliacoes na secao' % len(cartoes))
    for c in cartoes:
        w0, h0 = c['origem']
        t, b, e, d = c['corte']
        corte = ('margem cortada: %dpx topo, %dpx base, %dpx esq, %dpx dir' % (t, b, e, d)
                 if (t or b or e or d) else 'sem corte')
        print('  %-26s %dx%d -> %dx%d  (%s)'
              % (c['item']['nome'], w0, h0, c['largura'], c['altura'], corte))
    print('colunas: %d e %d cartoes, alturas relativas %.2f e %.2f'
          % (len(colunas[0]), len(colunas[1]), somas[0], somas[1]))
    if faltando:
        print('AINDA FALTA: ' + ', '.join(faltando))


if __name__ == '__main__':
    main()
