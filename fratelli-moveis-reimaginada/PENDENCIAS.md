# Pendências — Fratelli Móveis

O site não exibe mais nenhum aviso de obra. Tudo que está na página é dado
confirmado. O que falta está listado aqui, e não lá.

Legenda: 🔴 bloqueia a publicação · 🟡 melhora o resultado · ⚪ decisão da empresa.

---

## 🔴 Antes de publicar no domínio oficial

Três linhas do `index.html` precisam mudar. Estão marcadas com o comentário
`<!-- PRODUÇÃO: ... -->` no próprio arquivo, para não passar batido.

### 1. Liberar a indexação

```html
<meta name="robots" content="noindex, nofollow">
```

**Apagar essa linha.** Ela existe só para o Google não indexar a prévia. Se ela
for ao ar junto com o site, a Fratelli não aparece em busca nenhuma.

### 2. URL absoluta na imagem de compartilhamento

```html
<meta property="og:image" content="assets/img/og-cover.jpg">
```

**Trocar por** `https://SEU-DOMINIO/assets/img/og-cover.jpg`. Caminho relativo
não é resolvido pelos robôs do WhatsApp, do Instagram e do Facebook — o link
compartilhado sairia sem imagem. Não deixei escrito porque o domínio ainda não
existe e eu não invento endereço.

### 3. Canonical e URL nos dados estruturados

Com o domínio definido, acrescentar no `<head>`:

```html
<link rel="canonical" href="https://SEU-DOMINIO/">
<meta property="og:url" content="https://SEU-DOMINIO/">
```

E no bloco `application/ld+json`, a chave `"url"` com o mesmo endereço.

---

## 🔴 A fotografia de nogueira não tem procedência confirmada

`assets/images/material-nogueira-*` sai de `tools/ref/26.jpg`, que você
enviou como **referência visual de material** durante o trabalho do
módulo 3D.

Ela agora é conteúdo publicado: é a superfície que abre a seção
"Cada ambiente começa por dentro" e o fundo do capítulo de
materialidade. Isso muda a natureza do uso — uma referência de trabalho
e uma imagem publicada no site não têm a mesma exigência.

**Antes de publicar, uma destas três:**

1. confirmar que a Fratelli tem direito de uso sobre essa fotografia;
2. substituí-la por uma fotografia de madeira da própria Fratelli em
   resolução equivalente (mínimo ~840 px no lado útil, em foco);
3. substituí-la por uma textura licenciada.

A troca é barata: são dois `<picture>` e um arquivo de origem em
`tools/prepare-reimaginada.py`. O enquadramento continua valendo desde
que a nova fotografia tenha pelo menos 840 px na faixa em foco.

O site **não** afirma que esse material é um acabamento vendido pela
Fratelli — a nota ao lado diz, com todas as letras, que é uma
fotografia de referência. Mas publicar imagem de terceiro sem
autorização é outro problema, e esse continua aberto.

---

## 🔴 Duas imagens da faixa de ambientes são geradas por IA

Sala de estar e área gourmet **não são fotografia nem render da Fratelli.**

O que me levou a isso: nas banquetas da área gourmet, as travessas não formam
quadro, a perna traseira da banqueta do meio não conecta em nada, e as três
banquetas — que deveriam ser o mesmo produto repetido — têm proporções
diferentes entre si. Em render 3D a banqueta é um bloco instanciado e sai
idêntica em toda cópia; em foto, a física resolve sozinha. Somado: 1536 × 1024
exatos, medida padrão de gerador de imagem, e um acabamento que destoa de todo o
resto do material.

Estão na página com a etiqueta **"Imagem de referência"** — verdadeira seja qual
for a origem, e que não atribui a obra à Fratelli.

**Continua sem resposta:** essas duas imagens são da Fratelli?

- Se a empresa as gerou para apresentar uma proposta, troco a etiqueta.
- Se vieram de outro lugar, o certo é tirar. Há risco de licença e de o cliente
  contratar esperando um ambiente que nunca existiu.

---

## 🟡 A resolução das fotografias é o teto da experiência

O módulo 3D saiu (ver `RELATORIO-REIMAGINACAO.md`). O que ficou no
lugar depende inteiramente das fotografias, e elas têm limite.

### Não existe original acima de 1600 px neste projeto

