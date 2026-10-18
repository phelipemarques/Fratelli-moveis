# Testes — Reimaginação

Tudo executado em Chromium (Playwright). Os scripts estão em `tools/`;
as fotografias de prova, em `tools/provas/`.

```
python3 -m http.server 8092                 # na raiz do projeto
node tools/teste-contraste.js http://localhost:8092/
node tools/teste-funcional.js http://localhost:8092/
node tools/teste-cena.js      http://localhost:8092/
```

**A seção 6 diz o que NÃO foi medido, e por quê.**

---

## 1. CONTRASTE REAL EM 11 LARGURAS

99 estados: 11 larguras × 9 paradas de rolagem, a página inteira.

Em cada parada a tela é fotografada **duas vezes** — a segunda com os
glifos em `color: transparent` — e o fundo verdadeiro atrás de cada
bloco de texto é lido da segunda. O contraste sai daí, pela fórmula da
WCAG.

| tela | transbordo horizontal | pior contraste da página |
| --- | --- | --- |
| 320×568 | 0 px | 5,41:1 |
| 360×800 | 0 px | 5,41:1 |
| 375×667 | 0 px | 5,41:1 |
| 390×844 | 0 px | 5,41:1 |
| 414×896 | 0 px | 5,41:1 |
| 430×932 | 0 px | 5,41:1 |
| 768×1024 | 0 px | 5,41:1 |
| 1024×768 | 0 px | 5,41:1 |
| 1280×800 | 0 px | 5,41:1 |
| 1440×900 | 0 px | 5,41:1 |
| 1920×1080 | 0 px | 5,41:1 |

**Nenhum bloco abaixo do mínimo da WCAG AA. Zero transbordo. Zero erro
de página.**

### Quatro correções no próprio instrumento

A primeira versão deste teste acusou **23 colisões em 1440** e todas
eram falsas. Vale registrar as quatro, porque cada uma errava *a favor*
ou *contra* por um motivo diferente:

| erro | o que ele fazia | sintoma |
| --- | --- | --- |
| comparar retângulos | acusava texto sobre imagem sempre que os retângulos se cruzavam | 23 falsos positivos; a seção de materialidade põe texto sobre foto **de propósito**, com vinheta |
| esconder o elemento | `visibility: hidden` tira também o **fundo** dele | botão com preenchimento próprio lia 1,00:1 |
| medir elementos sem letra | um `<a>` que embrulha só uma foto descia até o `<img>` | 3,8:1 para um elemento sem uma letra |
| medir o que ainda não chegou | bloco a 30% de opacidade, no meio da entrada | 1,47:1 num botão **invisível** na fotografia do recorte |

A última é a terceira vez que ela aparece neste projeto — a V8 e a V9
já tinham caído nela. Agora o teste espera a opacidade estabilizar em
duas leituras seguidas e exige 0,9 de opacidade efetiva (do elemento e
de todos os pais) antes de medir qualquer coisa.

### O que o teste encontrou de verdade

| achado | contraste | onde |
| --- | --- | --- |
| `materia__passo-p` | 2,41:1 | texto de tema claro numa seção escura |
| `materia__nota` | 2,43:1 | idem |
| `materia__passo-n` | 3,16:1 | idem |
| `Ver projetos` (hero) | 4,22:1 e 1,47:1 | contorno com 4% de fundo sobre fotografia |

Todos corrigidos. O do hero era defeito **anterior** a esta rodada.

---

## 2. A CENA, ESTADO POR ESTADO

Pelo caminho real da rolagem, nas duas composições.
`tools/provas/cena-*.png`.

### Desktop (1440×900) — com pin

| progresso | folha (x) | quadro (x, largura) | texto cruza o quadro | transbordo |
| --- | --- | --- | --- | --- |
| 0% | 817 | 817 · 694 | não | 0 |
| 25% | 714 | 714 · 694 | não | 0 |
| 50% | 547 | 680 · 694 | não | 0 |
| 75% | 236 | 680 · 694 | não | 0 |
| 100% | 234 | 680 · 694 | não | 0 |

### Celular (390×844) — **sem pin**

