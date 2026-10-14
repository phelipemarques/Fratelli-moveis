# Auditoria e refinamento — Vitor Queiroz Cosechen

## Rodada 6 — posicionamento, arquitetura e conversão (14/10/2026)

**O que prejudicava a conversão**
- Quem é o Vitor só aparecia de verdade na 5ª seção: 10,2 telas de rolagem no celular (390 px), 6,6 no desktop.
- A ação principal da abertura levava ao conteúdo; o WhatsApp era um link secundário. Não havia nenhum botão de contato no corpo da página antes do formulário.
- Depois dos conteúdos não havia próximo passo: a leitura terminava e o visitante seguia rolando sem direção.
- O formulário começava com um parágrafo de quatro linhas sobre privacidade antes do primeiro campo.

**Duas composições testadas (medidas em telas até cada ponto)**

| | Quem é (390 px) | Quem é (1440) | Formulário (390 px) |
|---|---|---|---|
| Antes | 10,2 | 6,6 | 12,5 |
| A — ordem atual refinada | 10,6 | 6,8 | 13,0 |
| **B — Sobre logo após a abertura** | **1,6** | **1,4** | 13,0 |

Escolhida a **B**: Abertura → Sobre → Temas → Conteúdos → Manifesto → Contato.
Segue a lógica posicionamento → quem é / para quem → assuntos → prova pelo
conteúdo → método → contato, sem duplicar a identificação no topo.

**Alterações**
- Abertura: botão principal “Falar pelo WhatsApp”; “Ver as explicações” como link. Texto de apoio passa a dizer quem é e para quem (“advogado do servidor público e de sindicatos”).
- Fim dos Conteúdos: “Tem uma situação parecida com algum destes assuntos?” + “Preparar mensagem” (leva ao formulário) ou “Continuar no Instagram”. Sem prometer atendimento.
- Temas: ressalva curta e visível (“assuntos abordados nas publicações — não uma lista de serviços”), com link para o contato.
- Sobre: texto mais humano e factual (vídeos gravados por ele, em primeira pessoa, muitos respondendo perguntas dos comentários) em vez de repetir a abertura.
- Formulário: uma frase em cima (“A mensagem abre no seu WhatsApp e só é enviada quando você confirmar”); privacidade como nota abaixo do botão; botão “Abrir mensagem no WhatsApp”; campo “Cargo e órgão, ou sindicato”.
- Menu e rodapé na ordem da página; índices renumerados.
- Impressão: nada fica escondido à espera da rolagem.

**Removido (densidade)**: numeração 01–04 da ficha do Sobre e o marcador “04 / 06” dos Temas — não orientavam, só decoravam.

**Rejeitado**: botão flutuante de WhatsApp no celular (com a nova ordem e o CTA ao fim dos conteúdos, o contato aparece cedo sem tom comercial); renomear Temas para “Áreas de atuação” (afirmação não confirmada).

---

## Rodada 5 — sistema visual e motion (14/10/2026)

Antes × depois renderizados em 1920×1080, 1600×900, 1440×900, 1280×800,
1024×768, 768×1024, 430×932, 390×844, 360×800 e 320×568 (90 capturas de cada).

**Problemas reais encontrados**
- Abertura: a capa violeta cobria o fim do título da capa escura (“Paulo Gu…”).
- Mobile (360–430 px): as capas ocupavam quase uma tela inteira depois dos botões.
- Não havia um sistema gráfico recorrente além do marca-texto; os fios de seção eram genéricos.
- Título da abertura entrava com fade simples; manifesto e rodapé não tinham entrada própria.
- Regressão desta rodada pega na comparação: títulos com revelação por recorte não apareciam (o Chromium considera o `clip-path` do próprio elemento no IntersectionObserver). Corrigido observando o elemento pai.

