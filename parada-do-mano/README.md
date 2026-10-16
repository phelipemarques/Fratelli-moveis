# Parada do Mano — site (V5)

Site do **Parada do Mano Restaurante e Lanchonete**, BR-277, km 594, Cascavel/PR.

> **Status: prévia de aprovação. Não publicado.** A página tem `noindex, nofollow`, o
> `robots.txt` bloqueia buscadores e o `vercel.json` manda o cabeçalho `X-Robots-Tag: noindex`.
> As fotos são as enviadas pelo restaurante, ampliadas, e o rodapé as marca como ilustrativas.
> Antes de publicar, ver [`PENDENCIAS.md`](PENDENCIAS.md). As animações cinematográficas da V5, a
> comparação com a V4 e os testes estão em [`RELATORIO-V5.md`](RELATORIO-V5.md).

## Abrir

**Sem servidor:** dois cliques em `parada-do-mano-v5-visualizacao.html`. É um arquivo só,
com CSS, JavaScript, fontes, fotos e o vídeo da abertura dentro (por isso pesa 6,8 MB).
Serve para mostrar e aprovar; não é o que vai para o ar.

**Com servidor** (o jeito certo de testar o site que vai para o ar):

```bash
cd parada-do-mano
node tools/servidor.mjs . 8130        # gzip e cache como numa hospedagem
# ou: python3 -m http.server 8130
# abrir http://127.0.0.1:8130
```

## O que vai para o ar

`python3 tools/make-zip.py` gera `parada-do-mano-v5-producao.zip`, com a pasta
`parada-do-mano-v5/` pronta para qualquer hospedagem estática:

```
parada-do-mano-v5/
  index.html                 a página (HTML semântico, um único h1)
  favicon.ico                ícone da aba (16, 32 e 48 px)
  robots.txt                 bloqueia indexação enquanto for prévia
  vercel.json                cache por tipo de arquivo + X-Robots-Tag noindex
  sitemap.xml                só depois de rodar tools/set-domain.py
  assets/css/style.css       tokens (cores, espaços, movimento), seções, animações
  assets/js/main.js          menu, revelação, abas do cardápio, galeria, vídeo — sem bibliotecas
  assets/js/cinema.js        animações cinematográficas (GSAP), carregadas sob demanda
  assets/js/vendor/          gsap.min.js e ScrollTrigger.min.js (cópias de node_modules)
  assets/images/             WebP + AVIF em várias larguras, logo, og-cover.jpg
  assets/videos/             abertura em MP4 (H.264) e WebM (VP9), sem som, sem texto
  assets/fonts/              Anton, Barlow, Barlow Condensed (SIL OFL 1.1, licenças ao lado)
```

O ZIP leva só os arquivos que a página usa (o script lista o que ficou de fora) e
para com erro se a página citar um arquivo que não existe. HTML e CSS vão sem comentários
e sem indentação; no projeto ficam legíveis.

## Estrutura do projeto

```
index.html, favicon.ico, robots.txt, vercel.json, assets/   o site (ver acima)
conteudo/cardapio.json      as 10 categorias do cardápio e os itens (nome, preço...)
conteudo/contato.json       WhatsApp, Instagram, rota e as mensagens prontas do WhatsApp

parada-do-mano-v5-visualizacao.html   prévia em arquivo único
parada-do-mano-v5-producao.zip        pacote de produção
parada-do-mano-video-vertical.mp4     1080x1920 para Reels, Stories e WhatsApp
parada-do-mano-video-horizontal.mp4   1920x1080 para Facebook, YouTube e TV
comparacao/                           capturas V4 | V5 lado a lado (4 tamanhos de tela)
versoes/                              V3 e V4 (prévias e relatórios), guardadas para comparação
RELATORIO-V5.md                       animações implementadas, comparação com a V4 e testes
QA.md                                 o que foi testado, como, e o que não foi
PENDENCIAS.md                         o que falta confirmar com o restaurante

tools/build-content.py        grava no index.html o cardápio e os links de conteudo/
tools/vendor.py               copia o GSAP de node_modules para assets/js/vendor
tools/3d/                     cena 3D preparada (não ativa) e o modelo que falta
tools/fluidez.mjs             quadros por segundo e tarefas longas durante a rolagem
tools/source/                 fotos tratadas (uma por espaço do site) e a logo
tools/source/referencias/     prints e fotos enviados, sem alteração
tools/enhance-photos.py       amplia as fotos enviadas (EDSR); "novas" = fotos de 16/10
tools/prepare-images.py       corta e gera WebP + AVIF, a logo, o favicon e o og-cover
tools/make-film.py            gera o vídeo da abertura e os dois vídeos para redes sociais
tools/build-preview.py        gera a prévia em arquivo único
tools/make-zip.py             gera o pacote de produção
tools/set-domain.py           grava o domínio (canonical, og:url, og:image, twitter:image, JSON-LD, sitemap)
tools/servidor.mjs            servidor local com gzip, Range e cabeçalhos de cache
tools/qa-browser.mjs          bateria de testes no Chromium (Playwright), 13 tamanhos de tela
tools/qa-preview.mjs          testes da prévia em arquivo único, aberta direto do disco
tools/medir.mjs               medição comparável entre versões + capturas
tools/comparar.py             monta as capturas lado a lado de duas medições
tools/inp-lab.mjs             duração das interações em laboratório (CPU 4x mais lenta)
tools/fonts-ttf/              cópias TTF das fontes, usadas só pelos scripts de imagem e vídeo
```

