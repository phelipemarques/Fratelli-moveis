# Relatório — Reimaginação

A instrução era clara: **não preservar a animação 3D automaticamente**,
e remover o armário se qualquer um dos problemas centrais continuasse
comprometendo a experiência.

Ele foi removido.

---

## 1. A DECISÃO SOBRE O ARMÁRIO

O critério pedia dez condições simultâneas. Pelas medidas da própria
V9 — feitas por mim, na rodada anterior — **quatro não eram atendidas**:

| condição | situação na V9 |
| --- | --- |
| material visualmente convincente | o espectro do veio tinha pico de **672× a mediana** em 3 ciclos contra **125×** na fotografia: mais regular que madeira |
| ausência de aparência plástica | resolvida só em escalas de perto; de longe o painel ainda lia como ripado até a correção de UV, e o poro teve de ficar em **43 linhas/m contra ~130/m** da referência por limite de pixels de tela |
| funcionamento excelente em mobile | o celular rodava uma composição 2.5D que era **outro móvel**: duas folhas, 1,80 m, sem moldura |
| validação em navegador real | **nunca houve**: todo o 3D foi medido em WebGL por software |

As outras seis estavam de pé (portas para fora, enquadramento sem
deformação, sem sobreposição de texto, reversibilidade, performance
contida). Não bastaram: o pedido era que **todas** fossem verdadeiras.

Decisão: fotografia no lugar de geometria procedural. Com ela saíram
**687 KB de Three.js e 106 KB de módulos próprios**.

---

## 2. A AUDITORIA DE IMAGENS VEIO ANTES DO DESENHO

E foi ela que definiu a composição, não o contrário.

### O que existe

Varri `tools/source/`, `assets/images/` e `tools/ref/`. **Nenhum
arquivo do projeto passa de 1600 px de largura.**

| imagem | maior original | entregue na V9 |
| --- | --- | --- |
| closet ("Cada ambiente começa por dentro") | `closet.jpg` **1600 × 943** | 1540 × 866 |
| cozinha (faixa de ambientes) | `amb-cozinha.jpg` **368 × 420** | 336 × 420 |
| nogueira (referência de material) | `tools/ref/26.jpg` **2000 × 2000** | — |

### Sobre os 3840 × 2160 pedidos

Não há como chegar lá com honestidade. O original do closet é **4%
maior** que o que já estava publicado, e não existe super-resolutor
neste ambiente — sem `torch`, sem `onnxruntime`, e o OpenCV instalado
não traz `dnn_superres`. Verificado, não suposto.

Ampliar com Lanczos aumenta dimensão e não devolve detalhe nenhum. O
briefing proíbe exatamente isso, então a saída foi a outra que ele
mesmo autoriza: **mudar o enquadramento**.

### A medição que virou direção de arte

Nitidez da fotografia de nogueira, em faixas de 100 px (desvio do
laplaciano vertical):

```
x  700..799   13,60      ← em foco
x  900..999    9,61
x 1100..1199   5,01
x 1400..1499   3,19      ← fora de foco
x 1800..1899   2,56
```

A profundidade de campo é curta: só a faixa esquerda está nítida. O
recorte vai até x=1560 e para ali.

Daí saem os dois tetos de exibição:

| peça | fonte | teto na tela | densidade a 2× |
| --- | --- | --- | --- |
| folha de nogueira | 840 px | **420 px** | 2,00× |
| ambiente (closet) | 1570 px | **820 px** | 1,91× |

**É por isso que a cena abre num quadro estreito.** Não é estilo: é o
que a fotografia aguenta. O quadro então se abre até 820 px, e para.
A fotografia nunca é esticada além da própria resolução em momento
nenhum da sequência.

---

## 3. A NOVA ANIMAÇÃO — ARCHITECTURAL REVEAL

Três atos, dirigidos por GSAP + ScrollTrigger, sem WebGL:

1. **O quadro abre.** O recorte cresce da esquerda para a direita
   enquanto o quadro desliza meia-tampa — a folha nasce centrada na
   coluna e o enquadramento se abre para os dois lados.
2. **A folha desliza.** Para fora, pela esquerda, com 5° de giro em Y
   no desktop. Pouco de propósito: o suficiente para a aresta
   iluminada aparecer, pouco o bastante para uma fotografia plana não
   se denunciar plana.
3. **O ambiente assenta.** De 1,06 para 1,00 de escala. Há folga para
   6% e não muito mais — ampliar além disso trocaria nitidez por
   movimento.

