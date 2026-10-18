# Testes — capítulo 3D

Tudo executado em Chromium (Playwright), com WebGL por **software**
(SwiftShader). A seção 7 diz o que essa escolha impede de afirmar.

```
python3 -m http.server 8091
node tools/teste-contraste.js       # contraste real, 11 larguras
node tools/teste-funcional.js       # menu, lightbox, galeria, fallbacks
node tools/teste-cena.js            # a timeline, estado por estado
```

---

## 1. CHECKPOINT 1 — O MODELO PARADO

Enquadramento frontal, pela própria cena, com os sobrepostos do DOM
escondidos. `tools/provas/modelo-parado.png`.

Medidas do modelo, lidas do `Box3`: **3,38 × 2,60 × 0,62 m**, 6 folhas,
10 ripas por folha ripada, 32 malhas.

Comparação por folha contra `tools/ref/29.jpg`:

| folha | tipo | p50 | faixa | variação na largura |
| --- | --- | --- | --- | --- |
| F0 | **ripada** | 106 | 96 | 45 |
| F1 | lisa | 94 | 53 | 45 |
| F2 | lisa | 92 | 55 | 53 |
| F3 | lisa | 89 | 52 | 49 |
| F4 | lisa | 89 | 56 | 58 |
| F5 | **ripada** | 107 | 90 | 50 |
| **alvo ripado** | | **116** | **181** | **165** |
| **alvo liso** | | **93** | **74** | **111** |

De perto, com a iluminação real do site
(`tools/provas/ripado-referencia-vs-render.png`):

| | p50 | faixa | variação |
| --- | --- | --- | --- |
| referência `ref/30.jpg` | 76 | **195** | **210** |
| render | 106 | **104** | **123** |

**53% e 59% da referência.** Não é aprovação; é a medida honesta de
onde está. As causas e os caminhos estão em `RELATORIO-3D.md` §6.

### Quatro correções no próprio instrumento

Nenhuma delas era defeito da página, e todas me fizeram perseguir a
coisa errada por um tempo:

| erro | sintoma | o que era |
| --- | --- | --- |
| sonda media o **fundo** | iluminação não mudava nada, em 4 configurações seguidas | o laço de render reescrevia a câmera logo depois da sonda posicioná-la |
| extrusão girada ao contrário | painel ripado nascia deslocado e com as ripas viradas para a parede | `rotateX(−90°)` em vez de `+90°` |
| distância de câmera errada | câmera dentro da peça | multiplicava o ângulo pelo aspect em vez de `tan(vfov/2) × aspect` |
| medição de arquivo velho | geometria mudava e o número não | o servidor tinha caído e eu havia suprimido o `stderr` |

A terceira correção gerou o `window.__fratelli3D` com `enq.congelado`,
que é o modo de desenvolvimento que o briefing pede na seção 08.

---

## 2. CHECKPOINT 2 — AS PORTAS

A ponta **livre** de cada folha, em coordenadas do mundo. A frente da
carcaça está em **z = +0,325**.

| estado | ponta esquerda | ponta direita | simétrico | câmera dentro de painel |
| --- | --- | --- | --- | --- |
| 0% | +0,293 | +0,293 | sim | nunca |
| 25% | +0,580 | +0,580 | sim | nunca |
| 50% | +0,808 | +0,808 | sim | nunca |
| 75% | +0,929 | +0,929 | sim | nunca |
| 100% | +0,911 | +0,911 | sim | nunca |

Sempre **para fora**. O recuo de 75% para 100% é correto: a abertura é
de 106,6° e, passados os 90°, a ponta começa a voltar.

**Reversão:** as rotações voltam a **0,0000** exatamente.
`tools/provas/portas-cinco-estados.png`.

---

## 3. CHECKPOINT 4 — A TIMELINE, PELA ROLAGEM REAL

| progresso | rot esquerda | rot direita | texto recuado | transbordo |
| --- | --- | --- | --- | --- |
| **1440×900 (perfil A, com pin)** | | | | |
| 0% | 0 | 0 | não | 0 |
| 25% | −0,1012 | +0,1012 | não | 0 |
| 50% | −1,7066 | +1,7066 | **sim** | 0 |
| 75% | −1,8600 | +1,8600 | sim | 0 |
| 100% | −1,8600 | +1,8600 | sim | 0 |
| **390×844 (perfil B, com pin, 2,6 alturas)** | | | | |
| 0% | 0 | 0 | sim | 0 |
| 50% | −1,7066 | +1,7066 | sim | 0 |
| 100% | −1,8600 | +1,8600 | sim | 0 |

