# Parada do Mano — Relatório da V3

16/10/2026 · evolução da V2 (mesma identidade, mesma abertura), não um site novo.
Cada item: **problema → solução → benefício → teste**. Todos os números abaixo foram medidos;
o que não foi medido está escrito como "Não medido".

## Como foi medido

- **V2** = o commit anterior à V3, servido de uma cópia separada. **V3** = o pacote
  `parada-do-mano-v3-producao.zip` descompactado. As duas pelo mesmo servidor local
  (`tools/servidor.mjs`: gzip, cache e Range, como numa hospedagem), na mesma máquina.
- **Lighthouse 12.8**, mobile (Moto G Power emulado, 4G lento simulado, CPU 4x) e desktop,
  **3 execuções de cada, valor = mediana**.
- **Playwright 1.56 + Chromium 141** (`tools/medir.mjs`): altura da página, posição de cada seção,
  bytes transferidos (cache desligado), console e falhas de rede, capturas com as animações
  concluídas (estado equivalente nas duas versões).
- **axe-core 4.14** (regras WCAG 2.0/2.1/2.2 A e AA + boas práticas), DOM inteiro, em 390 e 1440 px.
- **`tools/qa-browser.mjs`**: 125 verificações (10 tamanhos de tela, incluindo paisagem, teclado, menu, abas,
  galeria, vídeo, movimento reduzido, página sem JavaScript, jornadas de toque).

Limites: Lighthouse local com rede **simulada** não é dado de campo; o servidor é local (sem
distância até o usuário). Safari, Firefox e aparelhos reais **não foram testados**. INP só existe
com usuários reais: **Não medido**.

## Tabela V2 × V3

| Métrica | V2 | V3 | Como |
|---|---|---|---|
| Lighthouse Performance — mobile | 94 | **98** | mediana de 3 |
| Lighthouse Performance — desktop | 100 | **100** | mediana de 3 |
| Lighthouse Acessibilidade | 100 | **100** | mobile e desktop |
| Lighthouse Boas práticas | 100 | **100** | mobile e desktop |
| Lighthouse SEO | 66 | 66 | única falha nas duas: `is-crawlable` — é o `noindex` pedido enquanto for prévia |
| LCP mobile (simulado) | 3,02 s (3,09 · 3,01 · 3,02) | **2,10 s** (2,10 · 2,10 · 2,25) | meta ≤ 2,5 s: V2 não atingia, V3 atinge nas 3 execuções |
| LCP desktop (simulado) | 0,65 s (0,64 · 0,66 · 0,65) | **0,52 s** (0,52 · 0,52 · 0,54) | |
| FCP mobile | 1,22 s | 1,20 s | |
| CLS mobile / desktop | 0,001 / 0,008 | 0,001 / 0,008 | meta ≤ 0,1 |
| TBT mobile | 0 ms | 0 ms (142 · 0 · 0) | uma execução teve duas tarefas de ~30 ms reais na inicialização, ×4 pela CPU simulada |
| INP | Não medido | Não medido | precisa de dados de campo (CrUX) |
| Bytes da 1ª visita, 390 px, sem rolar | 436 KB (12 req.) | **268 KB** (14 req.) (−39%) | Chromium, cache desligado |
| Bytes da página inteira rolada, 390 px | 1.504 KB (27 req.) | **719 KB** (27 req.) (−52%) | |
| Bytes da 1ª visita, 1440 px (com vídeo) | 3.596 KB (vídeo 2.464 KB) | **1.659 KB** (vídeo 1.284 KB) (−54%) | Chromium do teste usa o WebM; Chrome com H.264 baixa o MP4 de 1,7 MB |
| HTML (arquivo) | 52,5 KB | 49,5 KB | V3 sem comentários no pacote |
| Altura da página — 390×844 | 12.604 px | **7.967 px** (−37%) | |
| Altura da página — 320×568 | 12.347 px | **7.933 px** (−36%) | |
| Altura da página — 768×1024 | 14.998 px | **9.082 px** (−39%) | |
| Altura da página — 1440×900 | 11.127 px | **9.466 px** (−15%) | |
| Início do cardápio — 390×844 | 7.929 px | **1.723 px** | pedido: entre ~2.000 e 3.500 px; ficou antes, com a apresentação compacta |
| Início do cardápio — 320 / 768 / 1440 | 7.690 / 9.728 / 6.997 px | 1.704 / 1.942 / 2.007 px | |
| Toques até o WhatsApp certo (almoço, espeto, feijoada) — 390 | Não medido | **3** | `qa-browser.mjs`, jornadas A–C |
| Toques até a rota — 390 | Não medido | **1** (na primeira tela) | jornada D |
| axe-core — violações | 1 (`label-content-name-mismatch`) | **0** | contraste sobre foto fica "para revisão manual" nas duas |
| Erros/avisos de console · falhas de rede | 0 · 0 | 0 · 0 | 4 tamanhos de tela |
| Verificações automáticas | 78 de 78 (bateria da V2) | **125 de 125** | bateria nova, mais exigente |
| Prévia em arquivo único | 9,24 MiB, fotos dependiam de JS | **6,5 MiB**, fotos sem JS | |
| Nota visual fundamentada | não atribuída | ver o fim do relatório | avaliação própria, não é medição |