**Implementado**
- Assinatura gráfica “ler → marcar → entender”: índice (01–06) + fio + segmento violeta + marcador quadrado, com desenhos diferentes no topo da abertura, fios de seção, manifesto, ficha do Sobre, menu mobile e rodapé.
- Abertura: guias de 12 colunas a 3,5% de opacidade que somem para baixo; fio do topo que se desenha; título com máscara por linha; “sem rodeio.” com extensão gráfica de 6–14 px; capa violeta deslocada (título da capa escura inteiro legível); paralaxe de no máximo 10/18 px só acima de 1180 px.
- Sequência de entrada de ~1,5 s: fio → legenda → linhas → marcação → texto → botões → capas.
- Cabeçalho: item ativo com fio + microquadrado violeta. Trilho de leitura com indicador de posição.
- Conteúdos: hover com 3 px, borda mais clara, fio violeta no topo e seta; “32” desloca 4 px; PAD com fio pontilhado entre erros; vídeo com título de citação e aspas penduradas.
- Temas: marcador de posição “04 / 06” no cabeçalho fixo; título desloca 3 px no hover; cabeçalho lateral deixa de ser fixo em telas com menos de 720 px de altura.
- Manifesto: “Leia o texto.” por máscara → tarja escura se expande → frase aparece; fio que percorre os três passos (só desktop).
- Sobre: ficha numerada com fio vertical e segmento violeta, nome em 2,35rem, “Pendente do cliente” ao lado da OAB.
- Formulário: rótulo acende em violeta no foco, fio lateral + anel suave, rótulo e borda em vermelho no erro.
- Rodapé: espaço negativo maior, assinatura maior, fio que se desenha e marca-texto ao entrar.
- Menu mobile: índices, item ativo, entrada em sequência curta (40 ms entre itens).
- Tokens de motion: `--motion-fast/base/slow`, `--ease-standard/enter/exit`, em quatro famílias (A microinteração, B reveal, C editorial, D navegação).

**Considerado e rejeitado**
- Altura do cabeçalho mudando ao rolar: o cabeçalho é `sticky`, então mudar a altura desloca a página inteira (CLS).
- Fonte serifada, cursor customizado, spotlight, tilt 3D, marquee: fora do posicionamento.
- Reveal em parágrafos e stagger em todas as listas: o contraste entre o que se move e o que fica parado é o que dá hierarquia.
- Usar quadros da gravação como capas ou foto: resolução baixa, interface do Instagram por cima, sem autorização de uso.

---

## Rodada 4 — polimento final (14/10/2026)

Comparação lado a lado da versão aprovada com a polida, em 1920×1080, 1440×900,
1024×768, 768×1024, 430×932, 390×844, 360×800 e 320×568.

**Corrigido**
- 1024×768: o texto de apoio e os botões da abertura ficavam fora da primeira
  dobra — o bloco se alinhava à base de uma linha do grid esticada pelas capas.
- 320 px: quatro linhas de texto pequeno antes do título (legenda e canal); o
  canal voltou a caber em uma linha.
- Regressão desta rodada pega na comparação: o novo estilo de erro do formulário
  (`display: flex`) vencia o atributo `hidden` e mostrava os erros ao carregar.
  Corrigido com `.field__error[hidden]`.

**Refinado**
- “sem rodeio.”: bloco desenhado com bordas levemente fora de esquadro, entra
  da esquerda com `transform` (antes `background-size`).
- Capas da abertura: até 24rem, alinhadas à direita, título da capa escura com
  menos contraste — apoio, não protagonista.
- Cabeçalho após rolagem: fundo e desfoque um pouco mais leves.
- Conteúdos: os textos de assédio moral e da notícia comentada viraram colunas
  abertas (só fio no topo), quebrando a grade de caixas.
- Temas: hover só em dispositivos com mouse — fio que acende, descrição com mais
  contraste, contorno do número em off-white, seta 4 px. Sem fundo, sem número
  preenchido.
- Manifesto: passos em 1rem com largura de leitura de 36 caracteres.
- Sobre: identificação como bloco de créditos (fio violeta, rótulos menores,
  nome em destaque) com fio no mesmo nível do “Sobre”; marcador quadrado
  violeta nos públicos.
- Formulário: separação entre aviso e campos, campos de 50 px, foco com anel
  suave, erro com faixa lateral e ícone, botão de 56 px.
- Movimento: linhas de tema entram com 6 px e mais rápido; cards com 12 px.

**Mantido sem mudança:** título e texto da abertura, botões, paleta, Manrope,
manifesto (conceito e cores), contato, rodapé, links, número, textos jurídicos,
JSON-LD, `noindex` da prévia.

