# Relatório mobile — Salão Iolanda V5

Atualização **só do celular** sobre a V4 (que continua intacta em
`salao-iolanda-v4/`). Desktop preservado: mesma altura, mesmas seções e o mesmo
enquadramento 3D em 1440×900 (tabelas abaixo). Não publicado.

## 1. Como foi medido

- **Build de produção servido por HTTP** (`vite preview`), V4 e V5 lado a lado.
- **Chromium do Playwright com emulação de celular** (toque, viewport, user agent
  do Pixel 7, densidade 2). WebGL por **SwiftShader (CPU)**: prova enquadramento,
  rolagem e estados; **não** mede fluidez em GPU real.
- **Não houve aparelho físico** (iOS Safari, Android Chrome, Samsung Internet).
  Essas verificações estão listadas em `PENDENCIAS.md`.
- Ferramentas no próprio projeto, para repetir as medições:
  - `scripts/audit.mjs` — alturas, posição de CTAs, sobreposições, conteúdo
    escondido no fim, rolagem lateral (comparando com a largura configurada),
    alvos de toque, bytes, erros, capturas por seção;
  - `scripts/framing.mjs` + `Stage.bounds()` — retângulo de cada objeto 3D na
    tela por fase: quanto fica fora da tela e quanto fica sob o texto;
  - `scripts/axe.mjs` — axe-core (WCAG 2.2 AA + boas práticas);
  - Lighthouse 12.8 (3 execuções, mediana).
- A linha de base do enquadramento 3D da V4 foi medida na cópia da V5 antes de
  qualquer mudança (mesmo código da V4 + o gancho de medição).

## 2. Auditoria da V4 no celular (fase 1)

Achados medidos, não supostos:

- Serviços com **3.151 px** em 390×844 (uma foto em largura total por categoria).
- Barra inferior já na primeira tela, repetindo o botão do hero; no contato e no
  rodapé, três botões de agendamento seguidos; no fim da página a barra cobria
  "Como chegar" (390, 393) e links do rodapé (360, 320, celular deitado).
- Alvos de toque menores que 44 px: link do Instagram (27 px de altura) e botão
  do cabeçalho (42 px).
- Abertura 3D no celular: a flor aberta ficava **24–34 %** fora da tela; o botão
  da flor ficava até **32 %** sob o texto do hero; tampa e pincel ficavam **15 %**
  fora da tela em 320×568 e 375×667.
- Hero com dois botões empilhados e o "Pular apresentação" pequeno, colado na barra.
- Celular deitado: rótulo "Salão Iolanda" do hero sobre o nome do cabeçalho.
- Sem erros de console e sem rolagem lateral na V4.

## 3. Comparação V4 × V5 (medida)

### Altura da página e da seção de serviços (px)

| Tamanho | Página V4 | Página V5 | Diferença | Serviços V4 | Serviços V5 | Diferença | Portfólio começa em (V4 → V5) |
|---|---|---|---|---|---|---|---|
| 320x568 | 13.473 | 10.808 | -2.665 (-19.8%) | 2.982 | 1.724 | -1.258 (-42.2%) | 9.444 → 7.150 |
| 360x800 | 15.195 | 12.280 | -2.915 (-19.2%) | 3.038 | 1.676 | -1.362 (-44.8%) | 11.219 → 8.548 |
| 375x667 | 14.309 | 11.483 | -2.826 (-19.7%) | 3.095 | 1.668 | -1.427 (-46.1%) | 10.295 → 7.690 |
| 390x844 | 15.715 | 12.646 | -3.069 (-19.5%) | 3.151 | 1.686 | -1.465 (-46.5%) | 11.664 → 8.793 |
| 393x852 | 15.730 | 12.718 | -3.012 (-19.1%) | 3.162 | 1.689 | -1.473 (-46.6%) | 11.672 → 8.853 |
| 414x896 | 16.098 | 13.054 | -3.044 (-18.9%) | 3.215 | 1.692 | -1.523 (-47.4%) | 12.069 → 9.151 |
| 430x932 | 16.422 | 13.346 | -3.076 (-18.7%) | 3.250 | 1.685 | -1.565 (-48.2%) | 12.402 → 9.404 |
| 768x1024 | 20.908 | 18.222 | -2.686 (-12.8%) | 4.371 | 1.666 | -2.705 (-61.9%) | 16.357 → 13.670 |
| 844x390 | 16.225 | 13.262 | -2.963 (-18.3%) | 4.672 | 1.690 | -2.982 (-63.8%) | 11.426 → 8.463 |
| 667x375 | 13.936 | 10.645 | -3.291 (-23.6%) | 4.017 | 1.765 | -2.252 (-56.1%) | 9.608 → 5.911 |
| 1440x900 | 15.444 | 15.444 | +0 (+0.0%) | 2.059 | 2.059 | +0 (+0.0%) | 11.926 → 11.926 |

