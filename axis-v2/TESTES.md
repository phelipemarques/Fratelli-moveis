# AXIS V2 — testes e comparação com a V1

Todos os números abaixo foram medidos nesta sessão, com Chromium (Playwright
1.56) contra um servidor local (`python3 -m http.server`, **sem compressão**).
Nada foi estimado. O que não foi testado está no fim.

## Altura total da página (px)

Medida depois de rolar a página inteira (todas as animações concluídas).

| Largura | V1 | V2 | Diferença |
| --- | ---: | ---: | ---: |
| 320 | 16.576 | 13.097 | −21,0% |
| 360 | 15.753 | 12.410 | −21,2% |
| 375 | 15.449 | 12.251 | −20,7% |
| 390 | 15.213 | 12.140 | −20,2% |
| 414 | 14.965 | 12.031 | −19,6% |
| 430 | 14.700 | 12.068 | −17,9% |
| 768 | 14.046 | 13.082 | −6,9% |
| 1440 | 12.652 | 10.989 | −13,1% |

A V2 tem **mais** conteúdo visual (12 espaços de foto) e menos altura. Em 768 a
redução é menor porque os pilares de serviço viram blocos de duas colunas com
foto.

## Onde as informações começam (390 px)

| Começo de… | V1 | V2 |
| --- | ---: | ---: |
| Serviços | 2.170 | **976** |
| Fisioterapia | 4.655 | 3.774 |
| Contato | 13.195 | 10.605 |

## Altura das seções-chave (390 px)

| Seção | V1 | V2 |
| --- | ---: | ---: |
| Serviços | 2.485 | 2.118 (com 3 fotos) |
| Fisioterapia | 2.039 | 1.444 (com 1 foto) |
| Serviços + Fisioterapia | 4.524 | 3.562 |
| Diferenciais / Por que a AXIS | 1.173 | 680 |
| Para quem é | 1.284 | 954 |
| Conteúdos / Revista | 824 | 1.428 (matéria em destaque + índice, sem carrossel escondendo itens) |
| Histórias | 1.111 | 580 (sem depoimentos inventados) |

## Repetição visual (contagem no DOM)

| | V1 | V2 |
| --- | ---: | ---: |
| SVGs dentro de `<main>` | 71 | 33 |
| Blocos `article/figure/li` | 107 | 74 |
| Espaços preparados para `<img>` | 0 | 12 |

## Desempenho

4G lento emulado (150 ms de latência, 1,6 Mbps), CPU 4× mais lenta, 390 × 844,
DPR 2, cache desligado. Mediana de 3 execuções.

| | FCP | LCP | CLS | TBT* |
| --- | ---: | ---: | ---: | ---: |
| V1 | 1.140 ms | 1.140 ms | 0,008 | 258 ms |
| V2 (sem fotos) | 1.368 ms | 1.712 ms | 0 | 214 ms |
| V2 com 12 fotos de teste** | 1.516 ms | 1.920 ms | 0,013 | 228 ms |

\* Soma das tarefas longas acima de 50 ms até 5 s após a carga.
\** Fotos sintéticas geradas só para o teste, numa cópia descartável.

- Metas do briefing: LCP ≤ 2,5 s ✔, CLS < 0,1 ✔.
- O FCP da V2 é 0,23 s maior que o da V1 porque o núcleo do GSAP (28 KB com
  gzip) carrega antes da primeira pintura, para a timeline de abertura começar
  junto com a página. É uma troca consciente; com compressão no servidor a
  diferença diminui.
- Com fotos, a carga inicial no celular baixa só as 3 da abertura e as 3 dos
  serviços (AVIF, 480 a 640 px de largura em DPR 1); a galeria e a
  fisioterapia esperam a rolagem.

### Peso dos arquivos (bytes; gzip -9)

| Arquivo | V1 | V2 |
| --- | ---: | ---: |
| HTML | 56.507 (12.148) | 43.040 (9.469) |
| CSS | 57.527 (12.406) | 43.136 (9.979) |
| JS do site | 12.042 (4.104) | 17.239 (6.480), em 3 arquivos |
| GSAP + ScrollTrigger | 116.594 (45.308) | 116.592 (45.955), em 2 arquivos |
| Fontes | 119.144 | 119.144 (as mesmas) |

