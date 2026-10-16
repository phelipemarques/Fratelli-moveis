# Parada do Mano — site

Site do **Parada do Mano Restaurante e Lanchonete**, BR-277, km 594, Cascavel/PR.

> **Status: prévia de aprovação.** Layout, animações, cardápio, contato e vídeo funcionando,
> com as 5 fotos enviadas em 16/10 (ampliadas 2x) e a logo oficial. As fotos são marcadas como
> ilustrativas no rodapé. Os dados vieram das divulgações da casa e precisam do ok do dono.
> A página está com `noindex` e o `robots.txt` bloqueia buscadores.
> Ver [`PENDENCIAS.md`](PENDENCIAS.md) antes de publicar.

## Abrir

Sem servidor: dê dois cliques em **`parada-do-mano-visualizacao.html`** (tudo embutido num arquivo só).

Com servidor (o jeito certo de testar o site de publicação):

```bash
cd parada-do-mano
python3 -m http.server 8130
# abra http://127.0.0.1:8130
```

## Estrutura

```
index.html                     a página (HTML semântico, um único h1)
robots.txt                     bloqueia indexação enquanto for prévia
assets/css/style.css           tokens, base, componentes, seções, movimento
assets/js/main.js              menu, revelação na rolagem, cardápio, galeria (sem bibliotecas)
assets/fonts/                  Anton, Barlow, Barlow Condensed — SIL OFL 1.1 (licenças ao lado)
assets/images/                 imagens geradas pelo script (WebP em várias larguras, logo em PNG)
assets/video/                  vídeo da abertura (MP4 H.264 + WebM VP9), sem texto, em loop

tools/source/referencias/      prints e fotos enviados, sem alteração
tools/enhance-photos.py        prints do Instagram: recorta, limpa e amplia 4x (EDSR);
                               "novas": amplia 2x as fotos enviadas em 1122x1402 -> tools/source/
tools/source/                  fotos tratadas, uma por espaço do site, e a logo
tools/prepare-images.py        corta e gera as versões do site; quadro provisório se faltar foto
tools/make-film.py             gera os três vídeos a partir das fotos
tools/build-preview.py         gera parada-do-mano-visualizacao.html
tools/make-zip.py              gera parada-do-mano-site.zip (só o que vai para o ar)
tools/qa-browser.mjs           bateria de testes no Chromium (8 tamanhos de tela + interações)
tools/fonts-ttf/               cópias TTF das fontes, usadas só pelo script de imagens

parada-do-mano-visualizacao.html   prévia em arquivo único (com o vídeo embutido)
parada-do-mano-site.zip            pacote de produção
parada-do-mano-video-vertical.mp4    1080x1920 para Reels, Stories e WhatsApp
parada-do-mano-video-horizontal.mp4  1920x1080 para Facebook, YouTube e TV
QA.md                          o que foi testado, como e o que não foi
PENDENCIAS.md                  o que falta confirmar com o restaurante
```

## Trocar as fotos

O HTML já aponta para os arquivos finais. Para trocar uma foto pela versão original em alta:

1. Salve a original em `tools/source/` com o nome da foto de origem — por exemplo
   `tools/source/buffet-saladas.jpg`. A lista de nomes está no topo de `tools/prepare-images.py`
   (`SLOTS`). Uma foto pode alimentar mais de um espaço (a do arroz vira a abertura e o mosaico).
2. Rode `python3 tools/prepare-images.py` (precisa de Pillow: `pip install pillow`).
3. Se o corte não ficou bom, ajuste o ponto de foco em `FOCO`, no mesmo script.
4. Revise o texto alternativo (`alt`) da imagem no `index.html` para descrever a foto de verdade.
5. Gere de novo a prévia e o ZIP: `python3 tools/build-preview.py && python3 tools/make-zip.py`.

A foto do arroz também vira a imagem de compartilhamento (`og-cover.jpg`, com a logo e o nome).

Para tratar novas capturas de tela do Instagram, acrescente o recorte em `RECORTES`
no `tools/enhance-photos.py` e rode o script (precisa de `opencv-contrib-python-headless`
e do modelo EDSR, ~38 MB, cujo endereço está no topo do arquivo; sem ele, amplia com Lanczos).

## Vídeos

```bash
python3 tools/make-film.py                # os três
python3 tools/make-film.py vertical       # só um
```

Os roteiros (ordem das fotos, tempo de cada cena, textos) ficam em `roteiro_com_texto()`
e `roteiro_abertura()`. Depois de mudar o MP4 da abertura, gere o WebM:

```bash
ffmpeg -i assets/video/parada-do-mano-abertura.mp4 -c:v libvpx-vp9 -b:v 0 -crf 44 -an assets/video/parada-do-mano-abertura.webm
```

O vídeo da abertura só é carregado no computador (largura de 960 px ou mais), sem
"movimento reduzido" e sem economia de dados; no celular fica a foto.

## Atualizar o cardápio

Cada categoria é um `<section class="menu-panel">` no `index.html`. Para listar pratos,
copie o modelo que está no comentário logo acima da seção do cardápio para dentro do
`<ul class="menu-items">` da categoria. Assim que a lista tiver um item, o aviso
"sob consulta" daquela categoria some sozinho. **Preço só depois de confirmado.**

O preço do espeto corrido tem um lugar reservado, comentado, dentro do bloco `#espeto`.

## Logo

A logo oficial foi recortada do avatar do Instagram (150 px de origem, ampliada).
Quando chegar o arquivo vetorial ou um PNG grande com fundo transparente, salve como
`tools/source/logo.png` e rode `tools/prepare-images.py`: saem `logo-48/96/192/512.png`
para cabeçalho, rodapé, ícone da aba e imagem de compartilhamento.

## Publicar

Só com autorização do restaurante. Antes:

1. Resolver os itens 🔴 de `PENDENCIAS.md`.
2. No `index.html`, trocar `noindex, nofollow` por `index, follow` e completar
   `og:image` com a URL absoluta do domínio.
3. No `robots.txt`, liberar a indexação.
4. Gerar o pacote (`python3 tools/make-zip.py`) e enviar o conteúdo da pasta
   `parada-do-mano/` do ZIP para qualquer hospedagem estática.

## Testar

```bash
python3 -m http.server 8130 --bind 127.0.0.1 &
NODE_PATH=$(npm root -g) node tools/qa-browser.mjs capturas/
```

Precisa do Playwright com Chromium. Resultado detalhado da última rodada em `QA.md`.
