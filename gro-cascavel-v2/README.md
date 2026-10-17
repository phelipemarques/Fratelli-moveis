# GRO Cascavel — site institucional · V2

Segunda versão do site da GRO Cascavel — Medicina e Segurança do Trabalho
(Rua Maranhão, 539, Centro, Cascavel/PR). A V1 continua intacta em
`../gro-cascavel/`.

> **Status: pronto para apresentar ao cliente. Ainda não pode ser publicado.**
> Faltam o arquivo oficial do logotipo e a aprovação dos textos pela GRO. Ver
> [`PENDENCIAS.md`](PENDENCIAS.md). O que mudou e os testes estão em
> [`RELATORIO-V2.md`](RELATORIO-V2.md). Direção de arte em
> [`.impeccable.md`](.impeccable.md).

## Como rodar

Site estático: HTML, CSS e JavaScript, sem build. Fontes e bibliotecas estão
no projeto; nada é carregado de terceiros, exceto o mapa do Google, e só quando
a pessoa clica em "Mostrar o mapa aqui".

```bash
cd gro-cascavel-v2
python3 -m http.server 8131
# abra http://127.0.0.1:8131
```

## Entregáveis

```bash
python3 tools/gerar-visualizacao.py   # entrega/gro-cascavel-v2-visualizacao.html
python3 tools/empacotar.py            # entrega/gro-cascavel-v2-producao.zip
```

- **Visualização** (`gro-cascavel-v2-visualizacao.html`): o site num arquivo
  só, abre com dois cliques, para aprovação. Tem `noindex` e não tem a política
  de segurança (ela proíbe o CSS e o JS embutidos). Não é para publicar.
- **Produção** (`gro-cascavel-v2-producao.zip`): só o que vai para a
  hospedagem (página, 404, cabeçalhos, robots, sitemap, manifest e `assets/`).

A pasta `entrega/` é gerada e não vai para o Git.

## Estrutura

```
index.html              a página (uma só, com âncoras por seção)
404.html                página de erro no mesmo sistema visual
_headers                cabeçalhos de segurança e cache (Netlify / Cloudflare Pages)
robots.txt, sitemap.xml indexação, apontando para www.grocascavel.com.br
site.webmanifest        nome, ícones e cor do navegador
.impeccable.md          contexto e princípios de design

assets/css/main.css     tokens (cor, tipo, espaço, movimento), componentes,
                        seções, movimento e responsivo, nesta ordem
assets/js/main.js       header, menu, soluções, processo, cenas de rolagem,
                        carregamento do GSAP no desktop, mapa sob demanda
assets/vendor/          GSAP 3.15 e ScrollTrigger (licença padrão gratuita
                        da GSAP, cabeçalho nos arquivos)
assets/fonts/           Barlow Condensed e Hanken Grotesk (SIL OFL 1.1)
assets/images/          símbolo e logotipo em SVG (reconstruídos, provisórios),
                        favicon, ícone Apple, imagem de compartilhamento
docs/comparacao/        V1 (esquerda) × V2 (direita), 5 larguras × 8 seções
docs/capturas/          capturas da V2
docs/animacoes-*.mp4    gravações das animações
tools/                  visualização, pacote de produção, importação de fotos
```

## Como o movimento funciona

- **Abertura do hero**: CSS puro. Começa na primeira pintura, não espera
  JavaScript.
- **Desktop (≥ 1024 px)**: `main.js` carrega GSAP e ScrollTrigger depois que a
  página abriu. Eles fixam o "Como ajudamos" por cerca de 0,9 tela, coordenam a
  troca de soluções e o enquadramento do hero.
- **Celular e tablet**: nenhuma biblioteca. Um único listener de rolagem move
  o símbolo no processo, acende o manifesto e desenha a curva do contato.
- **Movimento reduzido** (`prefers-reduced-motion`) ou sem JavaScript: todo o
  conteúdo aparece completo e estático.

Tokens de duração, curva, distância e intervalo estão no `:root` do CSS e no
objeto `M` do `main.js`, com os mesmos valores.

## Como editar

**Textos**: direto no `index.html`; cada seção começa com um comentário.

**WhatsApp**: links `https://wa.me/5545991068333?text=...`, com mensagem por
contexto (geral, cada solução, contato). Para trocar o número, substitua
`5545991068333` em `index.html` e `404.html`.

**Script inline e CSP**: o `<head>` tem um script de uma linha
(`document.documentElement.classList.add('js')`) autorizado por hash na CSP do
`<meta>` e do `_headers`. Se ele mudar, recalcule o hash nos dois lugares:

```bash
printf "%s" "document.documentElement.classList.add('js')" | openssl dgst -sha256 -binary | base64
```

Não use atributos `style="..."` no HTML: a CSP bloqueia.

## Fotos

Desenhado para **no máximo 3 fotografias reais** (hero, Empresas, Sobre) e
funciona sem elas. Para colocar uma: salve o original em `fotos-originais/`
(ver `LEIA.md`), rode `python3 tools/importar-fotos.py` e insira o `<picture>`
no ponto indicado pelo comentário da seção no `index.html`.

## Publicação

Não publicado. Antes do primeiro deploy:

1. Resolver os itens 🔴 de `PENDENCIAS.md`.
2. Confirmar o domínio: canonical, Open Graph, `robots.txt`, `sitemap.xml` e
   dados estruturados usam `https://www.grocascavel.com.br/`.
3. Publicar o conteúdo do `gro-cascavel-v2-producao.zip` como raiz do site. O
   `_headers` é lido por Netlify e Cloudflare Pages; em outra hospedagem,
   configurar os mesmos cabeçalhos e ativar compressão (gzip ou brotli).
4. Cadastrar o site no Google Search Console e enviar o sitemap.

**Atenção:** esta pasta está temporariamente dentro do repositório da Fratelli
Móveis. Mover para um repositório próprio antes de publicar.