## Animações (V5)

Duas camadas, para nunca depender de uma biblioteca para mostrar o conteúdo:

1. **Base (CSS + `main.js`)**: revelação na rolagem, entrada da abertura, brasas, faixa. Vale
   para todo mundo e é o que aparece com movimento reduzido (simplificado), economia de dados,
   rede 2G/3G ou JavaScript desligado.
2. **Camada cinematográfica (`cinema.js` + GSAP)**: um script no `<head>` marca a página com
   `.cine` quando há movimento permitido, sem economia de dados e fora de rede lenta, e pede os
   arquivos do GSAP em prioridade baixa (a foto da abertura vem primeiro). O `cinema.js` faz a
   entrada da abertura e, **depois que a página termina de carregar**, traz o ScrollTrigger
   para os efeitos de rolagem. Se o GSAP não chegar em 1 s, a entrada em CSS (reserva, com a
   mesma composição) mostra tudo sozinha.

Não há empacotador: são dois arquivos prontos do próprio GSAP, já minificados, servidos de
`assets/js/vendor/`. Para atualizar a versão:

```bash
npm install            # dentro de parada-do-mano/ (gsap, three e @types/three)
python3 tools/vendor.py
```

O Three.js está instalado, mas **não vai para o site**: não há modelo 3D. A estrutura pronta e
o modelo que seria necessário estão em `tools/3d/LEIA-ME.md`.

Ajustes rápidos ficam em `assets/js/cinema.js` (durações, distâncias, quais fotos têm
enquadramento) e nos tokens de movimento do topo de `assets/css/style.css`.

## Editar o conteúdo

### Cardápio — `conteudo/cardapio.json`

O cardápio não se edita no HTML. Edite o JSON e rode:

```bash
python3 tools/build-content.py      # grava o cardápio no index.html
python3 tools/build-preview.py && python3 tools/make-zip.py
```

Cada **categoria** (as 10 abas, na ordem do arquivo) tem:

| Campo | O que é |
|---|---|
| `id` | identificador curto, sem acento (`buffet`); vira o link `#cat-buffet` |
| `nome` | nome da aba e do título |
| `descricao` | uma ou duas frases |
| `fatos` | etiquetas pretas: só o que a casa divulgou (`"Domingos"`, `"A partir das 06h"`) |
| `imagem` | `{ "foto": "buffet-salao", "alt": "..." }` — uma foto de `assets/images` |
| `marca` | palavra grande no lugar da foto, quando a categoria não tem foto |
| `visto` | lista opcional "Já passou pelo buffet" (o que aparece nas fotos da casa) |
| `consulta` | a linha laranja: onde consultar valores (`"Valor por pessoa pelo WhatsApp"`) |
| `botao`, `whatsapp` | texto do botão e a chave da mensagem em `conteudo/contato.json` |

Cada **item** (prato) vai na lista `itens`, com a categoria a que pertence:

```json
{
  "categoria": "lanches",
  "nome": "Nome do prato",
  "descricao": "Descrição curta (opcional)",
  "preco": 24.9,
  "disponibilidade": "Todos os dias (opcional)",
  "disponivel": true,
  "observacao": "Opcional",
  "imagem": null
}
```

- `preco`: número com ponto (`24.9` vira **R$ 24,90**) ou `null` para não mostrar preço.
- `disponivel: false` risca o item e mostra "Indisponível no momento".
- `imagem`: nome de um arquivo em `assets/images` (opcional; vira uma miniatura).

O script confere o arquivo: categoria que não existe, preço que não é número, foto que não
existe e mensagem de WhatsApp que falta param tudo com uma mensagem de erro clara.
**Prato, preço, porção ou promoção só depois de confirmados pelo restaurante.** Hoje a lista
`itens` está vazia de propósito, e cada categoria funciona como vitrine com consulta pelo WhatsApp.

### WhatsApp, Instagram e rota — `conteudo/contato.json`

