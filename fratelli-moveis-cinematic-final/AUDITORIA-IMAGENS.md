# Auditoria de imagens — Cinematic Final

Levantamento completo do acervo, feito antes de qualquer decisão de
direção de arte. Foi ele que definiu a composição da nova seção.

## O teto do acervo

**Nenhum arquivo deste projeto passa de 1600 px de largura.**
Verificado em `tools/source/`, `assets/images/` e `tools/ref/`.

| origem | dimensões | usada em |
| --- | --- | --- |
| `closet.jpg` | 1600 × 943 | reveal-closet (nova) |
| `sala.jpg` | 1600 × 874 | projeto sala |
| `home-office.jpg` | 1600 × 872 | projeto home office |
| `banheiro.jpg` | 1600 × 875 | projeto banheiro |
| `amb-closet.jpg` | 1600 × 924 | faixa de ambientes |
| `amb-home-office.jpg` | 1600 × 878 | faixa de ambientes |
| `ref-sala.jpg` | 1536 × 1024 | hero · gerada por IA |
| `ref-gourmet.jpg` | 1536 × 1024 | ambientes · gerada por IA |
| `showroom.jpg` | 1254 × 1254 | sobre |
| `dormitorio.jpg` | 1080 × 1293 | projeto dormitório |
| `painel-tv.jpg` | 1080 × 1431 | projeto painel de TV |
| **`amb-cozinha.jpg`** | **368 × 420** | faixa de ambientes |
| `tools/ref/26.jpg` | 2000 × 2000 | **nogueira — procedência não confirmada** |

## A imagem de "Cada ambiente começa por dentro"

**Pedido:** encontrar o original e, se possível, entregar ~3840 × 2160.

**Encontrado:** `tools/source/closet.jpg`, **1600 × 943**. É o maior
que existe. A V9 entregava 1540 × 866 — o original é 4% maior.

**Restauração:** não há super-resolutor neste ambiente. Verificado:
`torch` ausente, `onnxruntime` ausente, OpenCV 5.0 sem
`dnn_superres`. Interpolação aumenta dimensão sem devolver detalhe, e
o briefing proíbe tratar isso como recuperação.

**O que foi feito:**

1. reenquadrada a partir do original, aproveitando 30 px de largura
   que a V9 descartava → **1570 × 883**;
2. acabamento de 0,55 (bilateral + máscara de nitidez), o mesmo da
   escada anterior — limpa compressão, não cria detalhe;
3. escada de 400 / 600 / 900 / 1200 / 1570 em AVIF, WebP e JPEG, com
   `srcset` e `sizes` próprios por breakpoint;
4. **o enquadramento foi limitado a 820 px de tela**, onde 1570 px dão
   1,91× de densidade.

O item 4 é a correção de verdade. A imagem não ficou mais nítida — ela
deixou de ser pedida em um tamanho que não aguenta.

## A fotografia de nogueira

`tools/ref/26.jpg`, 2000 × 2000. Fotografia real de uma folha de
nogueira, enviada como referência visual.

Nitidez medida em faixas de 100 px (desvio do laplaciano vertical):

```
x  700.. 799   13,60   ← em foco
x  900.. 999    9,61
x 1100..1199    5,01
x 1400..1499    3,19   ← fora de foco
x 1800..1899    2,56
```

Profundidade de campo curta. O recorte usado vai de x=700 a x=1560 e
de y=870 a y=1995 — **860 × 1125**, inteiramente dentro da zona
utilizável. Entregue em 300 / 420 / 560 / 840.

Teto de exibição: **420 px de tela** (2,00× em densidade 2×).

**Procedência não confirmada. Ver `PENDENCIAS.md`.**

## Classificação — preservada

| imagem | classificação na página |
| --- | --- |
| closet do reveal | **Projeto em 3D** |
| projetos do portfólio | **Projeto em 3D** / **Projeto executado** |
| sala do hero, gourmet | **Imagem de referência** |
| nogueira | descrita no texto como fotografia de referência de material |

Nenhuma renderização é apresentada como obra entregue. Nenhuma imagem
de referência é atribuída à Fratelli.

---

## Acrescentado na Cinematic Final

### Os 16 quadros do perfil C

`assets/images/sequencia/q-00.webp` … `q-15.webp`, **480 × 760**,
WebP q72, **134 KB no total** (~8 KB por quadro), mais
`indice.json`.

**Não são fotografia e não são imagem de referência.** São capturas
do **mesmo modelo Three.js** que o perfil A roda, geradas por
`tools/render-sequencia.js` a partir da linha de tempo real, em 16
posições. A classificação que vale para elas é a mesma do capítulo
que ilustram: **visualização conceitual** — o `index.html` já diz, na
própria seção, que o módulo é um desenho conceitual e não um móvel
instalado.

Nenhuma delas é atribuída a uma obra da Fratelli, em lugar nenhum da
página.

### A fotografia de cozinha — limite confirmado, de novo

Reauditada nesta versão, a partir do arquivo de origem:

```
origem  tools/source/amb-cozinha.jpg   368 x 420
recorte 4:5 centrado                 -> 336 x 420
```

**O recorte já usa tudo o que existe.** Não há pixel adicional para
extrair: a entrega anterior já era o máximo do original. Aplicado
apenas tratamento moderado (bilateral 5/26/9 + máscara de nitidez
1,38/−0,38), sem ampliação e sem super-resolução, conforme o §14.
Acutância medida depois do tratamento: **11,21**.

O cartão é exibido em `sizes="(min-width: 900px) 22rem, 15rem"` —
352 px de tela no desktop, ou seja 0,95× em densidade 1 e 0,48× em
densidade 2. **Fica limitado a cartão pequeno**, e não suporta
ampliação em tela cheia como os outros. Pendência registrada em
`PENDENCIAS.md`.

### As comparações antes/depois

`tools/ref/comparacao/` — 8 imagens, 169 KB. São capturas de tela do
próprio site, em 1440×900 e 390×844, a 12% e 40% da linha do tempo,
na versão anterior (`antes`) e nesta (`depois`). Material de trabalho:
não vão para o ar, ficam em `tools/`, que o `make-zip.py` não
empacota.
