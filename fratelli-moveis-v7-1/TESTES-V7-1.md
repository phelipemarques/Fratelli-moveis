# Testes — V7.1

Tudo aqui saiu de execução real. O bruto está em
`tools/teste-abertura-resultado.json`; quem o gera é
`tools/teste-abertura.js`.

```
python3 -m http.server 8096          # em fratelli-moveis-v7-1/
node tools/teste-abertura.js http://localhost:8096/
```

Navegador: Chromium (Playwright), WebGL por software (SwiftShader).
**A seção 6 diz o que essa escolha impede de afirmar.**

O teste não olha capturas e opina. Ele mede três coisas que só a
geometria responde: para onde vai a ponta livre de cada folha, quanto
da tela o móvel ocupa, e se a câmera entrou dentro de algum painel.

---

## 1. Os seis estados, em oito telas

| tela | perfil | ocupação no ato 4 | câmera dentro de painel | folha atrás da frente | transbordo | erros |
| --- | --- | --- | --- | --- | --- | --- |
| 1920 × 1080 | A | 63% L · **92% A** | nunca | nunca | 0 px | nenhum |
| 1440 × 900 | A | 70% L · **92% A** | nunca | nunca | 0 px | nenhum |
| 1280 × 800 | A | 70% L · **92% A** | nunca | nunca | 0 px | nenhum |
| 768 × 1024 | B | 80% L · 70% A | — | nunca | 0 px | nenhum |
| 430 × 932 | B | 107% L · 58% A | — | nunca | 0 px | nenhum |
| 390 × 844 | B | 118% L · 64% A | — | nunca | 0 px | nenhum |
| 360 × 800 | B | 101% L · 54% A | — | nunca | 0 px | nenhum |
| 320 × 568 | B | 114% L · 76% A | — | nunca | 0 px | nenhum |

No perfil B a largura passa de 100% de propósito no ato da imersão: o
que sai do quadro são as **portas abertas**, não o vão. O transbordo
do DOCUMENTO continua em 0 px nas oito telas — o palco tem
`overflow: clip` e a escala nunca vira rolagem horizontal.

O tablet (768 × 1024) ocupava só 60% da largura enquanto a peça tinha
330 px fixos no CSS. Agora as medidas crescem a partir de 600 px de
largura e ele vai a 80%.

**92% de altura** nas três telas de desktop, com os oito cantos do
`Box3` dentro de ±1 em NDC — ou seja, dentro da faixa de 85–95% pedida
e **sem nada cortado**. A largura fica menor porque o móvel aberto é
mais alto do que largo: quem limita é a altura, e forçar a largura
cortaria o topo.

---

## 2. TESTE DAS DOBRADIÇAS — a prova principal

A frente do móvel está em **z = +0,290**. Qualquer leitura abaixo
disso é folha entrando na carcaça.

### Antes (V7, defeito confirmado)

| progresso | ponta esquerda z | ponta direita z | |
| --- | --- | --- | --- |
| 0% | +0,300 | +0,300 | à frente |
| 50% | **−0,575** | **−0,578** | **atrás — atravessando o móvel** |
| 70% | **−0,551** | **−0,566** | **atrás** |

### Depois (V7.1)

| progresso | ponta esquerda | ponta direita | |
| --- | --- | --- | --- |
| 0% | x −0,002 · z +0,300 | x +0,002 · z +0,300 | fechada |
| 20% | z +0,323 | z +0,323 | avançando |
| 35% | x −0,073 · z +0,647 | x +0,073 · z +0,647 | avançando |
| 50% | x −0,999 · z +1,171 | x +0,999 · z +1,171 | aberta |
| 70% | x −1,131 · z +1,143 | x +1,131 · z +1,143 | aberta |

Simétrico nos dois lados, sempre à frente de z = +0,290, e o arco
cresce em |x| — as folhas avançam **para fora e em direção a quem
olha**. Medido em 1280, 1440 e 1920: as mesmas leituras.

Valores finais dos pivôs: `pivoEsq.rotation.y = −1,86` e
`pivoDir.rotation.y = +1,86` (±106,6°).

### No celular (CSS 3D)

Medido pela matriz de transformação do elemento, aplicada ao ponto da
borda oposta à dobradiça:

| progresso | ponta esquerda | ponta direita |
| --- | --- | --- |
| 0% | x +165 · z 0 | x −165 · z 0 |
| 30% | x +124 · z **+108,9** | x −124 · z **+108,9** |
| 50% | x +36,7 · z **+160,9** | x −36,7 · z **+160,9** |
| 75% | x +34,3 · z **+161,4** | x −34,3 · z **+161,4** |

### Uma correção no próprio instrumento

A primeira sonda do celular usava `getBoundingClientRect().width` e
dava leituras assimétricas (73,8 contra 112,9). O retângulo renderizado
**encolhe conforme a folha gira** — eu estava medindo a rotação de
volta. Com `offsetWidth` (a largura de layout) os dois lados ficam
exatamente simétricos. Registro porque a assimetria parecia defeito da
animação e era do teste.