### Qualidade de layout (contagens)

| Tamanho | Sobreposições reais V4 → V5 | Escondidos no fim da página V4 → V5 | Rolagem lateral V4 → V5 (px) | Alvos < 44 px V4 → V5 | Erros de console V4 → V5 |
|---|---|---|---|---|---|
| 320x568 | 0 → 0 | 1 → 0 | 0 → 0 | 3 → 0 | 0 → 0 |
| 360x800 | 0 → 0 | 2 → 0 | 0 → 0 | 1 → 0 | 0 → 0 |
| 375x667 | 0 → 0 | 0 → 0 | 0 → 0 | 3 → 0 | 0 → 0 |
| 390x844 | 0 → 0 | 1 → 0 | 0 → 0 | 1 → 0 | 0 → 0 |
| 393x852 | 0 → 0 | 1 → 0 | 0 → 0 | 1 → 0 | 0 → 0 |
| 414x896 | 0 → 0 | 0 → 0 | 0 → 0 | 1 → 0 | 0 → 0 |
| 430x932 | 0 → 0 | 0 → 0 | 0 → 0 | 1 → 0 | 0 → 0 |
| 768x1024 | 1 → 0 | 0 → 0 | 0 → 0 | 2 → 0 | 0 → 0 |
| 844x390 | 0 → 0 | 1 → 0 | 0 → 0 | 2 → 0 | 0 → 0 |
| 667x375 | 0 → 0 | 2 → 0 | 0 → 0 | 3 → 0 | 0 → 0 |
| 1440x900 | 1 → 0 | 0 → 0 | 0 → 0 | 3 → 1 | 0 → 0 |

### Enquadramento 3D: objeto principal fora da tela / sob o texto (% da área)

| Tamanho | botao | flor-parcial | flor-aberta | esmalte-surgindo | esmalte-girando | tampa-abrindo | pincel-saindo | pincel-revelado | escova-entrando | marca |
|---|---|---|---|---|---|---|---|---|---|---|
| 320x568 | 0/32 → **0/0** | 0/33 → **0/0** | 24/7 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 1/0 → **1/0** | 15/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** |
| 360x800 | 0/14 → **0/0** | 12/18 → **1/0** | 34/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/19 → **0/0** | 0/0 → **0/0** |
| 375x667 | 0/1 → **0/0** | 0/11 → **0/0** | 24/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 15/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** |
| 390x844 | 0/20 → **0/0** | 10/22 → **1/0** | 33/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/5 → **0/0** | 0/0 → **0/0** |
| 393x852 | 0/19 → **0/0** | 10/21 → **1/0** | 33/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/2 → **0/0** | 0/0 → **0/0** |
| 414x896 | 0/11 → **0/0** | 11/16 → **0/0** | 33/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** |
| 430x932 | 0/5 → **0/0** | 11/13 → **1/0** | 33/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** |
| 768x1024 | 11/25 → **17/19** | 20/27 → **22/22** | 28/11 → **22/10** | 0/0 → **0/0** | 0/5 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/1 → **0/0** | 13/10 → **7/14** | 8/0 → **1/6** |
| 844x390 | 0/7 → **0/6** | 0/16 → **0/13** | 29/12 → **29/12** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 12/0 → **12/0** | 0/4 → **0/4** | 0/0 → **0/0** |
| 1440x900 | 1/14 → **1/14** | 13/17 → **13/17** | 37/9 → **37/9** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 0/0 → **0/0** | 12/0 → **12/0** | 0/2 → **0/2** | 0/0 → **0/0** |

### Transferência e Lighthouse (mobile, mediana de 3)

