# QA — GRO Cascavel

## V2 visual (fotografia)

| Verificação | Resultado |
|---|---|
| Fotos reais | 9, recortadas do vídeo (posts de NR-12, CIPA, "Estamos aqui!" e 2 reels); exibidas no máximo no tamanho do arquivo (2× a origem) |
| Momentos fotográficos | Hero (3 fotos), Soluções (par de fotos por solução, troca ao abrir), Para empresas, Sobre; Conteúdos com capas no idioma visual do Instagram |
| Ritmo | foto → tipografia → foto + interação → foto → processo → tipografia → foto → capas → CTA |
| Movimento das fotos | máscara verde-lima sobe e revela; escala 1,08 → 1; troca com fade nas soluções; parallax de até 14 px na foto de Para empresas |
| Hero no celular e tablet (até 1279 px) | ordem título → fotos → texto → contatos, para as pessoas aparecerem na primeira tela |
| Lighthouse 13 | mobile 97 / 100 / 100 / 100 / 100 (LCP 2,4 s); desktop 100 em todas |
| 6 larguras | sem rolagem horizontal, sem erros de console |
| Interações | as mesmas da versão anterior, repetidas: todas passaram |
| Movimento reduzido | 49/49 blocos visíveis, máscaras desligadas |

Problemas encontrados e corrigidos na V2: tratamento com desfoque das miniaturas
(parecia visão noturna, descartado); foto pequena em painel grande nas Soluções
(virou par de fotos com bloco verde); curva solta em Para empresas; curva cruzando o
subtítulo das capas; palco lateral do hero invadindo o texto em 1024 px (o hero
lateral só entra a partir de 1280 px); curva cruzando legendas no celular; painel do
Sobre repetia o do Contato (virou "Estamos aqui.").

## Versão anterior (redesign)

Data: 28/09/2026. Ferramentas: Chromium headless (Playwright 1.56),
Lighthouse 13.5, servidor local `python3 -m http.server`. Capturas em
`docs/capturas/`.

## Fases executadas

| Fase | Como | Resultado |
|---|---|---|
| 1. Vídeo e identidade | quadros a cada 0,5 s + ampliações de bio, story e posts | Gravação de tela do Instagram; cores, curvas, tipografia e textos extraídos; nenhuma foto utilizável |
| 2–3. Direção e arquitetura | `.impeccable.md` | Site tipográfico com "a curva GRO"; 9 seções |
| 4–5. Implementação e movimento | HTML/CSS/JS sem bibliotecas | Um momento orquestrado no hero; revelação por grupos; curva do processo ligada ao scroll |
| 6. Copy | revisão linha a linha | 3 correções (abaixo) |
| 7. SEO | skill seo-audit + Lighthouse | H1 passou a dizer o que e onde; 100 |
| 8. Segurança | skill owasp-security + varredura | Sem segredos, sem sinks de XSS, sem terceiros; CSP e cabeçalhos |
| 9. Qualidade web | skill web-quality-audit + Lighthouse 13 | 99–100 em todas as categorias |
| 10–11. Impeccable | 2 passadas visuais sobre capturas | 11 problemas corrigidos (abaixo) |
| 12. Mobile/desktop | 390, 430, 768, 1024, 1280, 1440, 1920 px | Sem rolagem horizontal, sem sobreposição |

## Lighthouse 13 (servidor local)

| | Desempenho | Acessibilidade | Boas práticas | SEO | Agentic browsing | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| Mobile | 99 | 100 | 100 | 100 | 100 | 2,0 s | 0 | 0 ms |
| Desktop | 100 | 100 | 100 | 100 | 100 | 0,4 s | 0,023 | 0 ms |

Sugestões restantes do Lighthouse (cache, compressão, CSS bloqueante, CSS/JS não
minificados) dependem da hospedagem ou de etapa de build. O `_headers` já define o
cache; compressão é ativada pela hospedagem.

## Testes no navegador

