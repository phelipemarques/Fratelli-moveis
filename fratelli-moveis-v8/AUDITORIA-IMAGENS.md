# Auditoria de imagens — V8

A auditoria completa com medições por arquivo está em
`fratelli-moveis-v6/IMAGENS-V6.md` e continua valendo: o conjunto de
fotografias não mudou da V6 para cá, e o pipeline é o mesmo
(`tools/prepare-images-v6.py` + `tools/rewrite-pictures.py`).

Este documento registra o que foi reconferido na V8 e o que segue
pendente.

## O que foi reconferido

| item | situação |
| --- | --- |
| 21 `<picture>` no HTML | todas com AVIF → WebP → JPEG, `srcset`, `sizes` |
| `width`/`height` explícitos | em toda `<img>` (evita salto de layout) |
| `loading="lazy"` abaixo da dobra | sim |
| hero com prioridade | `<link rel="preload">` em AVIF + `fetchpriority="high"` |
| arquivos referenciados que não existem | nenhum (o `rewrite-pictures.py` falha se houver) |
| imagens quebradas em execução | nenhuma, em 8 larguras |

## O que mudou na V8

Nada no conteúdo das imagens. **Uma correção de exibição**, herdada da
V7.1 e que vale registrar aqui porque é um defeito de imagem:

`<picture>` é inline por padrão, e altura em porcentagem não resolve
contra um pai de altura automática. A fotografia da abertura vinha
saindo com a altura **intrínseca** dela:

| | antes | depois |
| --- | --- | --- |
| 390 × 844 | 390 × 219 (uma faixa no topo) | 394 × 852 |
| 1440 × 900 | 1440 × 810 | 1510 × 944 |

## A cozinha

`ambiente-cozinha` está em **336 × 420 px** porque **o original
disponível em `tools/source/amb-cozinha.jpg` tem 368 × 420 px**. O
recorte usa 336 dos 368 px de largura; os 32 restantes são borda.

O que foi feito: um degrau adicional de 252 px, para telas pequenas
não baixarem mais do que exibem, e AVIF nos dois.

O que **não** foi feito, de propósito:

- **não** houve ampliação para 672 ou 1008 px — ampliar uma miniatura
  produz pixel macio, não detalhe de marcenaria;
- **não** houve super-resolução por rede neural — não há ferramenta
  instalada aqui, e mesmo que houvesse ela **inventaria** arestas e
  juntas numa fotografia de obra executada.

A imagem é usada apenas como cartão de 22rem (352 px), que é o uso que
a resolução dela suporta. Na ampliação em tela cheia ela fica abaixo
das outras — e é por isso que o arquivo original continua na lista de
pendências.

**Pendência:** o arquivo da cozinha no tamanho em que foi fotografado.
Com ele, este cartão passa a suportar a ampliação como os demais.

## Fotografias não confirmadas

`ref-sala.jpg` e `ref-gourmet.jpg` seguem rotuladas como **imagem de
referência** porque nunca foi confirmado se são obra da Fratelli. A
`ref-sala.jpg` é também a fotografia do hero, onde aparece sem rótulo.
A pergunta está aberta desde a V1 e detalhada em `PENDENCIAS.md`.

Nenhuma fotografia real foi substituída, e nenhuma classificação
(**Projeto em 3D** / **Projeto executado** / **Imagem de referência**)
foi alterada.
