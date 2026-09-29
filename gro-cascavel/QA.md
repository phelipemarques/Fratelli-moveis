# QA — GRO Cascavel

## V6 — redesign de direção de arte

Problemas da versão anterior e o que mudou:

| Problema | Mudança |
|---|---|
| Página quase toda verde | Superfícies claras dominam; verde escuro em hero (painel), soluções (número), Empresas, diferencial, contato e rodapé; lima só como acento |
| Condensada em tudo | Barlow Condensed só em títulos e números; texto em Hanken Grotesk |
| Hero só tipográfico sobre verde | Hero claro em duas colunas: texto + painel visual (curva, símbolo, endereço) preparado para a foto |
| Credenciais como lista | Faixa de 4 afirmações com divisórias verticais |
| Soluções como FAQ | Navegação: lista numerada à esquerda, solução ativa à direita (nome, frase, 3 itens, CTA) e número grande; no celular, acordeão |
| Empresas: texto + etapas | Título grande, 3 benefícios editoriais, processo com trilho fixo: a linha da marca e o contador (01/04) acompanham o scroll |
| Diferencial como comparação | "Não é só documentação." + bloco verde: "O documento é o começo. A orientação é o que faz ele funcionar." |
| Sobre frio | Quem é (texto + citação real da GRO), prova física ("539" + endereço + como chegar), depois dados |
| Temas | Índice editorial numerado com seta e linha no hover |
| Contato | CTA primeiro (título grande, botão grande), depois canais, depois localização e mapa |
| Header | Silencioso, menu junto ao logo, "Contato" saiu do menu (o CTA cumpre) |
| Curvas por toda parte | Curva só em hero, processo e contato |
| 3+ estilos de botão | Dois: principal (verde escuro no claro, lima no verde) e secundário (contorno) |

Testes:

| | Desempenho | Acessib. | Boas práticas | SEO | Agentic | LCP | CLS | Peso |
|---|---|---|---|---|---|---|---|---|
| Mobile | 99 | 100 | 100 | 100 | 100 | 2,0 s | 0 | 152 KB |
| Desktop | 100 | 100 | 100 | 100 | 100 | 0,5 s | 0 | 152 KB |

- 6 larguras sem rolagem horizontal e com console limpo.
- Soluções: no desktop sempre há uma aberta e clicar na ativa não fecha; no celular
  abre e fecha; teclado leva do item ao CTA do painel.
- Header, menu móvel, processo, mapa sob demanda e movimento reduzido (34/34) OK.
- Contraste: os passos inativos do processo usavam opacidade 35% e falhavam; agora
  usam cor (verde claro) e passam.
- Segurança: links externos com noopener, sem sinks de DOM, sem estilo inline,
  CSP com hash do único script inline.


## V5 — refinamento institucional (sem fotos)

- **Fotografia:** retiradas as imagens de IA (V4) e as miniaturas do Instagram.
  Regra: só foto real e boa. Cada seção tem um ponto preparado (comentário no
  HTML + CSS pronto) para receber a foto real.
- **Hero:** tipográfico, em caixa normal, uma frase, um CTA; faixa discreta com
  endereço e horário; curva da marca como única peça gráfica.
- **Credenciais** (nova, no lugar de "Mais do que cumprir obrigações", que repetia o
  Diferencial): responsável técnico com CRM/RQE, atendimento presencial, escopo.
- **Soluções:** índice à esquerda, painel à direita com número grande, nome, frase e
  CTA contextual; troca com fade no número e recorte no texto.
- **Para empresas:** título "Sua operação não para. A saúde e a segurança dela também
  não.", uma frase de parceria, três valores curtos, processo e CTA.
- **Diferencial:** "Documento entregue." (o mínimo) x "Documento entendido, risco
  prevenido, empresa acompanhada." (o que a GRO agrega).
- **Sobre:** texto + lista de fatos (endereço, horário, responsável técnico,
  Instagram); o endereço grande fica só no Contato, com o mapa.
- **Temas:** índice editorial sem cartões.
- **Código:** CSS reescrito sem as regras das versões anteriores (613 linhas, sem
  seletores duplicados); JS sem o tratamento de fotos ausentes; nenhuma imagem no
  HTML.

| | Desempenho | Acessib. | Boas práticas | SEO | Agentic | LCP | CLS | Peso |
|---|---|---|---|---|---|---|---|---|
| Mobile | 99 | 100 | 100 | 100 | 100 | 2,1 s | 0 | 160 KB |
| Desktop | 100 | 100 | 100 | 100 | 100 | 0,5 s | 0,001 | 160 KB |

