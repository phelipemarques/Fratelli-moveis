# QA — Fratelli Móveis

## Ambiente de teste

| | |
| --- | --- |
| Navegador | Chromium 141.0.7390.37, automatizado com Playwright 1.56 |
| Servidor | `python3 -m http.server` em `127.0.0.1:8123` |
| Sistema | Linux (container de execução) |
| Data | 19/09/2026 |

**Limitação importante:** todas as verificações rodaram em **um único motor,
Chromium**. Safari, Firefox e navegadores de celular reais não foram testados —
não havia como. Os pontos de atenção para esses navegadores estão listados no
fim deste documento.

## Larguras verificadas

360 × 800 · 390 × 844 · 768 × 1024 · 1024 × 768 · 1440 × 900 · 1920 × 1080 ·
e **1280 × 600** e **1280 × 560**, para as telas baixas com seção fixada.

---

## 1. Composição e tipografia

Um script mede, em cada largura, quantas linhas cada título formou e qual a
menor linha em número de palavras. Serve para pegar título virando coluna
estreita, que uma medição de largura de página não detecta.

**Resultado nas sete larguras:**

| Título | 360 / 390 px | 768 px e acima |
| --- | --- | --- |
| Móveis planejados para o seu jeito de morar. | 3 linhas | 2 linhas |
| Seu espaço começa na sua rotina. | 2 | 2 |
| Ambientes desenhados peça a peça. | 2 | 2 |
| Cada cômodo pede uma medida diferente. | 2 | 2 |
| Da primeira medida à montagem. | 2 | 2 |
| Móveis planejados em Cascavel, no Paraná. | 2 | 2 |
| Vamos conversar sobre o seu espaço? | 2 | 2 |

Nenhum título passou de 3 linhas. A menor linha em qualquer largura tem 2
palavras, exceto "montagem." no título do Processo — uma palavra sozinha no fim
de um título de duas linhas é quebra normal, não coluna estreita.

**Problema encontrado e corrigido:** em 1024 px e acima, "Móveis planejados em
Cascavel, no Paraná." quebrava em 3 linhas, terminando em "Paraná." sozinho,
porque a coluna do texto da seção Sobre ocupava 6 de 12 colunas. Passou para 7
colunas e voltou a 2 linhas.

**Como as larguras são controladas:** `--measure-hero`, `--measure-title`,
`--measure-lead` e `--measure-text` em `tokens.css`, aplicadas **ao elemento de
texto**, nunca ao contêiner que também carrega descrição e botões. As medidas
estão em `em`, relativas ao próprio tamanho da fonte, então a contagem de
caracteres por linha se mantém em qualquer tela. Não há `<br>` fixo em nenhum
título.

## 2. Rolagem horizontal acidental

`document.documentElement.scrollWidth - window.innerWidth` = **0 px nas sete
larguras**. Um segundo passe percorre todos os elementos do `body` e reporta os
que ultrapassam a borda da janela: os únicos que aparecem estão dentro de
contêineres com recorte próprio (a faixa de ambientes, que é um container de
rolagem, e as imagens com folga de parallax dentro de quadros com
`overflow: hidden`).

**Não existe `overflow-x: hidden` no `html` nem no `body`.** Nenhum defeito de
layout está escondido.

## 3. Contraste

Duas medições separadas, porque os fundos são de naturezas diferentes.

### Sobre fundos sólidos — 74 amostras, 0 reprovações

O script percorre a página em passos de 400 px e mede **apenas o que está em
cena e já revelado**, compondo todas as camadas de fundo semitransparentes até
chegar a uma cor opaca.

Pior caso: **6,7:1** (botão principal do encerramento). Mínimo exigido: 4,5:1
para texto normal, 3:1 para texto grande.

**Problema encontrado durante o teste:** a primeira versão do script mediu a
faixa escura com a página no topo, antes da transição de cor vinculada à rolagem
acontecer, e reportou 7 falsas reprovações. A medição foi refeita elemento a
elemento, com cada um em cena.

### Sobre a fotografia — medição por pixel

Contraste calculado sobre os **pixels realmente renderizados**: o texto é
escondido, a página é capturada, e cada região é varrida em busca do pixel de
fundo mais desfavorável.

