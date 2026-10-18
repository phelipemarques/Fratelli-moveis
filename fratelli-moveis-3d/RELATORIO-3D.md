# Relatório — o capítulo 3D, refeito

Antes de tudo, uma ressalva que o relatório precisa carregar: **a
rodada anterior removeu o armário 3D** porque o briefing daquela vez
mandava removê-lo se ele falhasse nos critérios, e ele falhava em
quatro. Este briefing manda consertá-lo. Ele voltou, numa versão nova.
A versão fotográfica continua intacta em `../fratelli-moveis-reimaginada/`.

---

## 1. A CAUSA DO ASPECTO ARTIFICIAL, MEDIDA

Cinco versões tentaram fazer uma **chapa lisa** parecer madeira usando
textura. A medição das referências novas explica por que nunca fechou:

| | faixa de luma | variação da luz na largura |
| --- | --- | --- |
| `ref/29.jpg` painel **liso** | 74 | 111 |
| `ref/29.jpg` painel **ripado** | **181** | **165** |
| `ref/30.jpg` ripado, uma única ripa | — | **210 níveis, da sombra ao realce** |
| V9, painel liso renderizado | ~25 | — |

Numa peça de marcenaria real a maior parte da amplitude tonal **não
vem do desenho da madeira**. Vem da geometria recebendo luz
direcional. Uma superfície plana tem um ângulo só, logo um tom só.
Cada ripa tem todos os ângulos entre o realce e a sombra.

Nenhum mapa de normal faz esse trabalho: normal map não projeta sombra
na peça vizinha nem muda a silhueta. Ripa projeta.

**Foi esta a troca central da rodada: relevo em geometria, não em mapa.**
O `normalScale` da lâmina caiu de 0,16 para 0,09 na mesma mudança.

---

## 2. O QUE FOI RECONSTRUÍDO

### A silhueta

As versões 6 a 9 modelaram um **armário solto**: caixa com pés, tampo e
laterais aparentes, apoiada no piso. As referências mostram outra
coisa — marcenaria **de parede, do piso ao teto**, onde o móvel é a
própria parede. Isso muda a leitura antes de qualquer material.

| | V9 | esta versão |
| --- | --- | --- |
| medidas | 2,46 × 2,42 × 0,62 m | **3,38 × 2,60 × 0,62 m** |
| folhas | 4 | **6** |
| tipo | todas lisas | 2 **ripadas** nas pontas, 4 lisas |
| que abrem | 2 centrais | 2 centrais |
| metal | puxador de barra | **friso de latão de 12 mm** |
| interior | fundo claro | **fundo escuro**, base em pedra, 7 prateleiras com LED |

### `js/3d/ripado.js` — o painel ripado

Um `ExtrudeGeometry` por painel: o perfil é a seção horizontal (costas
lisas, frente ondulada) e a extrusão é a altura. Uma malha só, 1188
vértices, compartilhada entre peças de mesma medida.

**Passo de 42 mm com 14 mm de saliência**, e esse número tem história:

A referência usa ~18 mm (10 px por ripa numa foto de 2000 px). Copiei
essa escala primeiro — 26 mm — e o resultado medido foi ruim:
variação de 34 contra 165. O motivo é de amostragem: no enquadramento
aberto o painel ocupa ~104 px para 15 ripas, **7 px por ripa com 9
facetas dentro**. A GPU faz a média e devolve um tom só.

É a mesma parede que a V9 encontrou com o poro da madeira. Detalhe mais
fino que ~3 px por elemento desaparece, e aumentar a resolução da
textura não resolve, porque quem decide é a escala **na tela**.

Com 42 mm a amplitude subiu de 74 para 96. Continua abaixo da
referência — ver a seção 6.

### O fundo escuro

Mudança em relação à V9, que usava fundo claro "para o interior não
virar um buraco preto". Medido na referência 31: o interior é um marrom
escuro, e é ele que faz a fita de LED aparecer. Interior claro achata.

---

## 3. A ILUMINAÇÃO ESTAVA ERRADA, E O COMENTÁRIO MENTIA

O rig vinha dimensionado para uma caixa de 1,80 m vista de três
quartos: chave alta e quase frontal (z = 4,2) e uma luz **chamada**
"rasante" em z = 6,4 — ou seja, mais frontal ainda que a chave. O
comentário dela dizia *"quase paralela à frente do móvel"*. Nunca foi:
estava a 71° do plano da face.

Com um painel ripado isso deixa de ser detalhe e vira o problema todo.

| | faixa do ripado | variação |
| --- | --- | --- |
| referência | 181 | 165 |
| rig antigo | 72 | 35 |
| **o mesmo modelo, luz rasante de verdade, de perto** | **153** | **171** |