## Funcionalidade (22 de 22 passaram)

Roteiro em Playwright, celular 390 × 844 com toque e desktop 1440 × 900:

- WhatsApp: 13 links com o número 5545991159425 e texto pronto; mensagens
  específicas para musculação, fisioterapia e pilates (conferidas decodificando
  o `encodeURIComponent`); todos com `rel=noopener`.
- CTA do hero visível e opaco na primeira tela, desde o início.
- Menu: abre, trava a rolagem, torna `main`/rodapé inertes, foco no primeiro
  link, Tab preso no painel, Esc fecha e devolve o foco, toque fora fecha,
  link de âncora fecha e rola até a seção abaixo do cabeçalho.
- Todas as âncoras internas têm destino.
- "Conhecer…" dos serviços começa fechado com JS e atualiza `aria-expanded`.
- FAQ abre um item por vez.
- Barra fixa aparece no meio da página e some no contato e quando outro botão
  vermelho grande está na tela.
- Jornada: as 5 etapas acendem com a rolagem.
- Indicador do cabeçalho marca a seção visível.
- Redimensionar de 390 para 1280 sem overflow, com a navegação de desktop.
- Console sem erros e sem requisições falhas em todas as larguras.
- Sem JavaScript: nenhum texto escondido, detalhes abertos.
- `prefers-reduced-motion`: sem classe `motion`, sem cortinas, título no lugar.
- Ordem de Tab no desktop: pular para o conteúdo → marca → 5 links → WhatsApp.

Com fotos de teste (cópia descartável):

- `tools/fotos.py` encaixou as 12; os quadros 4 e 5 da galeria apareceram e a
  grade passou para 5 itens.
- Lightbox: abre no clique, ← e → navegam, arrastar com o dedo troca de foto,
  Esc fecha, a rolagem destrava e o foco volta ao quadro clicado; legenda e
  texto alternativo corretos.
- Prévia em arquivo único com fotos: abre por `file://`, sem erros, sem
  referências externas (1.056 KB com 12 fotos; 370 KB sem fotos).

## Contraste (WCAG 2.2 AA, texto normal ≥ 4,5:1)

Calculado pela fórmula de luminância relativa da WCAG:

| Combinação | Razão |
| --- | ---: |
| Cinza #a5a5aa sobre preto / superfície / carvão | 8,11 / 7,44 / 6,31 |
| Vermelho #ff4d42 sobre preto / superfície | 6,06 / 5,55 |
| Vermelho #ff6b61 sobre carvão (pilar Pilates) | 5,55 |
| Cinza #4e4e54 sobre claro #f3f3f3 | 7,45 |
| Vermelho #c4060f sobre claro / branco | 5,60 / 6,21 |
| Branco sobre botão #e30613 | 4,88 |

Uma combinação reprovava (vermelho #ff4d42 sobre carvão, 4,35:1) e foi
corrigida com o tom #ff6b61. Alvos de toque: botões e links de ação com 40 a
64 px de altura.

## Overflow horizontal

Nenhum em 320, 360, 375, 390, 414, 430, 768, 1024 e 1440.

## Capturas

`docs/comparativo/`: `antes-*` (V1) e `depois-*` (V2) do hero em 320, 390 e
1440 e da página inteira em 390; `antes-depois-pagina-390.jpg` lado a lado;
`simulacao-fotos-teste-*` mostra a composição com fotos **sintéticas de teste**
(não são fotos da AXIS).

## O que não foi testado

- **Lighthouse** não foi executado (não disponível neste ambiente). As metas de
  Performance > 90 e Acessibilidade > 95 precisam ser conferidas no endereço
  publicado.
- **INP** não foi medido (exige interação real).
- **Aparelhos físicos**, Safari/iOS e Firefox: só Chromium emulado.
- **Leitor de tela** (VoiceOver, TalkBack, NVDA): estrutura conferida no
  código, mas sem teste com leitor.
- **Fotos reais**: o encaixe foi testado com imagens sintéticas; recortes e
  pontos focais precisam ser revistos com as fotos de verdade.