Capturas V2 | V3 lado a lado, por seção, em `comparacao/` (1440×900, 768×1024, 390×844, 320×568).
A página inteira em `comparacao/{largura}-9-pagina-inteira.jpg`, com a linha do cardápio marcada.

## 1. Arquitetura e ordem

**Problema.** Na V2 o cardápio era a 7ª seção: no celular começava a 7.929 px, depois de
buffet, churrasco e feijoada. Quem chega querendo saber "o que tem hoje" rolava 9 telas.

**Solução.** Nova ordem: abertura → apresentação compacta → **cardápio** → buffet →
churrasco/espeto → feijoada → galeria → contato → rodapé. Menu do topo, menu do celular
(numerado 01–07) e espiã de rolagem seguem a mesma ordem.

**Benefício.** O cardápio sobe para 1.723 px (2 telas) e a página fica 37% mais curta no celular.

**Teste.** `medir.mjs` nos 4 tamanhos (tabela acima); `qa-browser.mjs`: âncoras internas
apontam para seções existentes, menu leva à seção e fecha.

## 2. Abertura (preservada, mais compacta no celular)

**Problema.** No celular a foto e o texto da abertura ocupavam mais de uma tela; em paisagem
(844×390) o botão principal ficava abaixo da dobra.

**Solução.** Mesma foto, mesmo título "Do fogo à mesa", mesma paleta. No celular a foto
tem altura limitada (`clamp(250px, 46svh, 440px)`) e o texto sobe sobre ela; botões em grade
com "Explorar o cardápio" em largura total, WhatsApp e Como chegar lado a lado. Em paisagem
baixa, duas colunas e sem a etiqueta e os destaques.

**Benefício.** O botão do cardápio aparece na primeira tela em todos os tamanhos testados.

**Teste.** "botão do cardápio na primeira tela": 10 de 10 (ex.: 320×568 de 469 a 519 px;
844×390 de 292 a 342 px).

## 3. Apresentação compacta

**Problema.** A seção "O restaurante" repetia o que as seções seguintes mostravam.

**Solução.** Três momentos do dia (café a partir das 06h · almoço · janta até 23h30) em linhas
com miniatura no celular e em três colunas com a linha do dia no computador, mais atalhos
para Buffet, Churrasco e Feijoada. Miniaturas com versão de 240 px.

**Benefício.** A seção cabe em uma tela de celular e leva direto ao que interessa.

**Teste.** Capturas `comparacao/*-2-sobre.jpg`; imagens com tamanho certo conferido
(92 px exibidos → arquivo de 240 px em DPR 1,75).

## 4. Cardápio: vitrine honesta

**Problema.** Não há itens nem preços confirmados. A V2 mostrava "as opções ainda vão ser
publicadas" — soa como site inacabado.

**Solução.** Cada uma das 10 categorias mostra o que é confirmado (dias, horário, formato) em
chips, uma frase de convite, e um botão de WhatsApp com mensagem própria
("Opções e valores de hoje pelo WhatsApp"). Buffet e saladas têm "Visto nas fotos da casa",
recolhido, com o aviso de que muda conforme o dia. Nenhum prato, preço, porção ou promoção
inventado; o R$ 66,90 do espeto não aparece (fica "Valor do rodízio sob consulta").
Modelo pronto para incluir itens quando o restaurante mandar (README).

**Benefício.** Parece um cardápio de verdade, sem prometer o que não foi confirmado, e cada
categoria vira um pedido de informação já direcionado.

**Teste.** "nenhum 'ainda vão ser publicadas'", "nenhum preço afirmado", "cada categoria tem
WhatsApp com mensagem própria" (10 de 10; 20 links, 13 mensagens diferentes).