---

## Rodada 3 — direção de arte (13/10/2026)

**Problema principal encontrado:** na abertura, as duas capas (sobretudo a
violeta, o bloco mais brilhante da tela) disputavam atenção com o título.
Além disso, o perfil do Instagram era linkado 6 vezes, o @ aparecia 9 vezes em
texto e o “Sobre” repetia o formato já explicado na seção violeta.

| Área | Antes | Depois |
|---|---|---|
| Cabeçalho | Faixa opaca separada da abertura | Transparente no topo; translúcido com desfoque leve depois da rolagem; sublinhado animado na navegação; WhatsApp em contorno com ícone de link externo |
| Abertura | Título e capas com o mesmo peso | Fio de cabeçalho editorial (atuação à esquerda, canal à direita); título ocupa 8 de 12 colunas; texto de apoio em uma frase com o nome; capas menores, sobrepostas, com inclinação de −2,5° e 2°, sombra discreta e reação ao hover |
| Ritmo | Toda seção abria igual | Fio de seção com legenda e dado factual (“5 publicações · outubro de 2026”, “6 assuntos”) |
| Conteúdos | Hierarquia variava de card para card | Mesma estrutura em todos: tipo, tema, data → título → contexto → rodapé com ação; hover com elevação de 4 px; títulos dos vídeos agrupados em “Também no perfil”, com a única chamada forte para o Instagram |
| Temas | Só o número reagia ao hover | Linha inteira clicável quando há publicação; fundo muda, número preenche, seta avança; temas sem post marcados “Em vídeos” |
| Sobre | Ficha + parágrafo que repetia a seção violeta + bloco de redes | Texto curto + “Para quem as publicações falam” (professores, profissionais da saúde, servidores municipais, sindicatos — públicos que aparecem nos posts e na bio) + ficha de identificação com faixa violeta |
| Contato | Formulário funcional, visual simples | Campos de 52 px, faixa violeta, erros com marcador “!” além da cor, aviso informativo separado |
| Rodapé | Três colunas soltas | Assinatura “Direito do servidor público, explicado sem rodeio.”; identificação, navegação e canais em colunas rotuladas; aviso legal no fecho |
| Repetição | 6 links visíveis ao perfil; @ 9× no HTML | 3 links visíveis ao perfil (fio da abertura, “Ver todas”, rodapé) + dados estruturados; @ 6× (incluindo metadados); Threads só no rodapé e nos dados estruturados |
| Código | Tokens `--ink-*`, `--violet` | Tokens semânticos: `--bg`, `--surface`, `--text`, `--muted`, `--accent`, `--border`, `--radius`, `--shadow`, `--container`, `--section-space`, `--ease` |
| SEO | Sem dados estruturados; produção dependia de edição manual | JSON-LD `Person` só com nome, atuação declarada e perfis oficiais; `twitter:image`; `tools/build-production.py` |

**Decisão:** não entrou segunda fonte. Os carrosséis do perfil são 100% sem
serifa; uma serifada “editorial” afastaria o site da identidade que o público
já reconhece. O tom de revista veio do contraste de pesos da Manrope, dos fios
e da diagramação.

**Preservado:** título e assinatura “sem rodeio.”, paleta medida no vídeo,
textos jurídicos e atribuições da rodada 2, links, formulário → WhatsApp,
seção violeta, acessibilidade e o `noindex` da prévia.

---

## Rodada 2

Auditoria feita em 13/10/2026 sobre a versão anterior (`index.html` + `assets/`,
da qual `queiroz-cosechen-visualizacao.html` é gerado). Cada problema foi achado
lendo o código e rodando o site no navegador; o que não pôde ser verificado está
marcado como **pendente de teste**.

Legenda do resultado: ✅ corrigido · 📋 depende do advogado (ver `PENDENCIAS.md`)
· ⏳ pendente de teste.

---

## 1. Bloqueadores de publicação