A folha tem uma **aresta de 10 px** na borda livre. Sem ela a peça lê
como papel colado sobre a foto, que é o que o briefing proíbe.

### A composição em duas colunas resolve uma classe inteira de bugs

Texto à esquerda, imagem à direita. Eles **nunca dividem o mesmo
pixel**.

A V8 e a V9 gastaram duas rodadas medindo contraste de texto sobre uma
cena que passava por baixo dele — véus ancorados na coluna, recuo por
geometria com histerese, fundo sólido em botão. Nada disso existe
aqui, porque não há o que medir.

---

## 4. O CAPÍTULO DE MATERIALIDADE

Era uma peça desenhada: quatro `div` em `preserve-3d` com textura de
canvas, girando. Saiu pelo mesmo motivo do armário — superfície
procedural não convence de perto, que é justamente onde um capítulo
sobre **acabamento** é julgado.

No lugar: a fotografia da nogueira, com o enquadramento percorrendo a
superfície e uma luz rasante atravessando uma vez. A luz rasante é
legítima — é um fenômeno de **iluminação**, e o veio que ela revela é
o veio que a fotografia já tem.

---

## 5. O QUE A MUDANÇA QUEBROU, E FOI CONSERTADO

Com a fotografia atrás do texto, o teste de contraste achou coisas que
estavam erradas **desde antes** e nunca tinham sido medidas:

| achado | o que era | correção |
| --- | --- | --- |
| `materia__passo-p` 2,41:1 · `passo-n` 3,16:1 · `nota` 2,43:1 | texto usando `--on-surface-2` e `--accent-on`, que são tons de tema CLARO, numa seção escura | cores do tema escuro |
| texto da materialidade cruzando a borda da foto por 16 px em 1440 | coluna com 33rem | 30rem, e lado a lado só a partir de 1100 px |
| `Ver projetos` do hero 4,22:1 e 1,47:1 | `.btn--outline` tem 4% de preenchimento e vive sobre uma **fotografia** | fundo próprio de 76% no hero: pior caso possível passa a ser 7,9:1 |

O botão do hero é um defeito antigo. Nunca tinha aparecido porque os
testes anteriores só olhavam a seção de abertura.

---

## 6. PERFORMANCE — MEDIDO, NÃO ESTIMADO

Bytes efetivamente baixados até o fim da seção de abertura:

| | V9 desktop | V9 celular | reimaginada |
| --- | --- | --- | --- |
| JavaScript | 929 KB | 211 KB | **174 KB** |
| CSS | 90 KB | 90 KB | **77 KB** |
| imagens | 143 KB | 55 KB | 297 / 165 KB |
| **total** | **4452 KB** | **3645 KB** | **807 KB** |

Duas observações honestas:

- **As imagens subiram.** A cena agora é fotografia de verdade em vez
  de textura gerada em canvas. É o custo da decisão, e ele é pequeno
  perto do que saiu.
- **A maior economia não foi o 3D.** Foi o filme: 3,0 MB, **79% do
  peso da página**, que o navegador baixava antes de a pessoa chegar
  perto dele. `preload="none"` resolveu — medido, **0 KB** antes de
  rolar até lá, contra 3033 KB na V9.

---

## 7. O QUE NÃO FOI FEITO, E O QUE NÃO PÔDE SER VERIFICADO

- **Lighthouse, LCP, CLS e INP: não medidos.** Não há Lighthouse neste
  ambiente, e números de uma máquina sem GPU descreveriam a máquina.
- **O filme não pôde ser verificado tocando.** O Chromium daqui
  devolve `""` para `canPlayType('video/mp4; codecs="avc1.42E01E"')` —
  **não decodifica H.264**. Vale para a V9 também, então não é
  regressão; é limitação do ambiente. O que dá para afirmar, porque foi
  medido: o arquivo deixou de ser baixado antes da hora, e passa a ser
  baixado quando a seção se aproxima.
- **Nenhuma publicação.** A V9 continua intacta em `../fratelli-moveis-v9/`.
- **A procedência da fotografia de nogueira não está confirmada.** Ela
  foi enviada como referência visual. Está em `PENDENCIAS.md` como
  bloqueio 🔴 antes de publicar.
- **As outras seções** (hero, portfólio, ambientes, processo, sobre,
  avaliações, contato) receberam correções pontuais de contraste e de
  carregamento, não um redesenho. A repaginação profunda ficou nas duas
  seções que estavam quebradas.