---

## 3. TESTE DE REVERSÃO

Rolagem levada ao fim e trazida de volta pelos mesmos pontos:

| tela | volta (rotação da folha esquerda) |
| --- | --- |
| 1920 / 1440 / 1280 | −1,860 → −1,231 → **0,000** → **0,000** |
| 768 / 430 / 390 / 360 / 320 | −78° → −73,4° → **0°** → **0°** |

As portas voltam a fechar pelo mesmo caminho e param exatamente em
zero. Nada fica preso em estado intermediário.

---

## 4. TESTE DE COLISÃO DA CÂMERA

Em cada amostra, a posição da câmera é testada contra o `Box3` de
**cada malha** do móvel, com tolerância de 1 mm para encostar não
contar como atravessar.

Resultado: **nenhuma amostra, em nenhuma das três telas de desktop,
põe a câmera dentro de um painel.** Isso inclui os atos 4 e 5, onde a
câmera entra no vão.

O caminho desce pelo eixo central. As folhas, nessa altura, estão em
|x| ≥ 0,879 — fora do corredor por onde a câmera passa.

`near` foi para 0,03 e `far` para 40, para a precisão de profundidade
aguentar a aproximação sem z-fighting.

---

## 5. ENQUADRAMENTO — por que 92% e não 126%

A primeira implementação usou `(altura/2) / tan(fov/2)`. Medido, ela
entregava:

| pedido | entregue | resultado |
| --- | --- | --- |
| 90% da tela | **126% da altura** | móvel cortado em cima e embaixo |

A fórmula supõe o objeto achatado num plano à distância do centro. Com
as portas abertas o móvel tem **1,44 m de profundidade** e os cantos
da frente abrem um ângulo muito maior.

A versão por canto entrega:

| momento | NDC x | NDC y | ocupação |
| --- | --- | --- | --- |
| ato 3, meio | [−0,31 ; +0,72] | [−0,84 ; +0,69] | 52% · 77% |
| ato 3, fim | [−0,68 ; +0,71] | [−0,98 ; +0,84] | **70% · 91%** |
| ato 4, início | [−0,78 ; +0,81] | [−1,10 ; +0,96] | interior passa a extrapolar — intencional |

Nada ultrapassa ±1 no ato 3. No ato 4 extrapola de propósito: é o
momento em que a câmera entra e o interior passa a dominar.

---

## 6. Celular: enquadramento medido

Em 390 × 844, retângulo da peça:

| momento | tamanho | posição vertical |
| --- | --- | --- |
| ato 1 (fechado) | 258 × 318 | y 194 → 512 |
| ato 3 (metade) | 373 × 445 | y 73 → 518 |
| ato 5/6 | 447 × 526 | y 86 → 612 |

No último trecho a peça passa dos 390 px de largura de propósito: o
que fica de fora são as **portas**, não o vão. O palco tem
`overflow: clip`, e o **transbordo do documento é 0 px** em todas as
oito telas — a escala nunca vira rolagem horizontal.

Antes da correção a peça chegava a **589 × 694 com o topo em −86**:
cortada dos quatro lados, sem referência.

---

## 7. A fotografia do último ato

Defeito encontrado durante a verificação, anterior à V7.1:

| | antes | depois |
| --- | --- | --- |
| 390 × 844 | **390 × 219** (faixa no topo) | **394 × 852** (cobre) |
| 1440 × 900 | 1440 × 810 | **1510 × 944** (cobre) |

Causa: `<picture>` é inline por padrão e altura em porcentagem não
resolve contra pai de altura automática.

---

## 8. Prévia de arquivo único, de `file://`

`fratelli-moveis-v7-1-visualizacao.html`, 7,2 MB, aberta do disco:

| | desktop 1440 | celular 390 |
| --- | --- | --- |
| perfil | **A** | **B** |
| sequência ida e volta | reversível | reversível |
| transbordo | 0 px | 0 px |
| erros de página | nenhum | nenhum |
| recursos que falharam | nenhum | nenhum |
| referências externas | **nenhuma** | — |

---

## 9. O que NÃO foi medido

**FPS: não medido.** O navegador aqui roda WebGL por software
(SwiftShader). Qualquer taxa descreveria esta máquina, não um aparelho
real.

Isso importa mais nesta versão do que nas anteriores: a câmera agora
chega muito mais perto, e perto significa mais pixels sombreados pelo
mesmo material. **A validação em GPU real continua pendente** e é a
primeira coisa a fazer antes de publicar.

O que dá para afirmar, porque é verificável no código e no
comportamento: um render loop só, desenho sob demanda, parada fora da
tela e com a aba escondida, teto de pixel ratio em 2 (1,5 no perfil
leve), geometria e materiais compartilhados, `dispose()` completo, e
nenhuma geometria recriada por quadro — o `Box3` reusa os mesmos
vetores.

**Lighthouse, LCP, CLS e INP: não medidos**, pela mesma razão.
