# Maguila's — QA (versão 2)

Testes feitos em 15/10/2026, com Chromium (Playwright 1.56), contra o site
servido localmente (`python3 -m http.server`). A versão 1 foi servida lado a
lado, do commit `276c69c`, para as comparações. O que **não** foi testado está
no fim.

## Responsividade, console e toque — 9 resoluções

Rolagem até o fim com as animações ligadas, medindo `scrollWidth` a cada passo;
alvos de toque = links e botões visíveis com menos de 24 px de altura.

| Resolução | Rolagem horizontal | Console | Alvos < 24 px | Blocos ocultos ao fim |
|---|---|---|---|---|
| 1920×1080 | não | limpo | 0 | 0 |
| 1440×900 | não | limpo | 0 | 0 |
| 1280×800 | não | limpo | 0 | 0 |
| 1024×768 | não | limpo | 0 | 0 |
| 768×1024 | não | limpo | 0 | 0 |
| 430×932 | não | limpo | 0 | 0 |
| 390×844 | não | limpo | 0 | 0 |
| 360×800 | não | limpo | 0 | 0 |
| 320×568 | não | limpo | 0 | 0 |

Zoom de 200% (1440 px com zoom, simulado por 720 px a 2×): sem rolagem horizontal.

## Cardápio (abas)

- **Clique, 1440×900:** as 7 abas selecionam (`aria-selected="true"`), só o painel
  correspondente fica visível, e a altura da página fica em **6.634 px em todas**
  — trocar de categoria não empurra o resto da página.
- **Toque, 390×844:** as 7 abas respondem ao toque; a faixa de abas rola para o
  lado e a aba tocada é trazida para a vista. A altura da página varia por
  categoria (7.749 a 8.211 px), mas as abas ficam no lugar.
- **Teclado:** → → leva a "Pratos & marmitas"; End → Bebidas; Home → Café da
  manhã; ← no início volta para Bebidas; Tab sai das abas para o painel.
- **Fotos dos painéis:** nenhuma ampliada. Desktop: tamanho nativo (as de 281 px
  aparecem com 269 px). Celular: limitadas a 180 px de altura.
- **Sem JavaScript:** as 7 categorias aparecem empilhadas, abas ocultas.

## Menu, navegação e acessibilidade

- **Menu do celular:** Enter abre e leva o foco a "Início"; Escape fecha e devolve
  o foco ao botão; tocar em "Cardápio" fecha o menu e leva a seção para logo
  abaixo do cabeçalho (72 px).
- **Ordem do Tab:** pular para o conteúdo → marca → 5 links → WhatsApp → Ver
  cardápio → Como chegar → … (ordem visual).
- **Títulos:** um `h1`; um `h2` por seção; `h3` nos momentos e nas categorias.
- **Movimento reduzido:** nenhum bloco oculto; animação do título desligada.
- **`main.js` bloqueado** (simulando falha do arquivo): 0 blocos invisíveis e as
  7 categorias visíveis. Na v1, o mesmo teste deixava **17 de 17** blocos com
  `opacity: 0` — metade da página em branco.
- **Contraste novo da v2:** rótulos marrons no creme 7,2:1; texto de apoio no
  creme 8,8:1; texto da placa de horário 9:1. Os demais pares não mudaram (ver
  histórico no git).

## Links e WhatsApp

- 20 âncoras internas, nenhuma quebrada. 17 links externos, todos com
  `target="_blank"` e `rel="noopener"`.
- **12 links de WhatsApp, todos para o mesmo número** (`wa.me/5545999566139`),
  ainda não confirmado pelo restaurante.
- Textos conferidos um a um: "Pedir no WhatsApp" abre um pedido; os 7 botões do
  cardápio e o do buffet abrem **consultas**; os 2 links com o número abrem a
  conversa sem texto. Nenhum envia mensagem sozinho, e o site não diz que algo foi enviado.

## Desempenho — laboratório local, não campo

Rede limitada a ~1,6 Mbps com 150 ms de latência, cache desligado, mediana de 3 execuções.