| Indicador | V4 | V5 | Diferença |
|---|---|---|---|
| JavaScript transferido (KB, 390×844) | 687 | 690 | +3 (+0.4%) |
| Dados transferidos até o fim da página (KB, 390×844) | 870 | 880 | +10 (+1.1%) |
| Lighthouse mobile: Desempenho | 98 | 98 | +0 |
| Lighthouse mobile: Acessibilidade | 100 | 100 | +0 |
| Lighthouse mobile: Boas práticas | 100 | 100 | +0 |
| Lighthouse mobile: SEO (prévia com noindex) | 66 | 66 | +0 |
| Lighthouse mobile: LCP (s) | 1.96 | 1.95 | -0.01 |
| Lighthouse mobile: FCP (s) | 1.70 | 1.71 | 0.01 |
| Lighthouse mobile: CLS | 0.0007 | 0.0007 | 0.0000 |
| Lighthouse mobile: TBT (ms) | 66 | 69 | 4 |
| Lighthouse mobile: Peso inicial (KB) | 176 | 178 | 2 |


Capturas lado a lado, nas mesmas seções e tamanhos: `docs/capturas/comparacao-v4-v5/`
(320×568, 375×667, 390×844, 430×932, 768×1024 e 1440×900 para regressão).
Capturas da V5: `docs/capturas/v5-mobile/` (inclui as fases 3D em 320, 390 e 430).

## 4. O que mudou no celular (registro das correções)

| Problema | Alteração | Teste | Resultado |
|---|---|---|---|
| Flor aberta cortada, botão sob o texto, pincel saindo da tela | Câmera própria do retrato: `mDist` (afastamento) e `mLift` (subida) animados na timeline por fase; tablet em pé com versão suavizada | `framing.mjs`; Playwright "cada fase mostra o objeto principal inteiro" | Celular: no máximo 1 % fora da tela e 0 % sob o texto em todas as fases |
| Resposta ao dedo | `scrub` 0,45 com ponteiro de toque (0,8 no mouse) | Playwright rolagem, reverso, pular | Aprovado |
| Aparelho fraco | Degradação progressiva: se a média de quadros passar de ~40 ms desenhando sem parar, a densidade de pixels cai em degraus (até 0,75) e as sombras desligam | Jornada 4 (CPU 6× mais lenta) | Título em 1,8 s; a página não depende da cena |
| Engasgo na primeira aparição de objetos | Pré-compilação dos shaders (da V4, mantida) | — | — |
| Sequência longa no celular | Abertura de 720 vh para 620 vh no celular; "Pular apresentação" em pílula de 44 px | Jornada 5 | 1 toque, sem travar |
| Hero carregado | Um botão principal ("Agendar meu horário"); o caminho para os serviços é o "Pular apresentação"; endereço discreto | Capturas 320–430 | Primeira dobra limpa |
| Botões repetidos | Barra inferior só depois da primeira tela e escondida onde a página já mostra os mesmos botões (agendamento, contato, rodapé); no capítulo da marca o celular mostra só "Conhecer os serviços" | Playwright barra contextual | Aprovado |
| Barra cobrindo conteúdo | Barra mais baixa, WhatsApp protagonista e "Rota" compacto; rodapé com espaço próprio | Auditoria "escondidos no fim" | 0 em todos os tamanhos |
| Cabeçalho ocupando a tela | No celular (e em telas baixas) recolhe ao descer e volta ao subir, só com transform | Playwright (posição dos elementos não muda) | Sem CLS |
| Menu | Trava a rolagem do fundo; Esc, foco e fechamento ao escolher o link mantidos | Playwright | Aprovado |
| Serviços longos | Cabelo em destaque com foto; demais em linhas compactas com miniatura e selo "foto pendente"; tablet com foto ao lado | Auditoria | −42 % a −48 % no celular, −62 % no tablet |
| O salão | Foto horizontal no topo, dados em duas colunas | Capturas | Mais curta |
| Cabelos | Foto contida a 68 svh, destaques em pílulas | Capturas | Mais curta, mesma hierarquia |
| Portfólio | Filtros em uma linha deslizante; primeiro trabalho em destaque; lightbox volta à posição exata e amplia fotos reais com toque duplo | Playwright (posição, toque, teclado) | Aprovado |
| Agendamento e contato | Passos compactos, atalhos por serviço deslizantes, botões em largura total | Capturas | Mais curtos |
| Página mais larga que a tela | Fileiras com rolagem própria prendem o texto de leitor de tela; colunas `minmax(0, 1fr)`; atalho "pular" limitado à tela | Auditoria com a largura configurada | 0 px em todos os tamanhos |
| Revelação de cor cortava o texto | Recuo lateral do painel menor que a margem do celular | Capturas | Corrigido |
| Botão do cabeçalho com 42 px | 44 px | Auditoria | Corrigido |
| Celular deitado | Sem rótulo duplicado, botões em uma linha, texto na largura do desktop | `framing.mjs` | Igual ou melhor que a V4 |
| Fotos reais pesadas | `npm run images` gera 480/960/1440 px em WebP; HTML com `srcset`/`sizes` e `loading=lazy` (o 3D do hero não usa imagem) | Teste com imagem sintética | Proporção preservada, sem ampliar |

