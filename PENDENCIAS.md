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