**Rolagem reversa:** nas duas telas as rotações voltam a **0/0**,
idênticas à ida.

---

## 4. CHECKPOINT 5 — SEM SOBREPOSIÇÃO DE TEXTO

99 estados: 11 larguras × 9 paradas, a página inteira. Em cada parada
a tela é fotografada duas vezes — a segunda com os glifos em
`color: transparent` — e o fundo verdadeiro atrás de cada bloco é lido
da segunda.

### O defeito que o teste encontrou

| achado | contraste | exigido |
| --- | --- | --- |
| `abertura__nota` em 1280×800 | **2,39:1** | 4,5 |
| `eyebrow` em 1280×800 | **4,39:1** | 4,5 |

A fotografia do estado (`tools/provas/`) mostra a câmera **dentro** do
móvel, com o interior iluminado ocupando a tela, e o texto inteiro por
cima. O recuo não tinha disparado.

**Causa:** o recuo da V8/V9 é geométrico — compara o retângulo da cena
com o do texto. Quando a câmera entra no móvel, os cantos da caixa
ficam atrás dela e são descartados na projeção; o retângulo encolhe, a
folga calculada dá grande, e o texto não cede. O defeito só aparece
porque esta peça tem 3,38 m e a câmera entra de verdade.

**Correção:** o recuo passou a ter **duas causas**. A geométrica
continua, e entrou uma determinística por **progresso da sequência**
(26%). O briefing pede exatamente isso — "texto começa a recuar ANTES
da invasão visual" — e geometria sozinha reage tarde.

Depois da correção, em 1280×800, 1440×900 e 390×844: **nenhum bloco
abaixo do mínimo da WCAG AA**, pior contraste da página 5,41:1, zero
transbordo, zero erro de página.

---

## 5. CHECKPOINT 6 — O CELULAR

| | perfil | classe | malhas na cena |
| --- | --- | --- | --- |
| desktop 1440×900 | A | `tem-3d` | **32** |
| celular 390×844 | B | `tem-3d` | **32** |
| tablet 768×1024 | B | `tem-3d` | **32** |
| movimento reduzido | C | — | nenhuma |

**O celular passou a mostrar o mesmo móvel.** Na V9 ele mostrava uma
composição 2.5D em CSS que era outra peça. `js/3d/mobile25.js` e 326
linhas de CSS saíram.

---

## 6. CHECKPOINT 7 E 8 — FALLBACK, FUNCIONAIS, PRÉVIA

24 testes, **0 falhas**:

menu (abre, trava a rolagem, fecha com Escape, devolve a rolagem) ·
ampliação (abre, mostra a classificação, fecha, **reabre**, sem erro) ·
galeria (6 cartões, rolagem nativa, **sem pin** no celular, não prende
a rolagem vertical) · vídeo (elemento e fonte) · movimento reduzido
(perfil C, nenhuma cena 3D, fotografia no lugar, texto inteiro e sem
recuo) · sem JavaScript (seção, fotografia e texto no HTML) · rolagem
rápida 14 × 1600 px (não prende, nenhum bloco visível fica invisível) ·
redimensionar celular → desktop → celular (sem transbordo, **as folhas
voltam a fechar**).

**Prévia de arquivo único**, aberta de `file://`:

| | perfil | cena | malhas | externos | erros |
| --- | --- | --- | --- | --- | --- |
| desktop | A | sim | 32 | 1 | nenhum |
| celular | B | sim | 32 | 1 | nenhum |

O único pedido externo é o favicon do mapa do Google embutido no
contato. `noindex, nofollow` forçado pelo build.

---

## 7. O QUE NÃO FOI MEDIDO

**Nenhuma validação em GPU real.** Tudo rodou em WebGL por software.
Os números de aparência valem como comparação entre versões, não como
o que um aparelho mostra. **Primeiro item antes de publicar.**

**FPS, Lighthouse, LCP, CLS e INP: não medidos.** Não há Lighthouse
aqui e a máquina não tem GPU.

**O filme não pôde ser verificado tocando:** este Chromium não
decodifica H.264. Vale igualmente para as versões anteriores.

**Blender não existe neste ambiente** — sem binário, sem `bpy`,
`trimesh` ou `pygltflib`. A Estratégia B do briefing está fora.