## 5. Abas profissionais

**Problema.** Na V2 a troca de aba mudava a altura da área e podia mexer a página; a aba
escolhida podia ficar fora da faixa rolável.

**Solução.** Padrão ARIA completo (`tablist`/`tab`/`tabpanel`, `aria-selected`, `tabindex`
móvel); setas, Home, End, Enter e Espaço; Tab vai da aba ao painel. Painéis empilhados na mesma
célula da grade: a área tem a altura do maior e não pula. Aba ativa sempre rolada para dentro
da faixa, com esmaecido nas bordas indicando que há mais. Fotos das categorias só baixam
quando a aba é aberta. Troca animada com Web Animations API, sem forçar layout.

**Benefício.** Navegação por teclado e leitor de tela correta, e nenhum salto ao trocar.

**Teste.** "troca não faz a página pular" (scrollY 1651 → 1651), "altura da área não muda"
(588 px nas 10), "seta para a direita", "Home e End", "aria-selected e tabindex coerentes",
"aba escolhida sempre visível" (10 de 10), "foto da categoria carrega quando ela é aberta".

## 6. Buffet, churrasco/espeto e feijoada

**Problema.** Seções longas, com texto repetido e o valor do espeto ambíguo.

**Solução.** Buffet em fundo escuro com 3 fotos (salão, saladas, quentes) e a nota
"livre ou por quilo — confirme"; churrasco com a foto larga das carnes, a churrasqueira ao lado
e o bloco do espeto corrido com "Valor do rodízio sob consulta" (lugar reservado no HTML para
o preço confirmado); feijoada com título e os dias (quarta e sábado) em destaque.

**Benefício.** Menos rolagem, informação mais clara, nenhum valor não confirmado.

**Teste.** Capturas `comparacao/*-4-buffet.jpg`, `*-5-churrasco.jpg`, `*-6-feijoada.jpg`;
jornadas B e C chegam ao WhatsApp certo em 3 toques.

## 7. Galeria

**Problema.** No celular a galeria em grade ocupava várias telas.

**Solução.** No celular, faixa horizontal com encaixe (scroll-snap); no computador, mosaico.
Foto ampliada em `<dialog>` nativo, com setas, Escape, deslizar no toque e foco devolvido à foto.

**Benefício.** A galeria cabe em uma tela no celular sem perder nenhuma foto.

**Teste.** "faixa rola de lado sem rolar a página", "abre, avança e cabe na tela",
"Escape fecha e devolve o foco", "fechar devolve o foco à foto".

## 8. Movimento

**Problema.** Durações e curvas espalhadas pelo CSS; troca de aba e medição do cabeçalho
forçavam o navegador a recalcular o layout no carregamento.

**Solução.** Tokens de movimento (`--ease-out`, `--ease-in-out`, `--ease-soft`,
`--dur-xs` a `--dur-xl`, `--rise`, `--stagger`); só `transform` e `opacity`; Web Animations
API nas trocas; medidas (cabeçalho, faixa de abas) lidas só depois do primeiro quadro desenhado. A foto da abertura
não começa invisível (o zoom de entrada não atrasa o LCP). `prefers-reduced-motion` desliga
entradas, brasas, faixa corrida e vídeo.

**Benefício.** Animações consistentes e TBT 0 ms; nada de movimento para quem pediu menos.

**Teste.** "movimento reduzido: sem animação de entrada, brasas e faixa" e "nada escondido
esperando rolagem"; Lighthouse: nenhum *forced reflow* nas 6 execuções finais (antes da
correção aparecia em 2 de 6), TBT mediano 0 ms.

## 9. Vídeo da abertura

**Problema.** Na V2 o vídeo (2,4 MB) entrava na primeira visita do computador junto com a foto.

**Solução.** Só no computador (≥ 960 px), depois do `load` e de um momento ocioso; nunca com
movimento reduzido, economia de dados ou rede 2G/3G. Pôster = a própria foto da abertura.
Pausa fora da tela e com a aba em segundo plano. MP4 refeito com 1,7 MB e WebM com 1,3 MB;
o navegador escolhe pelo `canPlayType`.

**Benefício.** O vídeo não disputa banda com a foto principal (LCP desktop 0,65 → 0,52 s) e
o celular não baixa vídeo nenhum.

**Teste.** "vídeo da abertura toca no computador", "vídeo pausa quando a abertura sai da tela",
"celular não baixa o vídeo".

## 10. Imagens e carregamento

