# Salão Iolanda — experiência cinematográfica 3D (prévia da 1ª sequência)

Salão de beleza em Cascavel/PR. Projeto independente, dentro desta pasta:
não altera o Parada do Mano nem nenhum outro site do repositório.

**Não publicado.** É uma demonstração para aprovação; dados pendentes
(logo, DDD/WhatsApp, horários) estão em [`docs/PENDENCIAS.md`](docs/PENDENCIAS.md).

**Status:** Fases 1 a 5 da primeira sequência — flor abrindo → esmalte surgindo
→ frasco girando → tampa desenroscando → pincel saindo — em 3D real, conduzidas
pela rolagem. Objetos secundários e o site completo ficam para as próximas fases
(ver [`docs/PENDENCIAS.md`](docs/PENDENCIAS.md)).

## Como rodar

```bash
cd salao-cinematografico
npm install
npm run dev          # http://localhost:5173
npm run build        # gera dist/ (estático, pode ir para qualquer host)
npm run preview      # serve dist/ em http://localhost:4173
npm test             # Playwright (build + preview automáticos)
```

Parâmetros de URL úteis para revisão:

| URL | Efeito |
|---|---|
| `?q=low` / `?q=high` | força a qualidade (sombras, antialias, DPR) |
| `?sem-webgl` | simula aparelho sem WebGL (mostra a imagem estática) |

## Stack

Vite + TypeScript, Three.js (WebGL2), GSAP + ScrollTrigger, CSS puro,
Playwright. Sem React, sem construtor de sites. Fontes locais via Fontsource
(Instrument Serif e Manrope, licença OFL).

## Estrutura

```
index.html                  marcação semântica; o texto existe sem JS
src/main.ts                 detecção de capacidade, ScrollTrigger, laço único de render
src/config/salon.ts         dados do salão (informados + pendências)
src/three/stage.ts          renderer, câmera, luz de estúdio, fundo, estado animável
src/three/flower.ts         peônia procedural (7 camadas, 62 pétalas com morph)
src/three/polish.ts         frasco: bottle, liquid, label, neckThread, cap, applicatorStem, brush, drop
src/motion/timeline.ts      timeline mestre + capítulos de texto
src/styles/main.css         identidade visual e layout
public/posters/             quadros reais da cena para o fallback sem WebGL
scripts/frames.mjs          captura quadros posicionando a timeline (revisão quadro a quadro)
scripts/posters.mjs         gera public/posters/ (fallback sem WebGL)
scripts/capture.mjs         captura com rolagem real (lento no SwiftShader)
tests/                      Playwright
docs/                       storyboard, relatórios e pendências
```

## Como a sequência funciona

- **Um estado, uma timeline, um laço.** O GSAP anima números em um objeto
  (`SceneState`); a `Stage` lê esse objeto e desenha. O ScrollTrigger liga a
  rolagem da seção `.cinema` ao progresso da timeline (`scrub: 0.8`, sem pin de
  JS: o palco é `position: sticky`). O render usa o ticker do próprio GSAP —
  não há segundo `requestAnimationFrame`.
- **Render sob demanda.** Só desenha quando o estado muda, ou continuamente
  enquanto a flutuação sutil do frasco está ligada (desktop). Para quando a seção
  sai da tela ou a aba fica oculta.
- **Nada é recriado entre cenas.** Flor e frasco são construídos uma vez; as
  cenas são trechos da mesma timeline.
- **Flor.** Cada pétala tem dobradiça própria (rotação na base) e um morph
  target entre a forma fechada (arco para dentro, côncava) e a aberta (ponta
  virada para fora, babado). As camadas abrem de fora para dentro.
- **Tampa e pincel.** `cap`, `applicatorStem`, `brush` e `drop` são filhos do
  mesmo `capPivot`. Desenroscar = 2 voltas com subida de 0,028 por volta (passo da
  rosca). O pincel só inclina depois que a ponta passa da boca do frasco
  (`BRUSH_CLEARANCE`), então não atravessa o vidro.
- **Vidro.** `MeshPhysicalMaterial` com transmissão, IOR 1,5 e espessura; o
  fundo é um quad em tela cheia dentro da cena, para entrar no passe de
  transmissão. Reflexos vêm de um estúdio procedural (cúpula + softboxes)
  pré-filtrado com PMREM — nenhum HDR baixado.

## Acessibilidade e degradação

- Atalho "Pular a apresentação" no primeiro Tab e link fixo no palco.
- `prefers-reduced-motion`: sem scrub; um quadro único do frasco aberto e o
  conteúdo em fluxo normal.
- Sem WebGL2 (ou erro ao criar o contexto): imagem estática real da cena.
- Aparelhos modestos (`Save-Data`, pouca memória, toque em tela pequena):
  sem sombras, sem antialias, DPR até 1,5, sem flutuação contínua.
