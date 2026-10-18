# Relatório — V9

O pedido desta rodada foi direto: o módulo 3D "ainda é artificial,
semelhante a um objeto de plástico ou massinha". E a condição estava
escrita: **antes de animar, o móvel parado precisa parecer
convincente.**

Então esta versão quase não mexeu na animação. Mexeu na peça parada.

---

## 1. O QUE ERA, DE FATO

"Massinha" não é um defeito — é o sintoma de vários. Separá-los levou
mais tempo do que corrigi-los, e o método foi sempre o mesmo: medir a
fotografia que você mandou, medir o render, comparar os números.

O primeiro passo foi um **render de argila** (`tools/provas/render-de-argila.png`):
a mesma cena com um cinza fosco no lugar de todos os materiais. Ele
responde uma pergunta que nenhuma textura responde — *o que é forma e o
que é material?*

A resposta foi desconfortável. Sem material, a V8 era uma caixa com duas
folhas quase quadradas, sem moldura, sem rebaixo, sem uma única aresta
na própria frente que projetasse sombra. Nenhuma madeira salvaria aquilo.

Daí em diante foram cinco causas distintas:

| # | causa | como apareceu |
| --- | --- | --- |
| 1 | geometria sem estrutura | render de argila |
| 2 | campo de altura sem escala | textura com faixa de luma 10, referência 51 |
| 3 | emenda da textura dentro do painel | faixa atravessando as duas portas |
| 4 | relevo na frequência errada | painel lia como cobre derretido |
| 5 | UV normalizada por peça | tiras de 85 mm com a folha inteira dentro |

A (5) foi a mais cara de achar e a que mais mudou o resultado.

---

## 2. A GEOMETRIA

A referência `tools/ref/27.jpg` é um armário de **quatro folhas
estreitas e altas**, perto de 1:4, dentro de uma moldura de perímetro
que avança sobre elas, com campo rebaixado, puxadores longos, e um
interior com cabideiro, prateleiras e gaveteiro.

A V9 passou a ser isso:

| | V8 | V9 |
| --- | --- | --- |
| medidas | 1,80 × 2,10 × 0,58 m | 2,46 × 2,42 × 0,62 m |
| folhas | 2, de 0,89 m | 4, de 0,60 m (as 2 centrais abrem) |
| moldura | nenhuma | 70 mm, saliente 12 mm |
| folha | chapa lisa | campo rebaixado 7 mm dentro de um quadro de 85 mm |
| puxador | 0,62 m | 0,95 m |
| interior | prateleiras + 3 gavetas | cabideiro, 4 prateleiras, divisória, 8 gavetas |

Uma correção no caminho vale registrar porque o primeiro desenho estava
errado: o quadro da porta nasceu **saliente**. De longe não aparecia
nada — 9 mm dão menos de dois pixels e, com a luz quase de frente, não
há sombra para marcá-los. Virou **rebaixo**. Um rebaixo devolve uma
linha escura no encontro das peças, e linha escura se lê em qualquer
escala. É o mesmo motivo de a fresta entre as folhas funcionar.

---

## 3. A MADEIRA, POR MEDIÇÃO

### Cor

Não foi escolhida. Foi lida da referência: recorte de 600 × 600 px na
face, pixels ordenados por luminosidade, média dos percentis.

| | cor | H | S | luma |
| --- | --- | --- | --- | --- |
| escuro (p02–p08) | `#684633` | 21° | 51% | 76 |
| médio (p45–p55) | `#85624F` | 22° | 40% | 105 |
| claro (p92–p98) | `#9F7B65` | 22° | 36% | 129 |

**Ressalva que não pode faltar:** estes valores são o que a CÂMERA
registrou, não o albedo puro da madeira — a fotografia já traz a luz do
estúdio dentro dela. Usá-los como albedo é uma aproximação assumida,
não uma medição de albedo.

### Faixa tonal

O campo de altura somava sempre em torno de 0,44: a textura saía com
faixa de luma de **10 níveis** contra os **52** da fotografia. Marrom
chapado — e nenhum ajuste de luz corrigia, porque não havia variação
para a luz revelar. Corrigido com normalização por percentil, nos
mesmos 5% e 95% em que a referência foi medida.

### Desenho

Aqui o instrumento foi o **espectro horizontal**, medido na mesma
escala nos dois lados (170 px para ~0,60 m de folha):

| ciclos por folha | referência | V9 (antes) | V9 (depois) |
| --- | --- | --- | --- |
| 2 | 284× a mediana | 998× | 245× |
| 3 | 125× | 3962× | 672× |
| 4 | 72× | 1204× | 317× |
| 11 | — | **1136× (pico isolado)** | — |

