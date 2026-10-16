# Parada do Mano — Relatório da V4

16/10/2026 · evolução da V3, não um redesign. Paleta, logo, abertura, título, fotos, ordem
das seções, galeria e animações foram preservados. Cada item: **problema → solução →
benefício → teste**. Todo número abaixo foi medido nesta data; o que não foi medido está
escrito como "Não medido". Diferenças pequenas estão chamadas de pequenas.

## Como foi medido

- **V3** = o commit `ebcce65` (pacote `parada-do-mano-v3-producao.zip`, descompactado).
  **V4** = o pacote `parada-do-mano-v4-producao.zip`, descompactado. As duas servidas pelo mesmo
  servidor local (`tools/servidor.mjs`: gzip, cache e Range), na mesma máquina, na mesma sessão.
- **Lighthouse 12.8.2**, mobile (Moto G Power emulado, 4G lento simulado, CPU 4x) e desktop,
  **3 execuções de cada, valor = mediana** (execuções individuais entre parênteses).
- **Playwright 1.56.1 + Chromium 141** (`tools/medir.mjs`): altura da página, posição das seções,
  bytes transferidos com cache desligado (**mediana de 3 visitas**), console e falhas de rede,
  capturas com as animações concluídas.
- **axe-core 4.14.0** (WCAG 2.0/2.1/2.2 A e AA + boas práticas), em 390 e 1440 px.
- **`tools/qa-browser.mjs`**: a bateria nova da V4, rodada nas duas versões.
- **`tools/inp-lab.mjs`**: duração de 11 interações pela Event Timing API (a mesma do INP),
  celular 390×844 com CPU 4x mais lenta, 5 execuções de cada versão. **É laboratório, não é INP
  de campo.**

O diagnóstico do briefing cita, para a V3 em 390 px, cardápio a ~1.819 px e página de
~8.598 px. Nas minhas medições (Chromium 141, 390×844, densidade 1, pacote de produção) a V3
dá 1.723 px e 7.967 px. Uso os meus números nos dois lados da comparação, sempre do mesmo jeito.

Limites: Lighthouse local com rede **simulada** não é dado de campo; Safari, Firefox e aparelhos
reais **não foram testados**; o entalhe do iPhone não é simulado pelo Chromium (área segura
verificada no código).

## Tabela V3 × V4

| Métrica | V3 | V4 | Leitura |
|---|---|---|---|
| Lighthouse mobile — Desempenho | 98 | 98 | igual |
| Lighthouse mobile — Acessibilidade / Boas práticas | 100 / 100 | 100 / 100 | igual |
| Lighthouse desktop — Desempenho | 100 | 100 | igual |
| Lighthouse SEO na prévia | 66 | 66 | só reprova `is-crawlable`: é o `noindex` pedido |
| Lighthouse SEO na cópia de publicação | Não medido | **100** | cópia com `set-domain.py https://exemplo.com.br --publicar`; o site entregue continua `noindex` |
| LCP mobile (simulado) | 2,33 s (2,33 · 2,33 · 2,10) | 2,25 s (2,25 · 2,33 · 2,10) | dentro da variação entre execuções; ambos abaixo de 2,5 s |
| LCP desktop (simulado) | 0,52 s | 0,52 s | igual |
| CLS mobile / desktop | 0,001 / 0,008 | 0,001 / 0,008 | igual, muito abaixo de 0,1 |
| TBT mobile | 30 ms (30 · 40 · 24) | 13 ms (13 · 0 · 46) | ruído; os dois muito abaixo de 200 ms |
| Bytes no teste mobile do Lighthouse | 376 KB | 301 KB | **−20%** |
| INP de campo | Não medido | Não medido | só com visitantes reais |
| Pior interação em laboratório (mediana de 5) | 104 ms (máx. 120) | 80 ms (máx. 104) | sem regressão; numa rodada anterior deu empate (96 × 96) |
| 1ª visita, celular 390 px, sem rolar | 268 KB · 14 req. | 231 KB · 13 req. | **−14%** |
| Página inteira rolada, 390 px | 719 KB · 27 req. | 647 KB · 25 req. | −10% na mediana; varia entre visitas (V3: 608–719 KB; V4: 647–682 KB) |
| 1ª visita, computador 1440 px (com vídeo) | 1.659 KB · 14 req. | 1.660 KB · 14 req. | igual |
| Requisições abortadas na carga | **2** (fotos de categorias fechadas) | **0** | corrigido |
| HTML / CSS / JS (gzip) | 8,8 / 9,6 / 5,5 KB | 9,0 / 10,1 / 6,3 KB | um pouco maior: gerador, testes de borda e mensagens mais longas |
| Altura da página — 390×844 | 7.967 px | 7.856 px | −1,4% (pequeno; o objetivo era não aumentar) |
| Altura da página — 320 / 768 / 1440 | 7.933 / 9.082 / 9.466 px | 7.782 / 9.018 / 9.128 px | −2% / −1% / −4% |
| Início do cardápio — 390 / 320 / 768 / 1440 | 1.723 / 1.704 / 1.942 / 2.007 px | 1.723 / 1.704 / 1.942 / 2.007 px | preservado |
| Área vazia no cardápio (pior categoria) | 127 px (390) · 139 px (320) · **218 px** (1440) | **0 px** | corrigido |
| Abas do cardápio em 1440 px | 2 linhas | 1 linha | |
| Bateria de testes da V4 | **210 de 220** | **220 de 220** | as 10 falhas da V3 estão na seção "Defeitos da V3" |
| Prévia em arquivo único | 6,79 MB | 6,81 MB | o vídeo embutido é a maior parte; não é o site publicado |
| axe-core — violações | 0 | 0 | |
| Erros e avisos de console | 0 | 0 | 13 tamanhos de tela |
| Pacote de produção | 94 arquivos · 11,45 MB | 92 arquivos · 11,31 MB | só o que a página usa |