| Elemento | 1440 | 1920 | 390 | 360 |
| --- | --- | --- | --- | --- |
| Título (96 px / 43 px, mín. 3:1) | 3,55 | 8,29 | 9,11 | 8,32 |
| Texto de apoio | 12,2 | 11,8 | 9,1 | 8,2 |
| Sobretítulo | 12,2 | 9,0 | 6,4 | 5,5 |
| Navegação do cabeçalho | 7,5 | 8,2 | — | — |
| Contato (cabeçalho) | 6,0 | 7,4 | — | — |
| Rodapé do hero | 14,4 | 14,3 | 13,8 | 13,8 |

**Problemas encontrados e corrigidos.** A primeira medição reprovou cinco
elementos: o título caía a **1,19:1** onde passava sobre a bancada clara, e a
navegação a **2,56:1** sobre o teto iluminado. O véu de abertura foi refeito em
quatro camadas com funções separadas — faixa do cabeçalho, base, sombra radial
ancorada no canto inferior esquerdo (é ela que segura o título) e queda suave da
esquerda para a direita — e o cabeçalho ganhou sombra própria, para não depender
do que a foto mostra ali. Uma tentativa de resolver estreitando o título para 3
linhas **piorou** o caso (o bloco subiu para uma região onde a sombra é mais
fraca) e foi revertida.

## 4. Movimento

### Com `prefers-reduced-motion: reduce`

- A classe `motion` não é aplicada ao documento.
- Títulos, blocos de texto e quadros: todos com opacidade 1 e sem transformação.
- Nenhum véu permanece cobrindo quadro.
- Os títulos **não** são divididos em linhas — o texto fica inteiro.
- Nenhum erro de script. Rolagem até o fim sem conteúdo preso.

### Sem JavaScript

- Título do hero, encerramento e todo o conteúdo visíveis.
- O cabeçalho deixa de ser fixo e a navegação inteira aparece, quebrando em
  linhas — não existiria como abrir o menu sobreposto.
- O botão de menu fica escondido; o painel sobreposto também.
- A faixa de ambientes continua rolável na horizontal, de forma nativa.

### Animações que funcionam

| Momento | O que faz |
| --- | --- |
| Abertura do hero | Fotografia entra com acomodação de escala (1,14 → 1 em 1,9 s) enquanto as linhas do título sobem uma a uma, mascaradas, com 75 ms entre elas. Sobretítulo, apoio, ações e rodapé entram atrás, escalonados. O título começa aos 0,20 s. |
| Profundidade no hero | Fotografia e texto deslocam em velocidades diferentes conforme a rolagem. A caixa da imagem é 118 % da altura da seção e fica centrada na folga, então o deslocamento de ±7 % nunca descobre a borda. No celular a amplitude cai para ±2,5 % e o texto não se desloca. |
| Títulos de seção | Mesma revelação por linhas, disparada quando o título chega a 86 % da altura da janela. |
| Quadros | Um véu recolhe de baixo para cima (`scaleY`), e a imagem interna acomoda a escala. |
| Profundidade nos quadros | Só a partir de 900 px: o preenchimento desloca ±5 % dentro da folga de 8 %. |
| Ambientes | No desktop com pelo menos 620 px de altura, a rolagem vertical conduz a faixa horizontal com a seção fixada. Fora disso, rolagem horizontal nativa com encaixe. |
| Processo | O fio avança com a rolagem (horizontal no desktop, vertical no celular) e os marcadores acendem. Nenhum parágrafo perde opacidade. |
| Faixas de fundo | Claro ↔ escuro acompanhando a rolagem, três transições. Não são faixas de gradiente estático. |

**Como o contraste é preservado durante a troca de cor:** a transição termina
quando o topo da faixa chega a 76 % da altura da janela; todo o texto de dentro
só é revelado a partir de 82 %. Nenhuma palavra é lida sobre uma cor
intermediária. Verificado pela medição da seção 3, que percorre a página inteira.

### Separação entre entrada e rolagem

Exigência do briefing, e um problema real apareceu por causa dela. A entrada e o
deslocamento de rolagem nunca atuam no mesmo elemento:

