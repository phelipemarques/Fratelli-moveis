# Maguila's Restaurante & Grill — site

Site de uma página para o Maguila's Restaurante & Grill, em Cascavel/PR.

> **Status: prévia de aprovação — não publicar como site definitivo.** A
> página está marcada como `noindex` e os dados de contato ainda precisam de
> confirmação. Pendências: [`PENDENCIAS.md`](PENDENCIAS.md). Relatório da
> versão atual: [`RELATORIO-V5.md`](RELATORIO-V5.md). Testes da V4:
> [`QA.md`](QA.md). Medições: [`PERFORMANCE.md`](PERFORMANCE.md). Como
> publicar: [`PUBLICACAO.md`](PUBLICACAO.md). Decisões de marca:
> [`DIRECAO.md`](DIRECAO.md). Fotos: [`FOTOGRAFIA.md`](FOTOGRAFIA.md).

## Os três jeitos de entregar

| Arquivo | Para quê |
|---|---|
| `maguilas-v5-visualizacao.html` | mostrar ao cliente: abre com dois cliques, sem internet e sem pastas ao lado |
| `maguilas-v5-producao.zip` | o site pronto para publicar: descompacte e envie a pasta `maguilas-v5/` para a Vercel |
| esta pasta (`maguilas/`) | o projeto, com ferramentas, testes e documentação |

O zip é gerado por `python3 tools/gerar-zip.py`, que confere se todo arquivo
citado no HTML e no CSS existe antes de empacotar.

## Como rodar

HTML, CSS e JavaScript puros, sem build e sem nenhuma dependência de rede em
tempo de execução: as fontes estão dentro do projeto.

```bash
cd maguilas
node tools/servidor-local.mjs . 8130     # imita a Vercel: brotli, cache, cabeçalhos do vercel.json
# abra http://127.0.0.1:8130
```

`python3 -m http.server 8130` também funciona, sem os cabeçalhos.

### Testes automatizados

```bash
npm i --no-save playwright
node tools/testar.mjs http://127.0.0.1:8130/
```

48 verificações: 16 tamanhos de tela, o menu, as 7 abas, a página sem
JavaScript, movimento reduzido, links, o `noindex` da prévia, tamanho mínimo
de texto (10,5 px) e o iPhone deitado com entalhe. Sai com erro se algo falhar.

## Estrutura

```
— vai para o ar —
index.html                 a página inteira
404.html                   página de erro, na identidade do site
robots.txt, sitemap.xml    SEO — trocar o domínio antes de publicar
vercel.json                cache (fontes 1 ano, imagens 7 dias) e cabeçalhos de
                           segurança, incluindo CSP e X-Robots-Tag: noindex
.vercelignore              o que fica fora do deploy
assets/css/style.css       estilos em blocos: fontes, tokens, base, layout,
                           componentes, seções, movimento, prévia, 404
assets/js/main.js          menu do celular, abas, revelação ao rolar,
                           barra de ação do celular, aviso de prévia
assets/fonts/              Oswald, Inter e Dancing Script recortadas (SIL OFL 1.1),
                           com hash no nome
assets/images/             fotos em AVIF + WebP, miniaturas de 192 px,
                           fundo da abertura, og-cover, favicon

— fica no repositório —
maguilas-v5-visualizacao.html  o site inteiro num arquivo só, para mostrar ao cliente
tools/recortar-instagram.py    recortes das capturas → AVIF, WebP e miniaturas
tools/otimizar-fontes.py       recorta as fontes e renomeia com hash (requer fonttools)
tools/gerar-arquivo-unico.py   gera o arquivo único
tools/gerar-zip.py             gera maguilas-v5-producao.zip e confere as referências
tools/servidor-local.mjs       servidor local que imita a Vercel
tools/testar.mjs               testes de navegador (Playwright)
tools/og-cover.html, gerar-og.mjs  imagem de compartilhamento
tools/source/                  capturas do Instagram e fontes originais
docs/comparacao/               capturas V4 × V5 em 1440, 768, 390 e 320 px
```

## Versão em arquivo único

`maguilas-v5-visualizacao.html` tem CSS, JavaScript, fontes e imagens dentro
dele (≈0,96 MB). Abre com dois cliques, sem servidor e sem as pastas ao lado —
serve para mandar ao cliente ver. Não é o arquivo de publicação.

Toda alteração no site deve terminar com:

```bash
python3 tools/gerar-arquivo-unico.py
python3 tools/gerar-zip.py
```

Na prévia, as fotos vão só em WebP (o AVIF dobraria o tamanho) e ficam de
fora o pré-carregamento e a imagem de compartilhamento, que dependem das
pastas.

Sem JavaScript a página continua completa: o menu vira uma linha de links, o
cardápio aparece com todas as categorias e nada fica escondido por animação.

## Editar conteúdo

Todo o texto está no `index.html`, em ordem de leitura, com uma faixa de
comentário por seção (`01 · ABERTURA`, `02 · O MAGUILA'S`…).

**WhatsApp.** O número aparece nos links como `5545999566139` (55 + DDD +
número). Para trocar, substitua esse trecho em todo o `index.html` — são 13
ocorrências — e também o texto `(45) 99956-6139`.

**Endereço.** Aparece em 4 lugares do `index.html` (abertura, Localização,
placa de horário, rodapé) e em 2 links do Google Maps (`destination=` e
`query=`, com espaços como `%20`). Procure por `Aimor`.

