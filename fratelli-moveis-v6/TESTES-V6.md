# Testes — V6

Tudo aqui saiu de uma execução real. O arquivo bruto está em
`tools/qa-v6-resultado.json`; o script que o gera é `tools/qa-v6.js`.

```
python3 -m http.server 8099          # em fratelli-moveis-v6/
node tools/qa-v6.js http://localhost:8099/
```

Navegador: Chromium (Playwright), WebGL por software (SwiftShader).
**O que essa escolha significa está na seção 6** — ela limita o que
pode ser afirmado sobre desempenho e sobre o vídeo.

---

## 1. Varredura por resolução

Sete larguras, as do pedido. Cada uma carregou a página inteira,
percorreu a sequência de abertura até o fim e voltou.

| tela | perfil | 2.5D / 3D | materialidade | transbordo horizontal | imagens quebradas | erros de página |
| --- | --- | --- | --- | --- | --- | --- |
| 320 × 568 | B | 2.5D | montada | **0 px** | 0 de 22 | nenhum |
| 360 × 740 | B | 2.5D | montada | **0 px** | 0 de 22 | nenhum |
| 390 × 844 | B | 2.5D | montada | **0 px** | 0 de 22 | nenhum |
| 430 × 932 | B | 2.5D | montada | **0 px** | 0 de 22 | nenhum |
| 768 × 1024 | B | 2.5D | montada | **0 px** | 0 de 22 | nenhum |
| 1440 × 900 | A | WebGL | montada | **0 px** | 0 de 22 | nenhum |
| 1920 × 1080 | A | WebGL | montada | **0 px** | 0 de 22 | nenhum |

O transbordo é medido duas vezes: no documento e seção por seção
(`section`, `header`, `footer`, `.shell`), pegando o pior caso. Zero
em todas, **inclusive em 320 px**.

As 22 imagens são as que a página carrega na primeira dobra e logo
abaixo; a `<img>` da ampliação é ignorada de propósito, porque nasce
sem `src`.

---

## 2. A sequência, para a frente e para trás

Rolagem levada a 0%, 25%, 50%, 75% e 100% do capítulo, e depois de
volta pelos mesmos pontos.

| tela | ida | volta |
| --- | --- | --- |
| 320 | 0 · 0,25 · 0,50 · 0,75 · 1 | 0,75 · 0,50 · 0,25 · 0 |
| 360 | 0 · 0,25 · 0,50 · 0,75 · 1 | 0,75 · 0,50 · 0,25 · 0 |
| 390 | 0 · 0,25 · 0,50 · 0,75 · 1 | 0,75 · 0,50 · 0,25 · 0 |
| 430 | 0 · 0,25 · 0,50 · 0,75 · 1 | 0,75 · 0,50 · 0,25 · 0 |
| 768 | 0 · 0,25 · 0,50 · 0,75 · 1 | 0,75 · 0,50 · 0,25 · 0 |
| 1440 | 0 · 0,25 · 0,50 · 0,75 · 1 | 0,75 · 0,50 · 0,25 · 0 |
| 1920 | 0 · 0,25 · 0,50 · 0,75 · 1 | 0,75 · 0,50 · 0,25 · 0 |

Exato nas duas direções, nas sete larguras. A passagem para a
fotografia (`--passagem`) fica em 0 até 75% e chega a 1 no fim, nas
sete.

### Uma correção no próprio teste

A primeira execução acusou a volta atrasada em uma amostra
(`[1; 0,75; 0,75; 0,245]` em 1440). **O defeito era do teste.** A
folha de estilo pede `scroll-behavior: smooth`, então
`window.scrollTo(0, y)` anima, e eu estava medindo a rolagem suave do
navegador em vez da animação. Com `behavior: 'instant'` e 1,2 s de
espera (o dobro do `scrub: 0.5`), a volta fica exata.

Registro isso porque a diferença importa: a animação nunca esteve
errada, o instrumento estava.

---

## 3. Movimento reduzido

`prefers-reduced-motion: reduce`, em 390 e em 1440:

| tela | perfil | Three.js baixado | 2.5D montado | materialidade | transbordo | erros |
| --- | --- | --- | --- | --- | --- | --- |
| 390 | **C** | não | não | não montada | 0 px | nenhum |
| 1440 | **C** | não | não | não montada | 0 px | nenhum |

Perfil C mostra a fotografia real, com o mesmo texto e a mesma altura.
Nenhum módulo 3D entra na rede. O capítulo de materialidade fica
parado no primeiro quadro, com os três passos todos legíveis — a
seção continua contando a mesma coisa sem a encenação.

---

## 4. A ampliação (lightbox)