6 larguras sem rolagem horizontal e com console limpo; header, menu, acordeão,
processo, mapa e movimento reduzido (35/35 blocos visíveis) testados.


## V4 — fotografia ilustrativa e hero com foto

- 6 fotos geradas por IA no Canva (a pedido): hero 16:9, 4 retratos 4:5 para as
  soluções, 1 horizontal 3:2 para Para empresas. Sem marca da GRO, com legenda
  "Imagem ilustrativa". O Sobre continua só com registros reais.
- **Arquivos ainda não baixados:** o Canva só entrega uma prévia de 200 px por aqui
  e o domínio de download está bloqueado. O layout foi testado numa cópia de teste
  (fora do repositório) com as prévias no lugar, só para validar composição.
- Hero: foto em tela cheia (desktop) ou no topo (celular), título em caixa normal,
  uma frase, um CTA; a curva da marca virou uma linha sobre a foto. Saíram o link
  "Ver soluções" e a faixa de dados.
- Soluções: a foto ocupa o painel inteiro, com nome, frase e CTA sobre degradê; no
  celular a foto entra dentro do acordeão.
- Para empresas: foto grande + uma frase de parceria + lista de públicos.
- Temas: um só estilo de cartão (antes 4 cores).
- Testes (cópia de teste): 6 larguras sem rolagem horizontal, console limpo,
  interações e movimento reduzido OK. Lighthouse: mobile 99/100/96*/100/100,
  desktop 100/100/96*/100/100 (*manifesto não copiado para a cópia de teste; no
  site real é 100). O peso final depende das fotos reais.


## V3 — refinamento de direção de arte

Decisões:

- **Fotos na resolução original, sem ampliar.** Na V2 as miniaturas eram exibidas
  a 2×; na V3 voltaram ao tamanho real (84–206 px); a foto da sala de treinamento saiu (não acrescentava informação) e só aparecem como registros
  pequenos: no painel de cada solução, ao lado do texto de Para empresas e numa
  faixa "Registros da GRO" no Sobre, com a fonte indicada.
- **Hero sem foto.** Nenhuma foto real passa no critério (alta resolução, espaço
  para texto). Hierarquia: título → texto → um CTA → dados de confiança; a curva
  da marca fica atrás. A variante com foto está pronta no CSS.
- **Decoração cortada (~60%).** Saíram: 3 curvas SVG (Soluções, Para empresas,
  painel do mapa), o arco do painel do hero, blocos verdes deslocados atrás das
  fotos, molduras, o grafismo das capas, o símbolo repetido nas capas e no mapa,
  o parallax. A curva ficou em 2 lugares: hero e "Como ajudamos".
- **Tipografia.** Caixa-alta só no título do hero; todos os outros títulos em
  caixa normal. Escala reduzida (h2 máx. 52 px, destaque máx. 80 px).
- **Soluções.** Painel à esquerda com número, nome, frase própria, CTA e registro;
  troca com fade + recorte + escala. No celular, o registro e o link entram dentro
  do acordeão. O painel vem depois do acordeão no HTML (ordem de leitura e foco) e
  é posicionado à esquerda por CSS.
- **Para empresas.** Um título grande, um parágrafo com os públicos, o processo e
  um CTA. Os 4 blocos de texto por público viraram uma frase.
- **Diferencial.** Duas metades: claro ("a legislação exige", em cinza) e verde
  ("a GRO agrega", em lima).
- **Conteúdos → "Temas que orientamos".** Sem títulos de post nem ícones de link
  individuais; um link para o Instagram.
- **Mapa.** Estado inicial com rótulo "Localização", endereço completo, "Como
  chegar" e "Mostrar o mapa aqui", avisando que carrega do Google Maps.
- **CTAs.** "Falar com a GRO" em todos os botões principais (hero, cada solução,
  Para empresas, contato, header, flutuante). "Ver soluções" virou link simples.
- **Performance.** Removidos a versão em arquivo único com Base64, o gerador dela,
  o parallax e cerca de 30% do CSS. Fotos em AVIF → WebP → JPG.

Resultados (Chromium, Lighthouse 13, servidor local):

| | Desempenho | Acessib. | Boas práticas | SEO | Agentic | LCP | CLS | Peso |
|---|---|---|---|---|---|---|---|---|
| Mobile | 99 | 100 | 100 | 100 | 100 | 2,0 s | 0 | 165 KB |
| Desktop | 100 | 100 | 100 | 100 | 100 | 0,5 s | 0,02 | 180 KB |

- 6 larguras (390–1920): sem rolagem horizontal, console limpo.
- Header, menu móvel, acordeão por teclado, processo, mapa sob demanda e movimento
  reduzido (39/39 blocos visíveis): todos passaram.


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
