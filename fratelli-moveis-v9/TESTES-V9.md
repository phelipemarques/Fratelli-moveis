# Testes — V9

Tudo medido. O bruto está em `tools/teste-sobreposicao-resultado.json`
e `tools/teste-abertura-resultado.json`.

```
python3 -m http.server 8094                      # em fratelli-moveis-v9/
node tools/teste-sobreposicao.js http://localhost:8094/
node tools/teste-abertura.js     http://localhost:8094/
```

Navegador: Chromium (Playwright). WebGL por software (SwiftShader) nas
execuções com GL; `--disable-webgl --disable-webgl2` nas execuções sem.
**A seção 5 diz o que essa escolha impede de afirmar.**

---

## 1. SOBREPOSIÇÃO DO TEXTO — o teste principal

72 estados: 8 larguras × 6 progressos com WebGL, mais 4 larguras × 6
progressos **sem** WebGL. Três medidas por estado, e só a terceira
reprova: folga geométrica, pixels alterados ao esconder a cena, e
**contraste real do texto contra o fundo que está efetivamente atrás
dele** (WCAG AA: 4,5:1 normal, 3,0:1 grande).

`R` = texto recuado · o número é o **pior contraste** do estado

| tela | perfil | WebGL | 0% | 20% | 40% | 60% | 80% | 100% |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1920×1080 | A | sim | 5,3 | 5,3 | 5,3 | R 6,3 | R 6,2 | R 5,3 |
| 1440×900 | A | sim | 5,3 | 5,3 | 5,3 | R 6,3 | R 6,3 | R 5,1 |
| 1280×800 | A | sim | 5,3 | 5,3 | 5,3 | R 6,6 | R 6,4 | R 5,3 |
| 768×1024 | B | sim | R 6,6 | R 6,6 | R 6,6 | R 6,6 | R 6,6 | R 5,9 |
| 430×932 | B | sim | R 16,4 | R 6,6 | R 6,6 | R 6,6 | R 6,6 | R 4,6 |
| 390×844 | B | sim | R 16,4 | R 6,6 | R 6,6 | R 6,6 | R 6,6 | R 4,6 |
| 360×800 | B | sim | R 16,4 | R 6,6 | R 6,6 | R 6,6 | R 6,6 | R 4,6 |
| 320×568 | B | sim | R 16,3 | R 6,6 | R 6,6 | R 6,6 | R 6,6 | R 4,7 |
| 1920×1080 | B | **não** | 5,4 | 5,4 | 5,4 | 5,4 | R 6,0 | R 5,2 |
| 1440×900 | B | **não** | 5,4 | 5,4 | 5,4 | 5,4 | R 6,0 | R 4,9 |
| 1280×800 | B | **não** | 5,5 | 5,5 | 5,5 | 5,5 | R 6,1 | R 5,3 |
| 768×1024 | B | **não** | R 6,0 | R 6,0 | R 6,0 | R 6,0 | R 6,0 | R 5,0 |

**72 de 72 aprovados.** Transbordo horizontal: **0 px** nas 12
execuções. **Nenhum erro de página.**

A V8 entregou 71 de 72, com o botão de pular em 430×932 empatado em
4,50:1. Empate não é aprovação: o fundo do botão era 97% opaco e
deixava passar 3% da madeira clara. Opaco, o contraste do botão passou
a ser propriedade dele, igual em qualquer tela — 4,6:1.

### O caminho até aqui

Um móvel 37% mais largo e mais claro reabriu o que a V8 havia fechado:

| achado | o que era | correção |
| --- | --- | --- |
| nota em 3,35:1 em 1440×900 @0% | o desvio da câmera era 1,30, calibrado para um módulo de 1,80 m | desvio proporcional a `L` |
| lead e nota em 4,2–4,5:1 em 1440 e 1920 | véu da coluna insuficiente contra a moldura clara | platô do véu de 0,90 para 0,96 no fim da coluna |
| botão em 4,50:1 em 430×932 @100% | fundo a 97% | fundo opaco |

### A terceira correção no próprio instrumento

As duas primeiras estão em `TESTES-V8.md`. Esta foi a mais sorrateira.

Em 1920×1080 no progresso 0 o teste devolvia **16,6:1 numa execução e
2,1:1 na seguinte, no mesmo código**. O par de fotografias explicou: no
quadro "com cena" o texto ainda estava no meio da animação de entrada,
translúcido; no quadro "sem cena", tirado 120 ms depois, já estava
inteiro. O teste comparava dois momentos diferentes e culpava a cena
pela diferença.

Agora ele espera a opacidade dos blocos ficar igual em duas leituras
seguidas antes de medir. Depois disso os três desktops passaram a ler
5,3 de forma estável, em vez de oscilar.

