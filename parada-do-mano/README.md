# Parada do Mano — site (V3)

Site do **Parada do Mano Restaurante e Lanchonete**, BR-277, km 594, Cascavel/PR.

> **Status: prévia de aprovação. Não publicado.** A página tem `noindex, nofollow`, o
> `robots.txt` bloqueia buscadores e o `vercel.json` manda o cabeçalho `X-Robots-Tag: noindex`.
> As fotos são as enviadas pelo restaurante, ampliadas, e o rodapé as marca como ilustrativas.
> Antes de publicar, ver [`PENDENCIAS.md`](PENDENCIAS.md). O que mudou da V2 para a V3, e como
> foi medido, está em [`RELATORIO-V3.md`](RELATORIO-V3.md).

## Abrir

**Sem servidor:** dois cliques em `parada-do-mano-v3-visualizacao.html`. É um arquivo só,
com CSS, JavaScript, fontes, fotos e o vídeo da abertura dentro. Serve para mostrar e aprovar.

**Com servidor** (o jeito certo de testar o site que vai para o ar):

```bash
cd parada-do-mano
node tools/servidor.mjs . 8130        # gzip e cache como numa hospedagem
# ou: python3 -m http.server 8130
# abrir http://127.0.0.1:8130
```

## O que vai para o ar

`python3 tools/make-zip.py` gera `parada-do-mano-v3-producao.zip`, com a pasta
`parada-do-mano-v3/` pronta para qualquer hospedagem estática:

```
parada-do-mano-v3/
  index.html                 a página (HTML semântico, um único h1)
  robots.txt                 bloqueia indexação enquanto for prévia
  vercel.json                cache por tipo de arquivo + X-Robots-Tag noindex
  sitemap.xml                só depois de rodar tools/set-domain.py
  assets/css/style.css       tokens (cores, espaços, movimento), seções, animações
  assets/js/main.js          menu, revelação, abas do cardápio, galeria, vídeo — sem bibliotecas
  assets/images/             WebP + AVIF em várias larguras, logo, og-cover.jpg
  assets/videos/             abertura em MP4 (H.264) e WebM (VP9), sem som, sem texto
  assets/fonts/              Anton, Barlow, Barlow Condensed (SIL OFL 1.1, licenças ao lado)
```

No ZIP, o HTML e o CSS vão sem comentários e sem indentação; no projeto ficam legíveis.

## Estrutura do projeto

```
index.html, robots.txt, vercel.json, assets/   o site (ver acima)

parada-do-mano-v3-visualizacao.html   prévia em arquivo único
parada-do-mano-v3-producao.zip        pacote de produção
parada-do-mano-video-vertical.mp4     1080x1920 para Reels, Stories e WhatsApp
parada-do-mano-video-horizontal.mp4   1920x1080 para Facebook, YouTube e TV
comparacao/                           capturas V2 | V3 lado a lado (4 tamanhos de tela)
versoes/v2-visualizacao.html          a V2, guardada para comparação
RELATORIO-V3.md                       problema → solução → benefício → teste, com medições
QA.md                                 o que foi testado, como, e o que não foi
PENDENCIAS.md                         o que falta confirmar com o restaurante

tools/source/                 fotos tratadas (uma por espaço do site) e a logo
tools/source/referencias/     prints e fotos enviados, sem alteração
tools/enhance-photos.py       amplia as fotos enviadas (EDSR); "novas" = fotos de 16/10
tools/prepare-images.py       corta e gera WebP + AVIF em cada largura, a logo e o og-cover
tools/make-film.py            gera o vídeo da abertura e os dois vídeos para redes sociais
tools/build-preview.py        gera a prévia em arquivo único
tools/make-zip.py             gera o pacote de produção
tools/set-domain.py           grava o domínio (canonical, og:url, og:image, JSON-LD, sitemap)
tools/servidor.mjs            servidor local com gzip, Range e cabeçalhos de cache
tools/qa-browser.mjs          125 verificações no Chromium (Playwright), 10 tamanhos de tela
tools/medir.mjs               medição comparável entre versões + capturas
tools/fonts-ttf/              cópias TTF das fontes, usadas só pelos scripts de imagem e vídeo
```

## Editar o conteúdo

Todo o texto está no `index.html`. Depois de editar, gere de novo a prévia e o pacote:

```bash
python3 tools/build-preview.py && python3 tools/make-zip.py
```

### Cardápio

A seção `#cardapio` tem 10 abas. Cada categoria é um `<section class="menu-panel">` com:

- `.menu-facts` — horário e dias (só o que foi confirmado nas divulgações);
- `<details class="menu-seen">` (buffet e saladas) — o que aparece nas fotos da casa,
  com o aviso de que muda conforme o dia;
- `<ul class="menu-items"></ul>` — vazio de propósito;
- `.menu-pending` — "Opções e valores de hoje pelo WhatsApp" e o botão com mensagem própria.

