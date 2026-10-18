# Fratelli Móveis — V8

Acabamento e correção. A V7.1 continua inteira em
`fratelli-moveis-v7-1/`; nada nela foi alterado.

Este documento descreve o que foi encontrado, a **causa** de cada
coisa e o que mudou. Os números saem de `TESTES-V8.md` e do bruto em
`tools/teste-sobreposicao-resultado.json`.

---

## 1. A sobreposição do texto — o defeito que você apontou

### Reproduzido primeiro

A condição exata: **desktop largo SEM WebGL**. Com
`--disable-webgl`, um 1440 × 900 cai no perfil B (2.5D). Capturado:

- **0%** — a nota "O módulo acima é um desenho conceitual" atravessada
  pela madeira;
- **40%** — o móvel por cima de "Espessura de painel…".

### Duas causas distintas, não uma

**Causa 1 — a composição 2.5D não sabia o que é uma tela larga.**

O perfil B foi escrito para celular, onde o texto mora no rodapé e a
peça em cima. Mas o perfil B também atende desktop sem WebGL, onde o
texto mora à **esquerda**. A peça nascia centrada no palco — e o
centro de um palco de 1440 px é exatamente a coluna de texto.

Agora há duas composições, decididas pela largura real:

| | composição |
| --- | --- |
| ≥ 900 px | peça à **direita**, caminhando para o centro conforme o texto cede — o mesmo gesto que o `desvio` faz na cena WebGL. Não sobe: ali o texto divide a altura. |
| < 900 px | peça em cima, texto embaixo, e ela sobe para liberar o rodapé. |

**Causa 2 — o recuo era por número, não por geometria.**

`texto-recuado` disparava em `progress > 0.44`. Esse 0,44 foi escolhido
olhando o desktop com WebGL, onde a câmera mantém o móvel à direita
nos dois primeiros atos. No 2.5D a colisão começa em **0%**.

Agora cada cena responde **onde está na tela**
(`retanguloNaTela()`), e a decisão é por sobreposição medida, com
histerese: recua quando a folga cai abaixo de 24 px, volta só quando
passa de 72 px. Na cena WebGL isso significa projetar os oito cantos
do `Box3` pela mesma câmera que desenha o quadro — o móvel não é um
elemento do DOM e não tem retângulo próprio.

**Causa 3, encontrada no caminho — não havia primeiro quadro.**

O 2.5D só era desenhado no primeiro `onUpdate` do ScrollTrigger. Até
lá ele ficava no estado padrão do CSS: centrado e sem escala, ou seja,
em cima do texto. Era esse estado que aparecia no quadro de 0%.
Corrigido com um `progresso(0)` na montagem.

### Os cinco estados pedidos

| estado | resultado |
| --- | --- |
| A — apresentação | texto legível, móvel à direita, folga de 103 a 299 px |
| B — abertura inicial | texto ainda legível |
| C — transição | o texto recua **antes** da colisão, por medida |
| D — fullscreen | móvel sozinho; só o botão de pular permanece |
| E — reversão | o texto volta; a histerese impede piscar |

---

## 2. Um defeito de acessibilidade que o teste revelou

Ao medir contraste em vez de só sobreposição, apareceu uma coisa que
**não tem relação com o móvel**: a nota da abertura dava **3,83:1** com
a cena escondida. Abaixo dos 4,5:1 que a WCAG AA pede para texto
pequeno.

Era o próprio tom: `--slate-light: #A79E92`, o tom de apoio do site
sobre fundo escuro. Clareado para **`#B8B1A8`** — mesma matiz, mesma
saturação, **4,77:1** no mesmo fundo.

Depois disso sobrou um resíduo: o **piso e a sombra da cena 3D**
clareavam o fundo por baixo da nota e derrubavam o contraste de 4,9
para 4,1. Não era o móvel passando por cima; era o chão da cena
levantando o preto. O véu da coluna de texto passou a pesar mais
enquanto o texto está lá, e a afrouxar quando ele recua — para não
embaçar o momento em que o móvel toma a tela.

E o **botão de pular**, que de propósito não recua, ficava sobre
madeira: 1,4:1 em 768 × 1024, com 10% dos pixels atrás dele vindos da
cena. Agora ele ganha fundo próprio quando o texto recua — deixa de
ser um contorno e vira uma pastilha sólida.

