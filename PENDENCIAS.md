# Pendências — Fratelli Móveis

Lista do que falta para a prévia virar site publicável. Cada item diz **o que
pedir**, **em que formato** e **onde entra** na página.

Legenda: 🔴 bloqueia a publicação · 🟡 substituível (há reserva no lugar) ·
⚪ proposta minha, sujeita a aprovação.

---

## 🔴 Bloqueiam a publicação

### 1. Origem e direito de uso da fotografia de abertura

A única imagem recebida foi **uma captura de tela de um mockup** (1280 × 960 px),
com a interface do site gravada por cima da fotografia. Removi esses textos por
reconstrução digital e usei o resultado na abertura.

Duas coisas precisam ser confirmadas antes de publicar:

- **A fotografia é de um ambiente executado pela Fratelli?** Se não for, ela não
  pode ficar na abertura como se fosse. A página hoje não atribui autoria nem
  chama o ambiente de projeto entregue, justamente por isso.
- **A Fratelli tem direito de uso da imagem?** Se veio de banco de imagens,
  render de terceiros ou geração por IA, é preciso a licença ou a substituição.

**O que pedir:** o arquivo original, em alta resolução, e a confirmação de origem.

### 2. Conferir o número do WhatsApp

O número informado foi **55 45 9842-3488**. Como `9842-3488` tem 8 dígitos e
celular brasileiro tem 9 depois do DDD, sempre começando com 9, entendi que
faltou um dígito e implementei como **(45) 99842-3488**, que é a única leitura
que forma um celular válido.

No site ele está em três lugares: o botão do encerramento, a lista de dados do
Contato e o rodapé. Todos apontam para o mesmo endereço, com a mensagem já
escrita:

```
https://wa.me/5545998423488?text=Olá, vim pelo site da Fratelli Móveis e gostaria de mais informações.
```

**O que fazer:** mandar uma mensagem para o número pelo próprio site e ver se
chega na Fratelli. Se o número for outro, é trocar as três ocorrências de
`5545998423488` no `index.html` — inclusive a que está nos dados estruturados,
no `<head>` — e as três de `(45) 99842-3488`.

Os outros canais continuam pendentes: e-mail, endereço, horário de atendimento
e Instagram aparecem marcados como "a confirmar", sem link.

### 3. 🔴 Duas imagens da última remessa são geradas por IA

As que você chamou de sala de estar e área gourmet **não são fotografia nem
render da Fratelli.** Elas foram geradas por inteligência artificial. O que me
levou a isso:

- **A geometria não fecha.** Nas banquetas da área gourmet, as travessas não
  formam quadro, a perna traseira da banqueta do meio não conecta em nada, e as
  três banquetas — que deveriam ser o mesmo produto repetido — têm proporções
  diferentes entre si. Em render 3D a banqueta é um bloco instanciado: sai
  idêntica em toda cópia. Em foto, a física resolve sozinha.
- **O tamanho.** 1536 × 1024 px exatos, medida padrão de saída de geradores de
  imagem. Câmera e render não entregam nesse formato por acaso.
- **O traço destoa.** Todas as outras que você enviou têm a cara de render de
  marcenaria, com iluminação mais dura e materiais mais simples. Essas duas têm
  acabamento de fotografia editorial.

**Por que isso importa.** Uma seção de portfólio diz ao visitante: isto é o que
a Fratelli faz. Se a pessoa contrata esperando aquela cozinha e ela nunca
existiu, o problema é da Fratelli. Há ainda a questão de licença, se as imagens
vieram de algum banco ou do portfólio de outro estúdio.

**O que fiz.** Coloquei as duas nos cartões que faltavam, como você pediu, mas
com a etiqueta **"Imagem de referência"** — que é verdade seja qual for a
origem, e não atribui a obra à Fratelli.

**O que preciso de você, em uma linha:** essas duas imagens são da Fratelli?

- Se a Fratelli as gerou para apresentar uma proposta, troco a etiqueta.
- Se vieram de outro lugar, o certo é tirar. Eu tiro e os dois cartões voltam a
  ser reserva até chegar imagem própria.

### 3a. As três fotografias reais

Painel de TV, cozinha e o atendimento da Fratelli são as únicas fotografias do
conjunto. Vão sem etiqueta, porque a etiqueta existe para avisar quando a imagem
é desenho. **Se alguma não for trabalho da Fratelli, me avise.**

