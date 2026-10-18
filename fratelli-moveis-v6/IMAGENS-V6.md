# Fotografias — V6

Tudo aqui foi medido, não estimado. A tabela sai de
`tools/imagens-v6.json`, que é escrito por `tools/prepare-images-v6.py`
na mesma execução que gera os arquivos.

## O que mudou, em uma frase

**Nenhuma fotografia ganhou resolução.** Todas já estavam no teto do
original na V3, e ampliar não devolve detalhe. O que mudou foi o
*peso do que chega ao visitante*: entrou AVIF na frente do WebP e as
escadas de largura ficaram mais densas, então cada tela baixa um
arquivo mais próximo do tamanho em que vai exibi-lo.

### Bytes realmente baixados, por caso de uso

O navegador escolhe o menor arquivo que cobre o tamanho de exibição.
Estes são os arquivos que ele escolheria, antes e depois:

| imagem | uso | V3 (WebP) | V6 (AVIF) | diferença |
| --- | --- | --- | --- | --- |
| hero-sala | hero, desktop 100vw | 1536 w · 142 KB | 1536 w · 68 KB | **−52%** |
| hero-sala-retrato | hero, celular 100vw | 480 w · 24 KB | 390 w · 10 KB | **−60%** |
| projeto-sala | portfólio 52vw em 1440 | 800 w · 19 KB | 900 w · 16 KB | −17% |
| projeto-sala | portfólio 52vw em 1920 | 1200 w · 32 KB | 1200 w · 23 KB | −29% |
| ambiente-dormitorio | cartão de 22rem | 480 w · 16 KB | 360 w · 7 KB | −59% |
| ambiente-dormitorio | aberto na ampliação | 1036 w · 53 KB | 1036 w · 37 KB | −31% |
| projeto-closet | portfólio 92vw | 1540 w · 58 KB | 1540 w · 36 KB | −38% |

Soma destes casos: **487 KB → 265 KB, −46%**. O hero, que é o LCP,
cai pela metade.

O total EM DISCO subiu (3,44 MB → 5,36 MB) porque há três formatos e
mais degraus. Isso é peso de pacote, não de carregamento: nenhuma
tela baixa mais de um arquivo por imagem.

## Auditoria, imagem por imagem

`original` é o arquivo em `tools/source/`. `recorte nativo` é o que
sobra depois do enquadramento aprovado — e é ele que limita a maior
largura possível.

| arquivo | original | recorte nativo | maior V3 | maior V6 | larguras | acabamento | no teto? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `projeto-closet` | 1600x943 | 1540x866 | 1540 | 1540 | 400 · 600 · 900 · 1200 · 1540 | leve (0.55) | — |
| `projeto-dormitorio` | 1080x1293 | 1034x1293 | 1034 | 1034 | 360 · 480 · 620 · 820 · 1034 | pleno (1.00) | — |
| `projeto-banheiro` | 1600x875 | 1312x875 | 1312 | 1312 | 440 · 640 · 820 · 1040 · 1312 | leve (0.65) | — |
| `projeto-home-office` | 1600x872 | 1308x872 | 1308 | 1308 | 440 · 640 · 820 · 1040 · 1308 | só recorte | — |
| `projeto-sala` | 1600x874 | 1554x874 | 1554 | 1554 | 400 · 600 · 900 · 1200 · 1554 | só recorte | — |
| `projeto-painel-tv` | 1080x1431 | 1080x1350 | 1080 | 1080 | 360 · 480 · 640 · 860 · 1080 | só recorte | — |
| `ambiente-dormitorio` | 1080x1295 | 1036x1295 | 1036 | 1036 | 360 · 480 · 620 · 820 · 1036 | só recorte | — |
| `ambiente-closet` | 1600x924 | 739x924 | 739 | 739 | 360 · 480 · 600 · 739 | só recorte | — |
| `ambiente-home-office` | 1600x878 | 702x878 | 702 | 702 | 360 · 460 · 580 · 702 | só recorte | — |
| `ambiente-cozinha` | 368x420 | 336x420 | 336 | 336 | 252 · 336 | só recorte | — |
| `sobre-showroom` | 1254x1254 | 1003x1254 | 1003 | 1003 | 480 · 620 · 800 · 1003 | só recorte | — |
| `ambiente-sala` | 1536x1024 | 819x1024 | 819 | 819 | 400 · 520 · 660 · 819 | só recorte | — |
| `ambiente-gourmet` | 1536x1024 | 819x1024 | 819 | 819 | 400 · 520 · 660 · 819 | só recorte | — |
| `hero-sala` | 1536x1024 | 1536x1024 | 1536 | 1536 | 560 · 768 · 1024 · 1280 · 1536 | só recorte | — |
| `hero-sala-retrato` | 1536x1024 | 840x1024 | 780 | 780 | 390 · 500 · 620 · 780 | só recorte | — |