**Problema.** LCP mobile da V2 em 3,02 s, acima da meta; só WebP; miniaturas baixavam
arquivos de 480 px para 92 px na tela.

**Solução.** AVIF com WebP de reserva em `<picture>`; *preload* da foto da abertura em AVIF
com `fetchpriority="high"`; versão de 800 px da abertura para celulares de tela densa;
miniaturas de 240 px; `content-visibility: auto` nas seções abaixo da dobra; fontes com
*preload* só das duas da primeira tela.

**Benefício.** LCP mobile 2,10 s (as 3 execuções abaixo de 2,5 s); 1ª visita no celular 39% mais leve.

**Teste.** Lighthouse (tabela); `medir.mjs` (bytes); "imagens carregadas" e "todas as imagens
têm endereço" nos 10 tamanhos e sem JavaScript.

## 11. Acessibilidade (WCAG 2.2 AA)

**Problema.** Na V2, o link da marca tinha `aria-label` diferente do texto visível
(`label-content-name-mismatch`).

**Solução.** Marca sem `aria-label` (o texto visível é o nome); menu do celular com foco preso,
resto da página `inert`, Escape fecha e devolve o foco; foco visível em dourado; um único `h1`;
alvos de toque grandes; página utilizável sem JavaScript (10 categorias abertas, nada escondido).

**Benefício.** Zero violações automáticas.

**Teste.** axe-core: 0 violações (V2: 1). Lighthouse acessibilidade 100. Itens "menu",
"sem JS" do `qa-browser.mjs`. Contraste de texto sobre foto: conferido visualmente nas
capturas, mas é revisão manual (o axe não decide sobre imagem).

## 12. SEO local preparado, sem indexar

**Problema.** Para compartilhar no WhatsApp/Facebook e para o Google, `canonical`, `og:url` e
`og:image` precisam de endereço absoluto HTTPS — e o domínio ainda não existe.

**Solução.** `tools/set-domain.py https://dominio` grava canonical, og:url, og:image
(arquivo `og-cover.jpg` de 1200×630, não base64), o JSON-LD `Restaurant` (endereço, telefone,
horário, `hasMenu`, `servesCuisine`) e gera o `sitemap.xml`. `noindex, nofollow` mantido no
HTML, no `robots.txt` e no cabeçalho `X-Robots-Tag` do `vercel.json`; só `--publicar` libera.

**Benefício.** Publicar vira um comando, sem chance de liberar a indexação sem querer.

**Teste.** Script rodado numa cópia: URLs absolutas gravadas, `noindex` mantido; com
`--publicar`, as três travas liberadas. Lighthouse SEO: a única falha é `is-crawlable`.

## 13. Estrutura de produção e entrega

**Solução.** `parada-do-mano-v3-producao.zip` com a pasta `parada-do-mano-v3/` (index.html,
assets/css, js, images, videos, fonts, robots.txt, vercel.json), HTML e CSS sem comentários.
Prévia em arquivo único com as fotos direto no HTML (abre sem JavaScript, sem servidor).
README com edição de conteúdo e publicação no Vercel passo a passo; nada foi publicado.

**Teste.** O ZIP foi descompactado e testado como site: 125 de 125, Lighthouse da tabela.

## O que não foi feito ou não foi verificado

- Safari (iOS/macOS), Firefox e aparelhos reais: **não testados**.
- INP e qualquer dado de campo: **Não medido** (o site não está no ar).
- Leitor de tela real (NVDA, VoiceOver): **não testado**; a estrutura ARIA foi verificada por
  script e pelo axe.
- Cardápio sem itens e preços: depende do restaurante (`PENDENCIAS.md`).
- As fotos são as enviadas, ampliadas 2x; aparentam ser geradas/retocadas — por isso
  "Imagens ilustrativas" no rodapé. A logo vem do avatar de 150 px do Instagram.

## Nota visual fundamentada

Avaliação própria, não é medição: **8,5 / 10**.

O que sustenta: identidade e abertura preservadas; hierarquia clara com o cardápio a duas
telas; movimento consistente e discreto; nenhum salto de layout; leitura confortável em 320 px.

O que impede 9,5 hoje, e não depende do código: fotos de origem em baixa resolução e com aspecto
de imagem gerada; logo em bitmap pequeno; cardápio ainda sem itens nem preços. Com fotos
próprias do restaurante, logo vetorial e cardápio confirmado, os mesmos componentes já
comportam esse nível — mas isso precisa ser visto, não presumido.
