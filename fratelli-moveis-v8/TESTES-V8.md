# Testes — V8

Tudo medido. O bruto está em `tools/teste-sobreposicao-resultado.json`
e `tools/teste-abertura-resultado.json`.

```
python3 -m http.server 8095                      # em fratelli-moveis-v8/
node tools/teste-sobreposicao.js http://localhost:8095/
node tools/teste-abertura.js     http://localhost:8095/
```

Navegador: Chromium (Playwright). WebGL por software (SwiftShader) nas
execuções com GL; `--disable-webgl --disable-webgl2` nas execuções sem.
**A seção 6 diz o que essa escolha impede de afirmar.**

---

## 1. SOBREPOSIÇÃO — o teste principal

72 estados: 8 larguras × 6 progressos com WebGL, mais 4 larguras × 6
progressos **sem** WebGL.

Três medidas por estado, e só a terceira reprova:

1. **folga geométrica** entre o retângulo da cena e a união dos blocos
   de texto;
2. **pixels alterados** quando a cena é escondida — informativo;
3. **contraste real** do texto contra o fundo que está efetivamente
   atrás dele (WCAG AA: 4,5:1 normal, 3,0:1 grande) — **este reprova**.

### Resultado

`R` = texto recuado · o número é o **pior contraste** do estado

| tela | perfil | WebGL | 0% | 20% | 40% | 60% | 80% | 100% |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1920×1080 | A | sim | 5,0 | 5,3 | 5,3 | R 6,5 | R 6,2 | R 5,3 |
| 1440×900 | A | sim | 5,0 | 5,3 | 5,3 | R 6,5 | R 6,4 | R 5,0 |
| 1280×800 | A | sim | 5,0 | 5,3 | 5,3 | R 6,5 | R 6,5 | R 5,7 |
| 768×1024 | B | sim | R 6,6 | R 6,6 | R 6,6 | R 6,6 | R 6,4 | R 5,7 |
| 430×932 | B | sim | R 16,4 | R 6,6 | R 6,6 | R 6,6 | R 6,6 | R **4,5** |
| 390×844 | B | sim | R 16,4 | R 6,6 | R 6,6 | R 6,6 | R 6,6 | R 4,5 |
| 360×800 | B | sim | R 16,4 | R 6,6 | R 6,6 | R 6,6 | R 6,6 | R 4,6 |
| 320×568 | B | sim | R 16,3 | R 6,6 | R 6,6 | R 6,6 | R 6,6 | R 4,6 |
| 1920×1080 | B | **não** | 4,8 | 5,4 | 5,4 | 5,4 | R 5,8 | R 5,4 |
| 1440×900 | B | **não** | 4,9 | 5,4 | 5,4 | 5,4 | R 6,0 | R 5,1 |
| 1280×800 | B | **não** | 4,9 | 5,5 | 5,5 | 5,5 | R 6,2 | R 5,6 |
| 768×1024 | B | **não** | R 6,0 | R 6,0 | R 6,0 | R 6,0 | R 5,9 | R 5,6 |

**71 de 72 estados acima de 4,5:1.**

O único fora: `430×932 @100%`, o botão de pular, em **4,50** — sobre a
linha, do lado de dentro por uma casa decimal. Mesmo botão em 390 dá
4,5 e em 360 dá 4,6. Não vou chamar de aprovado nem de reprovado: é um
empate com o limite, e está aqui para você saber que existe.

### Transbordo e erros

**0 px** de transbordo horizontal nas 12 execuções. **Nenhum erro de
página.**

### O caminho até aqui

A primeira execução reprovou **22 estados**. O que cada um era:

| achado | o que era | correção |
| --- | --- | --- |
| 2.5D em desktop largo cobrindo o texto desde 0% | a composição B só sabia ser celular | composição larga, peça à direita |
| recuo só a partir de 44% do progresso | número escolhido olhando o caso com WebGL | recuo por geometria medida, com histerese |
| primeiro quadro no estado padrão do CSS | o 2.5D só era desenhado no primeiro `onUpdate` | `progresso(0)` na montagem |
| nota em 3,83:1 **sem a cena** | o próprio tom `--slate-light` | `#A79E92` → `#BEB7AE` (5,16:1) |
| nota caindo para 4,1 **com** a cena | piso e sombra da cena clareando o fundo | véu da coluna reforçado |
| em 1920 o mesmo véu não bastava | paradas em % do viewport, texto centrado com teto | véu ancorado em `--veu-fim`, que acompanha a coluna |
| botão de pular em 1,4:1 sobre madeira | botão de contorno sobre superfície clara | fundo sólido próprio |
| botão sem fundo em 1920 @60% | o fundo dependia de `texto-recuado`, que ali ainda não tinha disparado | fundo passa a valer sempre que há cena |
| tablet 768 com folga de 1 px | tamanho da peça saltava em 600 px, composição em 900 | breakpoints alinhados em 900 px |