A foto do atendimento fechou o quadro da seção Sobre e mostra a marca aplicada
na parede, com o lema **"Estilo, Satisfação e Bom Gosto"**. Esse lema não está
escrito em nenhum texto do site. Se a empresa quiser usá-lo, é só dizer onde.

### 3b. 🔴 Resolução da fotografia de cozinha

Chegou com **368 × 420 px**. Ocupa o maior lugar onde cabe sem ampliar, um cartão
de 352 px. Em tela retina vai aparecer menos definida que as vizinhas. Não
ampliei: ampliar não recupera detalhe.

**O que pedir:** o arquivo original, direto da câmera ou do celular, sem passar
por aplicativo de mensagem — é a compressão do envio que encolhe assim.

### 3c. O balanço das imagens

Dezessete chegaram, treze estão no site: três fotografias, oito renders da
Fratelli e duas imagens de referência. **Não há mais nenhum quadro reservado.**

Oito das treze são render. Render mostra a intenção; foto mostra o acabamento, a
junção, a ferragem e o encaixe na parede real — é o que convence quem está
decidindo. Vale fotografar os ambientes já instalados.

---

## 🟡 Substituíveis (a prévia já funciona sem)

### 4. Texto institucional

A seção Sobre traz apenas o que dá para afirmar com segurança: que a Fratelli
trabalha com móveis planejados em Cascavel, no Paraná. **Não inventei** tempo de
mercado, tamanho de equipe, número de projetos entregues nem posição no mercado
regional. A própria seção declara que o texto completo está pendente.

**O que pedir:** 2 a 3 parágrafos sobre história, equipe e estrutura, e a
confirmação de qualquer número que a empresa queira exibir.

### 5. Resolução das imagens

O arquivo de origem tem 1280 px de largura. Em telas de 1440 px ou mais, e em
celulares com tela de alta densidade, o navegador amplia a imagem e o resultado
fica menos nítido. **Não ampliei o arquivo artificialmente** — isso não recupera
detalhe, só inventa pixel.

**O que pedir:** os originais da câmera, ou pelo menos 2400 px no lado maior.

### 6. Imagem de compartilhamento e ícone

`assets/img/og-cover.jpg` é um recorte da mesma fotografia de abertura, e o
ícone (`favicon.svg`) é um monograma provisório que desenhei a partir do nome.

**O que pedir:** o logotipo oficial em vetor (SVG, AI, EPS ou PDF). Ele muda a
marca no cabeçalho, no rodapé e o ícone da aba.

---

## ⚪ Propostas minhas, sujeitas a aprovação

### 7. Lista de ambientes

Cozinha, Dormitório, Closet, Home office, Sala de estar e Área gourmet. É o
escopo comum de uma marcenaria de planejados, **não uma lista confirmada pela
Fratelli**. A seção exibe a marca "proposta a validar".

**O que confirmar:** quais desses a empresa de fato atende, e o que falta.
Trocar, remover ou acrescentar um ambiente é editar um `<li>` no `index.html`.

### 8. Etapas do processo

Conversa e medição → Projeto e detalhamento → Produção → Montagem e entrega.
Também marcado como "proposta a validar".

**O que confirmar:** se o atendimento funciona assim, se há visita técnica
cobrada, prazo médio e se a montagem é feita por equipe própria.

### 9. Textos de chamada

Título de abertura, passagem editorial, descrições dos ambientes e o convite do
encerramento foram escritos por mim, a partir do vocabulário de móveis planejados
(medida, proporção, vão, prumo, circulação). Nenhum deles atribui à Fratelli uma
característica que não foi informada.

**O que confirmar:** se a voz está adequada e se "Móveis planejados para o seu
jeito de morar." fica como frase de abertura. A alternativa presente no material
recebido era "Móveis que pertencem ao espaço."

---

## Não há, e não haverá sem material

Estes itens **não** foram colocados na página, por não haver base:

- Depoimentos ou avaliações de clientes.
- Nomes de clientes, condomínios ou obras.
- Números de projetos entregues, anos de mercado ou tamanho de equipe.
- Prêmios, certificações ou parcerias com fabricantes.
- Prazo de garantia.
- Formulário de orçamento — um formulário sem destino configurado dá ao visitante
  a impressão de que a mensagem foi enviada. Quando houver e-mail ou serviço de
  envio definido, ele pode entrar na seção Contato.
