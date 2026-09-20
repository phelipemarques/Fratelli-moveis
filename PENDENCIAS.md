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

### Avaliações de clientes

Não há seção de prova social, porque não há avaliação real disponível. Não
inventei nenhuma. Se a Fratelli tiver avaliações no Google ou no Instagram,
elas podem virar uma seção curta entre Processo e Sobre, com nome e texto reais.

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