Capturas V3 | V4 lado a lado, por seção, em `comparacao/` (1440×900, 768×1024, 390×844,
320×568) e a página inteira em `comparacao/{largura}-9-pagina-inteira.jpg`, com a linha do cardápio.

## Defeitos da V3 encontrados pela bateria nova (e corrigidos na V4)

A bateria da V4 é mais exigente. Rodada na V3, ela reprova 10 de 220 itens. Sete eram defeitos
reais; três são exigências novas da V4 (o começo padronizado das mensagens, a jornada que procura
a mensagem do buffet e o botão "Próxima" parado sob o dedo). Outros defeitos apareceram nas
medições e capturas, fora da contagem.

| Defeito na V3 | Como apareceu | Na V4 |
|---|---|---|
| Em 320 px o nome no cabeçalho quebrava em duas linhas e a marca (72 px) passava da barra (64 px) | teste "cabeçalho" + captura `320-0-primeira-tela` | botão do menu só com ícone abaixo de 360 px (a palavra "Menu" continua para leitor de tela) |
| Em 320 px "Como chegar" era cortado (texto de 142 px em botão de 137 px); com espaçamento de texto ampliado, criava rolagem lateral | medição do botão + teste de espaçamento (WCAG 1.4.12) | letras um pouco mais justas abaixo de 360 px; botão quebra linha em vez de cortar |
| Em 320 px o botão do cardápio passava da borda do cartão, "Opções e valores…" era cortado e o contador "01 / 10" ficava em 3 linhas | captura `320-3-cardapio` | painel novo, etiquetas menores em 320 px, contador numa linha |
| Foco do teclado escondido atrás da barra ou do cabeçalho em 6 elementos (390 px) | teste de foco (WCAG 2.4.11) | `scroll-padding-bottom` com a altura da barra |
| Galeria no celular baixava a foto de 1200 px | teste da galeria | 800 px em telas pequenas, 1200 px nas grandes |
| Contador e legenda da foto ampliada não eram anunciados ao trocar de foto | teste da galeria | `aria-live="polite"` |
| `env(safe-area-inset-bottom)` sem efeito no iPhone: faltava `viewport-fit=cover`, então a barra de ações podia ficar sob o indicador de início | inspeção do código (teste) | `viewport-fit=cover` + margens laterais pelo entalhe |
| Barra de ações continuava atrás do menu aberto | teste da barra | sai da tela quando o menu abre |
| Fotos de categorias fechadas começavam a baixar antes do JavaScript e eram canceladas | 2 requisições abortadas | endereço só chega quando a categoria abre |

Defeito encontrado por leitura de código e corrigido: tablet girado com o menu aberto deixava a
página travada (menu some na tela larga, mas a rolagem continuava bloqueada). Teste novo: passa.

