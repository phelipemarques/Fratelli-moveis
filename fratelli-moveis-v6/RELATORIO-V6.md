# Fratelli Móveis — V6

O que foi implementado, o que foi corrigido e o que **não** foi feito.
Os números deste documento saem de `TESTES-V6.md`, que por sua vez sai
de uma execução real de `tools/qa-v6.js`. Onde não houve medição, está
escrito que não houve.

---

## 0. Uma correção de premissa

O pedido fala em "V4 ou V5". **Essas versões não existem neste
repositório.** O que há é V1 (raiz), V2 e V3. A V6 foi construída a
partir da **V3**, que é a mais recente, e a V3 continua intacta em
`fratelli-moveis-v3/` — nada foi sobrescrito.

Mantive a numeração V6 que você pediu, para o nome do pacote bater com
o que você espera receber.

---

## 1. Auditoria: o que estava errado antes de eu mexer

Três defeitos reais, todos reproduzidos antes de corrigir.

### 1.1 A ampliação travava ao fechar e reabrir rápido

Em `js/main.js`, `fechar()` agendava `caixa.hidden = true` para 260 ms
depois. Reabrindo dentro desse intervalo, o temporizador antigo
disparava **já com a ampliação reaberta** e a escondia. O resultado:
diálogo invisível mas "aberto", fundo `inert`, rolagem travada —
precisava recarregar a página.

Corrigido guardando o temporizador e cancelando-o em `abrir()`.
Verificado: cinco ciclos abrir/fechar com 60 ms entre eles terminam com
`hidden: true`, `is-open: false`, rolagem livre e fundo acessível.

### 1.2 A etiqueta de classificação era cortada na faixa de ambientes

Ao dar individualidade a cada ambiente (§14 do pedido), a máscara de
entrada ia no `.room__frame` — que contém a etiqueta **PROJETO EM 3D /
PROJETO EXECUTADO / IMAGEM DE REFERÊNCIA**. A etiqueta era cortada
junto e aparecia como "GEM DE REFERÊNCIA".

Era grave: a classificação honesta das imagens é uma regra fixa deste
site, e ela estava sendo mutilada pela animação. A máscara passou para
a `<picture>`. A etiqueta fica inteira.

### 1.3 O canvas 3D ficava em branco sob o pin

Montada a V6, a cena renderizava uma vez e parava — tela preta. A
causa: o `IntersectionObserver` que decide "vale desenhar?" é criado
dentro do módulo, e o pin do ScrollTrigger passa a seção para
`position: fixed` **depois** disso. O observador parava de reportar e a
porta de visibilidade nunca mais abria.

Corrigido em `js/3d/opening.js`: o observador continua como atalho para
o "sim", mas a medida do retângulo (`getBoundingClientRect`) tem a
palavra final. Custa microssegundos por quadro e é o que de fato
garante que a cena pare fora da tela.

### 1.4 Dois pins assíncronos mediam o documento errado

`abertura` e `materiais` chegam por `import()` e não há ordem garantida
entre eles. Quem montasse primeiro media um documento sem o espaçador
de pin do outro: o capítulo de materialidade calculou `start: 2425`
quando o elemento está em `6025`, e rodava inteiro por cima da
abertura.

Corrigido: depois de criar cada pin, `ScrollTrigger.sort()` +
`refresh()`. Quem montar por último acerta os dois. Medido depois:
`start: 6025`, exatamente a posição do elemento.

---

## 2. A cena 3D

### 2.1 Madeira (era o ponto mais fraco)

A V3 pintava o móvel de marrom chapado. De perto, um bloco.

Agora há um gerador procedural em `js/3d/grao.js` que desenha três
mapas PBR em canvas, no carregamento:

| mapa | o que faz |
| --- | --- |
| `map` | alburno claro e cerne escuro, figura em catedral |
| `roughnessMap` | o poro espalha luz, o acabamento não |
| `normalMap` | relevo por Sobel **sobre o mesmo campo de altura** |

O normal sair do mesmo campo é o detalhe que importa: o brilho
acompanha o veio em vez de brigar com ele.

Três decisões de direção, todas tomadas olhando render:

- **O domínio é esticado** (y × 0,048 contra x × 2,1), senão o veio
  vira mancha em vez de correr ao longo da peça.
- **A distorção do domínio é baixa** (0,26). Comecei em 0,62 e o móvel
  saiu com figura de zebrano, listrado e berrante.
- **Os tons são próximos** — `[151,127,103]` sobre `[96,76,60]`.
  Comecei em `[168,132,96]` sobre `[74,52,35]` e o resultado era
  laranja de plástico. Aproximar os dois tons é o que transforma
  listra em veio.

Cada peça recebe o veio na **direção certa**: em pé numa lateral,
girado 90° numa prateleira. As texturas são clonadas — mesma imagem na
GPU, só o enquadramento muda.

