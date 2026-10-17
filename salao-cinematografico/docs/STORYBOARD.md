# Storyboard — Fase 1

## 1. O que o vídeo de referência mostra

Vídeo vertical de 16,4 s (576×1024, 30 fps), filmado de uma tela: um monitor e
um celular rodando o mesmo site de cosmético (pote de creme + peônia), com a
assinatura de um estúdio no topo. Extraí quadros a 2 fps e recortei a área do
monitor e do celular para estudar cada momento.

### Observado diretamente nos quadros

| Tempo | Cena | Elemento principal | Movimento | Comportamento no scroll |
|---|---|---|---|---|
| 0,0–1,0 s | A | Peônia fechada, à direita; título editorial à esquerda ("…at first bloom") com botão | Botão quase parado; pela abertura no topo já se vê o pote | Topo da página |
| 1,0–2,5 s | B | Peônia abrindo | Pétalas externas se afastam camada por camada; câmera aproxima; o pote aparece inteiro dentro da flor | Rolagem contínua, o movimento acompanha o dedo |
| 2,5–4,0 s | C | Pote saindo da flor | Pote sobe; a flor desce e fica só a coroa de pétalas na base do quadro, desfocada; o título troca | O enquadramento acompanha o pote (câmera sobe) |
| 4,0–5,5 s | D | Pote flutuando | Pote centralizado, com leve inclinação e giro; texto curto com lista de 3 itens à esquerda | Rolagem lenta, pouca mudança por quadro |
| 5,5–6,5 s | E | Tampa abrindo | Tampa sobe em linha reta, depois inclina e se desloca para a direita; o conteúdo (creme em espiral) aparece | O scroll controla a separação |
| 6,5–7,5 s | F | Vista de cima | Câmera passa para vista superior; a peônia reaparece aberta sob o pote, vista de cima; tampa ao lado | Mudança de eixo da câmera sem corte |
| 7,5–8,5 s | G | Transição para a loja | Composição encolhe e sobe; grade de 4 produtos entra abaixo | A cena 3D vira parte do layout |
| 8,5–12 s | H | Loja | Grade de produtos, gaveta de carrinho | Rolagem comum de site |
| 12–16 s | — | Assinatura do estúdio | Escurece, logo do Instagram | Fora do site |

No celular a sequência é a mesma, com o objeto centralizado e o texto acima ou
abaixo dele, sobre um véu claro.

### Inferência (não comprovada pelo vídeo)

- A qualidade fotográfica do pote e da flor, sem serrilhado e com profundidade
  de campo, sugere quadros pré-renderizados (sequência de imagens) trocados pelo
  scroll, mas o vídeo não prova a técnica. Não assumo nada sobre ela.
- O ritmo sugere scroll com suavização (scrub), sem travar a rolagem.

### O que leva da referência

Continuidade (a flor nunca é cortada, ela sai do quadro), câmera que segue o
objeto, texto editorial grande à esquerda que troca a cada momento, objeto à
direita no desktop e centralizado no mobile, separação da tampa em dois tempos
(sobe reto, depois inclina), e a transição em que a cena vira layout.

### O que não leva

Marca, textos, pote de creme, grade de loja e assinatura do estúdio.

## 2. Roteiro do salão (primeira sequência — implementada)

Timeline em unidades (≈ 11,8 no total). A rolagem da seção `.cinema`
(640 vh no desktop, 540 vh no mobile) vira o progresso 0–1.

| # | Unid. | Cena | Elemento | Movimento | Scroll |
|---|---|---|---|---|---|
| 1 | 0,0–2,6 | Flor | Peônia procedural, 7 camadas, 62 pétalas | Abre de fora para dentro (dobradiça + morph da curvatura); estames dourados aparecem; câmera sobe e olha para dentro; fundo e luz esquentam | scrub, reversível |
| 2 | 1,5–3,8 | Esmalte surge | Frasco nasce no centro da flor (escala 0,42 → 1) | Sobe entre as pétalas girando ~110°; câmera acompanha; flor desce e vira base | scrub |
| 3 | 3,6–6,2 | Frasco girando | Frasco oval de vidro | Volta completa; inclina para mostrar o ombro e a base; câmera orbita levemente; termina de frente (rótulo) | scrub |
| 4 | 6,0–8,0 | Tampa desenrosca | `capPivot` (tampa + haste + pincel) | Câmera fecha na tampa; 2 voltas subindo pelo passo da rosca (0,028/volta) | scrub |
| 5 | 8,0–9,0 | Pincel sai | Haste e pincel | Sobe em linha reta até a ponta passar da boca do frasco | scrub |
| 6 | 9,0–11,8 | Revelação | Pincel com esmalte, gota | Tampa e pincel inclinam juntos para a direita; close no pincel; a gota se forma | scrub |

Texto: 5 capítulos, um por vez, com entrada por linha (máscara) e saída para cima.
Capítulos não se sobrepõem: cada um sai antes do próximo entrar.

### Direção de arte (Salão Iolanda)

Fundo preto profundo com halo atrás do objeto, que muda de tom ao longo da
sequência: rosé na flor, champagne no frasco, rosé com dourado no pincel.
Contraluz champagne e rosado recorta o vidro e as pétalas sobre o escuro.
Texto off-white, destaques em rosé, botões champagne, detalhes em dourado
discreto. A paleta é provisória até a logo oficial chegar.

## 3. Próximas fases (não implementadas)

| # | Cena | Objetos | Serviço associado |
|---|---|---|---|
| 7 | Saída do esmalte | Frasco sai da composição; câmera atravessa | Unhas |
| 8 | Escova | Escova girando | Cabelo e finalização |
| 9 | Secador | Entrada em arco 3D | Cabelo e finalização |
| 10 | Tesoura + pente | Tesoura abre e fecha | Corte |
| 11 | Batom + pincel de maquiagem | Batom gira e sobe | Maquiagem |
| 12 | Produto capilar | Frasco assume o centro | Tratamentos |
| 13 | Transição para o site | Objetos se reorganizam como índice das categorias; fundo vira a seção de serviços | — |

## 4. Modelos necessários

| Modelo | Situação | Origem |
|---|---|---|
| Peônia (pétalas independentes, estames, sépalas, haste) | Feito | Procedural (`src/three/flower.ts`) |
| Frasco de esmalte: vidro, líquido, rótulo, rosca, tampa, haste, pincel, gota | Feito | Procedural (`src/three/polish.ts`) |
| Secador, escova, tesoura, pente, batom, pincel de maquiagem, frasco capilar | Pendente | Procedural simples ou Blender → GLB (Draco/Meshopt) |
| Logo do salão | Pendente | Cliente |