Todo link de WhatsApp do site tem `data-wa="chave"` e recebe a mensagem daquela chave
(por exemplo `"buffet": "Olá! Vim pelo site do Parada do Mano e gostaria de saber as opções
do buffet de hoje."`). Links com `data-rota` e `data-insta` recebem o endereço do Maps e do
Instagram. Mude o número ou uma mensagem no JSON e rode `python3 tools/build-content.py`:
todos os links são atualizados e codificados para URL.

### Horário e endereço

Aparecem nos dados estruturados (`<script type="application/ld+json">`, no `<head>`), na
abertura, em `#contato`, no rodapé e nas etiquetas do cardápio (`conteudo/cardapio.json`).

### Fotos

1. Salve a original em `tools/source/` com o nome do espaço — por exemplo
   `tools/source/buffet-salao.jpg`. A lista está em `SLOTS`, no topo de `tools/prepare-images.py`.
2. `python3 tools/prepare-images.py` (precisa de Pillow com AVIF: `pip install pillow`).
3. Se o corte não ficou bom, ajuste o ponto de foco em `FOCO`, no mesmo script.
4. Revise o `alt` da imagem no `index.html` (ou em `conteudo/cardapio.json`).

Para ampliar fotos novas pequenas: `tools/enhance-photos.py` (precisa de
`opencv-contrib-python-headless` e do modelo EDSR, ~38 MB, endereço no topo do arquivo;
o modelo fica em `tools/models/`, fora do Git). Foto pequena só deve ser ampliada quando não
houver original maior.

### Logo

Recortada do avatar do Instagram (150 px de origem, ampliada). Quando chegar o arquivo
vetorial ou um PNG grande com fundo transparente, salve como `tools/source/logo.png` e rode
`tools/prepare-images.py`: saem a logo do cabeçalho e do rodapé, o `favicon.ico` e o `og-cover.jpg`.

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
O pôster é a própria foto da abertura; se o vídeo falhar, fica a foto. Pausa quando sai da
tela ou quando a aba fica em segundo plano. No celular fica a foto.

## Testar

```bash
node tools/servidor.mjs . 8130 &
NODE_PATH=$(npm root -g) node tools/qa-browser.mjs capturas/
NODE_PATH=$(npm root -g) node tools/qa-preview.mjs parada-do-mano-v5-visualizacao.html
NODE_PATH=$(npm root -g) node tools/medir.mjs http://127.0.0.1:8130/ v5 medidas/
NODE_PATH=$(npm root -g) node tools/inp-lab.mjs http://127.0.0.1:8130/ V5
NODE_PATH=$(npm root -g) node tools/fluidez.mjs http://127.0.0.1:8130/ V5 390 844 4
```

Precisa do Playwright com Chromium. Para testar o pacote descompactado:
`QA_URL=http://127.0.0.1:8134/ node tools/qa-browser.mjs ...`. A bateria também confere se o
`index.html` está em dia com `conteudo/`. Resultado da última rodada em `QA.md`.

## Publicar no Vercel (só com autorização do restaurante)

Nada foi publicado. Quando houver autorização:

1. Resolver os itens 🔴 de `PENDENCIAS.md`.
2. Gravar o domínio, mantendo a página fora dos buscadores enquanto for prévia:
   ```bash
   python3 tools/set-domain.py https://dominio-do-restaurante.com.br
   ```
   Isso põe `canonical`, `og:url`, `og:image` e `twitter:image` absolutos (HTTPS), completa o
   JSON-LD com o endereço e gera o `sitemap.xml`. Funciona no `index.html` do projeto e no do pacote.
3. `python3 tools/make-zip.py` e descompactar `parada-do-mano-v5-producao.zip`.
4. Publicar a pasta `parada-do-mano-v5/`:
   - **pela linha de comando:** `npx vercel` dentro da pasta descompactada (depois `npx vercel --prod`);
   - **pelo site do Vercel com o repositório:** *Add New → Project*, *Root Directory* `parada-do-mano`,
     *Framework* **Other**, sem comando de build. O `.vercelignore` da pasta deixa de fora
     ferramentas, conteúdo-fonte, prévias, ZIPs e vídeos de redes sociais.
5. Conferir o endereço de prévia que o Vercel mostra (o `vercel.json` já manda `noindex`).
6. Ligar o domínio em **Settings → Domains**.
7. Só quando o restaurante liberar a página para o Google:
   ```bash
   python3 tools/set-domain.py https://dominio-do-restaurante.com.br --publicar
   ```
   Isso troca o `meta robots` para `index, follow`, libera o `robots.txt` (com o sitemap) e
   tira o `X-Robots-Tag` do `vercel.json`. Gerar o ZIP de novo e publicar.

Qualquer hospedagem estática serve (Netlify, Cloudflare Pages, hospedagem comum por FTP):
basta enviar o conteúdo da pasta `parada-do-mano-v5/`. Fora do Vercel, o `vercel.json` é
ignorado; configure o cache e o `X-Robots-Tag` no painel da hospedagem.
