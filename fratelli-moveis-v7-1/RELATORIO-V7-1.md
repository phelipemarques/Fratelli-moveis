# Fratelli Móveis — V7.1

Correção cirúrgica da abertura do armário. Nada fora de `#abertura`
foi tocado: hero, identidade, paleta, fontes, fotografias, portfólio,
galeria, conteúdo, contatos e navegação continuam como estavam.

Os números deste documento saem de execuções reais registradas em
`TESTES-V7-1.md` e em `tools/teste-abertura.js`.

---

## 0. De onde esta versão partiu

A V7.1 foi construída sobre a **V7**, que é o estado mais recente da
pasta e já trazia, dentro desta mesma seção, um trabalho de material
em andamento: frestas de 3 mm entre as folhas, uma lâmina diferente
por peça, puxador em perfil com pés e um piso de verdade no lugar de
uma sombra solta.

Digo isso com clareza porque o pedido fala em "baseado na V6": a V6
continua inteira em `fratelli-moveis-v6/`, a V7 em
`fratelli-moveis-v7/`, e nenhuma das duas foi alterada.

---

## 1. PROBLEMA 1 — As portas abriam para dentro

### Confirmado antes de mexer

Não troquei os sinais e torci. Instalei uma sonda que lê a **ponta
livre** de cada folha em coordenadas do mundo e medi:

| progresso | ponta esquerda z | ponta direita z |
| --- | --- | --- |
| 0% | +0,300 | +0,300 |
| 35% | +0,019 | +0,057 |
| 50% | **−0,575** | **−0,578** |
| 70% | **−0,551** | **−0,566** |

A frente do móvel está em **z = +0,290**. As pontas terminavam em
z ≈ −0,56: as folhas giravam para dentro e **atravessavam a carcaça
inteira**, saindo atrás do painel de fundo. Você estava certo.

### Por quê

O pivô esquerdo fica em x negativo e a folha se estende para +x. Um
giro **positivo** em Y leva um ponto de +x para −z — ou seja, para
dentro. A V7 mandava `pivoEsq.rotation.y → +1,82` e
`pivoDir.rotation.y → −1,74`: as duas, para dentro.

A direita é o espelho: folha em −x, giro positivo leva para +z.

### A correção

```js
var ABRE_ESQ = -1.86;   // negativo = para fora
var ABRE_DIR =  1.86;   // positivo = para fora
```

### Verificado depois

| progresso | ponta esquerda | ponta direita |
| --- | --- | --- |
| 0% | x −0,002 · z **+0,300** | x +0,002 · z **+0,300** |
| 20% | z **+0,323** | z **+0,323** |
| 35% | x −0,073 · z **+0,647** | x +0,073 · z **+0,647** |
| 50% | x −0,999 · z **+1,171** | x +0,999 · z **+1,171** |
| 70% | x −1,131 · z **+1,143** | x +1,131 · z **+1,143** |

As duas pontas avançam **para a frente** e **para fora**, em arcos
perfeitamente simétricos, e nenhuma leitura cai abaixo de z = +0,290
em momento algum. O teste refaz essa medição a cada execução e reprova
se qualquer amostra ficar atrás do plano frontal.

### O mesmo defeito no celular

O 2.5D tinha o problema idêntico, pela mesma razão: no CSS, um
`rotateY` positivo também leva +X para −Z. A folha esquerda, com
dobradiça à esquerda, entrava no armário.

Corrigido e medido pela própria matriz de transformação do elemento
(usando `offsetWidth`, a largura de layout — a primeira sonda usou o
retângulo renderizado, que encolhe com a rotação e media a rotação de
volta):

| progresso | ponta esquerda | ponta direita |
| --- | --- | --- |
| 0% | x +165 · z 0 | x −165 · z 0 |
| 30% | x +124 · z **+108,9** | x −124 · z **+108,9** |
| 50% | x +36,7 · z **+160,9** | x −36,7 · z **+160,9** |
| 75% | x +34,3 · z **+161,4** | x −34,3 · z **+161,4** |

Simétrico e para a frente nos dois lados.

