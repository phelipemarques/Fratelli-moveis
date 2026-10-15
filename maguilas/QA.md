# Maguila's — QA (versão 4)

Testes de 15/10/2026 com Chromium (Playwright 1.56) e Lighthouse 12, contra o
site servido por `tools/servidor-local.mjs` (imita a Vercel: brotli, ETag,
cabeçalhos do `vercel.json`, incluindo a CSP). A V3 foi servida ao lado, do
commit `a00cd53`. Medições de desempenho em [`PERFORMANCE.md`](PERFORMANCE.md).

Para repetir: `node tools/testar.mjs http://127.0.0.1:8130/` (README).

## 1. Testes automatizados — `tools/testar.mjs`

**45 de 45 passaram.**

| Grupo | O que verifica | Resultado |
|---|---|---|
| Tamanhos de tela (16) | rolagem lateral, erros de console, imagens quebradas, blocos ocultos, alvos de toque < 24 px | 16/16 sem problema |
| Menu do celular (7) | Enter abre, foco no 1º link, Tab não escapa para trás (inert), Escape fecha, foco volta, link fecha o menu, conteúdo volta a ser acessível | 7/7 |
| Abas (14) | →, ←, Home, End, Enter, Espaço; só o painel certo ativo em cada uma das 7; altura da página constante no desktop | 14/14 |
| Robustez (3) | sem JavaScript as 7 categorias aparecem; com `main.js` bloqueado nada fica invisível; movimento reduzido sem animação de entrada | 3/3 |
| Links (4) | 0 âncoras quebradas; 0 externos sem `target`/`rel="noopener noreferrer"`; WhatsApp com um número só; `noindex` presente | 4/4 |

## 2. Responsividade

| Tela | Rolagem lateral | Console | Alvos < 24 px | Comida começa em (V3 → V4) | Botão "Ver cardápio" na 1ª tela |
|---|---|---|---|---|---|
| 1920×1080 | não | limpo | 0 | — | sim |
| 1440×900 | não | limpo | 0 | — | sim |
| 1366×768 | não | limpo | 0 | — | sim |
| 1280×800 | não | limpo | 0 | — | sim |
| 1024×768 | não | limpo | 0 | — | sim |
| 820×1180 | não | limpo | 0 | — | sim |
| 768×1024 | não | limpo | 0 | 351 → 351 px | sim |
| 430×932 | não | limpo | 0 | 327 → 327 px | sim |
| 414×896 | não | limpo | 0 | 327 → 327 px | sim |
| 393×852 | não | limpo | 0 | 327 → 327 px | sim |
| 390×844 | não | limpo | 0 | 327 → 327 px | sim |
| 375×667 | não | limpo | 0 | 280 → 280 px | sim |
| 360×800 | não | limpo | 0 | 327 → 327 px | sim |
| 320×568 | não | limpo | 0 | 280 → 280 px | sim |
| 844×390 (deitado) | não | limpo | 0 | 168 → 168 px | sim |
| 667×375 (deitado) | não | limpo | 0 | — | — |

Zoom: 200% (1440 px) e 400% (1280 px → 320 px de largura útil) cobertos pelos
testes de 720 e 320 px, sem rolagem lateral.

## 3. Identidade preservada (comparação pixel a pixel V3 × V4)

Mesmas condições nas duas: movimento reduzido, imagens carregadas, aviso de
prévia fechado. Diferença = pixels com variação acima de 24 em 255.

| Tela | Primeira tela | Página inteira | Altura da página |
|---|---|---|---|
| 1440×900 | 0,01% | 0,02% | igual (6.121 px) |
| 768×1024 | 0,01% | 0,02% | igual (7.583 px) |
| 390×844 | 0,03% | 0,27% | igual (7.237 px) |
| 320×568 | 0,04% | 0,14% | igual (7.377 px) |

As diferenças vêm da compressão AVIF, das miniaturas de 192 px no celular e
do novo fundo pré-desfocado da abertura. Capturas lado a lado em
`docs/comparacao/v3-v4-*`.

## 4. Fluxos de quem usa o celular (390×844)

| Pessoa | Caminho | Toques |
|---|---|---|
| A — quer ver o almoço | "Ver cardápio" → aba "Buffet & grelhados" | 2 |
| B — quer consultar marmita | "Ver cardápio" → aba "Pratos & marmitas" → "Consultar marmitas no WhatsApp" (abre conversa com a mensagem pronta; nada é enviado sozinho) | 3 |
| C — quer o endereço | "Como chegar" (o endereço fica visível na tela) | 1 |
| D — quer ver fotos | Menu → "Galeria" | 2 |

## 5. Outros testes

- **Âncoras com cabeçalho fixo:** ao navegar para cada seção, o título fica
  entre 168 e 182 px abaixo do cabeçalho — nenhum escondido.
- **Barra inferior:** não aparece na abertura, some antes do rodapé (o último
  link, "Voltar ao topo", fica livre) e não aparece com o menu aberto nem com o
  celular deitado (seria 20% da altura).
- **Menu ao girar o aparelho:** abrir no celular e passar para 1024 px fecha o
  menu e libera a página.
- **CSP ativa:** console limpo em 390 e 1440 px. Fontes, imagens AVIF e o
  script funcionam com `default-src 'self'`.
- **Página 404:** responde 404, com a identidade do site e link para o início.
- **Prévia em arquivo único:** aberta sozinha por `file://`, em 390 e 1440 px —
  0 imagens quebradas, 3 fontes ativas, sem erro e sem rolagem lateral.

## 6. Problemas encontrados durante a V4 e corrigidos

| Problema | Causa | Correção |
|---|---|---|
| Galeria 11–23 px mais alta que na V3 | o `<source>` do AVIF virava um item vazio da grade dentro de `<figure>` | `picture > source { display: none }` |
| Rodapé 12 px mais alto | títulos passaram de `h2` para `p` e uma regra antiga de espaçamento passou a valer | regra limitada a parágrafos que não são título |
| Com o menu aberto, "Pular para o conteúdo" ainda recebia foco | ficou fora da lista de elementos inertes | incluído |
| Nome da marca com rótulo diferente do texto visível (Lighthouse) | `aria-label` no link da marca | `aria-label` removido |
| A foto do buffet seria baixada duas vezes | pré-carregamento em WebP + `<picture>` escolhendo AVIF | pré-carregamento de imagem removido |

## Não testado

- **Safari no iPhone e Chrome em Android de verdade.** Só emulação no
  Chromium: área segura, barra dinâmica do Safari e desempenho em aparelho
  intermediário não foram verificados em aparelho.
- **Firefox.**
- **Leitor de tela** (VoiceOver, TalkBack, NVDA) — estrutura e foco verificados
  por teclado e pelo Lighthouse, não com leitor.
- **INP e Core Web Vitals de usuários reais** — o site não está no ar.
- **Deploy real na Vercel** — o `vercel.json` foi validado pelo servidor local
  que aplica os mesmos cabeçalhos, não na Vercel.
- Se o WhatsApp é do restaurante e se o Google Maps acha o endereço.