Registro porque um instrumento que erra sete vezes para mais ou para
menos não serve para aprovar nem para reprovar nada — e por um tempo
foi com ele que eu estava decidindo.

---

## 2. ABERTURA DAS PORTAS

Refeito do zero: a geometria mudou, então nenhuma medida da V8 vale.

Em perfil A a frente da carcaça está em **z = +0,310** e a folha
fechada em **z = +0,321** (11 mm à frente, que é a moldura). Qualquer
leitura abaixo de +0,310 seria folha entrando na carcaça.

| progresso | ponta esquerda | ponta direita |
| --- | --- | --- |
| fechado | z +0,321 | z +0,321 |
| abrindo | z +0,394 | z +0,394 |
| metade | z +0,890 | z +0,890 |
| tela cheia em diante | z +0,899 a +0,901 | z +0,899 a +0,901 |

Nas **oito telas**: portas sempre para fora, simétricas, nunca
afundando na carcaça, e **câmera nunca dentro de um painel**.

**Reversão:** as rotações voltam a **0,000** exatamente — medido em
`−1,86 → −1,232 → 0` na volta.

**Enquadramento** (largura × altura ocupadas):

| momento | 1920×1080 | 1440×900 | 1280×800 |
| --- | --- | --- | --- |
| fechado | 30% × 52% | 30% × 48% | 30% × 48% |
| tela cheia | 61% × 95% | 67% × 95% | 67% × 95% |
| interior | 100% × 100% | 100% × 100% | 100% × 100% |

No perfil 2.5D a peça vai de 34–66% até 58–118% da largura conforme a
tela, sem transbordo horizontal em nenhuma.

---

## 3. OS SEIS ESTADOS PARADOS

`tools/provas/estado-*.png`, em 1440×900, pelo caminho real do site —
a cena é dirigida por `progresso` e é ela que enquadra. Nenhuma câmera
inventada no teste.

| estado | p05 | p50 | p95 | pixels estourados |
| --- | --- | --- | --- | --- |
| fechado | 22 | 52 | 98 | 0,0% |
| 25% | 22 | 59 | 119 | 0,0% |
| 50% | 40 | 69 | 133 | 0,0% |
| aberto | 35 | 72 | 160 | 0,0% |
| interior | 38 | 93 | 188 | 0,0% |
| detalhe | 33 | 85 | 164 | 0,0% |

Nenhum pixel estourado e nenhum preto fechado em nenhum estado. (Os
valores incluem o fundo escuro da página; só a face do móvel fechado dá
p05 36 / p50 61 / p95 95.)

**ANTES/DEPOIS:** `tools/provas/antes-depois-v9.png`, os seis estados da
V8 e da V9 lado a lado.

Um aviso sobre essa folha: as miniaturas têm 480 px para um render de
1440, e a redução cria o seu próprio moiré — a V9 parece mais ripada ali
do que é. Em 1:1 o veio lê como veio. Se for julgar o acabamento, olhe
`tools/provas/estado-*.png` em tamanho real, não a folha de contato.

---

## 4. MOVIMENTO REDUZIDO, SEM JAVASCRIPT, INDEXAÇÃO

| situação | resultado |
| --- | --- |
| `prefers-reduced-motion: reduce` | perfil **C**: fotografia estática, texto legível, nenhum módulo 3D baixado |
| sem JavaScript (`html.no-js`) | a seção fica inteira, sem buraco reservado a cena nenhuma |
| `index.html` (produção) | `noindex, nofollow` — até a URL existir |
| `fratelli-moveis-v9-visualizacao.html` | `noindex, nofollow`, **forçado pelo build** |

A prévia de arquivo único foi aberta de `file://` e **roda a cena em
perfil A, sem nenhum erro de página** — verificado, não suposto.

---

## 5. O QUE NÃO FOI MEDIDO

**FPS: não medido.** O navegador aqui roda WebGL por software. Qualquer
taxa descreveria esta máquina, não um aparelho real.

**Lighthouse, LCP, CLS e INP: não medidos**, pela mesma razão.

**A validação gráfica em GPU real continua pendente**, e é o primeiro
item antes de qualquer publicação. Em particular, a anisotropia foi
lida como 16 no SwiftShader; num aparelho real o número e o resultado
podem ser outros, e o veio é justamente o que mais depende disso.

**Blender não foi usado** — não está disponível neste ambiente.

O que dá para afirmar porque é verificável: um render loop só, desenho
sob demanda, parada fora da tela e com a aba escondida, teto de pixel
ratio, geometria e materiais compartilhados (as geometrias chanfradas
são reaproveitadas por medida), `dispose()` completo, e nenhuma
geometria recriada por quadro.