---

## 3. O teste de sobreposição (§17)

O pedido é explícito: retângulos do DOM não provam que os pixels não
cobrem o texto. Concordo, e o teste faz as duas coisas.

1. **Geometria** — folga entre o retângulo que a cena ocupa e a união
   dos blocos de texto.
2. **Pixel** — a mesma tela é fotografada **duas vezes**, com a cena e
   com a cena escondida, e os quadros são comparados dentro do
   retângulo de cada bloco de texto.

E uma terceira coisa, que é a que **reprova**:

3. **Contraste real.** Diferença de pixel sozinha dá alarme falso: o
   piso da cena é quase preto, e aparecer atrás de um texto claro não
   prejudica ninguém. O que importa é se o texto continua legível.

   O quadro **sem** a cena serve de máscara: pixels escuros ali são
   fundo, claros são glifo. Essa máscara é aplicada ao quadro **com** a
   cena, e mede-se a luminância do fundo — a dos glifos não entra. Usa
   o percentil 95, não o máximo, para um pixel solitário de antialias
   não condenar um bloco.

   Limiares: 4,5:1 para texto normal, 3,0:1 para texto grande.

Uma correção que fiz no próprio instrumento: tentei acelerar a
contagem de pixels com uma conversão de matriz e o resultado ficou
errado — reportava 1% onde a medida real era 91%. Voltei à contagem
direta. Registro porque por alguns minutos eu tinha um teste que
passava sem motivo.

---

## 4. Indexação e metadados (§14)

O `index.html` trazia `index, follow` **ativo** com `canonical`,
`og:url` e `og:image` comentados. Isso é pior do que parece: sem
canonical, o Google pode registrar o endereço provisório do Netlify
como a página oficial da Fratelli, e depois disputar com o domínio de
verdade.

- **Produção**: agora sai com `noindex, nofollow` e uma lista do que
  fazer, em ordem, na publicação.
- **Prévia**: o build **força** `noindex, nofollow`. Ela é um arquivo
  solto que circula por e-mail; não pode ir para o índice por engano.
- Entraram `og:image:alt`, `twitter:title` e `twitter:description`.
- As três linhas de URL continuam comentadas: Open Graph exige URL
  absoluta, e inventar um domínio produziria um link de
  pré-visualização apontando para lugar nenhum.

---

## 5. Arquivos alterados

| arquivo | o quê |
| --- | --- |
| `js/3d/opening.js` | `retanguloNaTela()` — projeta o Box3 para pixels de tela |
| `js/3d/mobile25.js` | composição larga × estreita; `retanguloNaTela()`; primeiro quadro |
| `js/3d/boot.js` | recuo por geometria com histerese; primeiro quadro; expõe a cena |
| `css/main.css` | `--slate-light` corrigido; breakpoint da peça alinhado a 900 px; véu condicional; fundo do botão de pular |
| `index.html` | bloco de indexação e metadados |
| `tools/build-single-file.py` | força `noindex` na prévia |
| `tools/teste-sobreposicao.js` + `tools/diff-sobreposicao.py` | o teste novo |

---

## 6. O que NÃO foi feito, e por quê

- **FPS, Lighthouse, LCP, CLS e INP: não medidos.** O navegador aqui
  roda WebGL por software. A validação em GPU real continua pendente.
- **A fotografia da cozinha continua 336 × 420.** O original disponível
  tem 368 × 420 — não há o que recuperar. Não foi ampliada nem passada
  por super-resolução. Detalhes em `AUDITORIA-IMAGENS.md`.
- **O portfólio, a ampliação e a galeria horizontal não foram
  reconstruídos.** Foram testados; o que passou, ficou. O pedido era
  refinamento, não reforma.
- **Nada foi publicado.**

---

## 7. O que ainda bloqueia a publicação

1. **Validação em GPU real.** Primeira coisa a fazer.
2. **A URL final**, para liberar canonical, Open Graph, sitemap e a
   indexação.
3. **As duas fotografias não confirmadas** (sala e área gourmet) — a
   pergunta segue aberta desde a V1, e está em `PENDENCIAS.md`.
4. **O arquivo original da cozinha.**

Enquanto 1 e 2 não forem resolvidos, **o site não está pronto para ir
ao ar** — e seria desonesto dizer que está.