**O que isto não é:** não é a fotografia de uma lâmina real, e não
corresponde a nenhum material que a Fratelli ofereça. Não temos foto
autorizada de nenhuma madeira da empresa, e usar uma textura de banco
de imagens seria afirmar um material que ninguém confirmou. A seção diz
isso em voz alta, na própria página.

### 2.2 Ambiente e luz

Entrou um envMap procedural (PMREM a partir de um gradiente de 128 px).
Sem ele o puxador é um tubo cinza; com ele é metal. Custa um canvas e
uma convolução, uma vez.

A iluminação ganhou uma quarta fonte: uma **rasante**, quase paralela à
frente do móvel. Luz de frente achata; luz que raspa é o que revela a
fita de borda e o veio — e é por isso que ela sobe no ato do detalhe.

### 2.3 Peças novas

Rodapé recuado, gaveteiro com três frentes e frestas de 3 mm, puxadores
em perfil, fita de borda de 1,5 mm em cada quina viva, fundo em tom
próprio, quatro prateleiras, divisória, cabideiro. São as peças que o
olho usa para decidir se aquilo é um móvel ou uma caixa.

### 2.4 Câmera

A V3 movia `camera.position` em linha reta. Agora a câmera mora em
**coordenadas esféricas** em volta de um alvo: raio (dolly), theta
(órbita), phi (altura) e o próprio alvo andam em curvas separadas, com
easings diferentes. É o que separa um travelling de arquitetura de um
voo de videogame.

O móvel ficou na origem; quem decide onde ele aparece na tela é o alvo.
Olhar para a esquerda do móvel joga o móvel para a direita do quadro —
que é onde o véu é mais claro e o texto não está. Compor pela câmera
mantém a órbita previsível.

### 2.5 Cinco atos

| ato | o que acontece |
| --- | --- |
| 1 — Apresentação | dolly de aproximação, órbita curta, a chave sobe de 1,30 a 2,05: a peça **sai da penumbra** |
| 2 — Abertura | a câmera roda para o lado **enquanto** as portas giram na dobradiça |
| 3 — Descoberta | as portas terminam e a luz interna acende **no mesmo intervalo** |
| 4 — Detalhe | entra no encontro da divisória com a prateleira; a lente fecha para 34° |
| 5 — Transformação | recua e reenquadra no eixo da fotografia; a passagem abre |

Uma timeline pausada só. O ScrollTrigger escreve o progresso. Por isso
é reversível quadro a quadro — medido: ida `[0; 0,25; 0,5; 0,75; 1]`,
volta `[0,75; 0,5; 0,25; 0]`, exato.

As portas giram em `Group` posicionado na **borda do vão**, com a folha
deslocada meia largura para dentro. A folha varre o espaço; não
encolhe.

---

## 3. Hero

O hero aprovado foi preservado: composição, headline, marca, CTAs,
fotografia. O que mudou é como ele entra e como ele sai.

**Entrada.** A fotografia agora é *descoberta* por uma máscara de
cinema que abre de uma faixa central, com a escala assentando numa
curva diferente — lente que pousa, não slide que entra. O cabeçalho
entra por último, de cima, depois que o título já foi lido.

**Profundidade em camadas.** Antes o conteúdo subia como um bloco só,
o que é translado, não profundidade. Agora marca (0,34×), título
(0,58×), apoio (0,82×), ações (0,96×) e rodapé (1,30×) andam em
frações diferentes.

**Entrega ao capítulo seguinte.** Três coisas no mesmo scrub: a
fotografia **reenquadra** (`object-position` sobe 17%), um véu escurece
até o **mesmo `--ink`** da seção de baixo, e um fio âmbar cresce pela
coluna do texto atravessando a emenda. Quando a abertura prende, o que
está na tela já é a cor e o eixo dela. Não há fade para preto nem corte
entre seções.

---

## 4. Mobile: 2.5D, não um fallback

O perfil B monta um capítulo próprio em CSS 3D (`js/3d/mobile25.js`),
sem WebGL e **sem baixar o Three.js**.

Não são duas `div` com `rotateY`:

- a caixa é montada em `preserve-3d` com fundo, duas laterais, tampo e
  base nos seus planos — gire a câmera e a lateral direita aparece
  enquanto a esquerda some;
- cada porta tem **frente e canto de 18 mm**; ao girar, o canto entra
  em quadro;
- as faces usam o **mesmo veio** da cena WebGL, via `grao.js`;
- a luz é encenada: cada face tem brilho próprio conforme a orientação,
  um reflexo **varre** a folha conforme o ângulo, o interior acende
  junto com a abertura, a sombra de contato abre quando a peça chega
  perto;
- a sequência inteira cabe em **2,2 alturas de tela** contra 4 no
  desktop — num celular, uma sequência de 4 alturas cobraria rolagem
  demais por espaço de menos.