| # | Problema | Resultado |
|---|---|---|
| 1.1 | Inscrição na OAB ausente — aparece `[nº e seccional a confirmar]` no “Sobre” e no rodapé. A identificação com nome e número de inscrição é exigida na publicidade do advogado. | 📋 Marcador mantido de propósito (é o que impede a publicação por engano). |
| 1.2 | Espaço `[Fotografia do Vitor — a enviar]` visível no “Sobre”, com cara de seção inacabada. | ✅ Removido da página. O “Sobre” virou uma ficha de identificação; o ponto de entrada da foto ficou comentado no HTML. 📋 Foto continua pendente. |
| 1.3 | Textos jurídicos e de apresentação não aprovados pelo profissional. | 📋 Lista do que revisar em `PENDENCIAS.md`. |
| 1.4 | Sem domínio: `noindex`, `og:image` relativa, sem `canonical`/`og:url`. | ✅ `noindex` mantido (correto para prévia). Marcas `PRODUÇÃO` no `<head>`. 📋 Domínio. |

## 2. Conteúdo e confiança

| # | Problema | Resultado |
|---|---|---|
| 2.1 | “Verificado pelo Instagram”: o selo aparece na gravação de 13/10/2026, mas não dá para confirmar que continua valendo. | ✅ Afirmação removida. |
| 2.2 | “Cinco publicações recentes” sem data. | ✅ Datas lidas na gravação: todas de outubro de 2026 (PAD em 3/10, CAT em 4/10; as demais “há 1 dia” e “há 6 dias” em 13/10). Cada card mostra “Out. 2026” com `<time>`. |
| 2.3 | Card do PAD mostrava os erros 01 e 04 sem explicar o recorte. | ✅ Legenda “Dois dos cinco erros apresentados no carrossel”; leitor de tela ouve “Erro 1 de 5”, “Erro 4 de 5”. |
| 2.4 | Cards de assédio e CAT mostravam uma etapa isolada. | ✅ Legendas “Trecho: a primeira das seis provas” e “Trecho: o quarto dos cinco passos”. |
| 2.5 | Opinião apresentada como fato no card da PEC (“concurso público deixando de ser regra”). | ✅ Atribuída: “na leitura do Vitor, o concurso público deixaria de ser a regra”. |
| 2.6 | Relato pessoal sem atribuição no card do PAD (“há servidores que… acabaram demitidos”). | ✅ “Vitor relata ter visto…”. |
| 2.7 | Notícia do MPT apresentada como fato. Busca não encontrou a ação do MPT contra a Prefeitura do Rio envolvendo CRAS/CREAS/Conselhos Tutelares. | ✅ Título entre aspas como “manchete exibida no vídeo”; categoria “Notícia comentada”. 📋 Pedir a fonte da notícia. |
| 2.8 | “…e mostra de onde vem cada regra” (abertura) e “cada explicação diz de onde vem a regra” (seção violeta): afirmação genérica sem comprovação. | ✅ Removida da abertura; na seção violeta virou “quando a explicação parte de uma norma ou de um julgamento, a publicação diz qual é”, com duas referências nomeadas e consultáveis. |
| 2.9 | “A fonte, citada” não oferecia fonte consultável. | ✅ Agora “A referência, nomeada”, com links: PEC 32/2020 (ficha da Câmara) e Tema 1218 (RE 1.326.541, andamento no STF). ⏳ Links não abertos daqui (ver QA). |
| 2.10 | Reproduções em CSS das capas na abertura podiam passar por imagem original (tinham até a assinatura “QUEIROZ COSECHEN”). | ✅ Assinatura removida; cada capa tem “Abrir o original”; legenda diz que são capas “redesenhadas em texto para o site”. |
| 2.11 | Chamada do contato (“Pergunte direto.”) soava como consulta gratuita. | ✅ “Para falar com o Vitor, o canal oficial é o WhatsApp.” + aviso de caráter informativo. |
| 2.12 | Título do Threads “Conta vinculada ao perfil do Instagram” afirmava vínculo técnico. | ✅ “Conta indicada na bio do Instagram” (é o que a gravação mostra). |

## 3. UX/UI