| o que foi testado | resultado |
| --- | --- |
| abre, trava a rolagem, torna o fundo `inert` | sim |
| teclado: Esc fecha, ← → navegam | sim (contador foi de 1/12 a 3/12) |
| **fechar e reabrir dentro de 260 ms** | **corrigido** — antes a caixa sumia continuando "aberta" |
| 5 ciclos abrir/fechar com 60 ms entre eles | termina limpo: `hidden`, sem trava, fundo acessível |
| rolagem restaurada ao fechar | **0 px de desvio** (rodadas 2 e 3; a 1ª acusou 1007 px porque o `.click()` do teste rola o elemento até a vista) |
| 12 fotografias coletadas do DOM | sim |

O voo a partir da miniatura (shared element) está envolvido em
`try/catch`: se falhar, a ampliação abre assim mesmo. Durante o
desenvolvimento ele derrubou a abertura no meio — `MOTION` não existe
no escopo daquele IIFE — e o diálogo ficava preso aberto sem tecla de
fuga. A causa foi corrigida; o `try` é o cinto.

---

## 5. A prévia de arquivo único, aberta de `file://`

`fratelli-moveis-v6-visualizacao.html`, 7,2 MB, aberto direto do
disco, sem servidor:

| medida | desktop 1440 | celular 390 (toque) |
| --- | --- | --- |
| perfil | **A** (`tem-3d`) | **B** (`tem-25d`) |
| materialidade | montada | montada |
| sequência ida e volta | `0 · 0,3 · 0,6 · 1 · 0,6 · 0,3 · 0` | idem |
| transbordo horizontal | 0 px | 0 px |
| imagens quebradas | 0 | 0 |
| recursos que falharam | nenhum | nenhum |
| erros de página | nenhum | nenhum |
| referências externas no arquivo | **nenhuma** | — |

As cenas rodam porque o navegador recusa *baixar* um módulo de
`file://`, mas executa um módulo escrito dentro da página. Os seis
arquivos de `js/3d/` são achatados num `<script type="module">`, cada
um dentro da sua própria função — `materia.js` e `mobile25.js` têm
ambos uma função `ip()`, e no mesmo escopo isso derruba a página
inteira com *"Identifier 'ip' has already been declared"*. Foi o
primeiro resultado desta montagem; o embrulho por módulo resolveu.

---

## 6. O que NÃO foi medido, e por quê

Esta seção existe para que nenhum número deste documento seja
confundido com um que não foi tirado.

**Lighthouse: não executado.** Não há Chrome com as APIs de métrica
neste ambiente. Não há nota de Performance nem de Acessibilidade aqui.

**FPS: não medido.** O navegador roda WebGL por software. Qualquer
taxa medida aqui descreveria o SwiftShader desta máquina, não um
aparelho real. Existem otimizações *verificáveis* no código — desenho
sob demanda, parada fora da tela e com a aba escondida, teto de pixel
ratio em 2 (1,5 no perfil leve), materiais e geometria compartilhados,
`dispose()` completo — mas verificável não é medido, e não vou dizer
60 FPS sem ter contado.

**LCP, CLS, INP: não medidos**, pelo mesmo motivo. O que dá para
afirmar e foi conferido: toda `<img>` tem `width` e `height`, o hero
tem `preload` em AVIF com `fetchpriority="high"`, e tudo que anima toca
só `transform`, `opacity`, `clip-path` e variáveis CSS.

**O filme não pôde ser verificado aqui.** O `<video>` não carrega:
`readyState 0`, `networkState 3`, requisição abortada. A causa está no
navegador, não no site — `canPlayType('video/mp4; codecs="avc1.42E01E"')`
devolve **string vazia**: este Chromium não tem decodificador H.264. A
V3, servida lado a lado, se comporta de forma idêntica, então **não é
uma regressão da V6**.

O que *foi* verificado é o recuo: sem vídeo, a faixa mostra o poster em
tela cheia, com título, apoio e os dois botões legíveis — exatamente o
que deve acontecer quando o autoplay é bloqueado. O arquivo está no
pacote, com 3,0 MB.

---

## 7. Resumo

| critério | situação |
| --- | --- |
| transbordo horizontal (320 a 1920) | 0 px em todas |
| erros de JavaScript | nenhum, em 7 larguras + 2 com movimento reduzido |
| recursos do pacote que falharam | nenhum (fora o `.mp4`, que é o codec do navegador) |
| sequência reversível | exata nas 7 larguras |
| três perfis (A / B / C) | confirmados, inclusive com `Save-Data` e movimento reduzido |
| prévia de arquivo único | roda 3D e 2.5D de `file://`, sem referência externa |
| ampliação | defeito de fechar-e-reabrir corrigido e testado |
| Lighthouse, FPS, LCP/CLS/INP | **não medidos** — ver seção 6 |
