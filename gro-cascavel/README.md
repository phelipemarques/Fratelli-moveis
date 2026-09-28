# GRO Cascavel — site institucional

Prévia do site da GRO Cascavel — Medicina e Segurança do Trabalho
(Rua Maranhão, 539 — Centro, Cascavel/PR).

> **Status: prévia pronta. Ainda não pode ser publicado.** Faltam as fotografias
> reais da GRO e o arquivo oficial do logotipo — ver [`PENDENCIAS.md`](PENDENCIAS.md).
> O que foi testado está em [`QA.md`](QA.md).

## Como rodar

Site estático: HTML, CSS e JavaScript, sem etapa de build e sem bibliotecas.
As fontes estão dentro do projeto.

```bash
cd gro-cascavel
python3 -m http.server 8130
# abra http://127.0.0.1:8130
```

Qualquer servidor estático serve (`npx serve`, Live Server do VS Code etc.).
Abrir o `index.html` direto pelo arquivo também funciona, mas o mapa do Google
só carrega servido por http.

## Estrutura

```
index.html                  a página (uma só, com âncoras)
robots.txt, sitemap.xml     indexação — apontam para www.grocascavel.com.br
assets/css/main.css         toda a folha de estilo: tokens, componentes, seções,
                            movimento, responsivo
assets/js/main.js           header, menu móvel, entradas no scroll, parallax
assets/fonts/               Archivo (variável) e IBM Plex Mono — SIL OFL 1.1
assets/images/              símbolo e logotipo em SVG (provisórios), favicon,
                            ícone Apple e imagem de compartilhamento (Open Graph)
```

## Como editar

**Textos** — direto no `index.html`. Cada seção começa com um comentário
(`<!-- HERO -->`, `<!-- SOLUÇÕES -->` …).

**Cores, tipografia e espaçamentos** — nas variáveis do topo de
`assets/css/main.css` (`:root`). Trocar `--lime` ou `--green-950` ali muda o
site inteiro.

**WhatsApp** — o número aparece nos links `https://wa.me/5545991068333?text=…`.
Para trocar, substitua `5545991068333` em todo o `index.html`. A mensagem
pré-preenchida está depois de `?text=`, codificada para URL.

**Trocar um espaço reservado por foto real** — cada foto a produzir é um
`<div class="ph" data-parallax …>`. Substitua o `div` inteiro por:

```html
<picture>
  <source type="image/avif" srcset="assets/images/fachada-900.avif 900w, assets/images/fachada-1600.avif 1600w, assets/images/fachada-2400.avif 2400w" sizes="(min-width: 1024px) 42vw, 100vw">
  <source type="image/webp" srcset="assets/images/fachada-900.webp 900w, assets/images/fachada-1600.webp 1600w, assets/images/fachada-2400.webp 2400w" sizes="(min-width: 1024px) 42vw, 100vw">
  <img class="ph" data-parallax src="assets/images/fachada-1600.jpg" width="1600" height="2000"
       alt="Fachada da GRO Cascavel na Rua Maranhão, 539, com o totem verde da marca"
       style="object-fit: cover" loading="lazy" decoding="async">
</picture>
```

A classe `ph` mantém o enquadramento e o parallax. Na foto do hero, troque
`loading="lazy"` por `fetchpriority="high"` — é a primeira imagem da página.
`sizes` sugerido: hero `42vw`, faixa `100vw`, Sobre `50vw` (desktop).

## Publicação

Não publicado. Antes do primeiro deploy:

1. Resolver os itens 🔴 de `PENDENCIAS.md`.
2. Confirmar o domínio: canonical, Open Graph, `robots.txt`, `sitemap.xml` e os
   dados estruturados usam `https://www.grocascavel.com.br/` (visto no material
   da GRO). Se for outro, trocar nesses cinco lugares.
3. Hospedar a pasta `gro-cascavel/` como raiz de um site próprio (Netlify,
   Vercel, Cloudflare Pages ou a hospedagem atual do domínio).

**Atenção:** esta pasta está temporariamente dentro do repositório da Fratelli
Móveis. Se esse repositório estiver ligado a deploy automático, a prévia da GRO
pode ficar acessível em `/gro-cascavel/` no domínio da Fratelli. O recomendado é
mover a pasta para um repositório próprio antes de qualquer publicação.