O modelo sempre foi capaz. A luz chegava de frente, e luz de frente
numa superfície ondulada ilumina todas as ondas igualmente — que é a
definição de achatar.

As duas direcionais passaram a ter **alvo**. Sem alvo elas apontam para
a origem, e numa peça de 3,4 m isso é um ângulo diferente em cada ponta.

---

## 4. AS PORTAS — CHECKPOINT 2

Medido com uma sonda que lê a ponta **livre** de cada folha em
coordenadas do mundo. A frente da carcaça está em **z = +0,325**.

| estado | ponta esquerda | ponta direita | simétrico | câmera dentro de painel |
| --- | --- | --- | --- | --- |
| 0% | +0,293 | +0,293 | sim | nunca |
| 25% | +0,580 | +0,580 | sim | nunca |
| 50% | +0,808 | +0,808 | sim | nunca |
| 75% | +0,929 | +0,929 | sim | nunca |
| 100% | +0,911 | +0,911 | sim | nunca |

Sempre para frente, sempre simétricas. O leve recuo de 75% para 100% é
correto: a abertura é de 106,6°, e depois dos 90° a ponta começa a
voltar. **Reversão: as rotações voltam a 0,0000 exatamente.**

---

## 5. O CELULAR — E O 2.5D SAIU

Era a queixa mais direta do briefing. A V9 entregava no celular
**literalmente outro móvel**: uma composição 2.5D em CSS com duas
folhas, 1,80 m, sem moldura, enquanto o desktop mostrava outra coisa.
Nenhum ajuste de acabamento conserta duas peças diferentes.

**Escolhida a Solução A** (WebGL simplificado), e ela só foi possível
porque esta cena é barata: 32 malhas no total. O modo `leve` já
existia e corta textura (512 em vez de 1024), sombra (1024 com filtro
simples) e teto de pixel ratio (1,5).

Verificado:

| | perfil | classe | malhas |
| --- | --- | --- | --- |
| desktop 1440 | A | `tem-3d` | **32** |
| celular 390 | B | `tem-3d` | **32** |
| tablet 768 | B | `tem-3d` | **32** |
| movimento reduzido | C | — | nenhuma |

A sequência do perfil B é mais curta — 2,6 alturas de tela contra 4,0 —
porque num espaço pequeno rolagem demais por capítulo cansa. Essa parte
da decisão da V9 continua certa.

Sem WebGL não há mais fallback intermediário: vai direto para a
fotografia, que é honesta e sempre funcionou. `js/3d/mobile25.js` e
326 linhas de CSS saíram.

---

## 6. O QUE NÃO FOI ATINGIDO

Com números, porque "melhorou" não é informação.

| | referência | esta versão | %  |
| --- | --- | --- | --- |
| painel **liso** — p50 | 93 | 84–94 | ✔ |
| painel **liso** — variação na largura | 111 | 45–58 | 41–52% |
| painel **ripado** — p50 | 116 | 106–109 | ✔ |
| painel **ripado** — faixa | 181 | 90–96 | **50–53%** |
| painel **ripado** — variação na largura | 165 | 45–50 | **27–30%** |

**De perto, o painel ripado chega a 153/171 contra 195/210 da
referência** — 78% e 81%. A distância aparece no enquadramento aberto,
e a causa está medida: 16 px por ripa não bastam para a GPU preservar o
contraste que uma fotografia captura nos mesmos 10 px, porque o realce
especular real é mais brilhante que uma rampa de Lambert amostrada.

Caminhos que não foram percorridos, em ordem de proveito:

1. **Anti-aliasing por supersampling** na seção 3D (render a 2× e
   reduzir). Custa fill rate; preserva o realce das ripas.
2. **Mapa de ambient occlusion** nos vales das ripas, que escureceria
   o que hoje a luz indireta levanta.
3. **HDRI licenciada** no lugar do ambiente procedural de 256×128.

---

## 7. O QUE NÃO PÔDE SER FEITO NESTE AMBIENTE

- **Blender não existe aqui.** Verificado: sem binário `blender`, sem
  `bpy`, sem `trimesh`, sem `pygltflib`. A Estratégia B do briefing
  (modelar e exportar GLB) está fora, e a escolha pela Estratégia A
  (procedural em Three.js) é consequência disso, não preferência.
- **Nenhuma validação em GPU real.** Tudo foi renderizado em WebGL por
  software (SwiftShader). Os números de aparência valem como
  comparação relativa entre versões, não como o que um aparelho mostra.
- **FPS, Lighthouse, LCP, CLS, INP: não medidos.** Não há Lighthouse
  aqui e a máquina não tem GPU.
- **Nada foi publicado.**
