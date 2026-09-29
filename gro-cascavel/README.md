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
quando a pessoa clica em "Mostrar o mapa aqui".

```bash
cd gro-cascavel
python3 -m http.server 8131
# abra http://127.0.0.1:8131
```

## Ver sem servidor

```bash
python3 tools/gerar-visualizacao.py
```

Gera `visualizacao/index.html`, o site num arquivo só (CSS, JS e fontes
embutidos), que abre com dois cliques para aprovação. Não é para
publicar: fica sem a política de segurança. A pasta `visualizacao/` não vai para o
Git.

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
assets/fonts/           Barlow Condensed e Hanken Grotesk (SIL OFL 1.1), subconjunto latino
assets/images/          símbolo e logotipo em SVG (reconstruídos, provisórios),
                        favicon, ícone Apple, imagem de compartilhamento
docs/capturas/          capturas usadas na aprovação
docs/animacoes-desktop.mp4  gravação das animações
```

## Como editar

**Textos**: direto no `index.html`; cada seção começa com um comentário
(`<!-- HERO -->`, `<!-- SOLUÇÕES -->`...).

**Cores, tipografia, espaços, durações**: variáveis no topo de
`assets/css/main.css` (`:root`).

**WhatsApp**: links `https://wa.me/5545991068333?text=...`. Para trocar o número,
substitua `5545991068333` em `index.html` e `404.html`.

**Conteúdos**: os itens da seção "Temas que orientamos" apontam para o perfil
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

O site foi desenhado para **no máximo 3 fotografias reais** (hero, Empresas, Sobre)
e funciona sem elas: o painel do hero é verde com a curva da marca e o endereço;
Sobre usa o "539" como composição.

Para colocar uma foto: salve o original em `fotos-originais/` (ver `LEIA.md` lá),
rode `python3 tools/importar-fotos.py` e insira o `<picture>` no ponto indicado pelo
comentário da seção no `index.html`. O CSS de cada área já existe (`.hero__foto`,
`.emp__foto`, `.about__foto` + classe `about--foto` na seção).

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