| Elemento | Quem move |
| --- | --- |
| `.hero__media` | rolagem |
| `.hero__media picture` | entrada |
| `.frame__veil` e `.frame__img` | entrada |
| `picture` e `.frame__reserved` do quadro | rolagem |
| `.frame__note` | ninguém — fica parada |

**Problema encontrado e corrigido:** as reservas de imagem eram um bloco único
que carregava fundo, número e etiqueta. Com a folga de parallax (`height: 116 %;
top: -8 %`), o número e a etiqueta eram empurrados para fora do quadro e sumiam.
A reserva foi dividida em duas camadas: o fundo, que acompanha a rolagem, e a
nota, que fica parada.

### Rede de segurança

Se o GSAP não carregar, o `onerror` de cada `<script>` remove a classe `motion`
na hora. Se o `motion.js` não sinalizar em 2,2 s, o `nav.js` remove. Em qualquer
um dos casos os estados iniciais deixam de valer e a página aparece inteira.

## 5. Navegação e teclado

- **Primeiro Tab** chega ao atalho "Ir para o conteúdo", que aparece na tela.
- **Contorno de foco visível** em 8 de 8 elementos percorridos na barra superior.
- **Âncoras** respeitam a altura do cabeçalho: ao ir para Contato, o topo da
  seção para a 86 px, com o cabeçalho ocupando 62 px.
- **Ambientes por teclado:** focar um cartão leva a página até ele. Testado com o
  quinto cartão, que entrou inteiro em cena (659 – 1011 px de 1440).
- **A seção fixada não prende:** ao rolar para o fim, o rodapé aparece.

**Problema encontrado e corrigido:** o atalho de conteúdo só reagia a
`:focus-visible`, o que o deixava invisível em foco por script. Passou a reagir
também a `:focus`.

## 6. Menu em celular (390 × 844)

Abre por toque e por teclado. `aria-expanded` acompanha o estado. `inert` sai ao
abrir e volta ao fechar. O foco entra no primeiro item, circula dentro do painel
ao chegar no último, e volta ao botão quando o menu fecha. `Escape` fecha. O
fundo trava enquanto está aberto e destrava ao navegar por uma âncora.

## 7. Telas baixas (1280 × 560 e 1280 × 600)

A faixa de ambientes **não** é fixada — a condição de fixação exige no mínimo
900 px de largura e 620 px de altura. Abaixo disso, vale a rolagem horizontal
nativa com encaixe, e a indicação "Arraste para o lado" volta a aparecer.
O hero também reduz o título e o espaçamento abaixo de 560 px de altura.

## 8. Fontes

Newsreader e Inter, variáveis, servidas do projeto com `preload`. Testado com os
arquivos **bloqueados**, para ver a família substituta:

- Quebras de linha do título: **idênticas** (as mesmas 2 linhas).
- Altura do H1: **196 px antes e depois** — sem salto de layout.
- Sem rolagem horizontal.

As métricas de substituição (`size-adjust`, `ascent-override`,
`descent-override`) estão em `base.css`. Se a fonte definitiva chegar depois dos
500 ms que a abertura espera, as quebras são medidas de novo quando
`document.fonts.ready` resolve.

**Todas as capturas deste QA foram feitas com a fonte definitiva carregada**,
exceto a que documenta justamente o estado substituto.

## 9. Imagens e carga

Nenhuma imagem sem `alt`. Nenhuma sem `width` e `height`. A imagem de abertura
não usa `loading="lazy"` e leva `fetchpriority="high"`; as de baixo da dobra são
adiadas. WebP com JPG de reserva.

Variante escolhida pelo navegador, e total baixado no primeiro carregamento:

| Tela | Variante do hero | Total |
| --- | --- | --- |
| 360 × 800 @2x | `hero-portrait-640.webp` | 264 KB |
| 390 × 844 @3x | `hero-portrait-640.webp` | 275 KB |
| 768 a 1920 | `hero-wide-1280.webp` | 300 KB |

O total inclui as duas fontes (146 KB), a imagem de abertura e a faixa.

**Recorte próprio por tela:** no desktop, o quadro inteiro. No celular, um
recorte vertical sobre a ilha e as banquetas — não sobre o teto ou os
eletrodomésticos.