| Verificação | Resultado |
|---|---|
| Rolagem horizontal em 6 larguras | Nenhuma |
| Console e violações de CSP | Limpo em todas as larguras |
| Âncoras do menu | Todas com alvo |
| H1 único | 1 |
| Header | Transparente no topo → sólido após 32 px → some ao descer abaixo do hero → volta ao subir |
| WhatsApp flutuante | Aparece após ~60% do hero; some com o menu aberto |
| Acordeão por teclado | Enter abre, fecha os outros; links de painéis fechados ficam fora do Tab |
| Curva do processo | Acompanha o scroll; nós acendem quando a linha passa |
| Mapa sob demanda | Botão cria o iframe (sandbox, sem referrer completo), foco vai para "Fechar mapa"; fechar devolve o foco |
| Menu móvel | Abre com foco no 1º link, trava rolagem, Esc fecha e devolve o foco, link leva à seção |
| Teclado | Pular para o conteúdo → logo → 6 links → CTA → hero; contorno de foco em todos |
| `prefers-reduced-motion` | 46/46 blocos visíveis de imediato, curvas já desenhadas |
| Página 404 | Renderiza no mesmo sistema visual |

## Problemas encontrados e corrigidos

1. Primeira linha do parágrafo do hero em outra cor (`::first-line`) parecia defeito: removido.
2. Posicionamento com metade direita vazia: recomposto em duas colunas.
3. Curva do processo desenhava só o fim: `vector-effect` anulava o `pathLength`; removido.
4. Resto de curva no canto do Contato parecia artefato: a curva passou para o painel do endereço.
5. Lista das soluções com texto menor que o corpo: corrigido.
6. Grade de Conteúdos com buraco (5 itens em 2 colunas): destaque + 4.
7. Hero do celular com título pequeno: escala mínima de 60 para 80 px.
8. Curva do hero cruzando texto e botões em 390, 768, 1024 e 1280 px: reposicionada por faixa.
9. Curva do hero terminando num corte reto em 1920 px: ancorada na borda da janela.
10. Curva do painel de endereço cortando "539" no celular: reduzida.
11. Resumo do acordeão em negrito sem querer (herdava do `h3`): corrigido.

Copy: "com o que faz ele funcionar" → "com o que o faz funcionar"; "com prática" →
"com teoria e prática"; "em qualquer segmento" (não comprovável) → "de diferentes
segmentos".

SEO: H1 passou a incluir "Medicina e Segurança do Trabalho em Cascavel".

## Segurança (OWASP, aplicável a site estático)

- Nenhum segredo, chave ou credencial no código.
- Nenhum `innerHTML`, `eval` ou `document.write`; o JS só usa `textContent` e
  `createElement`.
- Nenhum script, estilo ou fonte de terceiros; sem dependências.
- CSP restritiva (`default-src 'self'`, script inline autorizado só por hash,
  `frame-src` só Google, `form-action 'none'`, `object-src 'none'`) no `<meta>` e no
  `_headers`, com `frame-ancestors 'none'`, HSTS, nosniff, Referrer-Policy,
  Permissions-Policy e COOP. A CSP foi vista bloqueando estilo injetado no teste.
- Todos os `target="_blank"` com `rel="noopener noreferrer"`.
- Iframe do mapa com `sandbox` e carregado só por ação do usuário (sem cookies do
  Google antes do clique).
- Sem formulários, portanto sem coleta de dados pessoais.

## Não verificado

- **Mapa do Google, WhatsApp e Instagram**: domínios externos bloqueados pelo
  proxy deste ambiente. Links conferidos no código, não abertos.
- **Cabeçalhos do `_headers`**: o servidor local não os aplica; valem na hospedagem.
- **Safari/iOS e Firefox**: só Chromium disponível. Pontos a olhar: `oklch()`
  (Safari 15.4+), `color-mix()`, `:not()` com seletor composto, `clip` em `overflow`.
- **Leitor de tela real** (NVDA, VoiceOver): estrutura revisada e Lighthouse 100,
  sem teste com leitor.
- **Rede real e dados de campo (CrUX)**: medições em servidor local com simulação.