| # | Problema | Resultado |
|---|---|---|
| 3.1 | Abertura com WhatsApp como ação principal — tom de campanha de venda. | ✅ Principal: “Ver as explicações”. Secundária: “Falar pelo WhatsApp”. Botão do cabeçalho em contorno. |
| 3.2 | Canal oficial do Instagram não aparecia na primeira dobra. | ✅ Linha “Perfil oficial no Instagram: @vitorqcosechen.adv”. |
| 3.3 | Menu mobile aberto continuava cobrindo a página quando o foco saía dele pelo Tab. | ✅ Fecha ao perder o foco. |
| 3.4 | Menu mobile sem limite de altura (zoom alto ou tela baixa). | ✅ `max-height` + rolagem interna. |
| 3.5 | Item do menu continuava marcado ao rolar para a abertura ou o campo violeta. | ✅ Marca só a seção que está na faixa central; nenhuma fora delas. |
| 3.6 | Título da abertura quebrava “servidor público,” em 2 linhas a 320 px. | ✅ Escala ajustada; 4 linhas em todas as larguras de 320 a 1440 px. |
| 3.7 | Marca do cabeçalho com área de toque de 19 px no mobile. | ✅ 44 px. |
| 3.8 | Contador “48/600”. | ✅ “48 de 600 caracteres”, sem anunciar a cada tecla. |
| 3.9 | Mensagem de status “Sua mensagem foi aberta no WhatsApp”. | ✅ “O WhatsApp foi aberto em uma nova aba com a sua mensagem. Nada é enviado até você tocar em enviar por lá.” |
| 3.10 | Números da seção violeta: referências internas herdavam o contador (apareciam 03, 04 e o passo final virava 05). Erro introduzido nesta rodada e pego na revisão visual. | ✅ Seletor `> li`. |

## 4. SEO

| # | Problema | Resultado |
|---|---|---|
| 4.1 | Description com 185 caracteres. | ✅ 146. |
| 4.2 | Sem `twitter:title`/`twitter:description`, sem `og:site_name`/`og:image:alt`. | ✅ Acrescentados. |
| 4.3 | `canonical`, `og:url`, URL absoluta da imagem, `robots.txt`, `sitemap.xml`. | 📋 Dependem do domínio; instruções no `README`. Não inventei domínio. |
| 4.4 | Dados estruturados. | Não adicionados: sem OAB e área confirmadas, ficariam incompletos. |

## 5. Acessibilidade

| # | Problema | Resultado |
|---|---|---|
| 5.1 | `aria-label` em `<div class="steps">` sem papel (nome proibido para elemento genérico). | ✅ Removido; “Passo 4 de 5” já é texto visível. |
| 5.2 | `<main>` sem `tabindex="-1"`: o “Pular para o conteúdo” não movia o foco em alguns navegadores. | ✅ Testado: foco vai para `#conteudo`. |
| 5.3 | Contador com `aria-live` anunciando cada tecla. | ✅ Removido; continua ligado ao campo por `aria-describedby`. |
| 5.4 | Formulário sem nome acessível. | ✅ `aria-labelledby` + `aria-describedby` (aviso de privacidade). |
| 5.5 | Leitor de tela real (NVDA, VoiceOver). | ⏳ Verificado só pela árvore de acessibilidade do Chromium. |

## 6. Técnico e compatibilidade

| # | Problema | Resultado |
|---|---|---|
| 6.1 | `matchMedia().addEventListener` não existe no Safari < 14 — o script quebraria ali. | ✅ Fallback para `addListener`. |
| 6.2 | Slides da abertura usam `cqi` sem fallback (Safari < 16, Firefox < 110). | ✅ Valores em `rem` antes de cada `cqi`. |
| 6.3 | Sem cabeçalhos de segurança/cache para a hospedagem. | ✅ `_headers` (nosniff, referrer, frame, permissions, cache). |
| 6.4 | Gerador do arquivo único deixava comentários internos (marcas de PRODUÇÃO) na prévia. | ✅ Comentários removidos na geração. |
| 6.5 | Safari e Firefox reais. | ⏳ Só Chromium disponível. |

## 7. Refinamentos visuais opcionais (não feitos, aguardam material)

- Capas reais dos carrosséis (arquivos 1080×1350 exportados pelo designer) no lugar das capas redesenhadas — ver `PENDENCIAS.md`.
- Retrato do Vitor na abertura, ao lado das capas.
- Símbolo “Queiroz Cosechen” em vetor no cabeçalho e no rodapé.