Para listar pratos, copie para dentro do `<ul class="menu-items">` o modelo que está no
comentário logo acima da seção:

```html
<li class="menu-item">
  <span class="menu-item-name">Nome do prato</span>
  <span class="menu-item-desc">Descrição curta (opcional)</span>
  <span class="menu-item-price">R$ 00,00</span>
</li>
```

Assim que a lista tiver um item, o aviso daquela categoria some sozinho.
**Prato e preço só depois de confirmados pelo restaurante.** O valor do espeto corrido
tem um lugar reservado, comentado, dentro do bloco `#espeto`.

### Horário, telefone, endereço

Aparecem nos dados estruturados (`<script type="application/ld+json">`, no `<head>`),
na abertura, na seção `#contato`, no rodapé e nos links de WhatsApp
(`https://wa.me/5545998258916?text=...`). Procure e troque todas as ocorrências.

### Fotos

1. Salve a original em `tools/source/` com o nome do espaço — por exemplo
   `tools/source/buffet-salao.jpg`. A lista está em `SLOTS`, no topo de `tools/prepare-images.py`.
2. `python3 tools/prepare-images.py` (precisa de Pillow com AVIF: `pip install pillow`).
3. Se o corte não ficou bom, ajuste o ponto de foco em `FOCO`, no mesmo script.
4. Revise o `alt` da imagem no `index.html` para descrever a foto de verdade.

Para ampliar fotos novas pequenas: `tools/enhance-photos.py` (precisa de
`opencv-contrib-python-headless` e do modelo EDSR, ~38 MB, endereço no topo do arquivo;
o modelo fica em `tools/models/`, fora do Git).

### Logo

Recortada do avatar do Instagram (150 px de origem, ampliada). Quando chegar o arquivo
vetorial ou um PNG grande com fundo transparente, salve como `tools/source/logo.png` e rode
`tools/prepare-images.py`.

### Vídeos

```bash
python3 tools/make-film.py              # os três
python3 tools/make-film.py abertura     # só um (abertura, vertical ou horizontal)
```

Depois de gerar o MP4 da abertura, gere o WebM (usado onde o H.264 não toca e na prévia em arquivo único):

```bash
ffmpeg -i assets/videos/parada-do-mano-abertura.mp4 -c:v libvpx-vp9 -b:v 0 -crf 52 -an assets/videos/parada-do-mano-abertura.webm
```

O vídeo da abertura só é baixado no computador (960 px ou mais), depois que a página
terminou de carregar, e nunca com "movimento reduzido", economia de dados ou rede 2G/3G.
Pausa quando sai da tela ou quando a aba fica em segundo plano. No celular fica a foto.

## Testar

```bash
node tools/servidor.mjs . 8130 &
NODE_PATH=$(npm root -g) node tools/qa-browser.mjs capturas/       # 125 verificações
NODE_PATH=$(npm root -g) node tools/medir.mjs http://127.0.0.1:8130/ v3 medidas/
```

Precisa do Playwright com Chromium. Para testar outro endereço (o pacote descompactado,
por exemplo): `QA_URL=http://127.0.0.1:8132/ node tools/qa-browser.mjs ...`.
Resultado da última rodada em `QA.md`.

## Publicar no Vercel (só com autorização do restaurante)

Nada foi publicado. Quando houver autorização:

1. Resolver os itens 🔴 de `PENDENCIAS.md`.
2. Gravar o domínio, mantendo a página fora dos buscadores enquanto for prévia:
   ```bash
   python3 tools/set-domain.py https://dominio-do-restaurante.com.br
   ```
   Isso põe `canonical`, `og:url`, `og:image` absolutos (HTTPS) e o JSON-LD com o endereço,
   e gera o `sitemap.xml`.
3. `python3 tools/make-zip.py` e descompactar `parada-do-mano-v3-producao.zip`.
4. No Vercel: **Add New → Project**, importar o repositório e apontar o *Root Directory*
   para `parada-do-mano` — ou, sem Git, `npx vercel` dentro da pasta `parada-do-mano-v3/`
   descompactada. Framework: **Other**; sem comando de build; diretório de saída: a própria pasta.
5. Conferir o endereço de prévia que o Vercel mostra (o `vercel.json` já manda `noindex`).
6. Ligar o domínio em **Settings → Domains**.
7. Só quando o restaurante liberar a página para o Google:
   ```bash
   python3 tools/set-domain.py https://dominio-do-restaurante.com.br --publicar
   ```
   Isso troca o `meta robots` para `index, follow`, libera o `robots.txt` (com o sitemap) e
   tira o `X-Robots-Tag` do `vercel.json`. Gerar o ZIP de novo e publicar.

Qualquer hospedagem estática serve (Netlify, Cloudflare Pages, hospedagem comum por FTP):
basta enviar o conteúdo da pasta `parada-do-mano-v3/`. Fora do Vercel, o `vercel.json` é
ignorado; configure o cache e o `X-Robots-Tag` no painel da hospedagem.