### Duas correções no próprio instrumento

**Primeira.** Tentei acelerar a contagem de pixels com uma conversão de
matriz e o resultado ficou errado: reportava 1% onde a medida real era
91%. Voltei à contagem direta. Por alguns minutos eu tinha um teste
que passava sem motivo.

**Segunda.** O teste media o retângulo do invólucro `.abertura__acoes`,
que é maior que o botão e cuja sobra cai sobre a fotografia nua. Dava
4,5:1 num botão que, no seu próprio retângulo, está em 16:1. Agora
desce até o elemento que de fato carrega texto.

Registro as duas porque um teste que erra a favor é pior do que não
ter teste.

---

## 2. ABERTURA DAS PORTAS

A frente do móvel está em **z = +0,290**. Qualquer leitura abaixo disso
é folha entrando na carcaça.

| progresso | ponta esquerda | ponta direita |
| --- | --- | --- |
| 0% | z +0,300 | z +0,300 |
| 20% | z +0,408 | z +0,408 |
| 40% | z +1,129 | z +1,129 |
| 60–100% | z +1,143 | z +1,143 |

Simétrico, sempre à frente, nas três telas de desktop. No 2.5D, medido
pela matriz de transformação do elemento: as duas pontas vão a
**z = +161** (ou +128 abaixo de 380 px, onde a peça é menor).

**Reversão:** as rotações voltam a **0,000** exatamente, nas oito telas.

**Câmera dentro de painel:** nunca, em nenhuma amostra.

**Enquadramento no ato da abertura completa:** 92% da altura em 1280,
1440 e 1920, com os oito cantos do `Box3` dentro de ±1 em NDC.

No perfil 2.5D a peça ocupa 101–118% da largura em celular (o que sai
do quadro são as **portas**, não o vão) e **60% × 53% no tablet de
768**. Esse número caiu de propósito: o salto de tamanho da peça foi
movido de 600 px para 900 px, para bater com o ponto em que a
composição muda. Antes o tablet ganhava a peça grande com a
coreografia estreita e a folga contra o texto era de **1 px**. A troca
é consciente — menos presença no tablet, nenhuma colisão.

---

## 3. SEM WebGL, em tela larga

O caso que estava quebrado. `--disable-webgl --disable-webgl2`, 1440 ×
900:

| | antes | depois |
| --- | --- | --- |
| 0% | nota atravessada pela madeira | folga de 219 px, contraste 4,9 |
| 40% | móvel sobre "Espessura de painel…" | folga de 170 px, contraste 5,4 |

---

## 4. MOVIMENTO REDUZIDO E SEM JAVASCRIPT

| situação | resultado |
| --- | --- |
| `prefers-reduced-motion: reduce` | perfil **C**: fotografia estática, texto legível, nenhum módulo 3D baixado |
| texto recuado sob movimento reduzido | a regra é anulada — o texto permanece visível |
| sem JavaScript (`html.no-js`) | a seção fica inteira: fotografia, texto e botão, sem buraco reservado a cena nenhuma |

---

## 5. INDEXAÇÃO

| arquivo | `robots` |
| --- | --- |
| `index.html` (produção) | `noindex, nofollow` — até a URL existir |
| `fratelli-moveis-v8-visualizacao.html` (prévia) | `noindex, nofollow`, **forçado pelo build** |

---

## 6. O QUE NÃO FOI MEDIDO

**FPS: não medido.** O navegador aqui roda WebGL por software. Qualquer
taxa descreveria esta máquina, não um aparelho real.

**Lighthouse, LCP, CLS e INP: não medidos**, pela mesma razão.

**A validação gráfica em GPU real continua pendente**, e é o primeiro
item antes de qualquer publicação.

O que dá para afirmar porque é verificável: um render loop só, desenho
sob demanda, parada fora da tela e com a aba escondida, teto de pixel
ratio, geometria e materiais compartilhados, `dispose()` completo, e
nenhuma geometria recriada por quadro.