**Horário.** Aparece na abertura, na placa da Localização (`sign__days` e
`sign__hours`) e no rodapé. Procure por `6h`.

**Dado confirmado.** Quando o restaurante confirmar um dado, tire a classe
`pend` e o `title` daquele trecho. Na placa, tire também o selo
`<span class="preview-only pend-chip">a confirmar</span>`.

**Cardápio.** Cada categoria é um `<section class="menu__panel">` com uma lista
`menu__list`. Um item:

```html
<li><span class="menu__item">Nome</span><span class="menu__desc">Descrição curta.</span></li>
```

Para incluir preço, quando o restaurante enviar, acrescente
`<span class="menu__price">R$ 00,00</span>` e um estilo para ele em
`6.5 cardápio` no CSS.

## Trocar a logo

1. Salve o arquivo oficial em `assets/images/logo-maguilas.svg` (ou PNG
   transparente com pelo menos 2× o tamanho de exibição).
2. No `index.html`, dentro dos dois `<a class="brand">` (cabeçalho e rodapé),
   troque os dois `<span>` por
   `<img class="brand__logo" src="assets/images/logo-maguilas.svg" alt="Maguila's Restaurante & Grill" width="…" height="…">`.
   O CSS já tem a classe `brand__logo` (46 px de altura no cabeçalho, 72 px no rodapé).
3. Troque também `assets/images/favicon.svg`, que hoje é um "M" provisório,
   e o texto da marca em `tools/og-cover.html` (depois rode `node tools/gerar-og.mjs`).

## Trocar as fotos

As imagens atuais são recortes de capturas de tela, em ≈280 px. Quando chegarem
os originais:

1. Exporte cada foto em AVIF e WebP, em algumas larguras (ex.: 640, 960 e
   1440 px), e use o mesmo `<picture>` das fotos atuais com `srcset`/`sizes`, mantendo `width`/`height`
   proporcionais para não haver salto de layout.
2. **Abertura:** a composição `.board` (três fotos sobre o anel dourado) foi
   feita para fotos de ≈280 px. Com a foto P1 de `FOTOGRAFIA.md`, o caminho
   recomendado é uma foto grande no lugar do `.board` (horizontal no desktop,
   4:5 no celular, via `<picture>`), mantendo a ordem do celular: manchete →
   foto → botões. Apontar o `<link rel="preload">` para a nova imagem.
3. **Fachada:** substitua o bloco `sign` (placa de horário) da seção
   Localização por um `<img>`, e leve o horário para junto do endereço.
4. **Cardápio e momentos:** com fotos limpas, troque os recortes `foto-*` do
   cardápio e, nos momentos, prefira a foto sem a arte do post.

## Sair do modo prévia (antes de publicar)

1. Resolver os itens 🔴 de `PENDENCIAS.md`.
2. No `<html>`, remover a classe `is-preview` — some o aviso flutuante, as notas
   de prévia e o sublinhado pontilhado dos dados a confirmar.
3. Remover `<meta name="robots" content="noindex, nofollow">`.
4. Com o domínio definido, adicionar no `<head>`:
   ```html
   <link rel="canonical" href="https://DOMINIO/">
   <meta property="og:url" content="https://DOMINIO/">
   ```
   e trocar `og:image` para o endereço absoluto
   (`https://DOMINIO/assets/images/og-cover.jpg`).
5. Trocar `SEU-DOMINIO` em `robots.txt` e `sitemap.xml`.
6. Com endereço, telefone e horário **confirmados**, acrescentar os dados
   estruturados (modelo abaixo) antes de `</head>`.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Maguila's Restaurante & Grill",
  "url": "https://DOMINIO/",
  "image": "https://DOMINIO/assets/images/og-cover.jpg",
  "telephone": "+55-45-99956-6139",
  "servesCuisine": ["Brasileira", "Buffet por quilo", "Grelhados"],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rua Aimorés, 171",
    "addressLocality": "Cascavel",
    "addressRegion": "PR",
    "postalCode": "CEP-CONFIRMADO",
    "addressCountry": "BR"
  },
  "openingHoursSpecification": [{
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    "opens": "06:00",
    "closes": "23:00"
  }],
  "sameAs": ["https://www.instagram.com/maguilas_restaurante/"]
}
</script>
```

Não incluir `priceRange`, `aggregateRating` nem `review` sem dado real.

## Publicar

Na Vercel, como site estático: *Root Directory* = `maguilas`, preset
*Other*, sem comando de build. O passo a passo e o que muda para virar site
definitivo estão em [`PUBLICACAO.md`](PUBLICACAO.md).

Se usar o cabeçalho CSP do `vercel.json` e mudar o script curto do `<head>`
(`document.documentElement.classList.add('js');`), recalcule o hash:

```bash
printf "%s" "document.documentElement.classList.add('js');" | openssl dgst -sha256 -binary | base64
```

## Regerar imagens

```bash
# fontes (só se trocar as originais em tools/source/fonts/)
pip install fonttools brotli && python3 tools/otimizar-fontes.py

# recortes dos posts (só enquanto não houver originais)
python3 tools/recortar-instagram.py tools/source/instagram

# imagem de compartilhamento (com o servidor local rodando na porta 8130)
node tools/gerar-og.mjs
```