## 10. Console e recursos

Zero erros de console, zero erros de página e zero requisições falhas, em todas
as larguras e em todos os percursos de rolagem executados.

## 11. WhatsApp

Três links apontam para o mesmo destino: o botão do encerramento, a linha da
lista de dados e o rodapé. Verificado no navegador, com a página já revelada:

- Número discado: `5545998423488`.
- Mensagem que chega decodificada: "Olá, vim pelo site da Fratelli Móveis e
  gostaria de mais informações."
- `target="_blank"` com `rel="noopener"` nos três.
- O botão tem `aria-label` dizendo o número e avisando que abre em outra aba.
- Contraste do link sublinhado sobre o carvão: 15,88:1, no desktop e no celular.
- Nenhum elemento desativado restou na página.
- Dados estruturados (`LocalBusiness`) declaram o mesmo telefone e a mesma
  cidade que a página mostra. Nenhum campo inventado: sem endereço de rua, sem
  horário, sem avaliação.

**Não verificado:** se o número de fato atende na Fratelli. Isso depende de
mandar uma mensagem real. O raciocínio sobre o dígito que faltava está em
`PENDENCIAS.md`.

## 12. Imagens de projeto

Três renderizações 3D entraram na seção Projetos. A abertura e a faixa não foram
tocadas: continuam vindo de `prepare-images.py`.

**Seleção.** Medi definição e ruído nas cinco imagens recebidas antes de escolher.
Variância do laplaciano: `3.jpg` 105,7 · `2.jpg` 103,0 · `5.jpg` 90,9 ·
`6.jpg` 47,4 · `4.jpg` 26,8. As duas últimas ficaram de fora por moleza e por
dominante amarela.

**Tratamento e medição, antes → depois:**

| Imagem | Definição | Contraste | Brilho |
| --- | --- | --- | --- |
| Closet | 76,0 → 211,5 | 38,3 → 50,3 | 104,1 → 109,7 |
| Dormitório | 43,5 → 139,3 | 23,2 → 35,7 | 184,7 → 191,0 |
| Banheiro | 128,9 → 356,1 | 44,6 → 51,9 | 127,9 → 129,4 |

O brilho quase não se mexe de propósito: o acabamento devolve definição sem
clarear a cena e sem desmanchar a atmosfera de cada render.

**Dois erros meus, corrigidos no caminho.** A primeira curva somava o seno em vez
de subtrair, o que achatava o contraste e levantava o brilho de 104 para 124.
Depois de corrigir o sinal, a mesma dose endureceu o closet: o tecido ganhou
crosta e a madeira saturou. A força passou a ser regulada por imagem — 0,55 no
closet, 0,65 no banheiro, 1,00 no dormitório.

**Segunda remessa — só recorte.** Home office, sala de estar e painel de TV
entraram sem acabamento nenhum, a pedido: apenas recorte para a proporção do
quadro e redimensionamento. O script aceita força 0 exatamente para isso.

**Verificado no navegador**, com a página rolada até o fim para vencer o
carregamento adiado: as **seis** carregam nas duas larguras, o navegador escolhe
a variante certa (`closet-1540` no desktop, `closet-800` em 390 px;
`painel-tv-1080` nos dois, por ser a única portrait) e não há requisição falha.
Cinco levam a etiqueta "Projeto em 3D"; o painel de TV, que é fotografia, não
leva nenhuma.

**Terceira remessa — faixa de ambientes.** Quatro cartões de 4:5 deixaram de ser
reserva: cozinha (fotografia, 336 × 420 nativos), dormitório, closet e home
office (render). Só recorte, sem acabamento. Verificado no navegador: os quatro
carregam, exibidos a 352 px, sem requisição falha. Sala de estar e área gourmet
seguem reservados.

**Um bug meu, pego na revisão.** A primeira tentativa de trocar os cartões usou
um padrão que ia do primeiro `<li>` até o título procurado, e o `re.sub` sem
`count=1` trocou todos os quadros dentro desse trecho: os quatro ficaram com a
imagem do home office. Peguei conferindo a contagem de etiquetas, que deu 9 em
vez das 8 esperadas. Refeito cartão a cartão, com o padrão limitado a um `<li>`
de cada vez, e conferido imagem por imagem antes de seguir.

