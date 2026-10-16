#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parada do Mano — prepara o site para um domínio real.

Compartilhamento (WhatsApp, Facebook) e buscadores exigem endereços absolutos:
canonical, og:url, og:image, twitter:image e a imagem dos dados estruturados. Este script grava
essas URLs no index.html e gera o sitemap.xml para o domínio informado.

    python3 tools/set-domain.py https://paradadomano.com.br
        -> URLs absolutas; a página CONTINUA sem indexação (prévia)

    python3 tools/set-domain.py https://paradadomano.com.br --publicar
        -> além disso libera a indexação: meta robots, robots.txt e o
           cabeçalho X-Robots-Tag do vercel.json. Só com autorização do restaurante.

Pode rodar de novo com outro domínio: os valores anteriores são substituídos.
"""
import json
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    publicar = '--publicar' in sys.argv
    if not args or not re.match(r'^https://[\w.-]+(:\d+)?$', args[0].rstrip('/')):
        sys.exit('uso: python3 tools/set-domain.py https://dominio.com.br [--publicar]')
    dom = args[0].rstrip('/')

    p = os.path.join(RAIZ, 'index.html')
    html = open(p, encoding='utf-8').read()

    # remove o que uma execução anterior tenha posto (funciona com o HTML do projeto,
    # indentado, e com o do pacote, minificado)
    html = re.sub(r'\n[ \t]*<link rel="canonical" href="[^"]*">', '', html)
    html = re.sub(r'\n[ \t]*<meta property="og:url" content="[^"]*">', '', html)
    html = re.sub(r'\n[ \t]*<meta name="twitter:image" content="[^"]*">', '', html)
    html = re.sub(r'<meta property="og:image" content="[^"]*">',
                  '<meta property="og:image" content="%s/assets/images/og-cover.jpg">' % dom, html)
    html, n1 = re.subn(r'(\n[ \t]*)(<meta property="og:type" content="restaurant">)',
                       lambda m: '%s<link rel="canonical" href="%s/">%s<meta property="og:url" content="%s/">%s%s'
                       % (m.group(1), dom, m.group(1), dom, m.group(1), m.group(2)), html, count=1)
    html, n2 = re.subn(r'(\n[ \t]*)(<meta name="twitter:card" content="summary_large_image">)',
                       lambda m: '%s%s%s<meta name="twitter:image" content="%s/assets/images/og-cover.jpg">'
                       % (m.group(1), m.group(2), m.group(1), dom), html, count=1)
    if not (n1 and n2):
        sys.exit('ERRO: não achei og:type ou twitter:card no index.html')

    # dados estruturados: url, imagem e cardápio absolutos
    def ld(m):
        dados = json.loads(m.group(2))
        dados['url'] = dom + '/'
        dados['image'] = dom + '/assets/images/og-cover.jpg'
        dados['hasMenu'] = dom + '/#cardapio'
        corpo = json.dumps(dados, ensure_ascii=False, indent=2).replace('\n', '\n  ')
        return m.group(1) + '\n  ' + corpo + '\n  ' + m.group(3)
    html = re.sub(r'(<script type="application/ld\+json">)\s*(\{.*?\})\s*(</script>)', ld, html, flags=re.S)

    if publicar:
        html = html.replace('<meta name="robots" content="noindex, nofollow">',
                            '<meta name="robots" content="index, follow">')
    open(p, 'w', encoding='utf-8').write(html)

    with open(os.path.join(RAIZ, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n'
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                '  <url><loc>%s/</loc></url>\n</urlset>\n' % dom)

    if publicar:
        with open(os.path.join(RAIZ, 'robots.txt'), 'w', encoding='utf-8') as f:
            f.write('User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n' % dom)
        v = os.path.join(RAIZ, 'vercel.json')
        conf = json.load(open(v, encoding='utf-8'))
        for regra in conf.get('headers', []):
            regra['headers'] = [h for h in regra['headers'] if h['key'] != 'X-Robots-Tag']
        json.dump(conf, open(v, 'w', encoding='utf-8'), indent=2)

    print('domínio %s gravado (canonical, og:url, og:image, twitter:image, JSON-LD, sitemap.xml)' % dom)
    print('indexação LIBERADA' if publicar else 'indexação continua bloqueada (prévia)')


if __name__ == '__main__':
    main()
