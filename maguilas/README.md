# Maguila's Restaurante & Grill — site

Site de uma página para o Maguila's Restaurante & Grill, em Cascavel/PR.

> **Status: prévia de aprovação — não publicar.** A página está marcada como
> `noindex` e os dados de contato ainda precisam de confirmação. A lista do que
> falta está em [`PENDENCIAS.md`](PENDENCIAS.md). O que foi testado está em
> [`QA.md`](QA.md). As decisões de marca e estrutura estão em
> [`DIRECAO.md`](DIRECAO.md).

## Como rodar

HTML, CSS e JavaScript puros, sem build e sem nenhuma dependência de rede em
tempo de execução: as fontes estão dentro do projeto.

```bash
cd maguilas
python3 -m http.server 8130
# abra http://127.0.0.1:8130
```

Qualquer servidor estático serve (`npx serve`, Live Server do VS Code, etc.).

## Estrutura

```
index.html                 a página inteira
robots.txt, sitemap.xml    SEO — trocar o domínio antes de publicar
assets/css/style.css       estilos, em 8 blocos: fontes, tokens, base, layout,
                           componentes, seções, movimento, prévia
assets/js/main.js          menu do celular, abas do cardápio, revelação ao
                           rolar, barra de ação do celular, aviso de prévia
assets/fonts/              Oswald, Inter e Dancing Script (SIL OFL 1.1)
assets/images/             recortes provisórios dos posts + og-cover + favicon
tools/recortar-instagram.py  gera os recortes a partir das capturas de tela
tools/og-cover.html        modelo da imagem de compartilhamento
tools/gerar-og.mjs         gera assets/images/og-cover.jpg (Playwright)
tools/source/instagram/    as 4 capturas de tela do perfil enviadas como referência
tools/gerar-arquivo-unico.py  gera maguilas-v3-visualizacao.html
maguilas-v3-visualizacao.html o site inteiro num arquivo só, para visualizar
docs/comparacao/           capturas V2 × V3 em 1440, 768, 390 e 320 px
DIRECAO.md                 decisões de marca e estrutura (seção 9: versão 3)
FOTOGRAFIA.md              auditoria das imagens e plano de fotos P1–P5
```

## Versão em arquivo único

`maguilas-v3-visualizacao.html` tem CSS, JavaScript, fontes e imagens dentro
dele (≈1,05 MB). Abre com dois cliques, sem servidor e sem as pastas ao lado —
serve para mandar ao cliente ver. Não é o arquivo de publicação.

Toda alteração no site deve terminar com:

```bash
python3 tools/gerar-arquivo-unico.py
```

Sem JavaScript a página continua completa: o menu vira uma linha de links, o
cardápio aparece com todas as categorias e nada fica escondido por animação.

## Editar conteúdo

Todo o texto está no `index.html`, em ordem de leitura, com uma faixa de
comentário por seção (`01 · ABERTURA`, `02 · O MAGUILA'S`…).

**WhatsApp.** O número aparece nos links como `5545999566139` (55 + DDD +
número). Para trocar, substitua esse trecho em todo o `index.html` — são 12
ocorrências — e também o texto `(45) 99956-6139`.

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

1. Exporte cada foto em WebP, em duas larguras (ex.: 800 e 1600 px), e
   substitua o `<img>` por `srcset`/`sizes`, mantendo `width`/`height`
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

É um site estático. Em qualquer hospedagem estática (Netlify, Vercel, Cloudflare
Pages, hospedagem comum), publique **o conteúdo da pasta `maguilas/`** como raiz
do site — `robots.txt` e `sitemap.xml` só funcionam na raiz do domínio. No
Netlify, isso é o campo *Base directory* = `maguilas`.

A pasta `tools/` não precisa ir para o ar.

## Regerar imagens

```bash
# recortes dos posts (só enquanto não houver originais)
python3 tools/recortar-instagram.py tools/source/instagram

# imagem de compartilhamento (com o servidor local rodando na porta 8130)
node tools/gerar-og.mjs
```
