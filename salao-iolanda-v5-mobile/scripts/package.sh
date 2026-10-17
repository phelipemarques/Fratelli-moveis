#!/bin/sh
# Gera os entregáveis da prévia na pasta de cima (raiz do repositório):
#   salao-iolanda-v4-producao.zip     conteúdo de dist/ (site estático para hospedar)
#   salao-iolanda-v4-visualizacao.html arquivo único, abre sem servidor
# Para o pacote de publicação, rode antes com SITE_URL=... PUBLICAR=1 (ver README).
set -e
cd "$(dirname "$0")/.."
npm run build
npm run build:single
rm -f ../salao-iolanda-v4-producao.zip
(cd dist && zip -qr -X ../../salao-iolanda-v4-producao.zip .)
cp dist-single/index.html ../salao-iolanda-v4-visualizacao.html
ls -la ../salao-iolanda-v4-producao.zip ../salao-iolanda-v4-visualizacao.html