## 5. Jornadas (automação no celular emulado; não são testes com pessoas)

| Jornada | Caminho | Ações | Tempo da automação |
|---|---|---|---|
| 1. Agendar manicure | menu → Serviços → "Agendar unhas" (mensagem de unhas) | 3 | 2,7 s |
| 2. Ver trabalhos de cabelo | menu → Portfólio → filtro Cabelos (4 quadros) | 3 | 4,2 s |
| 3. Descobrir o endereço | menu → Contato (endereço e "Como chegar") | 2 | 1,5 s |
| 4. Celular mais lento (CPU 6×, rede 1,6 Mb/s) | título e botão de agendamento visíveis | — | 1,8 s; cena 3D pronta em 5,2 s |
| 5. Pular a apresentação na fase da tampa | "Pular apresentação" | 1 | 7,6 s (inclui o scrub levar a cena ao fim no WebGL por CPU) |

Em qualquer ponto depois da primeira tela, o WhatsApp está a 1 toque pela barra inferior.

## 6. Testes funcionais (Playwright, build de produção)

**53 aprovados, 0 falhas** (27 pulados por serem de um projeto só: teclado e
roda do mouse no desktop; menu, toque, barra, jornadas e câmera do celular no mobile).
Inclui os 13 tamanhos (320×568 a 1920×1080, com celular deitado 844×390 e
667×375), movimento reduzido, sem WebGL e sem JavaScript.

Na primeira rodada completa houve 8 falhas, todas do teste: o teste de larguras
contava como "cortados" os chips da nova fileira deslizante, e a jornada 2
esperava 3 quadros de cabelo quando os dados têm 4. Corrigidos os testes, a
rodada final passou inteira.

## 7. Acessibilidade (axe-core, build de produção)

| Cenário | 390×844 | 1440×900 |
|---|---|---|
| Com 3D | 0 violações (46 regras aprovadas) | 0 violações (45) |
| Sem WebGL + movimento reduzido | 0 violações (47) | 0 violações (46) |

Alvos de toque: nenhum controle abaixo de 44 px no celular (auditoria). No
desktop, o link "Início" do menu tem 36 px de largura (acima dos 24 px do
critério AA 2.5.8).

## 8. Desempenho

- Lighthouse mobile igual à V4 (98 / 100 / 100). LCP 1,95 s, CLS 0,0007.
- JavaScript da V5 = V4 + ~3 KB (barra contextual, câmera do celular, degradação).
  Valores da tabela são sem compressão; o Three.js segue carregado depois do texto.
- Nenhuma animação principal foi removida.
- INP real só existe com visitantes; não medido.

## 9. Critérios de aceitação

| Critério | Situação |
|---|---|
| Animação 3D funciona no celular; flor enquadrada; esmalte não sai da tela; tampa abre; pincel visível | Sim (medição por fase e Playwright) |
| Scroll reverso | Sim (desktop e mobile) |
| Hero equilibrado; header não cobre conteúdo; menu funciona | Sim |
| Barra inferior não esconde elementos | Sim (0 escondidos no fim; some onde há botões iguais) |
| Serviços mais compactos | Sim (−42 % a −48 % no celular) |
| Cabelos refinado; portfólio adequado ao toque; lightbox no mobile | Sim |
| WhatsApp, endereço e rota corretos | Sim (testes de links) |
| Sem rolagem lateral, textos cortados ou sobreposições | Sim nos 11 tamanhos auditados |
| Sem erros críticos de JavaScript | Sim (0 erros) |
| Funciona em 320 px | Sim |
| Desktop sem regressão | Sim (mesmos números em 1440×900) |
| Movimento reduzido e fallback | Sim |
| Testes executados | Sim, com a ressalva do WebGL por CPU e da falta de aparelhos reais |

**Pontos ainda abertos:** tablet em pé (768×1024) segue a composição do desktop
e tem a flor parcialmente fora da tela na abertura (17–22 %), parecido com a V4;
fluidez em aparelho real não medida; fotos reais ainda não recebidas.
