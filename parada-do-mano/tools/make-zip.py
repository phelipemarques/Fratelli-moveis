#!/usr/bin/env python3
"""
Monta parada-do-mano-v3-producao.zip: só o que o site usa em produção.

Dentro do ZIP fica a pasta parada-do-mano-v3/ com index.html, robots.txt,
vercel.json (cache e bloqueio de indexação na prévia), sitemap.xml se existir,
e assets/ (css, js, fontes, imagens WebP+AVIF e o vídeo da abertura).
Ficam de fora documentação, ferramentas, fotos originais, a prévia em arquivo
único e os vídeos para redes sociais.

    python3 tools/make-zip.py
"""
import os
import re
import zipfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'parada-do-mano-v3-producao.zip')
PASTA = 'parada-do-mano-v3'
ARQUIVOS = ['index.html', 'robots.txt', 'vercel.json', 'sitemap.xml']
PASTAS = ['assets']


def minificar_css(css):
    """Minificação conservadora: tira comentários e espaços que não mudam o sentido.
    Não mexe dentro de calc() nem em strings — só em espaços em torno de { } ; : ,"""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    css = re.sub(r'\s+', ' ', css)
    css = re.sub(r'\s*([{};,])\s*', r'\1', css)
    css = re.sub(r'([{;])\s*([\w-]+)\s*:\s*', r'\1\2:', css)
    return css.replace(';}', '}').strip()


def minificar_html(html):
    """Tira comentários e a indentação do começo das linhas. Mantém as quebras de
    linha (o espaço entre elementos de texto continua igual)."""
    html = re.sub(r'<!--(?!\[).*?-->', '', html, flags=re.S)
    html = re.sub(r'\n[ \t]+', '\n', html)
    return re.sub(r'\n{2,}', '\n', html)


def main():
    itens = [f for f in ARQUIVOS if os.path.exists(os.path.join(RAIZ, f))]
    for pasta in PASTAS:
        for dirpath, _, nomes in os.walk(os.path.join(RAIZ, pasta)):
            for n in sorted(nomes):
                if n.startswith('.'):
                    continue
                itens.append(os.path.relpath(os.path.join(dirpath, n), RAIZ))
    if os.path.exists(SAIDA):
        os.remove(SAIDA)
    with zipfile.ZipFile(SAIDA, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for rel in sorted(itens):
            if rel == 'index.html':
                html = open(os.path.join(RAIZ, rel), encoding='utf-8').read()
                z.writestr(os.path.join(PASTA, rel), minificar_html(html))
            elif rel.endswith('.css'):
                # o CSS vai minificado no pacote; o original legível fica no projeto
                css = open(os.path.join(RAIZ, rel), encoding='utf-8').read()
                z.writestr(os.path.join(PASTA, rel), minificar_css(css))
            else:
                z.write(os.path.join(RAIZ, rel), os.path.join(PASTA, rel))
    total = sum(os.path.getsize(os.path.join(RAIZ, r)) for r in itens)
    print('%s — %d arquivos, %.2f MB no ZIP (%.2f MB descompactado)' % (
        os.path.basename(SAIDA), len(itens), os.path.getsize(SAIDA) / 1e6, total / 1e6))


if __name__ == '__main__':
    main()
