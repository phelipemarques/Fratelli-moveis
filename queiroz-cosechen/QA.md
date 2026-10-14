# QA — Vitor Queiroz Cosechen

## Rodada 4 — polimento final (14/10/2026)

| Item | Resultado |
|---|---|
| Comparação visual antes × depois | 8 tamanhos × 9 áreas (72 capturas de cada versão) |
| Larguras 320×568 a 1920×1080 | Sem rolagem horizontal, sem texto cortado, sem botão sobreposto, áreas de toque ≥ 24 px, título em 4 linhas |
| Zoom 200%, menu, âncoras, teclado, skip-link | Passou (mesmos critérios da rodada 3) |
| Formulário | Nenhum erro visível ao carregar; erros por campo; contador; texto especial preservado na URL do WhatsApp; alternativa com janela bloqueada |
| Hover dos temas | Fio no topo em escala 1, seta deslocada 4 px |
| Marcação “sem rodeio.” | Termina em escala 1 após a entrada |
| Movimento reduzido / sem JS | 0 de 12 cards e temas escondidos |
| Build de produção | Continua recusando por causa de `[nº e seccional a confirmar]` |
| Arquivo único | 132 KB, fonte carregada, 0 requisições externas, 0 erros |

**Não executados:** links externos (bloqueados nesta rede), Safari/Firefox e aparelhos reais, leitor de tela real, Lighthouse.

---

## Rodada 3 — refinamento de direção de arte (13/10/2026)

Chromium (Playwright), pasta servida por `python3 -m http.server`.

| Item | Como | Resultado |
|---|---|---|
| Larguras | 320×640, 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×800, 1440×900, 1920×1080 | Sem rolagem horizontal, sem texto cortado, sem botão sobreposto, nenhuma área de toque abaixo de 24 px; título da abertura em 4 linhas em todas |
| Zoom 200% | 640×450, densidade 2 | Sem rolagem horizontal; o menu rola por dentro e o último item é alcançável |
| Menu mobile | clique, Esc, Tab para fora, clique em link, clique fora | Todos fecham; Esc devolve o foco ao botão; cabeçalho fica opaco com o menu aberto |
| Âncoras | 4 seções | Títulos abaixo do cabeçalho fixo |
| Teclado | “Pular para o conteúdo” + 12 Tabs | Foco vai para `<main>`; contorno visível em todos |
| Formulário | vazio, parcial, completo, janela bloqueada | Erros por campo com `aria-invalid` e `aria-describedby`; contador; texto com acentos, quebras, `&`, aspas, `%`, `#` e emoji idêntico na URL do `wa.me/5545991176434`; link alternativo quando a janela é bloqueada |
| Movimento reduzido / sem JS | `prefers-reduced-motion`, JS desligado | 0 de 12 cards e temas escondidos; títulos e destaques visíveis |
| Contraste | WCAG das cores novas | Menor valor 4,9:1 (`--subtle` sobre `--surface`); texto 15,2:1 |
| Console | todas as rodadas | Nenhum erro |
| Árvore de acessibilidade | `ariaSnapshot()` | 0 links sem nome |
| Arquivo único | `file://` | Fonte embutida carregada, 0 requisições externas, `noindex` |
| Build de produção | sem domínio; com pendência; cópia de teste com OAB fictícia **fora do projeto** | Recusa nos dois primeiros casos; no terceiro gera `index, follow`, canonical, og:url, URLs absolutas, `robots.txt`, `sitemap.xml` |

**Não executados:** links externos (bloqueados nesta rede), Safari/Firefox/aparelhos reais, leitor de tela real, Lighthouse, publicação real.

---

## Rodada 2

Segunda rodada, 13/10/2026, depois da auditoria (`AUDITORIA.md`). Testes com
Chromium (Playwright), servindo a pasta por `python3 -m http.server`, e o
arquivo único aberto direto do disco (`file://`).

## Executados

