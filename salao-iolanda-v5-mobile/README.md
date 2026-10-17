# Salão Iolanda — V5 Mobile

Site do **Salão Iolanda** (Salão de Beleza e Estética, Rua Castro Alves, 2995 —
Cascavel/PR) com abertura cinematográfica em 3D real e as seções comerciais:
o salão, serviços, destaque para cabelos, portfólio, agendamento pelo WhatsApp
e localização.

Projeto independente nesta pasta. A V5 é uma reengenharia **só do celular**
(até 700 px, com ajustes para tablet em pé e celular deitado) sobre a V4, que
continua intacta em `../salao-iolanda-v4/`. O desktop é o mesmo da V4.
Relatório da versão: [`docs/RELATORIO-MOBILE.md`](docs/RELATORIO-MOBILE.md).

**Não publicado.** É uma prévia para aprovação, com `noindex`. Antes de publicar,
veja [`docs/PENDENCIAS.md`](docs/PENDENCIAS.md) e [`docs/RELATORIO-V4.md`](docs/RELATORIO-V4.md).

## Como rodar

```bash
cd salao-iolanda-v4
npm install
npm run dev            # http://localhost:5173
npm run build          # gera dist/ (estático, qualquer hospedagem)
npm run preview        # serve dist/ em http://localhost:4173
npm run build:single   # dist-single/index.html: prévia em arquivo único, abre sem servidor
npm test               # Playwright (faz build + preview sozinho)
npm run images         # gera as variantes responsivas das fotos (ver abaixo)
```

### Ferramentas de auditoria mobile

```bash
node scripts/audit.mjs http://localhost:4173/ saida v5      # alturas, CTAs, sobreposições, overflow, toque, bytes, erros
node scripts/framing.mjs http://localhost:4173/ saida v5    # enquadramento 3D por fase e tamanho
node scripts/axe.mjs caminho/axe.min.js                      # acessibilidade (axe-core)
```

### Publicar (quando aprovado)

```bash
SITE_URL=https://dominio-do-salao/ PUBLICAR=1 npm run build
```

- `SITE_URL` gera canonical, `og:url`, `og:image` absoluta, a `url` do JSON-LD e o `sitemap.xml`.
- `PUBLICAR=1` troca o `noindex` por `index, follow` e libera o `robots.txt`.
- Sem as duas variáveis (padrão), o build é de prévia: `noindex` e `robots.txt` bloqueando.
- Suba o conteúdo de `dist/` para a hospedagem. Não há servidor nem banco de dados.

### Parâmetros de URL para revisão

| URL | Efeito |
|---|---|
| `?q=low` / `?q=high` | força a qualidade 3D (sombras, antialias, DPR) |
| `?dpr=0.5` | limita a densidade de pixels do canvas (usado nos testes em CPU) |
| `?sem-webgl` | simula aparelho sem WebGL2 (composição estática) |

## O que editar

Todos os dados comerciais estão em **`src/config/salon.ts`**: nome, endereço,
telefone, WhatsApp, mensagens de agendamento por serviço, Instagram, horários
(vazio até o salão informar), serviços e itens do portfólio. O número de WhatsApp
aparece só ali; o build monta todos os links.

### Colocar as fotos reais (portfólio, serviços, cabelos, ambiente)

1. Use só arquivos originais ou autorizados pelo salão e pelas clientes.
2. Salve os originais (JPG, PNG ou WebP, quanto maior melhor) em `fotos-originais/`.
3. Rode `npm run images`: gera `public/fotos/<nome>-480.webp`, `-960.webp` e
   `-1440.webp`, sem ampliar e sem distorcer.
4. Em `src/config/salon.ts`, preencha `src` com o nome-base (ex.: `'fotos/mechas-01'`),
   `alt` e `caption` de cada item (`portfolio`) e `photo` de cada serviço (`services`).
   O HTML sai com `srcset`/`sizes`: o celular baixa a variante pequena.
