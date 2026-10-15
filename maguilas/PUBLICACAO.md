# Maguila's — checklist de publicação

O site está pronto para hospedagem estática na Vercel, mas **não deve ir ao ar
como site definitivo** antes dos itens 🔴 de [`PENDENCIAS.md`](PENDENCIAS.md).
Nada foi publicado.

## 1. Antes de publicar (depende do restaurante)

- [ ] Logo oficial em SVG aplicada no cabeçalho, no rodapé, no favicon e em `tools/og-cover.html` (README, "Trocar a logo").
- [ ] WhatsApp confirmado (hoje `5545999566139`, em 13 links).
- [ ] Endereço, bairro, CEP e a referência "ao lado do Hospital Universitário" confirmados.
- [ ] Horário confirmado, incluindo domingo e feriados.
- [ ] Autorização por escrito para usar as fotos e a marca.
- [ ] Textos aprovados (as propostas estão em `PENDENCIAS.md`, ⚪).
- [ ] Cardápio revisado pelo restaurante — algum item pode ter saído.
- [ ] Domínio definido.

## 2. Publicar na Vercel (prévia, ainda com `noindex`)

1. Na Vercel: **Add New → Project** → importar o repositório.
2. **Root Directory:** `maguilas`.
3. **Framework Preset:** *Other*. **Build Command:** vazio. **Output Directory:** vazio (`.`).
4. Deploy. O `vercel.json` aplica cache e cabeçalhos de segurança; o
   `.vercelignore` deixa `tools/`, `docs/`, os `.md` e a prévia em arquivo
   único fora do ar.
5. Conferir na URL gerada: página abre, console sem erros, `/qualquer-coisa`
   mostra a página 404 da marca.

Não há build, banco de dados nem função de servidor.

## 3. Virar site definitivo (só depois da seção 1)

No `index.html`:

- [ ] Tirar a classe `is-preview` do `<html>` (some o aviso e os pontilhados).
- [ ] Tirar `<meta name="robots" content="noindex, nofollow">`.
- [ ] Adicionar `<link rel="canonical" href="https://DOMINIO/">` e `<meta property="og:url" content="https://DOMINIO/">`.
- [ ] Trocar `og:image` para `https://DOMINIO/assets/images/og-cover.jpg` (o WhatsApp exige endereço absoluto).
- [ ] Colar o JSON-LD `Restaurant` do README **só com dados confirmados**, sem `priceRange`, `aggregateRating` ou `review`.

No `vercel.json`:

- [ ] Tirar o cabeçalho `X-Robots-Tag: noindex, nofollow`.

Em `robots.txt` e `sitemap.xml`:

- [ ] Trocar `SEU-DOMINIO` pelo domínio real.

Na Vercel:

- [ ] Ligar o domínio em **Settings → Domains**.

## 4. Depois de publicar

- [ ] Rodar o Lighthouse na URL real (celular). Referência no laboratório: desempenho 100, acessibilidade 100, boas práticas 100 (`PERFORMANCE.md`).
- [ ] Testar em um iPhone e em um Android de verdade: menu, abas, barra inferior, botões de WhatsApp e rota.
- [ ] Enviar o link pelo WhatsApp para conferir a prévia (título, descrição e imagem).
- [ ] Cadastrar o site no Google Search Console e enviar o `sitemap.xml`.
- [ ] Depois de 28 dias com visitas, ver os Core Web Vitals reais (relatório do Search Console ou PageSpeed Insights, seção "dados de campo"). Os números deste projeto são de laboratório.