Varri `tools/source/`, `assets/images/` e `tools/ref/`. O maior arquivo
do acervo da Fratelli tem **1600 px**. O original do closet
(`closet.jpg`, 1600 × 943) é só **4% maior** que o que a V9 já
publicava.

Os 3840 × 2160 pedidos não existem, e não dá para fabricá-los: não há
super-resolutor neste ambiente (sem `torch`, sem `onnxruntime`, e o
OpenCV instalado não traz `dnn_superres`). Ampliar com interpolação
aumenta dimensão sem devolver detalhe.

**A saída foi o enquadramento**: o quadro tem teto de 820 px de tela,
onde a fotografia de 1570 px dá 1,91× de densidade. Ela nunca é
esticada além da própria resolução.

**O que isso custa:** a cena é mais contida que a da V9, onde o móvel
tomava a tela inteira. Trocamos tamanho por nitidez, conscientemente.

**Se aparecer um arquivo maior** — o render original do closet, em
4K — a experiência melhora sem mexer em código: basta regerar a escada
em `tools/prepare-reimaginada.py` e subir o teto de `max-width` do
`.reveal__quadro`.

### A cozinha continua em 336 × 420

`amb-cozinha.jpg` tem 368 × 420 na origem. Não foi ampliada e não deve
ser. Enquanto não houver arquivo melhor, ela fica no tamanho em que
está, no cartão da faixa de ambientes.

### A fotografia de nogueira tem profundidade de campo curta

Medida: a nitidez cai de 13,6 para 3,0 ao longo do recorte. Só a faixa
esquerda está em foco, e é por isso que o painel tem 840 px e não
1300. Uma fotografia de madeira em foco por inteiro permitiria um
painel maior.

## 🟡 Material que melhora o resultado

### Resolução da fotografia de cozinha

Chegou com **368 × 420 px**. Está no maior lugar onde cabe sem ampliar, um
cartão de 352 px da faixa de ambientes. Em tela retina aparece menos definida
que as vizinhas. Não ampliei: ampliar não recupera detalhe, inventa pixel.

**O que pedir:** o arquivo original, direto da câmera ou do celular, sem passar
por aplicativo de mensagem — é a compressão do envio que encolhe assim. Com
2000 px de lado maior ela serve para um quadro grande em Projetos.

### Mais fotografia de obra entregue

Das treze imagens no site, **três são fotografia** — painel de TV, cozinha e o
atendimento — e oito são render da Fratelli.

Render mostra a intenção. Foto mostra o acabamento, a junção, a ferragem e o
encaixe na parede real. A seção Projetos já está preparada para a comparação:
cada imagem leva a etiqueta "Projeto em 3D" ou "Projeto executado". Quando
chegar a foto de um ambiente que já tem render no site, os dois podem aparecer
lado a lado — é o argumento comercial mais forte que uma marcenaria tem.

### Origem da fotografia de abertura

A imagem do hero veio da captura de mockup enviada no começo, com a interface
gravada sobre a fotografia, que eu removi por reconstrução digital. **Não foi
confirmado se é um ambiente executado pela Fratelli nem se a empresa tem direito
de uso.** A página não a atribui a ninguém, justamente por isso.

Se ela não for da Fratelli, o caminho é substituir por uma foto própria em alta
resolução. Ela é a primeira coisa que o visitante vê.

---

## ⚪ Decisões da empresa

### E-mail e horário de atendimento

Não estão no site. Não foram informados, e campo de contato vazio ou com
"a confirmar" tira credibilidade. Assim que existirem, entram na lista da seção
Contato em duas linhas de HTML.

### O lema da marca

A foto do atendimento mostra, na parede, **"Estilo, Satisfação e Bom Gosto"**.
Esse lema não está em nenhum texto do site. Se a empresa quiser usá-lo, é só
dizer onde — abaixo da marca no rodapé é o lugar natural.

### Avaliações de clientes — o que não está confirmado

A seção está completa, com as seis avaliações: Joseane Terraplanagem
2019, Wagner Santos, Maicon Costa, Paula Susana, Rafael Livinali e
marcio batista. São capturas de tela reais, exibidas como imagem, e o
texto de cada uma está repetido no `alt` palavra por palavra.

Duas coisas continuam sem confirmação e por isso não aparecem no site:

- **A plataforma.** As capturas têm a aparência das avaliações do Google
  Meu Negócio, mas isso é leitura minha da interface, não confirmação da
  empresa. O site diz "na avaliação dos clientes", sem citar o Google.
  Confirmado que é o Google, dá para nomear a fonte — o que aumenta o
  peso da prova social.
- **O total de avaliações.** A nota 5,0 foi confirmada pela empresa e
  aparece. Quantas avaliações existem ao todo, não — e por isso nenhum
  número de total é exibido, nem entra `aggregateRating` nos dados
  estruturados, que exige uma contagem verdadeira.

Duas observações sobre envelhecimento:

- As datas ficam dentro das capturas e são relativas ("3 anos atrás"),
  então envelhecem junto com a imagem. Refazer as capturas daqui a algum
  tempo vale a pena.
- Para trocar ou acrescentar avaliações: a captura vai para
  `tools/source/` como `avaliacao-N`, o texto entra na tabela
  `AVALIACOES` de `tools/prepare-reviews.py`, e `python3
  tools/prepare-reviews.py` refaz a seção inteira e redistribui as
  colunas sozinho.

A seção não está no menu do topo. Incluí-la mexeria no cabeçalho, que
ficou fora do escopo; é uma linha, se a empresa quiser.

### A fotografia do hero é uma das de origem não confirmada

O hero passou a usar a sala com painel de TV, ripado e iluminação quente
(`assets/images/hero-sala-*`, gerada de `tools/source/ref-sala.jpg`). É a
mesma imagem que aparece na faixa de ambientes rotulada como "Imagem de
referência" — justamente porque a empresa nunca confirmou se é um projeto
da Fratelli.

No hero ela aparece sem rótulo nenhum, como a cara do site. Isso precisa
de confirmação: se for um projeto da Fratelli, ótimo e o rótulo da outra
seção também muda; se for uma imagem de banco ou de terceiro, é preciso
verificar a licença antes de publicar.

Duas notas menores, na mesma linha:

- A imagem de compartilhamento (`og-cover.jpg`) ainda sai da fotografia
  de cozinha que era o hero antigo. Não está errada, mas hoje não é mais
  a primeira imagem do site. Vale trocar quando o domínio for definido e
  as linhas de `og:` forem descomentadas.
- O arquivo tem 1536×1024. Em telas de 1920 ele é ampliado cerca de 25%,
  o que é pouco e passa despercebido, mas uma versão maior da mesma cena
  renderizaria mais nítida.

### O filme institucional

O vídeo em `assets/video/fratelli-brand-film.mp4` é o **fundo** da faixa
"Ambientes pensados nos detalhes.", entre a abertura e os projetos. São
10 segundos, 1280×720, 3,1 MB, sem áudio e sem corte interno — as cenas
se dissolvem. A faixa ocupa 80vh no desktop e 60vh no celular, com o
texto por cima, à esquerda.

Dois pontos que dependem da empresa:

- **A natureza das imagens.** O filme mostra sala, cozinha, dormitório e
  closet. Não sei quais cenas são projeto executado e quais são
  renderização. Por isso o texto da seção fala de marcenaria, proporção,
  luz e acabamento, e não de obra entregue: nada ali afirma que são
  ambientes construídos. Se a empresa confirmar a origem de cada cena, o
  texto pode ganhar força sem deixar de ser verdadeiro.
- **O direito de uso.** Vale confirmar que a Fratelli tem os direitos do
  filme, como de qualquer peça publicada no site.

Uma observação técnica: o filme termina numa parede clara e recomeça na
sala, 36 pontos de luminância abaixo. Como o vídeo não tem nenhum corte
interno, esse salto seria a única emenda visível da peça. A seção apaga a
imagem nos últimos oito décimos e a traz de volta já na cena nova — o
arquivo não foi tocado. Se um dia existir uma versão do filme que termine
perto de onde começa, dá para remover essa costura: é uma linha de CSS e
um bloco curto em `js/main.js`.

### O mapa carrega conteúdo do Google

A seção Contato monta um mapa do Google. Ele só é inserido depois que o
navegador confirma que o Google responde — quem bloqueia terceiros vê um bloco
de endereço no lugar, e o botão "Como chegar" funciona igual.

Vale saber, para fins de LGPD: quando o mapa carrega, o Google recebe o IP do
visitante. É o comportamento padrão de qualquer site com mapa incorporado. Se a
empresa preferir evitar isso, dá para trocar o mapa por uma imagem estática.

---