## 1. Cardápio fácil de atualizar

**Problema.** Cada categoria era um bloco de HTML escrito à mão; para incluir um prato seria
preciso copiar e editar markup em dez lugares, e as mensagens do WhatsApp estavam espalhadas
em 20 links.

**Solução.** `conteudo/cardapio.json` guarda as 10 categorias (nome, descrição, etiquetas,
foto, lista "já passou", texto do botão) e os itens (nome, descrição, categoria, preço,
disponibilidade, observação, foto). `conteudo/contato.json` guarda número, Instagram, rota e
as 12 mensagens. `tools/build-content.py` grava tudo no `index.html` como HTML estático (o
cardápio continua aparecendo sem JavaScript; sem backend) e valida o arquivo: categoria
inexistente, preço que não é número, foto que não existe e mensagem que falta param com erro claro.

**Benefício.** Incluir um prato é escrever um bloco no JSON e rodar um comando.

**Teste.** A bateria confere que o `index.html` está em dia com o JSON. O modelo de item foi
renderizado com **itens de exemplo numa cópia descartável** (com preço, sem preço, indisponível,
com foto) em 390 e 1440 px. **Nenhum item de exemplo está no site**: a lista `itens` está vazia
porque não há cardápio com preços confirmado.

## 2. Painéis padronizados, sem área vazia

**Problema.** A V3 empilhava os dez painéis na mesma célula para a altura não pular. Medido:
isso deixava até 139 px vazios no celular e 218 px no computador, onde a foto em 4:5 ditava
640 px de altura e o texto ficava centralizado num bloco branco. No celular sobrava um vão entre
o aviso e o botão.

**Solução.** Corpo de painel único, sempre na mesma ordem: etiquetas (o que a casa divulgou) +
linha "onde consultar valores", nome, descrição, lista opcional, botão. No computador a foto
acompanha a altura do texto (todos os painéis com 360 px). Cada categoria tem a altura do
próprio conteúdo: as abas ficam acima e não se mexem, e o botão "Próxima" compensa a diferença
para continuar sob o dedo. Abas numa linha a partir de 1280 px. Texto "ainda vão ser publicadas"
não existe; categorias sem lista funcionam como vitrine com consulta pelo WhatsApp.

**Benefício.** Nenhum vazio, mesma hierarquia nas dez categorias, cardápio mais curto no computador.

**Teste.** "nenhuma área vazia" (10 de 10), "trocar de categoria não move as abas" (posição
idêntica nas 10), "Próxima fica no mesmo lugar" (diferença ≤ 2 px), teclado (setas, Home, End,
Enter, Espaço, Tab para o painel), `aria-selected`/`tabindex`, "nenhum preço afirmado".
Estratégia escolhida por medição: a de altura fixa (V3) e a de altura natural foram medidas nos 4
tamanhos; a natural zerou o vazio sem mover as abas.

## 3. Celular: acabamento

**Problema.** Defeitos em 320 px (tabela acima), foco escondido atrás da barra, barra atrás do
menu, `env(safe-area-inset-*)` sem efeito no iPhone (faltava `viewport-fit=cover`).

**Solução.** Ajustes só abaixo de 360 px (letras um pouco mais justas, menu só com ícone),
botões que quebram linha em vez de cortar, `viewport-fit=cover` com margens laterais
respeitando o entalhe no celular deitado, `scroll-padding-bottom`, barra que sai com o menu
aberto, menu que fecha quando a tela fica larga.

**Benefício.** Nenhum corte, sobreposição ou rolagem lateral em 13 tamanhos, incluindo 320×568,
celular deitado e zoom de 200%.

**Teste.** Em 320×568, 360×800, 375×667, 390×844, 414×896, 430×932, 844×390, 667×375, 768×1024,
1024×768, 640×400 (zoom 200%), 1440×900 e 1920×1080: rolagem lateral, imagens, console,
requisições, conteúdo revelado, um `h1`, foto e botão do cardápio na primeira tela, cabeçalho,
**todo link e botão recebe o clique quando levado ao centro da tela** (nada por cima) e alvos de
toque ≥ 24 px (menor botão principal: 44 px). Barra: escondida na abertura, aparece depois, sai
com o menu, não cobre o rodapé no fim da página.

