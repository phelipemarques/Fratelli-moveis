#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parada do Mano — escreve no index.html o conteúdo que fica em conteudo/.

  conteudo/cardapio.json  -> abas e painéis do cardápio (entre os marcadores
                             <!-- cardapio:inicio --> e <!-- cardapio:fim -->)
  conteudo/contato.json   -> o endereço de todo link marcado com
                             data-wa="chave" (WhatsApp com mensagem pronta),
                             data-rota (Google Maps) e data-insta (Instagram)

O HTML gerado é estático: o cardápio continua aparecendo sem JavaScript e o
site não precisa de servidor nem de banco de dados.

    python3 tools/build-content.py           grava o index.html
    python3 tools/build-content.py --check   só confere (sai com erro se estiver desatualizado)
"""
import html
import json
import os
import re
import sys
from urllib.parse import quote

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGENS = os.path.join(RAIZ, 'assets', 'images')
INDEX = os.path.join(RAIZ, 'index.html')
LARGURAS = (480, 640, 800)
INICIO, FIM = '<!-- cardapio:inicio -->', '<!-- cardapio:fim -->'

e = html.escape


class Erro(Exception):
    pass


def carregar(nome):
    with open(os.path.join(RAIZ, 'conteudo', nome), encoding='utf-8') as f:
        return json.load(f)


def link_whatsapp(contato, chave):
    if chave not in contato['mensagens']:
        raise Erro('mensagem de WhatsApp "%s" não existe em conteudo/contato.json' % chave)
    return 'https://wa.me/%s?text=%s' % (contato['whatsapp'], quote(contato['mensagens'][chave], safe=''))


def tamanho(arquivo):
    from PIL import Image
    with Image.open(os.path.join(IMAGENS, arquivo)) as im:
        return im.size


def foto(img, ind, adiada=False):
    """<figure> com AVIF + WebP nas larguras que existem em assets/images.

    adiada=True (categorias fechadas): o endereço fica guardado em data-src/data-srcset e
    o JavaScript entrega quando a categoria abre. Assim o navegador não baixa, antes do
    JavaScript rodar, fotos de categorias que talvez ninguém abra. Sem JavaScript, a
    cópia dentro de <noscript> aparece no lugar."""
    base = img['foto']
    webp = [w for w in LARGURAS if os.path.exists(os.path.join(IMAGENS, '%s-%d.webp' % (base, w)))]
    if not webp:
        raise Erro('foto "%s" não encontrada em assets/images (%s-480.webp ...)' % (base, base))
    avif = [w for w in webp if os.path.exists(os.path.join(IMAGENS, '%s-%d.avif' % (base, w)))]
    lw, lh = tamanho('%s-%d.webp' % (base, webp[-1]))
    sizes = '(min-width: 768px) 40vw, 100vw'
    def srcset(ext, ws):
        return ', '.join('assets/images/%s-%d.%s %dw' % (base, w, ext, w) for w in ws)
    d = 'data-' if adiada else ''
    linhas = ['<figure class="menu-photo photo-frame">', '  <picture>']
    if avif:
        linhas.append('    <source type="image/avif" %ssrcset="%s" sizes="%s">' % (d, srcset('avif', avif), sizes))
    linhas += ['    <img %ssrc="assets/images/%s-%d.webp" %ssrcset="%s"' % (d, base, webp[0], d, srcset('webp', webp)),
               '         sizes="%s" width="%d" height="%d" loading="lazy" decoding="async"' % (sizes, lw, lh),
               '         alt="%s">' % e(img['alt']),
               '  </picture>']
    if adiada:
        linhas.append('  <noscript><img src="assets/images/%s-%d.webp" srcset="%s" sizes="%s" width="%d" height="%d" loading="lazy" decoding="async" alt="%s"></noscript>'
                      % (base, webp[0], srcset('webp', webp), sizes, lw, lh, e(img['alt'])))
    linhas.append('</figure>')
    return '\n'.join(ind + l for l in linhas)


def preco(valor):
    if valor is None:
        return ''
    if not isinstance(valor, (int, float)) or isinstance(valor, bool) or valor < 0:
        raise Erro('preço inválido: %r (use um número, como 24.9, ou null)' % (valor,))
    return 'R$ %s' % ('%.2f' % valor).replace('.', ',')


def item_html(it, ind):
    classes = 'menu-item' + (' has-img' if it.get('imagem') else '') + ('' if it.get('disponivel', True) else ' is-off')
    partes = []
    if it.get('imagem'):
        if not os.path.exists(os.path.join(IMAGENS, it['imagem'])):
            raise Erro('imagem do item "%s" não existe: assets/images/%s' % (it['nome'], it['imagem']))
        partes.append('<img class="menu-item-img" src="assets/images/%s" width="64" height="64" alt="" loading="lazy" decoding="async">' % e(it['imagem']))
    partes.append('<span class="menu-item-name">%s</span>' % e(it['nome']))
    valor = preco(it.get('preco'))
    if valor:
        partes.append('<span class="menu-item-price">%s</span>' % valor)
    if it.get('descricao'):
        partes.append('<span class="menu-item-desc">%s</span>' % e(it['descricao']))
    notas = []
    if not it.get('disponivel', True):
        notas.append('Indisponível no momento')
    for campo in ('disponibilidade', 'observacao'):
        if it.get(campo):
            notas.append(it[campo])
    if notas:
        partes.append('<span class="menu-item-note">%s</span>' % e(' · '.join(notas)))
    return '\n'.join([ind + '<li class="%s">' % classes] + [ind + '  ' + p for p in partes] + [ind + '</li>'])


def painel(cat, n, total, itens, contato, ind):
    i2 = ind + '  '
    i3 = ind + '    '
    out = ['%s<!-- %02d %s -->' % (ind, n, cat['nome']),
           '%s<section class="menu-panel%s" id="cat-%s" role="tabpanel" aria-labelledby="tab-%s" tabindex="0">'
           % (ind, '' if cat.get('imagem') else ' menu-panel-text', cat['id'], cat['id'])]
    if cat.get('imagem'):
        out.append(foto(cat['imagem'], i2, adiada=n > 1))
    else:
        out.append('%s<div class="menu-mark" aria-hidden="true"><span>%s</span></div>' % (i2, e(cat.get('marca') or cat['nome'])))
    out.append('%s<div class="menu-body">' % i2)
    # linha de etiquetas: o que a casa divulgou + onde consultar valores
    meta = ''.join('<li>%s</li>' % e(f) for f in cat.get('fatos', []))
    out.append('%s<div class="menu-meta">' % i3)
    if meta:
        out.append('%s  <ul class="menu-facts" aria-label="Divulgado pela casa">%s</ul>' % (i3, meta))
    com_preco = any(it.get('preco') is not None for it in itens)
    consulta = 'Valores podem mudar: confirme pelo WhatsApp' if com_preco else cat['consulta']
    out.append('%s  <p class="menu-ask">%s</p>' % (i3, e(consulta)))
    out.append('%s</div>' % i3)
    out.append('%s<h3 class="menu-title">%s</h3>' % (i3, e(cat['nome'])))
    out.append('%s<p class="menu-desc">%s</p>' % (i3, e(cat['descricao'])))
    visto = cat.get('visto')
    if visto:
        out += ['%s<details class="menu-seen">' % i3,
                '%s  <summary><span>%s</span> <span class="menu-seen-count">%d itens</span></summary>' % (i3, e(visto['titulo']), len(visto['itens'])),
                '%s  <ul class="menu-tags">%s</ul>' % (i3, ''.join('<li>%s</li>' % e(t) for t in visto['itens'])),
                '%s  <p class="menu-seen-note">%s</p>' % (i3, e(visto['nota'])),
                '%s</details>' % i3]
    if itens:
        out.append('%s<ul class="menu-items">' % i3)
        out += [item_html(it, i3 + '  ') for it in itens]
        out.append('%s</ul>' % i3)
    out.append('%s<a class="btn btn-dark menu-cta" data-wa="%s" href="%s" target="_blank" rel="noopener">'
               '<svg class="icon" aria-hidden="true"><use href="#i-chat"/></svg><span>%s</span></a>'
               % (i3, e(cat['whatsapp']), e(link_whatsapp(contato, cat['whatsapp'])), e(cat['botao'])))
    out.append('%s</div>' % i2)
    out.append('%s</section>' % ind)
    return '\n'.join(out)


def cardapio_html(cardapio, contato):
    cats = cardapio['categorias']
    ids = [c['id'] for c in cats]
    if len(set(ids)) != len(ids):
        raise Erro('há categorias com o mesmo id')
    for c in cats:
        for campo in ('id', 'nome', 'descricao', 'consulta', 'botao', 'whatsapp'):
            if not c.get(campo):
                raise Erro('categoria "%s": falta o campo "%s"' % (c.get('id', '?'), campo))
        if not re.match(r'^[a-z0-9-]+$', c['id']):
            raise Erro('id "%s": use só letras minúsculas, números e hífen' % c['id'])
    itens = {i: [] for i in ids}
    for it in cardapio.get('itens', []):
        if not it.get('nome'):
            raise Erro('item sem nome: %r' % it)
        if it.get('categoria') not in itens:
            raise Erro('item "%s": categoria "%s" não existe (use um destes: %s)' % (it['nome'], it.get('categoria'), ', '.join(ids)))
        itens[it['categoria']].append(it)

    ind = ' ' * 10
    abas = ['%s<div class="menu-tabs-wrap" data-tabs-wrap>' % ind,
            '%s  <div class="menu-tabs" role="tablist" aria-label="Categorias do cardápio" data-tablist hidden>' % ind]
    for k, c in enumerate(cats):
        abas.append('%s    <button class="menu-tab" type="button" role="tab" id="tab-%s" aria-controls="cat-%s" aria-selected="%s"%s>%s</button>'
                    % (ind, c['id'], c['id'], 'true' if k == 0 else 'false', '' if k == 0 else ' tabindex="-1"', e(c['nome'])))
    abas += ['%s  </div>' % ind, '%s</div>' % ind, '']
    paineis = ['%s<div class="menu-panels" data-panels>' % ind]
    paineis.append('\n\n'.join(painel(c, k + 1, len(cats), itens[c['id']], contato, ind + '  ') for k, c in enumerate(cats)))
    paineis.append('%s</div>' % ind)
    return '\n'.join(abas + paineis), len(cats), sum(len(v) for v in itens.values())


def links(html_doc, contato):
    """Atualiza o href de todo <a> com data-wa, data-rota ou data-insta."""
    usados = set()

    def tag(m):
        t = m.group(0)
        wa = re.search(r'\sdata-wa="([^"]+)"', t)
        if wa:
            usados.add(wa.group(1))
            novo = link_whatsapp(contato, wa.group(1))
        elif re.search(r'\sdata-rota\b', t):
            novo = contato['rota']
        elif re.search(r'\sdata-insta\b', t):
            novo = contato['instagram']
        else:
            return t
        if not re.search(r'\shref="[^"]*"', t):
            raise Erro('link sem href: %s' % t[:80])
        return re.sub(r'(\shref=")[^"]*(")', lambda h: h.group(1) + e(novo) + h.group(2), t, count=1)

    novo = re.sub(r'<a\b[^>]*>', tag, html_doc)
    return novo, usados


def gerar():
    cardapio, contato = carregar('cardapio.json'), carregar('contato.json')
    atual = open(INDEX, encoding='utf-8').read()
    if atual.count(INICIO) != 1 or atual.count(FIM) != 1:
        raise Erro('marcadores %s / %s não encontrados (uma vez cada) no index.html' % (INICIO, FIM))
    bloco, ncat, nitens = cardapio_html(cardapio, contato)
    a, b = atual.index(INICIO) + len(INICIO), atual.index(FIM)
    novo = atual[:a] + '\n' + bloco + '\n          ' + atual[b:]
    novo, usados = links(novo, contato)
    sem_link = [m for m in contato['mensagens'] if m not in usados]
    return atual, novo, ncat, nitens, len(usados), sem_link


def main():
    try:
        atual, novo, ncat, nitens, nmsg, sem_link = gerar()
    except Erro as err:
        sys.exit('ERRO: %s' % err)
    if '--check' in sys.argv:
        if atual != novo:
            sys.exit('index.html desatualizado em relação a conteudo/: rode python3 tools/build-content.py')
        print('index.html em dia com conteudo/ (%d categorias, %d itens)' % (ncat, nitens))
        return
    if atual != novo:
        with open(INDEX, 'w', encoding='utf-8') as f:
            f.write(novo)
    print('%s — %d categorias, %d itens, %d mensagens de WhatsApp em uso' % (
        'index.html atualizado' if atual != novo else 'index.html já estava em dia', ncat, nitens, nmsg))
    if sem_link:
        print('mensagens sem nenhum link no site (não é erro):', ', '.join(sem_link))


if __name__ == '__main__':
    main()
