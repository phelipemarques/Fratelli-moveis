# Testes — Cinematic Final

Tudo aqui foi **executado** nesta versão, contra
`fratelli-moveis-cinematic-final/`. Onde um número aparece, ele saiu de
uma medição; onde a medição não foi possível, está dito que não foi.

Os instrumentos estão em `tools/`. Todos exigem `S=` (a pasta de
saída das capturas) e aceitam `URL=`.

```
S=/tmp/qa URL=http://localhost:8090/ node tools/teste-funcional.js
S=/tmp/qa URL=http://localhost:8090/ node tools/teste-cena.js
S=/tmp/qa PARES=/tmp/qa/pares URL=http://localhost:8090/ node tools/teste-contraste.js
URL=http://localhost:8090/ node tools/teste-peso.js
node tools/teste-previa.js
```

---

## 1. Suíte funcional — 32 testes, 0 falhas

`tools/teste-funcional.js`. Menu, ampliação de imagem, faixa de
ambientes, filme, movimento reduzido, **WebGL indisponível**, sem
JavaScript, rolagem rápida e redimensionamento.

```
  OK  menu: abre / trava a rolagem / fecha com Escape / devolve a rolagem
  OK  ampliacao: abre / mostra a classificacao da imagem / fecha / reabre
  OK  galeria: tem cartoes e area rolavel   {"cartoes":6,"rolaNativo":true,"pinada":false}
  OK  galeria: no celular NAO usa pin   pin=false
  OK  galeria: nao prende a rolagem vertical   8609 -> 9309
  OK  video: elemento e fonte presentes
  OK  movimento reduzido: cai no perfil C   perfil=C
  OK  movimento reduzido: nenhuma cena 3D montada
  OK  movimento reduzido: texto inteiro visivel e sem recuo
  OK  sem WebGL: cai no perfil C   perfil=C
  OK  sem WebGL: nenhuma cena WebGL montada
  OK  sem WebGL: monta a sequencia pre-renderizada   temSeq=true quadros=16
  OK  sem WebGL: o gatilho de rolagem existe   900..2880
  OK  sem WebGL: a rolagem avanca os quadros   quadros=0 -> 8 -> 15
  OK  sem WebGL: os quadros carregam com a secao na tela   16/16
  OK  sem WebGL: o palco nao fica vazio   1440x900 centro=shell
  OK  sem JS: a seção, a fotografia e o texto estão no HTML
  OK  rolagem rapida: a pagina nao prende
  OK  rolagem rapida: nenhum bloco visivel fica invisivel   invisiveis=0
  OK  redimensionamento: sem transbordo depois de ir e voltar   transbordo=0
  OK  redimensionamento: as folhas voltam a fechar   rot=0,0

32 testes, 0 falhas
```

### O cenário novo, e as três correções de instrumento

O §17 pede o caso "**WebGL indisponível**". Ele não era exercido por
teste nenhum — era o cenário que esta fase mudou (de fotografia
parada para sequência pré-renderizada) e justamente o que ninguém
media.

WebGL sai pelo único caminho que `boot.js` consulta: `getContext`
devolvendo `null` para `webgl` e `webgl2`. Não é flag de navegador
nem *user-agent*: é o mesmo contexto que a página tenta criar.

A primeira execução acusou 4 falhas. **Nenhuma era da página.**

| o que o teste acusou | o que era |
| --- | --- |
| `quadros=1`, `0/1 carregados`, nenhum quadro ativo | `.abertura__seq` é a **caixa**; os quadros são `.abertura__seq img` |
| `centro=null` (palco vazio) | `elementFromPoint` com a seção **fora da tela** devolve `null` |
| `quadros=0 -> 0 -> 0` | a seção está **pinada**: a altura da caixa não é o curso de rolagem, que é o do ScrollTrigger (`900..2880`) |

Os três estão comentados dentro do próprio teste. O quarto ponto — os
quadros 1 a 15 são `loading="lazy"` **de propósito** — fez a contagem
de carregados passar a ser feita com a seção na tela, que é quando o
código pede que eles existam.

---

## 2. Estados da cena — `tools/teste-cena.js`

Cinco paradas na ida, duas na volta, em duas telas. Mede a rotação
real das duas folhas, se o texto recuou e se houve transbordo
horizontal.

```
1440x900  pin=true  erros=nenhum
     0%  rotEsq=       0 rotDir=      0  recuado=false  transbordo=0
    25%  rotEsq= -0.1012 rotDir= 0.1012  recuado=false  transbordo=0
    50%  rotEsq= -1.7066 rotDir= 1.7066  recuado=true   transbordo=0
    75%  rotEsq=   -1.86 rotDir=   1.86  recuado=true   transbordo=0
   100%  rotEsq=   -1.86 rotDir=   1.86  recuado=true   transbordo=0
   volta: 50% rot=-1.7066/1.7066 · 0% rot=0/0 (ida 0% foi 0/0)

390x844  pin=true  erros=nenhum
     0%  rotEsq=       0 rotDir=      0  recuado=true   transbordo=0
    ... (mesmos valores)
   volta: 50% rot=-1.7066/1.7066 · 0% rot=0/0 (ida 0% foi 0/0)
```

**As portas abrem para FORA**, que era o pedido explícito: o sinal da
esquerda é negativo e o da direita positivo, e ±1,86 rad = 106,6° é
abertura na direção de quem vê. A volta fecha exatamente em 0/0 —
sem resíduo de rotação ao rolar de volta.

---

## 3. Contraste real — 8 larguras, nenhuma reprovação