Um pico isolado é um padrão; madeira é um espectro largo. O pico em 11
ciclos eram as 11 bandas da figura. Com 3 bandas, bem distorcidas, a
energia voltou para a frequência em que a madeira a põe.

Continua mais "arrumada" que a fotografia (672× contra 125×). Isso é
uma diferença real que não foi fechada, e está na lista de pendências.

Lado a lado: `tools/provas/lamina-referencia-vs-v9.png`.

| | p05 | p50 | p95 | faixa | H | S |
| --- | --- | --- | --- | --- | --- | --- |
| referência | 77 | 105 | 129 | 52 | 22° | 41% |
| textura V9 | 76 | 106 | 129 | 53 | 22° | 40% |

---

## 4. A CAUSA RAIZ DO ASPECTO DE RIPADO

Mesmo com a textura correta, o móvel continuava lendo como **painel
ripado** de longe. Foi isolado assim:

- desligando **só o mapa de cor** → painel perfeitamente liso;
- desligando normal e rugosidade → as ripas continuam.

Logo: era a cor. E a textura, ampliada, estava certa. Logo: era a **UV**.

`geoPainel` normalizava a UV para 0..1 das dimensões da **própria
peça**. Numa tira de 85 mm — o quadro da porta — isso espreme a folha
INTEIRA em 85 mm: dezenas de linhas de veio em 15 px de tela. Aliasing
garantido, e nenhuma filtragem resolve.

Também estava errado na física, apesar do comentário no código que
dizia o contrário. Cortar uma tira de 85 mm de uma folha dá 85 mm
**daquela** folha, não a folha toda encolhida.

Agora a UV é medida em metros contra uma folha de lâmina de
0,70 × 2,50 m, e cada peça fica com a janela que lhe cabe. Uma porta
pega quase a folha inteira; uma tira de quadro pega uma faixa estreita
dela, com o veio na MESMA escala — que é o que acontece quando as duas
saem da mesma chapa.

### Um desvio deliberado da referência

O poro caiu de 62 para **26 linhas por folha** (~43/m contra ~130/m na
referência). No primeiro ato a folha ocupa ~105 px de tela; com 130
linhas/m sobram 1,7 px por linha, e aí não há filtragem que resolva —
nem anisotropia 16, nem mip-map, que é um filtro de caixa e não elimina
um sinal periódico de 1,7 texel.

Aumentar a resolução da textura **não ajudaria**: quem decide é a
escala na TELA, não no texel.

---

## 5. ILUMINAÇÃO

Mudou pouco, e só com número na frente:

- exposição de 1,06 para **1,45** — a face do móvel fechado passou de
  mediana 45 para **61**;
- volume da sombra ampliado de ±3,2 m para ±4,0 m, porque com 2,46 m de
  largura e quase 2,9 m de profundidade aberto a folha direita saía do
  volume e a sombra dela era cortada.

A referência fotografada está em 127, mas ela é um quarto com janela.
Aqui o fundo é escuro de propósito, porque é sobre ele que o texto
branco precisa ler — e isso é verificado, não suposto (seção 1 de
`TESTES-V9.md`).

---

## 6. O QUE A MUDANÇA QUEBROU, E FOI CONSERTADO

Um móvel mais largo e mais claro reabriu problemas que a V8 tinha
fechado. Os testes pegaram todos:

| achado | o que era | correção |
| --- | --- | --- |
| nota em 3,35:1 em 1440 | desvio da câmera era um número solto, calibrado para 1,80 m | desvio passou a ser proporcional a `L` |
| lead e nota em 4,2–4,5:1 | véu da coluna insuficiente para a moldura clara | platô do véu de 0,90 para 0,96 |
| botão de pular em 4,50:1 | fundo a 97% deixava passar a madeira | fundo opaco |
| contraste oscilando 2,1 ↔ 16,6 entre execuções | **erro do teste**, não da página | o teste passou a esperar a animação de entrada parar |

O último é o mais importante de registrar: por algum tempo eu tinha um
instrumento que reprovava e aprovava a mesma página conforme o humor da
máquina. Está descrito em `TESTES-V9.md`.

---

## 7. O QUE NÃO FOI FEITO

- **Blender não foi usado.** Não está disponível neste ambiente. Tudo
  aqui é Three.js em tempo real.
- **Nenhuma validação em GPU real.** O navegador desta máquina roda
  WebGL por software.
- **FPS, Lighthouse, LCP, CLS, INP: não medidos.** Pelo mesmo motivo.
- **Nada foi publicado.**
- A V8 continua intacta em `../fratelli-moveis-v8/`.

O módulo continua identificado na própria página como **visualização
conceitual**, com a nota de que não é um móvel instalado. Ele não é
apresentado como projeto executado pela Fratelli Móveis.
