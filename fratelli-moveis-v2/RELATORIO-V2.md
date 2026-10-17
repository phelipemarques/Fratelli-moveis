# Fratelli Móveis — Relatório da V2

Base: commit `5982be5` da versão atual, copiada integralmente para
`fratelli-moveis-v2/`. **A versão de produção publicada não foi tocada** e
nada foi publicado.

---

## Skills realmente usadas

O ambiente tem skills instaladas. Carreguei duas, e elas mudaram decisões
concretas:

**`anthropic-skills:cinematic-scroll`** — o storyboard que ela traz é de
outro projeto e foi ignorado. O que se aplicou foi o processo e os
critérios de aceitação: conteúdo legível se a animação falhar; cena
mudando nos dois sentidos sem travar; sem overflow horizontal; controles
operáveis por teclado; `will-change` só onde é necessário; limpeza dos
ScrollTrigger no redimensionamento; mobile projetado à parte, com pin
mais curto e sem rolagem horizontal forçada; testes manuais em 1440×900,
390×844 e 320×568.

Ela também diz, explicitamente, para **não** usar Three.js sem um modelo
3D licenciado. Não há nenhum. WebGL ficou de fora — decisão da skill, não
preguiça minha.

**`anthropic-skills:motion-design`** — definiu a personalidade de
movimento. Entre os quatro arquétipos dela, Fratelli é **Premium**:
350–600ms, desaceleração, **zero overshoot**. É exatamente o que o
briefing pede ao proibir bounce e elástico. Dela saíram também o
orçamento de cascata (nenhum stagger somando mais de 0,5s) e a regra de
que entrada dura mais que saída.

Skills que o briefing lista e que eu **não** usei, com o motivo:
`frontend-design` e `impeccable` tratam de criar direção visual nova — a
identidade da Fratelli está definida e aprovada, e o briefing manda
preservá-la. `web-quality-audit` roda Lighthouse; este container não tem
rede para baixá-lo, então medi com Playwright o que dava para medir e
**não** inventei notas de Lighthouse.

---

## O que foi preservado

Tudo o que já funcionava. A V2 não refez hero, filme, projetos,
ambientes, processo, sobre, avaliações, contato nem rodapé. Seguem
intactos:

- paleta, Newsreader e Inter;
- a classificação das imagens — *Projeto em 3D*, *Projeto executado*,
  *Imagem de referência* — inclusive dentro da ampliação nova;
- as seis avaliações reais, sem uma palavra alterada;
- WhatsApp, Instagram, endereço;
- os fallbacks sem JavaScript e o respeito a `prefers-reduced-motion`.

---

## O que mudou

### 1. Sistema de movimento (o pedido central do briefing)

Antes, cada animação trazia seus próprios números soltos: `duration: 0.9`,
`stagger: 0.075`, `scrub: 0.4`, `'power3.out'`, espalhados por 700 linhas.

Agora existe **um** vocabulário, em dois lugares que se espelham:
`css/main.css` (tokens) e `js/main.js` (objeto `MOTION`). Quatro curvas,
três durações, duas distâncias, três cascatas, quatro intensidades de
parallax, dois scrubs e três pontos de disparo.

**22 valores soltos foram centralizados.** Nenhuma animação do site
inventa mais duração ou curva própria. Mudar o ritmo do site é mudar um
objeto.

### 2. Ampliação de projeto (lightbox)

Nova. Abre qualquer uma das **12 fotografias** de projetos e ambientes em
tela cheia.

Construída por melhoria progressiva: a seção de projetos **não ganhou uma
linha de marcação**. O JavaScript lê o que já está na página — fotografia,
texto alternativo, nome do ambiente e a etiqueta de classificação — e monta
a ampliação a partir disso. Sem JavaScript, a seção fica exatamente como
era, sem botão quebrado.

Acessibilidade, toda verificada em navegador:

| | |
|---|---|
| `role="dialog"` + `aria-modal` | sim |
| rótulo com ambiente, classificação e posição | sim |
| foco vai para o botão fechar | sim |
| foco preso, Tab circula | sim |
| Escape fecha | sim |
| setas navegam, com volta no fim | sim |
| fundo recebe `inert` (6 elementos) | sim |
| rolagem de trás travada | sim |
| foco volta ao botão que abriu | sim |
| movimento reduzido: sem transição | sim |

A transição é fusão com escala curta — **não** é shared-element. A
segunda impressiona no papel e falha em redimensionamento, em rolagem
durante a abertura e no celular. O briefing autoriza explicitamente
preferir a simples que nunca erra.

### 3. Defeito encontrado e corrigido: a rolagem saltava

Ao fechar o menu em celular ou a ampliação, a página voltava **506px
acima** de onde estava. Medido: 2800px → 2294px.

`body{overflow:hidden}` não bastava: quando o documento volta a rolar, o
ScrollTrigger refaz a conta dos pin — a faixa de ambientes tem um — e
reposiciona a página no caminho.

Correção: uma trava compartilhada (`window.__fratelliTrava`) que guarda a
posição, força o recálculo de propósito e devolve a posição **depois**
dele. Medido de novo: **0px de deslocamento**. Vale para a ampliação e
para o menu, que tinha o mesmo defeito.

### 4. Progresso da faixa de ambientes

Um fio âmbar de 1px no rodapé da faixa, mostrando quanto da sequência já
passou. Funciona nos dois modos: no desktop lê o progresso do próprio
ScrollTrigger; no celular, o transporte horizontal nativo. Verificado nos
dois (desktop 0 → 0,47 em 14 passos de rolagem; celular 0 → 1 no fim).

---

## O que eu NÃO fiz

Honestidade sobre o escopo. O briefing tem 40 seções; entreguei as de
maior retorno e deixei estas de fora:

- **Redesenho editorial completo do portfólio** (seção 13). A seção já é
  assimétrica — faixa larga, par 5fr/7fr, bloco deslocado. Melhorei a
  interação (ampliação), não a composição. Um redesenho de composição é
  trabalho de direção de arte que merece uma rodada própria com
  aprovação visual antes.
- **Numeração dos projetos** e redesenho das etiquetas (seção 14). As
  etiquetas atuais funcionam e a classificação está preservada.
- **Smooth scroll / Lenis** (seção 25). O briefing manda avaliar, não
  adotar. Avaliei: há um pin de ScrollTrigger e âncoras internas, que são
  exatamente onde Lenis costuma quebrar. A rolagem nativa entrega melhor
  resultado aqui. **Não adotado, de propósito.**
- **Three.js / WebGL** (seção 26). Sem modelo licenciado; a própria skill
  proíbe fingir.
- **Ampliação das avaliações no celular** (seção 20). As capturas já
  passam no contraste, mas ampliar ainda ajudaria. A ampliação já
  construída cobre projetos e ambientes; estendê-la às avaliações é
  pequeno e não entrou nesta rodada.
- **Métricas de Lighthouse.** Sem rede para baixá-lo. Não inventei notas.