---

## 2. PROBLEMA 2 — O armário não tomava a tela

### A causa não era o `scale`

A V7 escolhia a distância da câmera a dedo: 8,6 … 5,0 … 3,4 … 2,55.
Números assim só valem na proporção de tela em que foram escolhidos, e
não há como pedir "ocupe 90% da composição".

### O que entrou no lugar

A distância passou a ser **resolvida a cada quadro** a partir de:

- o tamanho real do que se quer enquadrar, vindo de um `THREE.Box3`
  do próprio móvel — portanto já com as portas abertas;
- quanto da tela ele deve ocupar (`cheio`, de 0 a 1);
- o fov e a **proporção real do canvas naquele instante**.

A primeira tentativa usou a fórmula de folheto,
`(altura/2) / tan(fov/2)`. Ela supõe o objeto achatado num plano à
distância do centro — e com as portas abertas o móvel tem **1,44 m de
profundidade**: os cantos da frente ficam muito mais perto da câmera e
abrem um ângulo bem maior. Medido: eu pedia 90% e recebia **126% da
altura da tela**, com o móvel cortado em cima e embaixo.

A versão final resolve **canto a canto**. Para cada um dos oito:

```
distância mínima = profundidade_na_direção_da_câmera
                 + afastamento_lateral / (tan · cheio)
```

O maior valor entre os oito manda. É exato, fecha em forma fechada e
vale para qualquer proporção de tela — é isso que faz o mesmo código
enquadrar certo em 1920×1080 e em 320×568, sem um raio por aparelho.

### Resultado medido, no ato da abertura completa

| tela | largura ocupada | altura ocupada |
| --- | --- | --- |
| 1920 × 1080 | 62% | **91%** |
| 1440 × 900 | 70% | **91%** |
| 1280 × 800 | 70% | **91%** |

Dentro da faixa de 85–95% que você pediu, **sem nada cortado**: os
oito cantos ficam dentro de ±1 em NDC.

### A câmera entra no móvel

Do ato 4 em diante o enquadramento deixa de ser automático e passa a
mirar uma **caixa sintética** dentro do vão. Como a distância sai do
tamanho dessa caixa, a câmera entra no espaço do móvel pela conta, e
não por um raio escolhido a dedo. O `near` foi para 0,03 e o `far`
para 40, para a precisão de profundidade aguentar a aproximação.

O teste confere, em cada amostra, se a posição da câmera cai dentro do
`Box3` de algum painel. **Nunca cai**, em nenhuma das oito telas.

---

## 3. A coreografia, em seis atos

| ato | progresso | o que acontece |
| --- | --- | --- |
| 1 — Apresentação | 0–15% | móvel fechado e inteiro; dolly curto, enquadramento ficando mais frontal; a chave sobe de 1,25 a 2,05 |
| 2 — Primeira abertura | 15–40% | as folhas avançam **para fora**; aproximação moderada, para a direção do movimento não ficar escondida |
| 3 — Abertura completa | 40–60% | as portas terminam; o `cheio` vai a 0,99 e o Box3 já aberto manda na distância; o olhar vai ao centro; a luz interna acende no mesmo intervalo |
| 4 — Imersão | 60–82% | o alvo deixa de ser o móvel e passa a ser o **vão**; a câmera desce pelo eixo central, entre as folhas |
| 5 — Detalhe | 82–93% | o encontro da divisória com a prateleira: fita de borda, veio deitado, veio em pé e a fita de luz no mesmo quadro |
| 6 — Transição | 93–100% | recua ao eixo da fotografia e a passagem abre do centro para as bordas |

Uma timeline pausada só. O ScrollTrigger escreve o progresso. Nenhuma
segunda timeline toca nos mesmos pivôs, na câmera ou nas luzes.

**Um detalhe que precisou de cuidado:** `auto` (o interruptor entre
enquadrar o móvel e enquadrar o vão) começou como um valor
interpolado. Interpolado, ele passa por 0,5 — que continua sendo
verdadeiro — e a troca só aconteceria no fim do ato. Virou `.set()`,
que o GSAP desfaz sozinho na volta.

