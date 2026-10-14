#!/usr/bin/env python3
"""
Monta o pacote de PRODUÇÃO em dist/, a partir do index.html de desenvolvimento.

O que muda em relação à prévia:
  - robots: "noindex, nofollow"  ->  "index, follow"
  - acrescenta <link rel="canonical"> e og:url com o domínio informado
  - og:image e twitter:image passam a usar URL absoluta
  - acrescenta "url" aos dados estruturados
  - gera robots.txt e sitemap.xml
  - remove comentários de desenvolvimento do HTML

Recusa gerar o pacote enquanto houver pendência visível na página
(ex.: "[nº e seccional a confirmar]"). O domínio nunca é inventado: precisa
ser informado na linha de comando.

Uso:   python3 tools/build-production.py https://www.dominio-definitivo.com.br
Saída: dist/  (index.html, 404.html, assets/, _headers com CSP, robots.txt, sitemap.xml)
"""
import base64
import datetime
import hashlib
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")
PENDENCIAS = re.compile(r"\[[^\]]*(a confirmar|a enviar)[^\]]*\]", re.I)


def main():
    if len(sys.argv) != 2 or not re.match(r"^https://[a-z0-9.-]+\.[a-z]{2,}/?$", sys.argv[1], re.I):
        sys.exit("informe o domínio definitivo, com https://  (ex.: https://www.exemplo.com.br)")
    base = sys.argv[1].rstrip("/") + "/"

    with open(os.path.join(ROOT, "index.html")) as f:
        html = f.read()

    sem_comentarios = re.sub(r"<!--.*?-->", "", html, flags=re.S)
    achados = sorted(set(m.group(0) for m in PENDENCIAS.finditer(sem_comentarios)))
    if achados:
        sys.exit("há pendências visíveis na página — resolva antes de publicar:\n  " + "\n  ".join(achados))

    html = sem_comentarios
    trocas = [
        ('<meta name="robots" content="noindex, nofollow">',
         '<meta name="robots" content="index, follow">\n  <link rel="canonical" href="%s">' % base),
        ('<meta property="og:type" content="website">',
         '<meta property="og:type" content="website">\n  <meta property="og:url" content="%s">' % base),
        ('<meta property="og:image" content="assets/images/og-cover.jpg">',
         '<meta property="og:image" content="%sassets/images/og-cover.jpg">' % base),
        ('<meta name="twitter:image" content="assets/images/og-cover.jpg">',
         '<meta name="twitter:image" content="%sassets/images/og-cover.jpg">' % base),
        ('"name": "Vitor Queiroz Cosechen",',
         '"name": "Vitor Queiroz Cosechen",\n    "url": "%s",' % base),
    ]
    for antes, depois in trocas:
        if antes not in html:
            sys.exit("não encontrei no index.html: %s" % antes)
        html = html.replace(antes, depois)
    html = re.sub(r"\n\s*\n\s*\n", "\n\n", html)

    if os.path.exists(DIST):
        shutil.rmtree(DIST)
    os.makedirs(DIST)
    with open(os.path.join(DIST, "index.html"), "w") as f:
        f.write(html)
    shutil.copytree(os.path.join(ROOT, "assets"), os.path.join(DIST, "assets"))
    shutil.copy(os.path.join(ROOT, "404.html"), DIST)

    # Política de segurança (CSP): só recursos do próprio domínio. O único script
    # inline executável (o do <head>) entra pelo hash; o JSON-LD não é executado.
    inline = [m.group(1) for m in re.finditer(r"<script>(.*?)</script>", html, flags=re.S)]
    hashes = " ".join("'sha256-%s'" % base64.b64encode(hashlib.sha256(x.encode("utf-8")).digest()).decode() for x in inline)
    csp = ("default-src 'self'; script-src 'self' %s; style-src 'self'; img-src 'self' data:; "
           "font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'self'; "
           "form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests") % hashes
    with open(os.path.join(ROOT, "_headers")) as f:
        headers = f.read()
    headers = headers.replace("/*\n", "/*\n  Content-Security-Policy: %s\n" % csp, 1)
    with open(os.path.join(DIST, "_headers"), "w") as f:
        f.write(headers)

    with open(os.path.join(DIST, "robots.txt"), "w") as f:
        f.write("User-agent: *\nAllow: /\n\nSitemap: %ssitemap.xml\n" % base)
    hoje = datetime.date.today().isoformat()
    with open(os.path.join(DIST, "sitemap.xml"), "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n'
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                '  <url><loc>%s</loc><lastmod>%s</lastmod></url>\n'
                '</urlset>\n' % (base, hoje))

    total = sum(len(fs) for _, _, fs in os.walk(DIST))
    print("dist/ pronto para %s — %d arquivos" % (base, total))


if __name__ == "__main__":
    main()