| progresso | folha (x) | quadro (x, largura) | texto cruza o quadro | transbordo |
| --- | --- | --- | --- | --- |
| 0% | 73 | 73 · 350 | não | 0 |
| 25% | 33 | 33 · 350 | não | 0 |
| 50% | −58 | 20 · 350 | não | 0 |
| 75% | −239 | 20 · 350 | não | 0 |
| 100% | −240 | 20 · 350 | não | 0 |

**Rolagem reversa:** nas duas telas a folha volta exatamente ao ponto
de partida (desktop 817 → 817; celular 73 → 73).

**O texto nunca cruza o quadro, em estado nenhum.** É consequência da
composição em duas colunas, não de um ajuste.

---

## 3. FUNCIONAIS — 23 de 23

| o quê | resultado |
| --- | --- |
| menu em celular: abre | OK |
| menu: trava a rolagem do fundo enquanto aberto | OK |
| menu: fecha com Escape | OK |
| menu: devolve a rolagem ao fechar | OK |
| ampliação de projeto: abre | OK |
| ampliação: mostra a classificação da imagem | OK |
| ampliação: fecha com Escape | OK |
| ampliação: **reabre** depois de fechada | OK |
| ampliação: sem erro de página | OK |
| galeria: 6 cartões, área rolável nativa (`overflow-x: auto`) | OK |
| galeria: no celular **não usa pin** | OK |
| galeria: não prende a rolagem vertical | OK |
| vídeo: elemento e fonte presentes | OK |
| movimento reduzido: **nenhuma cena montada** (0 gatilhos) | OK |
| movimento reduzido: folha e ambiente visíveis (díptico) | OK |
| movimento reduzido: texto inteiro visível | OK |
| sem JavaScript: seção e texto estão no HTML | OK |
| rolagem rápida (14 × 1600 px): a página não prende | OK |
| rolagem rápida: nenhum bloco visível fica invisível | OK |
| redimensionar celular → desktop → celular: sem transbordo | OK |
| redimensionar: a folha volta a x = 0 | OK |
| rolagem/redimensionamento: sem erro | OK |

O `matchMedia` monta e **desmonta** a cena a cada troca de faixa, e é
isso que impede transformação acumulada no redimensionamento.

---

## 4. A PRÉVIA DE ARQUIVO ÚNICO, OFFLINE

Aberta de `file://`, sem servidor:

| tela | cena montada | folha deslizou | pedidos externos | erros |
| --- | --- | --- | --- | --- |
| 1440×900 | sim | sim | 1 | nenhum |
| 390×844 | sim | sim | 1 | nenhum |

O único pedido externo é o `favicon.ico` do mapa do Google embutido na
seção de contato. A página em si é autossuficiente.

---

## 5. PESO DA PÁGINA — MEDIDO

Bytes baixados até o fim da seção de abertura:

| | V9 desktop | reimaginada | diferença |
| --- | --- | --- | --- |
| JavaScript | 929 KB | 174 KB | **−755 KB** |
| CSS | 90 KB | 77 KB | −13 KB |
| imagens | 143 KB | 297 KB | +154 KB |
| vídeo | 3033 KB | **0 KB** | **−3033 KB** |
| **total** | **4452 KB** | **807 KB** | **−82%** |

As imagens sobem porque a cena passou a ser fotografia de verdade. O
vídeo zera porque `preload="none"` só o busca quando a seção chega a
300 px da tela — medido: 0 KB antes de rolar, 3033 KB depois.

---

## 6. O QUE NÃO FOI MEDIDO

**Lighthouse, LCP, CLS, INP: não medidos.** Não há Lighthouse neste
ambiente, e a máquina não tem GPU — os números descreveriam a máquina.

**O filme não pôde ser verificado tocando.** Este Chromium devolve
`""` para `canPlayType('video/mp4; codecs="avc1.42E01E"')`: não
decodifica H.264. Vale igualmente para a V9, então não é regressão —
é limitação do ambiente. O que foi medido é o carregamento, não a
reprodução.

**Nenhuma validação em aparelho real**, de nenhum tipo.