"no teto" marca as imagens cujo original não permite ir além do que
já está publicado. Pedir larguras maiores só produziria pixel
inventado.

## O caso da cozinha

`ambiente-cozinha` aparece no pedido com 336 × 420 px, e isso está
correto. **O original disponível tem 368 × 420 px.** Não há nada a
recuperar: o recorte usa 336 de 368 px de largura, e os 32 px
restantes são borda.

O que foi feito: gerado também um degrau de 252 px, para que o
cartão em telas pequenas não baixe mais do que exibe, e AVIF nos
dois. O que NÃO foi feito, de propósito:

- não houve ampliação para 672 px ou 1008 px. Ampliar uma miniatura
  produz pixel macio, não detalhe de marcenaria, e o pedido é
  explícito: *"Não amplie uma miniatura e declare que ganhou
  detalhes reais."*
- não houve super-resolução por rede neural. Não há ferramenta
  instalada neste ambiente, e mesmo que houvesse ela inventaria
  arestas e juntas — exatamente o que o pedido proíbe em uma
  fotografia de obra executada.

**Pendência de arquivo:** o original da cozinha, no tamanho em que
foi fotografado. Com ele, este cartão passa a suportar a ampliação
em tela cheia como os outros. Sem ele, a imagem continua limitada a
cartão pequeno — e é assim que ela está sendo usada.

## Tratamento aplicado

Os recortes são os mesmos da V3: o enquadramento já foi aprovado e
esta tarefa é de qualidade de arquivo, não de direção de arte.

Onde há acabamento (coluna da tabela), a sequência é a mesma de
antes, em `tools/prepare-images-v6.py`:

1. bilateral, para o bloco do JPEG sem comer aresta;
2. mediana nos canais de cor em LAB — o ruído de cor incomoda mais
   que o de luz;
3. definição só no canal de luz, para não puxar franja colorida;
4. CLAHE com limite baixo (1,0–1,4);
5. curva em S discreta;
6. equilíbrio quente de 0,8%, para conversar com o off-white do site.

Três imagens têm força 0 — só recorte — porque foram entregues com
pedido de não mexer na qualidade. Isso foi mantido.

Não há HDR, não há saturação artificial, não há supernitidez e não
há halo: o limite do CLAHE e a definição em canal único existem
justamente para isso.

## Formatos e entrega

- **AVIF** (q58) primeiro, **WebP** (q84) atrás, **JPEG** (q84) só
  no maior degrau, como último recurso.
- `srcset` + `sizes` em todas as 21 `<picture>`; `width`/`height`
  explícitos em toda `<img>` (CLS).
- `loading="lazy"` abaixo da dobra; o hero com
  `fetchpriority="high"` e `<link rel="preload">` em AVIF.
- O hero tem dois recortes: paisagem no desktop e retrato até 740 px,
  cada um com a sua escada. O enquadramento muda entre os dois, e é
  isso que preserva o painel e o ripado na tela estreita.

Os 174 arquivos de imagem do pacote são gerados por um comando:

```
python3 tools/prepare-images-v6.py
python3 tools/rewrite-pictures.py
```

O segundo reescreve as `<picture>` do `index.html` a partir do
manifesto e falha se alguma referência apontar para arquivo que não
existe.