5. Rode `npm run build`. Enquanto `src` for `null`, o quadro aparece como
   **"Foto autorizada pendente"**: nenhuma imagem ilustrativa é mostrada como
   trabalho do salão.

As fotos do destaque de cabelos e do ambiente (`#cabelos`, `#salao`) estão no
`index.html` como espaços reservados com o mesmo aviso.

## Stack

Vite + TypeScript, Three.js (WebGL2), GSAP + ScrollTrigger, CSS puro, Playwright.
Sem framework de UI. Fontes locais via Fontsource (Instrument Serif e Manrope, OFL).

## Estrutura

```
index.html                  marcação semântica; marcadores <!--@...--> preenchidos no build
src/config/salon.ts         dados do salão, serviços, mensagens e portfólio (fonte única)
src/content/sections.ts     HTML das seções geradas a partir dos dados
src/content/plugin.ts       plugin do Vite: monta o HTML, SEO de publicação, robots e sitemap
src/main.ts                 liga o site e, depois, a cena 3D (carregada sob demanda)
src/site/                   navegação, cor entre seções, movimento, serviços, portfólio/lightbox
src/three/stage.ts          renderer, câmera, luz de estúdio, fundo, estado animável
src/three/flower.ts         peônia procedural (7 camadas, 62 pétalas com morph)
src/three/polish.ts         frasco: vidro, líquido, rótulo, rosca, tampa, haste, pincel, gota
src/three/hairbrush.ts      escova redonda (objeto secundário da transição)
src/motion/timeline.ts      timeline mestre da abertura + capítulos de texto
src/styles/main.css         identidade visual e layout
public/posters/             quadros reais da cena para o modo sem WebGL
scripts/shots.mjs           capturas comparáveis (mesmos instantes e seções)
scripts/frames.mjs          capturas por % da timeline
scripts/posters.mjs         gera public/posters/ e public/og.jpg
tests/                      Playwright
docs/                       storyboard, relatório da V4 e pendências
```

## Como a abertura funciona

- **Um estado, uma timeline, um laço.** O GSAP anima números num objeto
  (`SceneState`); a `Stage` lê esse objeto e desenha. O ScrollTrigger liga a
  rolagem da seção `.cinema` ao progresso da timeline (`scrub: 0.8`). O palco é
  `position: sticky`: não há pin por JS nem sequestro da rolagem. O render usa o
  ticker do GSAP, sem segundo `requestAnimationFrame`.
- **Render sob demanda.** Só desenha quando o estado muda (ou enquanto a
  flutuação sutil está ligada). Para quando a seção sai da tela ou a aba fica oculta.
  Objetos fora de quadro deixam de ser desenhados.
- **Sequência:** flor abre → esmalte surge → frasco gira → tampa desenrosca →
  pincel sai → o produto sai de cena e o fundo vira preto e bordô → o nome
  **Salão Iolanda** assume a tela → a escova redonda entra girando e leva aos
  serviços. Tudo reversível.
- **Tampa e pincel.** `cap`, `applicatorStem`, `brush` e `drop` são filhos do
  mesmo `capPivot`. Desenroscar = 2 voltas subindo 0,028 por volta (passo da
  rosca). O pincel só inclina depois que a ponta passa da boca do frasco
  (`BRUSH_CLEARANCE`), então não atravessa o vidro.

## Acessibilidade e degradação

- "Pular apresentação" no primeiro Tab e no palco, direto para os serviços.
  Cabeçalho e barra inferior (mobile) dão acesso ao WhatsApp sem passar pela animação.
- `prefers-reduced-motion`: sem scrub e sem animações de seção; quadro único da cena.
- Sem WebGL2: imagem estática real da cena, com marca, textos e botões.
- Sem JavaScript: o conteúdo inteiro está no HTML (gerado no build), com a imagem estática.
- Aparelhos modestos (`Save-Data`, pouca memória, tela pequena de toque):
  sem sombras, sem antialias, DPR até 1,5, sem flutuação contínua.
- Menu mobile e lightbox em `<dialog>`: foco preso, Esc e devolução de foco nativos.