As portas abrem 78° aqui contra 116° no desktop: lá a câmera orbita e
vê a folha de lado; aqui a vista é quase frontal, e passando de 80° a
porta fica de perfil e some justamente no quadro em que ela importa.

---

## 5. Capítulo de materialidade (`#materiais`)

Seção nova. Uma peça só, de perto, em três trechos presos ao mesmo
scrub:

1. **Veio** — quase de frente, a fibra é lida;
2. **Luz rasante** — uma faixa estreita atravessa e mostra o poro;
3. **Espessura** — a peça gira e o canto de 28 mm entra em quadro.

O texto não é decoração sincronizada por acaso: cada passo acende no
trecho que ele descreve. Quem lê "espessura" está vendo o canto.

**Não há um segundo renderizador WebGL.** Para uma peça de frente que
gira 25°, ele não pagaria o próprio custo: outro contexto, outro render
loop, outro megabyte. É CSS 3D com o mesmo `grao.js`.

---

## 6. Portfólio, ampliação e faixa de ambientes

**Portfólio.** A entrada deixou de ser um bloco: véu que recolhe →
fotografia assentando em profundidade → etiqueta de classificação →
título → legenda, nesta ordem, dentro do orçamento de meio segundo de
cascata. No desktop com ponteiro fino, cada quadro ganhou profundidade
sob o cursor: a fotografia anda 14 px, a etiqueta anda 22 px no sentido
contrário. Amplitudes curtas de propósito — um cartão que foge do
cursor passa de interface a brinquedo.

**Ampliação.** Além da correção da §1.1: a imagem agora **sai do
quadro** (mede o retângulo da miniatura, mede o destino, anima a
diferença — só `transform`, um elemento só), e o toque ganhou arrastar
para trocar de foto e arrastar para baixo para fechar. Se o voo falhar
por qualquer motivo, ele é ignorado e a ampliação abre assim mesmo: é
enfeite, e enfeite não pode derrubar um diálogo.

**Faixa de ambientes.** Antes os seis cartões deslizavam juntos, sem
momento próprio. Agora cada um é medido contra o centro da tela: a
fotografia abre de uma máscara lateral pelo lado de onde está
chegando, o cartão se acomoda em profundidade, o título desencosta,
tudo volta à posição estável ao passar pelo meio. Como a conta é feita
no `onUpdate` do mesmo scrub, voltar desfaz na mesma ordem.

---

## 7. Imagens

Resumo; a auditoria completa está em `IMAGENS-V6.md`.

**Nenhuma fotografia ganhou resolução** — todas já estavam no teto do
original. O que mudou foi o peso do que chega: AVIF na frente do WebP e
escadas mais densas. Medido, nos casos de uso reais: **487 KB → 265 KB,
−46%**; o hero (que é o LCP) cai **52%**.

A cozinha de 336 × 420 px citada no pedido: **o original tem 368 × 420
px.** Não há o que recuperar. Não foi ampliada e não foi passada por
super-resolução — está registrada como pendência de arquivo.

---

## 8. O que NÃO foi feito

Dito claramente, como você pediu:

- **Lighthouse não foi executado.** Não há Chrome com as APIs de
  métrica neste ambiente. Não há número de Performance nem de
  Acessibilidade neste documento, e não vou inventar um.
- **FPS não foi medido.** O navegador aqui roda WebGL por software
  (SwiftShader); qualquer taxa que eu medisse diria respeito a esta
  máquina, não a um aparelho real. Há otimizações *verificáveis*
  (desenho sob demanda, pausa fora da tela, teto de pixel ratio,
  materiais compartilhados) — mas verificável não é medido.
- **LCP, CLS e INP não foram medidos** pelo mesmo motivo. O que dá para
  afirmar: toda `<img>` tem `width`/`height`, o hero tem `preload` +
  `fetchpriority`, e a animação toca só `transform`, `opacity`,
  `clip-path` e variáveis CSS.
- **Não há textura fotográfica de madeira.** É procedural, por falta de
  material autorizado — e está declarado na página.
- **Nenhuma fotografia foi restaurada por IA.**
- **Nada foi publicado.** Nenhum deploy, nenhum domínio, nenhum
  canonical. As três linhas de `og:`/`canonical` continuam comentadas
  no `index.html`, esperando a URL real.

---

## 9. Identidade preservada

Off-white `#F4F1EC`, carvão `#191714`, âmbar `#B27A42`, Newsreader nos
títulos, Inter no texto — intactos. Logotipo, fotografias, WhatsApp,
Instagram, endereço, avaliações reais e as classificações do portfólio:
intactos. Nenhum dado comercial novo foi inventado — sem e-mail, sem
horário, sem anos de experiência, sem número de projetos, sem garantia,
sem marcas de material.

Nada de preto e dourado, nada de neon, nada de futurismo.