| Item | Como | Resultado |
|---|---|---|
| Referências quebradas | IDs, âncoras internas, `aria-describedby/labelledby/controls` | 0 IDs repetidos, 0 âncoras sem destino, 0 referências ARIA quebradas |
| Erros de execução | console, `pageerror`, respostas 4xx/5xx em todas as rodadas | Nenhum |
| Fontes | `document.fonts` | Manrope carregada no site e no arquivo único |
| Larguras | 320, 375, 390, 430, 768, 1024, 1280, 1440 px, rolando a página inteira | Sem rolagem horizontal; nenhum elemento passa da borda; nenhum texto cortado; nenhum botão sobreposto; título da abertura em 4 linhas em todas |
| Áreas de toque | links e botões fora de texto corrido | Nenhum abaixo de 24 px (a marca do cabeçalho tinha 19 px; corrigido para 44 px) |
| Zoom 200% | viewport 640×450 com densidade 2 | Sem rolagem horizontal; menu cabe na tela e o último item é alcançável |
| Menu mobile | 390×844 | Abre com `aria-expanded=true` e foco no 1º link; Esc fecha e devolve o foco ao botão; Tab além do último item fecha; clique em link fecha e leva à seção; clique fora fecha |
| Âncoras | menu → 4 seções, 1440 px e 390 px | O título de cada seção fica abaixo do cabeçalho fixo |
| Item ativo do menu | rolagem até Contato, campo violeta, Temas, abertura | Contato / nenhum / Temas / nenhum |
| Pular para o conteúdo | 1º Tab numa página recém-aberta, Enter | Aparece no topo; foco vai para `<main id="conteudo">` |
| Foco visível | 12 Tabs a partir do conteúdo | Contorno em todos |
| Formulário vazio | Enter no botão, só teclado | 3 erros, cada um ao lado do seu campo, ligado por `aria-describedby`, com `aria-invalid=true`; foco no 1º campo; aviso no `role=status` |
| Validação ao corrigir | nome preenchido, mensagem curta | Erro do nome some; o da mensagem aparece |
| Contador | texto de 87 caracteres | “87 de 600 caracteres” |
| Codificação | nome com acentos, cargo com travessão, mensagem com quebra de linha, `&`, aspas, `%`, `#` e emoji | URL para `wa.me/5545991176434`; o texto decodificado é idêntico ao digitado; 7 quebras de linha preservadas |
| Confirmação | após abrir | “O WhatsApp foi aberto em uma nova aba… Nada é enviado até você tocar em enviar por lá.” |
| Janela bloqueada | `window.open` devolvendo `null` | Aparece o link “Toque aqui para abrir o WhatsApp com a sua mensagem”, com a mesma URL |
| Movimento reduzido | `prefers-reduced-motion: reduce` | Sem animação; todos os destaques e títulos visíveis de imediato |
| Sem JavaScript | 390 px | Menu visível em linha, todo o conteúdo visível, sem rolagem horizontal |
| Árvore de acessibilidade | `ariaSnapshot()` do Chromium | 0 links sem nome; títulos em ordem (1 h1, h2 por seção, h3 dentro) |
| Contraste | cálculo WCAG | Texto 15,5:1 · apoio 7,2:1 · violeta claro 8,3:1 · branco sobre violeta 9,4–9,9:1 · placeholder 4,8:1 |
| Metadados | leitura do `<head>` | Title 66 caracteres, description 146, OG e Twitter completos, `noindex` presente (correto para a prévia) |
| Arquivo único | `file://`, 1440 px | 120 KB, fonte embutida carregada, 0 requisições externas, `noindex` presente |

## Corrigido durante os testes

- Título quebrando em 5 linhas a 320 px → escala da abertura ajustada.
- Marca do cabeçalho com 19 px de altura no mobile → 44 px.
- Contador da seção violeta numerando também os links de referência (03, 04, 05) → seletor de filho direto.
- Item do menu preso em “Contato” sobre o campo violeta → lógica de seção visível refeita.
- O primeiro teste do “Pular para o conteúdo” saiu errado por um defeito **do script de teste** (foco herdado do teste anterior); refeito numa página nova.

## Não executados

- **Links externos** (Instagram, Threads, WhatsApp, Câmara, STF): a rede deste ambiente bloqueia esses domínios. As URLs foram conferidas só no formato. Ver `PENDENCIAS.md`, item 5.
- **Envio real pelo WhatsApp:** a abertura foi interceptada no teste.
- **Safari, Firefox, navegadores móveis reais:** só Chromium disponível. Pontos de atenção já tratados com fallback: `cqi`, `matchMedia`.
- **Leitor de tela real** (NVDA, VoiceOver, TalkBack): verificado só pela árvore de acessibilidade.
- **Lighthouse / Core Web Vitals:** ferramenta indisponível; página sem imagens pesadas, 1 fonte de 25 KB (+15 KB latin-ext sob demanda), CSS e JS sem dependências.
- **Fontes jurídicas oficiais:** Câmara, STF e OAB inacessíveis daqui; verificação feita por buscas em fontes secundárias, registrada em `PENDENCIAS.md`.
- **Produção:** sem domínio, nada de `canonical`, `og:url`, `robots.txt`, `sitemap.xml` ou cabeçalhos HTTP pôde ser testado no ar.
