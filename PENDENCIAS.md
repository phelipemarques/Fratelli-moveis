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

### 3. Fotografias dos ambientes executados

Chegaram cinco imagens. Escolhi três e tratei; duas ficaram de fora:

| Arquivo | Ambiente | Decisão |
| --- | --- | --- |
| `2.jpg` | Dormitório | **entrou** — a melhor do conjunto, e o tom bege com verde conversa com a paleta do site |
| `5.jpg` | Closet | **entrou** — mostra gaveteiro, cabideiro, prateleira e luz interna, que é o que interessa em planejados |
| `3.jpg` | Banheiro | **entrou** — recortei a parede branca vazia da esquerda, que ocupava 40% do quadro |
| `4.jpg` | Dormitório com painel de TV | ficou de fora — definição de 26,8 contra 103 da melhor, e dominante amarela |
| `6.jpg` | Dormitório menor | ficou de fora — mesma moleza e um amarelo no painel que briga com a paleta |

**As três são renderizações 3D, não fotografias de ambientes construídos.** É assim
que elas aparecem no site: cada uma leva a etiqueta "Projeto em 3D", e o texto da
seção diz que as fotos dos ambientes executados continuam pendentes. Se alguma
delas for foto de obra pronta, me avise que eu corrijo a etiqueta.

O que fiz nelas foi acabamento, não invenção: limpeza de artefato de compressão,
recuperação de definição no canal de luz, contraste local suave e uma curva em S
discreta. Nenhuma foi ampliada além do tamanho original. O tratamento está em
`tools/prepare-project-images.py`, com a força regulada por imagem — o closet é um
render difuso, visto através do vidro das portas, e não aguenta a mesma dose do
dormitório.

**O que ainda falta:** fotografias dos ambientes depois de instalados. Render mostra
a intenção; foto mostra o acabamento, a junção, a ferragem e o encaixe na parede
real. É o que convence quem está decidindo.

| Onde | Estado | Formato |
| --- | --- | --- |
| Projetos 01 — Closet | render 3D no lugar | 16:9 |
| Projetos 02 — Dormitório | render 3D no lugar | 4:5 |
| Projetos 03 — Banheiro | render 3D no lugar | 3:2 |
| Projetos 04 — Home office | **reservado** | 3:2 |
| Ambientes 01–06 | **reservados**, um por categoria | 4:5 |
| Sobre — oficina ou equipe | **reservado** | 4:5 |

Para as que faltam: JPG, lado maior a partir de 2400 px, sem marca d'água e sem
texto gravado.

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