| | v1 | v2 |
|---|---|---|
| LCP 1440×900 | 2,10 s | **1,66 s** |
| LCP 390×844, CPU 4× mais lenta | 1,50 s | 1,71 s |
| CLS | 0 | 0 |
| Interação mais lenta (menu + 4 abas, toque, CPU 4×) | 88 ms | 88 ms |
| Transferido na carga (1440 / 390) | 306 / 231 KB | 382 / 345 KB |

O LCP era a palavra manuscrita da manchete, à espera da fonte; a v2 pré-carrega
essa fonte. No celular o LCP subiu 0,2 s porque a página ficou mais curta e
as fotos dos momentos agora caem no raio de carregamento antecipado do
navegador. Continua abaixo da meta de 2,5 s. A "interação mais lenta" é uma
medida de laboratório da Event Timing API, não o INP de usuários reais.

Arquivo único (`maguilas-visualizacao.html`, 1,06 MB): aberto **sozinho** numa
pasta vazia por `file://`, em 1440 e 390 px — 22 imagens carregadas, 0
quebradas, 3 fontes ativas, abas funcionando, sem erro e sem rolagem lateral.

## Comparação antes/depois

Capturas nas mesmas resoluções em `docs/comparacao/`:
`comparacao-1440-abertura.jpg`, `comparacao-390-abertura.jpg`,
`comparacao-1440-pagina.jpg`, `comparacao-390-pagina.jpg`.

| Critério | Resultado |
|---|---|
| Impacto da abertura | Melhor: a marmita com carne e fritas substitui as cubas de farofa como foto da frente. |
| Hierarquia | Melhor: uma seção a menos; cada seção com uma função. |
| Legibilidade | Melhor no cardápio (sem caixa alta) e na galeria (posts em tamanho nativo, com legenda). |
| Fotografia | Melhor uso, mesma matéria-prima: recortes só da foto onde o texto do post competia com o site. |
| Navegação | Cardápio a 2,6 telas (antes 4,2) no desktop e 3,1 (antes 5,4) no celular. |
| Conversão | Mesmos caminhos; consulta separada de pedido em todos os botões. |
| Responsividade | Igual: 9 resoluções sem rolagem lateral. |
| Desempenho | LCP melhor no desktop, 0,2 s pior no celular, ambos abaixo de 2,5 s. |

Nenhuma mudança foi revertida.

## Não testado

- Safari/iOS e Firefox; celular de verdade (só emulação).
- Leitor de tela (VoiceOver, TalkBack, NVDA).
- Lighthouse e Core Web Vitals de campo — os números acima são de laboratório.
- Se o WhatsApp é do restaurante e se o Google Maps acha o endereço certo.
- Publicação — o site não foi publicado.

## Avaliação crítica (versão 2)

| Critério | v1 | v2 | Por quê |
|---|---|---|---|
| Direção de arte | 7 | 7,5 | Ritmo escuro/creme, placa de horário, galeria editorial. Ainda limitada por fotos de 280 px. |
| Branding | 6 | 6 | Logo continua provisória em texto. Nada a ganhar sem o arquivo oficial. |
| Fotografia gastronômica | 5 | 6 | Recortes só da foto onde cabia, marmita na abertura, sem repetição entre seções. Ainda são prints. |
| Marketing | 7,5 | 8 | Cada seção com função própria; cardápio tratado como vitrine, sem promessa de disponibilidade. |
| Conversão | 7,5 | 8 | Cardápio bem mais perto; consulta e pedido distintos. Falta confirmar o canal. |
| UX | 8 | 8,5 | Menos rolagem, abas sem salto no desktop, galeria com legenda. |
| Mobile | 8 | 8 | Mesma base; cardápio com foto controlada em altura. LCP mobile um pouco maior. |
| Performance | 8 | 8 | LCP melhor no desktop, levemente pior no celular; tudo abaixo das metas no laboratório. |
| Acessibilidade | 7,5 | 8 | Conteúdo não depende mais do JS para aparecer; menos caixa alta. Sem teste com leitor de tela. |
| SEO local | 5 | 5 | Mantido de propósito: `noindex`, canonical e JSON-LD esperam os dados confirmados. |
| Prontidão para publicação | 3 | 3 | Logo, contatos, horário e fotos continuam sem confirmação. **Não publicar.** |
