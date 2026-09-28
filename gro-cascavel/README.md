# GRO Cascavel — site institucional

Site da GRO Cascavel — Medicina e Segurança do Trabalho (Rua Maranhão, 539,
Centro, Cascavel/PR).

> **Status: pronto para apresentar ao cliente. Ainda não pode ser publicado.**
> Faltam o arquivo oficial do logotipo e a aprovação dos textos pela GRO. Ver
> [`PENDENCIAS.md`](PENDENCIAS.md). Testes em [`QA.md`](QA.md). Direção de arte em
> [`.impeccable.md`](.impeccable.md).

## Como rodar

Site estático: HTML, CSS e JavaScript, sem build e sem bibliotecas. As fontes
estão no projeto; nada é carregado de terceiros, exceto o mapa do Google, e só
quando a pessoa clica em "Ver mapa aqui".

```bash
cd gro-cascavel
python3 -m http.server 8131
# abra http://127.0.0.1:8131
```

## Ver sem servidor

`visualizacao/index.html` é o site inteiro num arquivo só (CSS, JS e fontes
embutidos): abre com dois cliques e pode ser enviado ao cliente para aprovação.
Depois de qualquer alteração, gere de novo:

```bash
python3 tools/gerar-visualizacao.py
```

Esse arquivo não é para publicar (fica sem a política de segurança). Para publicar,
use a pasta inteira. As animações em funcionamento estão gravadas em
`docs/animacoes-desktop.mp4`.

## Estrutura

```
index.html              a página (uma só, com âncoras por seção)
404.html                página de erro no mesmo sistema visual
_headers                cabeçalhos de segurança e cache (Netlify / Cloudflare Pages)
robots.txt, sitemap.xml indexação, apontando para www.grocascavel.com.br
site.webmanifest        nome, ícones e cor do navegador
.impeccable.md          contexto e princípios de design do projeto

assets/css/main.css     tokens (cor OKLCH, tipo, espaço, movimento), componentes,
                        seções, movimento e responsivo, nesta ordem
assets/js/main.js       header, menu móvel, acordeão, entradas no scroll, curva
                        do "Como ajudamos", mapa sob demanda
assets/fonts/           Barlow e Barlow Condensed (SIL OFL 1.1), subconjunto latino
assets/images/          símbolo e logotipo em SVG (reconstruídos, provisórios),
                        favicon, ícone Apple, imagem de compartilhamento
docs/capturas/          capturas usadas na aprovação
```

## Como editar

**Textos**: direto no `index.html`; cada seção começa com um comentário
(`<!-- HERO -->`, `<!-- SOLUÇÕES -->`...).

**Cores, tipografia, espaços, durações**: variáveis no topo de
`assets/css/main.css` (`:root`).

**WhatsApp**: links `https://wa.me/5545991068333?text=...`. Para trocar o número,
substitua `5545991068333` em `index.html` e `404.html`.

**Conteúdos**: os itens da seção "Conteúdo para sua empresa" apontam para o perfil
do Instagram. Quando houver o link de cada post (ou um blog), troque o `href` de
cada item.

**Script inline e CSP**: o `<head>` tem um script de uma linha
(`document.documentElement.classList.add('js')`) autorizado por hash na política de
segurança (CSP) do `<meta>` e do `_headers`. Se esse script mudar, o hash precisa
ser recalculado nos dois lugares:

```bash
printf "%s" "document.documentElement.classList.add('js')" | openssl dgst -sha256 -binary | base64
```

Não use atributos `style="..."` no HTML: a CSP bloqueia.

## Fotos

As fotos ficam em `assets/images/registros/`, cada uma em JPG e WebP, com o mesmo
nome. Hoje são recortes das miniaturas do Instagram (ver `PENDENCIAS.md`); por isso
o CSS nunca as amplia além do tamanho do arquivo.

**Trocar por uma original:** salve a foto com o mesmo nome em JPG e WebP (lado maior
entre 1200 e 1600 px, qualidade 80–85) e atualize `width` e `height` do `<img>`
correspondente no `index.html`. Para a foto crescer no layout, aumente o limite de
tamanho do bloco dela no CSS (`.reg--1`, `.shot__a img`, `.emp__photo`...).

Cada foto tem uma máscara verde-lima que sobe e a revela quando entra na tela
(`.reg__img::after`). Não é preciso fazer nada para a foto nova ganhar esse efeito.

## Publicação

Não publicado. Antes do primeiro deploy:

1. Resolver os itens 🔴 de `PENDENCIAS.md`.
2. Confirmar o domínio: canonical, Open Graph, `robots.txt`, `sitemap.xml` e dados
   estruturados usam `https://www.grocascavel.com.br/`.
3. Publicar a pasta `gro-cascavel/` como raiz de um site próprio. O `_headers` é
   lido por Netlify e Cloudflare Pages; em outra hospedagem, configurar os mesmos
   cabeçalhos no servidor e ativar compressão (gzip ou brotli).
4. Cadastrar o site no Google Search Console e enviar o sitemap.

**Atenção:** esta pasta está temporariamente dentro do repositório da Fratelli
Móveis. Se esse repositório publica automaticamente, a GRO pode aparecer em
`/gro-cascavel/` no domínio da Fratelli. Mover para um repositório próprio antes de
publicar.
