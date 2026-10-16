# Parada do Mano — Relatório da V5 (animações cinematográficas)

16/10/2026 · evolução da V4. Mesma identidade (preto, laranja e creme), mesmos textos, fotos,
seções e funcionalidades. O que muda é o movimento. Todos os números foram medidos nesta data;
o que não foi medido está escrito como "Não medido".

## 1. Referência: o que o vídeo mostra

Gravação de 14,9 s (576×1024) de um site de produto (molho Tikka Masala) num notebook.
Quadro a quadro:

| Cena | Visto no vídeo | Aplicado no Parada do Mano |
|---|---|---|
| A | fundo laranja/vermelho inteiro, título enorme em amarelo, produto à frente | abertura: título enorme, foto protagonista revelada por cortina e recuo de zoom |
| B–C | o pote flutua, gira e inclina entre as seções (modelo 3D) | **não reproduzido em 3D**: não há modelo (seção 4). Profundidade com camadas: foto e texto em velocidades diferentes |
| B | palavras gigantes atrás do produto ("UNWRAP THE ADVENTURE") | faixa de palavras gigantes em letra vazada no churrasco, correndo com a rolagem |
| D–E | troca forte de cor entre seções, fotos de comida em grade | fotos que entram com cortina e mudam de enquadramento; mosaico do buffet em camadas |
| F | grade editorial e chamada final ("LET'S GET COOKING") | títulos que sobem de máscara; contato com a placa da BR entrando |

Separação entre o visível e a inferência: o vídeo mostra o resultado, não o código. "O pote é um
modelo 3D" e "as palavras correm com a rolagem" são inferências pelo movimento.

## 2. Auditoria: o que existia (V4) e o que mudou

| Área | V4 (CSS + IntersectionObserver) | V5 (GSAP + ScrollTrigger) |
|---|---|---|
| Abertura | foto com recuo de zoom; linhas do título sobem; cascata | cortina que abre da direita para a esquerda (computador), recuo de zoom de 1,28, título sobe com leve giro, "Sabor de verdade." letra a letra, placa da BR com mola; ao rolar, a foto desce e cresce devagar enquanto o texto sobe mais rápido (profundidade) |
| Títulos das seções | o bloco aparece com subida curta | cada linha sobe de dentro de uma máscara |
| Fotos | cortina que recolhe + imagem assenta (uma vez) | mantido, mais **enquadramento contínuo**: a imagem desliza dentro da moldura e o zoom diminui enquanto atravessa a tela; no buffet, cada foto numa velocidade (camadas) |
| Churrasco | foto larga parada, título com revelação comum | câmera avança sobre a brasa, luz de calor sobe com a rolagem e tremula enquanto a seção está na tela, brasas subindo, título entra pelos lados, faixa gigante "Churrasqueira · Espeto corrido · Fogão a lenha · Bons momentos" |
| Cardápio | aba escura troca na hora; painel com subida de 8 px | **indicador que desliza** até a aba escolhida; foto da categoria abre com cortina e o texto sobe em cascata, tudo em menos de 0,6 s |
| Feijoada | dias aparecem com o bloco | "Qua" e "Sáb" entram com um pulo curto |
| O restaurante | linha do dia se enche de uma vez | a linha do dia se enche **com a rolagem** (computador) |
| Contato | bloco aparece | placa da BR-277 entra girando de leve |

Mantido da V4 (já era bom e é leve): revelação na rolagem por IntersectionObserver, cortina das
fotos, brilho e brasas da abertura, faixa corrida, menu, galeria, vídeo da abertura.

## 3. Arquitetura

- **Sem empacotador.** São dois arquivos prontos do próprio GSAP (`gsap.min.js`,
  `ScrollTrigger.min.js`), copiados de `node_modules` por `tools/vendor.py` para
  `assets/js/vendor/`. Um bundler não reduziria nada aqui e acrescentaria uma etapa de build.
- **Duas camadas.** A base (CSS + `main.js`) já mostra tudo. A camada `cinema.js` só entra no
  "modo cine": um script no `<head>` marca `.cine` quando há movimento permitido, sem economia de
  dados e fora de 2G/3G, e pede o GSAP em **prioridade baixa** (a foto da abertura vem antes).
- **Ordem de carga.** `gsap.min.js` logo após o HTML → entrada da abertura.
  `ScrollTrigger.min.js` **depois do `load`**, num momento ocioso, e só depois que a entrada
  terminou (os dois nunca animam o mesmo elemento ao mesmo tempo).
- **Reserva.** Se o GSAP não assumir a abertura em 1 s, a mesma entrada em CSS (atrasada 1,1 s)
  mostra tudo sozinha. Testado com o GSAP bloqueado.
- **Sem prender a rolagem.** Nenhum `pin`. Só `scrub` (o movimento acompanha a rolagem nos dois
  sentidos) e revelações que tocam uma vez.
- **Só `transform` e `opacity`** nos efeitos de rolagem. O enquadramento das fotos usa as
  propriedades `translate` e `scale` (separadas de `transform`), então o zoom do mouse e a
  revelação continuam funcionando.
- **`gsap.matchMedia()`** separa computador e celular e desfaz tudo se a pessoa ligar
  "movimento reduzido" durante a visita.
- **Recálculo seguro.** As seções com `content-visibility` mudam de altura quando aparecem;
  as posições são recalculadas só com a página parada (recalcular no meio de uma rolagem a
  interrompia — defeito encontrado pelos testes e corrigido).

## 4. Three.js

Não há modelo 3D no projeto (procurado: `.glb`, `.gltf`, `.obj`, `.fbx`, `.usdz`). Por isso o
Three.js **não vai para o site**: está instalado para desenvolvimento, mas não é copiado para
`assets/` nem entra no ZIP. As fotos não foram "transformadas em 3D".

O modelo que faria sentido, os requisitos do arquivo e um exemplo de cena pronto (carga sob
demanda, só no computador, um único laço de desenho pelo `gsap.ticker`, pausa fora da tela,
limpeza de recursos) estão em `tools/3d/LEIA-ME.md` e `tools/3d/cena-3d.exemplo.js`.

{{RESULTADOS}}