`tools/teste-contraste.js`. Fotografa a tela **duas vezes** em cada
uma de 9 paradas de rolagem, a segunda com os blocos de texto
transparentes, e lê o fundo verdadeiro atrás de cada bloco. O
contraste sai daí, pela fórmula da WCAG.

```
tela        transb  piorC  bloco mais fraco
320x568         0   5.41  btn
360x800         0   5.41  btn
375x667         0   5.41  btn
390x844         0   5.41  btn
414x896         0   5.41  btn
768x1024        0   5.41  btn
1280x800        0   5.41  btn
1440x900        0   5.41  btn

nenhum bloco abaixo do minimo da WCAG AA
```

Medido **antes e depois** da parede entrar na cena: 5,41:1 nos dois
casos. A parede não custou legibilidade, que era o risco de mexer no
fundo (o véu da coluna de texto foi calibrado contra fundo escuro).

Zero transbordo horizontal em todas as larguras.

---

## 4. Peso transferido — `tools/teste-peso.js`

O que o navegador **baixa** até `load` + 5 s, por perfil. Não é soma
de arquivos na pasta: é resposta de rede contada por `content-length`.

| | perfil | total |
| --- | --- | --- |
| desktop 1440×900 | A | **1524 KB** |
| celular 390×844 | B | **1395 KB** |
| celular 390×844 sem WebGL | C | **791 KB** |

```
perfil A                  perfil B                  perfil C
three.js       671 KB     three.js       671 KB     js             212 KB
js             281 KB     js             281 KB     fontes         200 KB
imagens        232 KB     fontes         200 KB     sequencia      136 KB
fontes         200 KB     imagens        103 KB     imagens        103 KB
css             83 KB     css             83 KB     css             83 KB
html            57 KB     html            57 KB     html            57 KB
```

O perfil C **não baixa o Three.js**: os 671 KB ficam fora de quem não
vai usá-los, e os 16 quadros custam 136 KB no lugar deles. É o que os
`import()` dinâmicos do `boot.js` sustentam, e é por isso que o
pacote de publicação continua com os arquivos separados.

---

## 5. A prévia de arquivo único — testada, não declarada

`tools/teste-previa.js`. **11 testes, 0 falhas.** Abre
`fratelli-moveis-cinematic-final-visualizacao.html` de `file://`, como
uma pessoa abriria: dois cliques, sem servidor.

```
  OK  o arquivo existe   7.6 MB
  OK  previa: monta a cena de file://   perfil=A classe=abertura tem-3d
  OK  previa: nenhuma referencia a arquivo externo
  OK  previa: as imagens estao embutidas   img data: 22
  OK  previa: sem erro de pagina
  OK  previa: sem erro de console alem da sonda do mapa   sonda: 1 linha(s)
  OK  previa: sem rede, o mapa cede o lugar ao endereco   {"iframes":0,"reserva":true}
  OK  previa sem WebGL: cai no perfil C e monta a sequencia   perfil=C quadros=16
  OK  previa sem WebGL: os quadros vieram embutidos (sem fetch)   16/16 em data:
  OK  previa sem WebGL: a rolagem avanca os quadros   0 -> 8 -> 15
  OK  previa sem WebGL: sem erro de pagina
```

Os dois caminhos que dependem de `file://` são diferentes e por isso
são testados separados:

- **com WebGL** — módulos ES não podem ser *baixados* dessa origem,
  então os arquivos de `js/3d/` são achatados num único
  `<script type="module">` escrito na página;
- **sem WebGL** — `fetch` também é recusado, e o índice da sequência
  ia junto. Agora ele vai embutido em `window.__fratelliSeq`, com os
  16 quadros em *data URI*. O `boot.js` prefere esse índice quando
  ele existe; no pacote de publicação ele não existe e o caminho
  continua sendo o arquivo servido pelo site.

**A única requisição externa é a sonda do mapa**, e ela é o mapa
funcionando: `main.js` nunca injeta o iframe do Google Maps direto —
pede antes um favicon de `maps.gstatic.com` e só monta o mapa se a
resposta vier. Sem rede, a sonda falha e o bloco de endereço fica no
lugar do retângulo de erro do navegador. Verificado: `iframes: 0`,
bloco de endereço visível.

---

## 6. O pacote de publicação, descompactado e servido

`fratelli-moveis-cinematic-final-producao.zip` — 242 arquivos, 11,1 MB.

Descompactado numa pasta limpa, servido em `:8091`, e as duas suítes
rodadas contra ele:

- `teste-funcional`: **32 testes, 0 falhas**
- `teste-cena`: sem erro, sem transbordo, portas em ±1,86 rad,
  volta a fechar em 0/0

O ZIP não é o que foi testado por tabela: é o que foi testado.

---

## 7. O que NÃO foi medido, e por quê

- **FPS, Lighthouse, LCP, CLS, INP.** Este ambiente roda WebGL por
  **software** (SwiftShader). Qualquer número de quadros por segundo
  daqui descreveria o renderizador de software, não um aparelho.
  Continua sendo o primeiro item antes de publicar.
- **GPU real.** Mesma razão. As comparações entre versões valem —
  elas rodaram no mesmo renderizador — mas não dizem o que um celular
  mostra.
- **O filme.** Este Chromium não tem decodificador H.264
  (`canPlayType` devolve string vazia). O recuo foi verificado: poster
  em tela cheia, texto e botões legíveis.

Nada disso foi estimado, arredondado ou escrito como se tivesse sido
medido.