## Nunca entrou no site, e não entra sem material

Depoimentos, nomes de clientes, número de projetos entregues, anos de mercado,
tamanho de equipe, estrutura de fábrica, prêmios, certificações, marcas de
ferragem, prazo de garantia e condições de pagamento. Nada disso foi informado,
e nada disso foi presumido.

---

## Acrescentado na V2

### Ampliação das avaliações no celular

A ampliação de projeto cobre as 12 fotografias de projetos e ambientes.
As seis capturas de avaliação ficaram de fora desta rodada. Elas passam
no contraste em todas as larguras, mas em 320px o texto fica pequeno —
poder ampliar ajudaria. Estender o mesmo diálogo a elas é pequeno: basta
incluir `.review__card` na coleta de `js/main.js`.

### Lighthouse não foi medido

As metas do briefing (LCP 2,5s, CLS 0,1, INP 200ms, Performance 90+,
Acessibilidade 95+) continuam sem medição: este ambiente não tem rede
para baixar a ferramenta. Medir numa máquina com internet, contra o site
já publicado, antes de tratar qualquer meta como atingida.

### Composição do portfólio

A V2 melhorou a interação do portfólio, não a composição. Um redesenho
editorial da seção — numeração, proporções, assimetria mais marcada —
é trabalho de direção de arte e merece uma rodada própria, com aprovação
visual antes da implementação.

---

# V6 — o que continua pendente

## 1. As duas fotografias não confirmadas (desde a V1, sem resposta)

`ref-sala.jpg` e `ref-gourmet.jpg` entraram como **imagem de
referência** porque nunca foi confirmado se são obra da Fratelli.

Isso ficou mais urgente: **`ref-sala.jpg` é a fotografia do hero**, e
lá ela aparece sem rótulo, como rosto do site. Na faixa de ambientes a
mesma fotografia leva a etiqueta "Imagem de referência" — ou seja, o
site diz duas coisas diferentes sobre a mesma imagem.

Três saídas, e a escolha é sua:

1. **São da Fratelli** → tiro a etiqueta de referência e passo as duas
   para "Projeto executado";
2. **Não são** → troco a fotografia do hero por uma obra real e mantenho
   as duas como referência onde estão;
3. **São de referência e você quer mantê-las no hero** → acrescento ao
   hero a mesma etiqueta que está na faixa, para o site não afirmar
   nada que não foi confirmado.

Enquanto não houver resposta, fica como está: rotulada onde já estava.

## 2. O arquivo original da cozinha

`ambiente-cozinha` está em 336 × 420 px porque **o original disponível
tem 368 × 420 px**. Não foi ampliada e não passou por super-resolução.

Com o arquivo original, no tamanho em que foi fotografado, este cartão
passa a suportar a ampliação em tela cheia como os outros. Sem ele,
continua limitado a cartão pequeno — que é como está sendo usado.
Detalhes em `IMAGENS-V6.md`.

## 3. A URL, depois da publicação

Continuam comentadas no `index.html`, esperando o endereço real:

```html
<!-- <link rel="canonical" href="https://SEU-DOMINIO/"> -->
<!-- <meta property="og:url" content="https://SEU-DOMINIO/"> -->
<!-- <meta property="og:image" content="https://SEU-DOMINIO/assets/images/og-cover.jpg"> -->
```

O `sitemap.xml` também tem a URL de exemplo. Nada disso foi inventado
de propósito.

## 4. Medições que este ambiente não permite

Lighthouse, FPS, LCP, CLS e INP **não foram medidos** — o navegador
daqui roda WebGL por software e não tem as APIs de métrica. O
`TESTES-V6.md` explica caso a caso. Para ter esses números é preciso
rodar o pacote num Chrome de verdade, num aparelho de verdade.

O filme também não pôde ser verificado: este Chromium não tem
decodificador H.264 (`canPlayType` devolve string vazia). A V3 se
comporta igual, então não é regressão. O recuo — poster em tela cheia,
texto e botões legíveis — foi verificado e funciona.

## 5. Material da madeira

A madeira da cena 3D é **procedural**, não é a fotografia de uma lâmina
real, e não corresponde a nenhum material que a Fratelli ofereça. Está
declarado na própria página. Se houver fotografia autorizada de uma
lâmina da empresa, ela pode substituir o desenho — e aí o móvel passa a
mostrar um material que existe.
