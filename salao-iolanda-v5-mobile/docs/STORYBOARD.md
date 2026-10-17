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

## 2. Roteiro da abertura (V4)

Timeline em unidades (16,2 no total). A rolagem da seção `.cinema`
(860 vh no desktop, 720 vh no mobile) vira o progresso 0–1. As fases 1 a 6
são as da versão aprovada pelo cliente e foram preservadas; a V4 acrescenta 7 a 9.

| # | Unid. | Cena | Elemento | Movimento | Texto |
|---|---|---|---|---|---|
| 1 | 0,0–2,6 | Flor | Peônia procedural, 7 camadas, 62 pétalas | Abre de fora para dentro; câmera sobe e olha para dentro | Hero: Salão Iolanda · "Seu momento de beleza começa aqui." |
| 2 | 1,5–3,8 | Esmalte surge | Frasco nasce no centro da flor | Sobe girando; flor desce e vira base | 01 Cuidado |
| 3 | 3,6–6,2 | Frasco girando | Vidro oval, tampa preta laqueada | Volta completa, inclina e termina de frente | 02 Cor |
| 4 | 6,0–8,0 | Tampa desenrosca | `capPivot` | 2 voltas subindo pelo passo da rosca | 03 Ritual |
| 5 | 8,0–9,0 | Pincel sai | Haste e pincel | Sobe reto até a ponta passar da boca | 04 Unhas |
| 6 | 9,0–11,8 | Revelação | Pincel, gota | Inclina; close; a gota se forma | 04 Unhas |
| 7 | 11,8–13,4 | **Saída do produto** | Frasco e tampa | Saem pela diagonal superior; câmera recua; fundo vira preto com halo bordô | — |
| 8 | 12,5– | **Marca** | — | — | "SALÃO *Iolanda*", proposta de valor, serviços e agendamento |
| 9 | 12,9–15,2 | **Escova redonda** | Escova procedural (cabo laqueado, anel champagne, tambor rosé, 324 cerdas) | Sobe girando no eixo longo e assenta na diagonal | idem |

Depois da abertura, o fundo preto continua na seção "O salão" (sem tela em
branco) e as cores seguintes mudam suavemente entre preto, off-white e bordô.

## 3. Site (V4)

| Seção | Fundo | Movimento |
|---|---|---|
| O salão | off-white | título por linhas; foto abre por máscara |
| Serviços | preto | linhas entram em sequência; no desktop a foto ao lado troca conforme a linha ativa |
| Cabelos | preto sofisticado | foto grande com máscara e parallax discreto; destaques em escada |
| Portfólio | off-white | grade assimétrica, quadros em ondas por coluna; filtro; lightbox |
| Agendamento | bordô | título por linhas; passos e atalhos por serviço |
| Localização e contato | preto | endereço em tipografia grande, linhas em sequência |

Sem pin nas seções e sem sequestro de rolagem.

## 4. Modelos necessários

| Modelo | Situação | Origem |
|---|---|---|
| Peônia (pétalas independentes, estames, sépalas, haste) | Feito | Procedural (`src/three/flower.ts`) |
| Frasco de esmalte: vidro, líquido, rótulo, rosca, tampa, haste, pincel, gota | Feito | Procedural (`src/three/polish.ts`) |
| Escova redonda | Feito (V4) | Procedural (`src/three/hairbrush.ts`) |
| Secador, tesoura, pente, pincel de maquiagem | Não incluídos de propósito (um objeto por vez, após aprovação) | Procedural ou Blender → GLB (Draco/Meshopt) |
| Logo do salão | Pendente (arquivo) | Cliente |