---

## 4. O texto cede a vez

Do ato 3 em diante o móvel ocupa a tela, e a coluna de texto passaria
a ser lida **por cima de painéis em movimento**. Ela recua, e volta
sozinha quando a rolagem volta.

A transição termina em `visibility: hidden` de propósito: texto
invisível e ainda focável é pior do que texto ausente. O botão
**"Pular a introdução"** está fora dessa regra — é a saída da
sequência e continua alcançável por ponteiro e por teclado do começo
ao fim.

---

## 5. Um defeito antigo que apareceu no caminho

Ao conferir o último ato no celular, a fotografia aparecia como uma
**faixa no topo** em vez de cobrir a tela. Medido: a `<img>` estava
renderizando **390 × 219** num palco de 390 × 844.

A causa: `<picture>` é inline por padrão, e uma altura em porcentagem
não resolve contra um pai de altura automática. A fotografia vinha
saindo com a altura intrínseca dela. No desktop o erro passava
despercebido porque 1440 de largura dá 810 de altura — quase a tela
inteira.

É um defeito que já existia antes da V7.1. Corrigido com três linhas:

```css
.abertura__foto picture { display: block; width: 100%; height: 100%; }
```

Depois da correção: **394 × 852** no celular e **1510 × 944** no
desktop. A fotografia cobre o palco nos dois.

Aproveitando: o véu afrouxa junto com a passagem. Ele existe para o
texto ser legível sobre a cena, mas no último ato o texto já recuou e
o que ele escondia passou a ser justamente a fotografia que a
sequência inteira estava apresentando.

---

## 6. O celular

Não foi só a inversão dos sinais. O enquadramento estava errado: a
peça chegava a **589 px de largura com o topo em −86** numa tela de
390 × 844. Não era imersão, era corte — o visitante via uma parede de
madeira sem referência.

A âncora era o problema: `align-content: start` mais padding dá um
ponto de apoio que muda com a altura da tela, e a escala crescia para
fora do palco. Agora a peça é centrada e **subida em pixels**, que é
previsível.

Os números saem de medida. A peça tem 330 × 385 px no CSS:

- escala **1,14** → 376 px de largura: ocupa a tela quase inteira sem
  as portas saírem pelas bordas;
- escala **1,32** → 508 px de altura: o interior domina, e o que é
  cortado são as **portas**, não o vão.

Medido depois, em 390 × 844: 258 × 318 no ato 1, 373 × 445 no ato 3,
410 × 483 no ato 6. Transbordo horizontal: **0 px**.

As portas abrem 78° aqui contra 106° no desktop — lá a câmera orbita e
vê a folha de lado; aqui a vista é quase frontal, e passando de ~80° a
folha fica de perfil e some justamente no quadro em que a abertura
precisa ser entendida.

---

## 7. Sobre a sonda de inspeção

`opening.js` publica `window.__sonda` com referências de leitura aos
pivôs, à câmera e às medidas do móvel. É o que permite aos testes
medirem a geometria em vez de olharem uma captura e opinarem.

Está no pacote de propósito, e é só leitura — não muda comportamento
nenhum. Se preferir tirá-la da publicação, são três linhas no fim de
`criarAbertura()`; os testes de dobradiça deixam de rodar junto.

---

## 8. O que NÃO foi feito

- **FPS não foi medido.** O navegador aqui roda WebGL por software
  (SwiftShader). Qualquer taxa que eu medisse descreveria esta
  máquina. A validação em GPU real continua pendente — e agora
  importa mais, porque a câmera chega bem mais perto e o número de
  pixels sombreados sobe.
- **Lighthouse, LCP, CLS e INP: não medidos**, pela mesma razão.
- **Nada foi publicado.** Nenhum deploy, nenhum domínio. As linhas de
  `canonical` e `og:` continuam comentadas.
- **Nenhuma seção fora de `#abertura` foi alterada**, com uma
  exceção declarada: a regra de `<picture>` da seção 5, que é da
  própria abertura.