## 4. Abertura e vídeo

**Problema.** A composição estava aprovada; faltava provar o comportamento do vídeo e o
contraste do texto sobre a foto.

**Solução.** Composição intacta. Vídeo externo ao HTML no pacote (MP4 1,7 MB / WebM 1,3 MB),
`preload="none"`, endereço só depois da carga e de um momento ocioso, só a partir de 960 px, nunca
com movimento reduzido, economia de dados ou rede 2G/3G; pausa fora da tela e com a aba em segundo
plano. O pôster é a própria foto, por baixo: até o vídeo tocar só ela aparece; se o vídeo falha,
fica a foto. Brasas, brilho e faixa corrida param quando saem da tela.

**Benefício.** A foto (o LCP) nunca disputa banda com o vídeo; o celular não baixa vídeo.

**Teste.** Vídeo bloqueado de propósito: a abertura fica com a foto, sem quadro preto. Economia
de dados e movimento reduzido no computador: vídeo não é baixado. Celular: não baixa. Vídeo toca e
pausa fora da tela. **Contraste medido nos pixels** (texto escondido, fundo amostrado na área de
cada texto, 5% mais claros, transparência do texto considerada): pior caso 6:1 ("segunda a
domingo", texto pequeno; mínimo 4,5:1), título 7,5:1 ou mais.

## 5. Animações

**Problema.** Valores de movimento repetidos à mão (escala de toque 0,95 / 0,96 / 0,97, zoom 1,05
e 1,08, durações 1,1 s / 1,2 s / 1,6 s, 280 ms no JS); animações contínuas rodando fora da tela.

**Solução.** Tokens em `:root` para duração (`--dur-xs` … `--dur-xl`, `--dur-photo`), curva
(`--ease-out`, `--ease-in-out`, `--ease-soft`), distância (`--rise`, `--swap-shift`), atraso
(`--stagger`, `--delay-step`), opacidade (`--fade-from`) e escala (`--press`, `--swap-scale`,
`--hover-zoom`, `--hero-zoom`, `--reveal-zoom`). O JS lê os mesmos tokens. Só `transform` e
`opacity`. Nenhuma animação nova.

**Benefício.** Um vocabulário só; ajustar o ritmo do site é mudar um número.

**Teste.** Movimento reduzido: sem animação de entrada, brasas e faixa, nada escondido.
Lighthouse sem *forced reflow*. Interações em laboratório: tabela acima.

## 6. Carregamento

**Problema.** Fotos de categorias fechadas baixadas (e canceladas) antes do JavaScript; foto de
1200 px na galeria do celular; arquivos sem uso no pacote (logos de 48 e 96 px em PNG, uma AVIF).

**Solução.** Fotos das categorias 2 a 10 com o endereço guardado até a aba abrir (`<noscript>`
para quem navega sem JavaScript); galeria escolhe 800 ou 1200 px pela tela, reserva o espaço da
foto e pré-carrega as vizinhas depois de mostrar a atual; ZIP só com o que a página usa (e para
com erro se faltar algo); `favicon.ico`.

Testado e **descartado**: CSS embutido no HTML. Medido no Lighthouse mobile (3 execuções):
LCP 2,41 s contra 2,10 s com o CSS externo; o HTML maior atrasou a foto principal.

**Benefício.** 1ª visita no celular 14% menor; nenhuma requisição desperdiçada.

**Teste.** `tools/medir.mjs` (tabela); comparação arquivo a arquivo entre V3 e V4;
"galeria 320×568: celular recebe a versão de 800 px".

## 7. Galeria e foto ampliada

**Solução.** Contador e legenda anunciados (`aria-live`), botões de 48 px, foto inteira na tela
sem botão por cima em 320×568, Tab preso dentro da foto ampliada (diálogo nativo), Escape e setas,
deslizar o dedo, foco devolvido à miniatura.

**Teste.** "foto ampliada inteira na tela e sem botão por cima" (320×568), "botões de 44 px ou
mais, legenda e contador anunciados", "Tab fica dentro", "Escape fecha e devolve o foco", faixa
do celular rola de lado sem rolar a página.

## 8. WhatsApp e conversão

**Solução.** Toda mensagem começa com "Olá! Vim pelo site do Parada do Mano e gostaria de…" e
tem contexto: café, buffet ("…saber as opções do buffet de hoje."), valores do buffet, janta,
carnes, espeto corrido, feijoada, saladas, lanches, sobremesas, bebidas e uma geral. Codificadas
para URL pelo gerador. Nenhuma fala em pedido, compra ou reserva; nada de checkout.

**Teste.** 20 links, 12 mensagens; toda mensagem com o começo certo e codificação que volta
exatamente ao texto; nenhuma promete pedido/compra/reserva. Jornadas no celular: almoço, espeto e
feijoada chegam ao WhatsApp certo em 3 toques; rota em 1 toque, na primeira tela.

## 9. SEO local e compartilhamento

**Solução.** `twitter:title`, `twitter:description`, `twitter:image:alt`; `favicon.ico` (16/32/48)
e ícone de 192 px; `tools/set-domain.py` grava `canonical`, `og:url`, `og:image` e `twitter:image`
absolutos em HTTPS, o JSON-LD `Restaurant` e o `sitemap.xml`. Corrigido um defeito do script:
ele não funcionava no HTML minificado do pacote (dependia da indentação). `noindex` mantido.

**Teste.** Script rodado no HTML do projeto e no do pacote, duas vezes com domínios diferentes:
uma tag de cada, sem resto do domínio anterior, `noindex` mantido. Cópia de publicação: SEO 100
no Lighthouse. Títulos: começam no `h1` e não pulam níveis.

## 10. Acessibilidade (WCAG 2.2 AA)

**Teste.** axe-core 0 violações; Lighthouse 100; foco visível em todo elemento alcançado pelo Tab
e nunca escondido atrás do cabeçalho ou da barra (390 e 1440 px); alvos ≥ 24 px; espaçamento de
texto ampliado sem corte nem rolagem lateral (320 e 390 px); contraste sobre foto medido; zoom de
200%; movimento reduzido; sem JavaScript: 10 categorias com título, foto e WhatsApp, rota,
imagens e barra de atalhos.

## 11. Código

- Cardápio e contatos em `conteudo/`, gerados para o HTML por um script com validação.
- CSS: pontos de quebra listados no topo e usados sempre os mesmos; 0 classes sem uso
  (verificado por script); tokens de movimento.
- JS: leituras de layout só depois do primeiro quadro; listeners revisados (menu fecha ao girar o
  tablet; animações contínuas param fora da tela).
- Pacote: só o que a página usa; `.vercelignore` para publicação pelo repositório.

## Testes executados

| Bateria | V3 | V4 |
|---|---|---|
| `tools/qa-browser.mjs` (projeto) | — | 220 de 220 |
| `tools/qa-browser.mjs` (pacote de produção) | 210 de 220 | 220 de 220 |
| `tools/qa-preview.mjs` (prévia aberta do disco, com e sem JS) | — | 15 de 15 |
| axe-core 390 e 1440 px | 0 violações | 0 violações |
| Lighthouse mobile e desktop, 3 + 3 | tabela | tabela |
| Interações em laboratório, 5 execuções | tabela | tabela |

Detalhe de cada verificação em `QA.md`.

## O que não foi feito ou verificado

- Safari (iOS/macOS), Firefox, aparelhos reais e barras dinâmicas reais do navegador: **não testados**.
- Entalhe do iPhone: o Chromium não simula; `viewport-fit=cover` e `env(safe-area-inset-*)` verificados no código.
- INP e Core Web Vitals de campo: **Não medido** (o site não está no ar).
- Leitor de tela real (NVDA, VoiceOver, TalkBack): **não testado**.
- Cardápio com itens e preços: depende da lista do restaurante (`PENDENCIAS.md`).
- Fotos: são as enviadas, ampliadas 2x, com aspecto de imagem gerada — o rodapé diz "Imagens
  ilustrativas". A logo continua a do avatar de 150 px até chegar o arquivo oficial.
- Publicação: não feita, por regra.

## Sobre nota

Não atribuo nota numérica à V4. A direção visual é a mesma da V3 (de propósito); o ganho da V4
é de acabamento e engenharia, e está nas tabelas acima: defeitos reais da V3 corrigidos, nenhuma
área vazia no cardápio, cardápio editável por arquivo, menos bytes na primeira visita, nenhuma
regressão medida. O que continua limitando a percepção visual não depende do código: fotos e logo
de origem.
