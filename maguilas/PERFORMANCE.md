# Maguila's — relatório de performance (V3 → V4)

Medições de 15/10/2026 neste ambiente, **em laboratório**. Não há dados de
usuários reais: o site não foi publicado. INP real e Core Web Vitals de campo
só existem depois de semanas no ar (ver `PUBLICACAO.md`, seção 4).

**Como foi medido.** Os dois sites foram servidos localmente por
`tools/servidor-local.mjs`, que imita a Vercel: brotli, ETag/304, cabeçalhos
do `vercel.json`. Ferramentas: Lighthouse 12 (celular com 4G lento simulado e
CPU 4× mais lenta; desktop com o preset padrão) e Chromium via Playwright 1.56.

## 1. O site em pastas (o que vai para a Vercel)

### Lighthouse

| Métrica | V3 | V4 | Diferença |
|---|---|---|---|
| **Desempenho, celular** (mediana de 5) | 98 | **100** | +2 |
| Acessibilidade | 100 | 100 | — |
| Boas práticas | 100 | 100 | — |
| SEO | 66 | 66 | — (cai só pelo `noindex` da prévia, de propósito) |
| FCP, celular | 0,77 s | 0,76 s | igual |
| **LCP, celular** | **2,41 s** | **1,89 s** | **−0,52 s (−22%)** |
| Speed Index, celular | 1,12 s | 1,09 s | igual |
| TBT, celular | 0 ms | 0 ms | — |
| CLS | 0 | 0 | — |
| Desempenho, desktop (mediana de 3) | 100 | 100 | — |
| LCP, desktop | 0,49 s | 0,41 s | −0,08 s |
| **Bytes transferidos** (celular) | **356 KB** | **213 KB** | **−143 KB (−40%)** |
| Requisições | 14 | 15 | +1 (o fundo da abertura virou um arquivo de 126 bytes) |
| Erros de console | 0 | 0 | — |

A única auditoria de acessibilidade com aviso na V3
(`label-content-name-mismatch`, o nome da marca) foi corrigida.

### Primeira visita × segunda visita (4G simulado 1,6 Mbps/150 ms, CPU 4×, 390×844)

| | V3 | V4 |
|---|---|---|
| 1ª visita: bytes pela rede | 356 KB | 212 KB |
| 1ª visita: LCP | 1,46 s | 1,19 s |
| 2ª visita: idas ao servidor para revalidar | 12 | **2** |
| 2ª visita: LCP | 0,50 s | 0,44 s |

Na V4, fontes e imagens têm cache longo (`vercel.json`). Na segunda visita,
só o HTML, o CSS e o JS perguntam ao servidor se mudaram.

### Rolagem com CPU 4× mais lenta

Igual nas duas versões: cerca de 60 quadros por segundo, nenhum quadro acima
de 50 ms (3 execuções em 390×844 e 1440×900). **Não há ganho de fluidez a
declarar** — a rolagem já era boa.

### Interação (laboratório, não é INP real)

Menu + 4 trocas de aba, toque, CPU 4×: a interação mais lenta ficou entre 72 e
88 ms nas duas versões. Meta do INP: 200 ms.

## 2. A prévia em arquivo único

| | V3 | V4 |
|---|---|---|
| Tamanho | 1,10 MB | 0,96 MB |
| Lighthouse celular | 63 | 65 |
| LCP celular | 6,0 s | 5,65 s |

Ela continua lenta por natureza: fotos, fontes e código chegam juntos, antes
da primeira pintura. **Serve para mandar ao cliente, não para publicar** — por
isso fica fora do deploy (`.vercelignore`).

## 3. O que mudou, por quê, e o que foi testado e descartado

| Item | Problema medido | Mudança | Resultado |
|---|---|---|---|
| Fontes | 119 KB; variáveis com todos os pesos e alfabetos que o site não usa | Recorte para o latim e só os pesos usados (`tools/otimizar-fontes.py`); nomes com hash | **76 KB (−36%)**, mesmo desenho |
| Imagens | 609 KB em WebP | AVIF (qualidade 70) com WebP de reserva via `<picture>` | **443 KB (−27%)** para os mesmos arquivos; comparação visual a 3× sem diferença perceptível |
| Miniaturas | Linha do dia e cardápio no celular baixavam posts de 281 px para mostrar 96 px | Versões de 192 px (2× de 96) com `srcset`/`sizes` | Ex.: post do empadão 25,6 KB → 12,9 KB (AVIF) |
| Pré-carregamento | A V3 pré-carregava a foto do buffet em WebP; com AVIF, isso baixaria a foto duas vezes | Pré-carregamento de imagem removido; `fetchpriority="high"` só na marmita | Sem download duplicado |
| Fundo da abertura | `filter: blur(46px)` ao vivo sobre a foto, em área maior que a tela | Imagem de 24×28 px já desfocada (126 bytes), ampliada pelo navegador | Mesmo visual (0,01–0,04% dos pixels mudaram), sem filtro ao vivo |
| Cabeçalho | Código rodava a cada evento de rolagem | `IntersectionObserver` com um sentinela de 24 px | Só roda ao cruzar o limite |
| Abas | Reflow forçado (`offsetWidth`) para reiniciar a animação | Web Animations API | Sem reflow forçado |
| Cache | Tudo revalidava a cada visita | Fontes 1 ano (`immutable`, nome com hash), imagens 7 dias | 12 → 2 revalidações na volta |

**Testado e descartado (com os números):**

| Hipótese | Resultado | Decisão |
|---|---|---|
| Tirar a animação de entrada da manchete melhora o LCP | LCP 1,886 s contra 1,891 s | Mantida a animação |
| Pré-carregar a fonte manuscrita é desnecessário | Sem o preload, FCP 1,07 s contra 0,76 s | Mantido o preload das 3 fontes (as 3 estão na primeira tela) |
| Embutir o CSS no HTML acelera a primeira pintura | FCP 0,85 s e LCP 1,96 s, contra 0,76 s e 1,90 s com o CSS separado | CSS continua em arquivo próprio |
| Minificar CSS e JS | Economia de 3,5 KB depois do brotli (≈17 ms em 4G lento) | Não compensa um passo de build; o código publicado continua legível |
| Ajustar métricas das fontes de reserva | CLS com fontes atrasadas em 2,5 s: 0,003 | Não implementado — sem problema a resolver |
| Tirar o `backdrop-filter` do cabeçalho | Rolagem já a 60 qps com CPU 4× | Mantido |

## 4. Orçamento de performance (para as próximas mudanças)

Medidos na V4; passar disso exige justificativa.

| Item | Limite | Hoje |
|---|---|---|
| Transferência na primeira visita (celular) | 260 KB | 213 KB |
| Fontes | 80 KB | 76 KB |
| CSS (brotli) | 12 KB | 9 KB |
| JS (brotli) | 5 KB | 2,7 KB |
| LCP Lighthouse celular | 2,5 s | 1,89 s |
| CLS | 0,05 | 0 |
| Erros de console | 0 | 0 |

Quando chegarem as fotos originais, a abertura deve usar uma foto grande em
AVIF com `srcset` (640, 960, 1440 px) e ganhar `fetchpriority="high"` e
pré-carregamento com `imagesrcset`. Refaça a medição nessa hora.