**Última remessa — os três quadros que faltavam.** Showroom na seção Sobre,
sala de estar e área gourmet na faixa de ambientes. Não resta nenhuma reserva na
página. Duas das três foram identificadas como geradas por IA e entraram com
etiqueta própria; o raciocínio está em `PENDENCIAS.md`.

**Limpeza depois do preenchimento.** Sem nenhuma reserva na página, as regras que
as desenhavam ficaram órfãs. Saíram `.frame__reserved` e seus pseudoelementos,
`.reserved__index`, a moldura interna de `.frame__note`, as quatro classes
`.frame--tone-*` e os sete tokens `--rv-*`. O seletor de parallax no `motion.js`
foi reduzido ao que sobrou. Conferido depois: nenhum token definido sem uso,
nenhum usado sem definição, nenhum seletor de classe sem correspondência.

**Carregamento adiado na faixa horizontal.** No celular, os dois últimos cartões
de ambientes apareciam como não carregados. Não era defeito: eles ficam fora da
tela na horizontal, e o navegador só busca a imagem quando a faixa é arrastada.
Verificado arrastando a faixa até o fim — os seis carregam, na variante de
480 px. O comportamento é o desejado: economiza dados de quem não rola a faixa.

**Um falso negativo corrigido no medidor.** Depois da segunda remessa a página
cresceu e o amostrador de contraste passou a reprovar o rótulo "proposta a
validar" em 3,84:1. Era artefato: ele checava a opacidade do próprio elemento,
mas não a do bloco que ainda estava entrando, e media o texto contra um fundo
que ainda não terminara a transição. Medido no estado assentado, o rótulo fica
em 6,77:1 sobre `rgb(25,23,20)`. O amostrador passou a multiplicar a opacidade
de todos os ancestrais.

## 13. Estados interativos

Hover no botão principal: preenchimento passa de `rgb(244,241,236)` para
`rgb(217,162,104)` e a cor do texto permanece `rgb(25,23,20)`. Preenchimento e
cor de texto são declarados separadamente em cada estado — nenhum dos dois
desaparece ao interagir. O botão desativado do encerramento não tem estado de
hover que sugira ação.

## 14. Estrutura do documento

`lang="pt-BR"`. Um único `h1`. Hierarquia de títulos sem salto (h1 → h2 → h3).
Marcos `header`, `main` e `footer` únicos; os três `nav` com rótulo próprio.
Todas as `section` rotuladas por `aria-labelledby`. Listas e listas de definição
com filhos válidos. **Nenhum link `href="#"`, nenhuma âncora quebrada, nenhum
formulário.** O `viewport` não bloqueia o zoom. 31 elementos focáveis por teclado.

---

## O que NÃO foi verificado

| Item | Por quê |
| --- | --- |
| Safari, Firefox, Chrome de celular reais | Só havia Chromium no ambiente. Atenção especial a: `backdrop-filter` no cabeçalho (há alternativa sólida via `@supports`), `inert` no menu, `100svh` no hero e o travamento de rolagem no iOS, que é conhecido por ser parcial com `overflow: hidden`. |
| Leitores de tela (NVDA, VoiceOver, TalkBack) | Não disponíveis. A estrutura foi verificada por código, o que não substitui escutar a página. |
| Toque real e gesto de arrastar | O Playwright emula toque, mas não substitui um aparelho. A faixa de ambientes usa rolagem nativa no celular, que é o caminho mais seguro. |
| Desempenho em rede lenta e aparelho fraco | Sem medição de Core Web Vitals em campo. O peso e o número de requisições foram medidos; o resto, não. |
| Impressão | Não há folha de estilo para impressão. |
| Comportamento com a fotografia definitiva | Três quadros têm render; os outros seguem reservados. O ritmo final só pode ser avaliado com as fotos dos ambientes executados. |
| Se o WhatsApp chega na Fratelli | O formato do link foi verificado; o destino real depende de mandar uma mensagem. Ver `PENDENCIAS.md`. |
| Abertura do aplicativo do WhatsApp | O clique foi testado até o `href`. A troca para o aplicativo depende do sistema do visitante. |
