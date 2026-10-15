# Maguila's — pendências do cliente

O que pedir ao restaurante, em ordem de prioridade. Cada item diz o formato e
**onde entra no site**. Na prévia, todo dado não confirmado aparece com
**sublinhado pontilhado** (classe `pend` no código).

Todo o conteúdo do site veio das capturas do Instagram do Maguila's enviadas
pelo cliente: nenhuma foto de banco de imagens, nenhuma imagem gerada por IA,
nenhum preço, avaliação ou dado de contato inventado.

## 🔴 Prioridade 1 — bloqueiam a publicação

| # | O quê | Formato | Onde entra |
|---|---|---|---|
| 1 | **Confirmar o WhatsApp** (45) 99956-6139 | "Sim" ou o número certo | 13 links: cabeçalho, as 7 abas do cardápio, buffet, Localização (2), rodapé e barra inferior do celular; o número também aparece escrito na Localização e no rodapé. Veio de 2 posts, não da bio. |
| 2 | **Modalidades de atendimento** | Responder sim/não: come no local · retira no balcão · entrega (bairros, taxa, iFood?) · aceita pedido pelo WhatsApp ou só tira dúvidas | Textos da abertura, botões de WhatsApp e mensagens prontas. Enquanto não houver resposta, o site usa redação neutra: "Falar no WhatsApp", "Veja o cardápio e consulte pelo WhatsApp". Nada sobre entrega foi escrito. |
| 3 | **Confirmar o endereço** | Rua, número, bairro e CEP; confirmar a referência "ao lado do Hospital Universitário" | Abertura (linha de dados), Localização (endereço, placa, botões "Traçar rota" e "Abrir no Google Maps"), rodapé. Veio de 3 posts. |
| 4 | **Confirmar o horário** | Dias e horas; horário do buffet; domingo e feriados | Abertura, placa da Localização, rodapé. A bio diz seg. a sáb., 6h às 23h; um post antigo dizia 6h às 0h. Nada sobre domingo foi escrito. |
| 5 | **Logo oficial** | SVG, ou PNG transparente ≥ 600 px de largura; versão para fundo escuro; símbolo isolado para o ícone da aba | Cabeçalho, rodapé, ícone da aba (favicon), imagem de compartilhamento. Hoje: marca provisória em texto e um "M" no favicon. O código já tem a classe `brand__logo` (README, "Trocar a logo"). |
| 6 | **Autorização de uso das fotos e da marca** | "De acordo" por escrito | Todas as imagens do site. |
| 7 | **Aprovação dos textos** | Leitura e "ok" ou correções | Todos os títulos e textos de apoio (lista em "Propostas sujeitas a aprovação", abaixo). Nenhum é slogan oficial. |
| 8 | **Domínio** | Ex.: maguilas.com.br | `canonical`, `og:url`, `og:image` (precisa de endereço absoluto para a prévia do link aparecer no WhatsApp e no Facebook), `robots.txt`, `sitemap.xml`. Passo a passo em `PUBLICACAO.md`. |

## 🟡 Prioridade 2 — a prévia funciona sem, a entrega final precisa

| # | O quê | Formato | Onde entra |
|---|---|---|---|
| 9 | **Fotos em alta resolução** — plano completo em [`FOTOGRAFIA.md`](FOTOGRAFIA.md) (P1 abertura, P2 buffet e grelha, P3 produtos, P4 ambiente) | JPG/HEIC original, sem texto nem filtro, ≥ 2000 px no lado maior | Abertura, buffet, linha do dia, cardápio, galeria. Hoje: recortes dos prints, entre ~150 e 280 px. **Não foram ampliados** — ampliar só deixaria as fotos borradas. |
| 10 | Os mesmos produtos dos posts, **sem a arte gráfica por cima** | Idem | Uma foto por categoria do cardápio e galeria. |
| 11 | **Foto da fachada** | Horizontal, de dia, com a placa visível | Localização, no lugar da placa de horário provisória ("Foto da fachada pendente"). |
| 12 | **Cardápio atualizado** | PDF, foto do cardápio ou planilha: categoria, item, descrição | Seção Cardápio (7 abas). Hoje: só itens vistos nos posts — o restaurante deve revisar a lista inteira; algum item pode ter saído. |
| 13 | **Preços** | Na mesma planilha do cardápio; preço do quilo do buffet | Seção Cardápio. Hoje o site não mostra nenhum preço. O código já prevê `menu__price` (README, "Editar conteúdo"). |
| 14 | **Imagem de compartilhamento** | Aprovar a atual ou enviar uma (1200×630) | Aparece quando o link é enviado no WhatsApp, Facebook etc. A atual (`assets/images/og-cover.jpg`) usa fotos dos posts e a marca provisória — refazer com a logo oficial (`tools/og-cover.html` + `node tools/gerar-og.mjs`). |
| 15 | Fotos do salão e do balcão | Horizontal, com luz do dia | Futura seção de ambiente. |
| 16 | Formas de pagamento, estacionamento, acessibilidade | Lista simples | Nada disso foi escrito. Entra na Localização se confirmado. |

## Inventário das afirmações do site

Tudo o que o site diz sobre o restaurante, de onde veio e como está escrito.

| Afirmação | Onde aparece | Origem | Situação | Como está no site |
|---|---|---|---|---|
| Restaurante & Grill em Cascavel/PR | abertura, rodapé, título | bio | confirmado | direto |
| Buffet por quilo, grelhados na hora | abertura, buffet, cardápio | bio | confirmado | direto |
| Café da manhã, marmitas, porções | abertura, linha do dia, cardápio | bio | confirmado | direto |
| Pedidos pelo WhatsApp | botões de WhatsApp | bio ("Peça no WhatsApp") | confirmado na bio; **não se sabe o que pode ser pedido** (marmita? entrega? retirada?) | neutro: "Falar no WhatsApp", "Consultar marmitas no WhatsApp", "Perguntar o buffet de hoje" |
| Comer no local | abertura (V4) | dedução das fotos do salão e do buffet | **a confirmar** (item 2) | removido na V5 ("Para comer aqui, levar ou pedir pelo WhatsApp" → "Veja o cardápio e consulte pelo WhatsApp") |
| Levar / retirar | abertura (V4) | não consta | **a confirmar** (item 2) | removido na V5 |
| Entrega / iFood | — | texto parcial em 1 post | **a confirmar** (item 2) | não aparece no site |
| WhatsApp (45) 99956-6139 | 13 links, Localização, rodapé | 2 posts | **a confirmar** (item 1) | sublinhado pontilhado |
| Rua Aimorés, 171 · Santo Onofre | abertura, Localização, placa, rodapé, links de rota | 3 posts | **a confirmar** (item 3) | sublinhado pontilhado |
| "Ao lado do Hospital Universitário" | Localização | 1 post | **a confirmar** (item 3) | sublinhado pontilhado |
| Seg. a sáb., 6h às 23h | abertura, placa, rodapé | bio (um post antigo diz até 0h) | **a confirmar** (item 4) | sublinhado pontilhado + selo "a confirmar" na placa |
| Café "desde cedo" | título "O Maguila's", aba Café | consequência do horário das 6h e dos posts de café da manhã | depende do item 4 | direto |
| Frango crocante todos os dias no buffet | cardápio | post "Servimos ele todos os dias em nosso buffet" | do restaurante | direto |
| "Muda com o dia — feijoada e strogonoff já passaram por aqui" | buffet | post "Nosso almoço — hoje está especial" | do restaurante; não promete cardápio fixo | direto |
| "A carne vai para a grelha quando você pede" | buffet | bio ("grelhados na hora") | redação minha a partir da bio | aprovar (item 7) |
| Jantar com várias opções de prato feito | linha do dia | post "Para seu jantar… várias opções de prato feito" | do restaurante | direto |

**Não aparece no site, de propósito:** preços, avaliações e notas, ano de
fundação, história, "o melhor de Cascavel" ou qualquer superlativo sem
fonte, entrega, estacionamento, formas de pagamento.

## ⚪ Propostas sujeitas a aprovação (item 7)

- Título da abertura: "Buffet caprichado, grelhado na hora."
- Ordem da página por **momentos do dia** (café → almoço → tarde → jantar).
- Todos os textos de apoio e as mensagens prontas do WhatsApp
  (ex.: "Olá! Vim pelo site do Maguila's e gostaria de algumas informações.").
- Paleta e tipos (Oswald, Inter, Dancing Script) — aproximações dos posts.
- Barra de ação fixa no celular ("Cardápio" + "Falar no WhatsApp").
- Botão "Perguntar o buffet de hoje" na seção do buffet.

## Origem dos itens do cardápio

Nenhum item foi inventado. Todos vieram de posts nas capturas enviadas:

| Item | Post |
|---|---|
| Cafezinho / "cafézão" | "Bom dia! Comece seu dia tomando um Cafézão" |
| Café com pão francês | "…com pão francês. Uma delícia de café da manhã" |
| Pão de queijo | post de pão de queijo com café |
| Cachorro-quente | "…cachorro-quente… seu café da manhã" |
| Salgados fritos e assados | "Esse tempinho pede o quê? Um salgadinho frito…" |
| Buffet por quilo, grelhados na hora | bio |
| Saladas, pratos quentes, carnes | "Nosso Buffet — saladas fresquinhas, pratos quentinhos, carnes suculentas, opções para todos os gostos" |
| Frango crocante (todos os dias no buffet) | "Servimos ele todos os dias em nosso buffet" |
| Feijoada, strogonoff | "Nosso almoço — hoje está especial" |
| Prato feito (feijão preto, batata frita, alface, tomate) | "Prato feito do Maguila's" |
| Marmita | "…na marmita — sabor e praticidade no seu dia" |
| Marmita de salada | "Temos marmita de salada" |
| Pratos feitos no jantar | "Para seu jantar… várias opções de prato feito" |
| Lanche caprichado | "Aquele lanche caprichado… ingredientes fresquinhos" |
| Shawarma de costela ou bife em tiras | "Novidade no Maguila's: Shawarma" |
| Coxinha de mandioca com costela | "Aquela coxinha de massa mandioca com recheio de costela" |
| Coxinha de carne, empadão de frango, calzone de pizza | posts próprios |
| Empadas | "Empadas — massa macia, recheio cremoso" |
| Porção de peixe e camarão | "Porção de peixe e camarão — aqui nós temos" |
| Pudim, bolo prestígio, bolo de chocolate, tortinha de maracujá, cupcake, mini bolos, salada de frutas | posts próprios |
| Brigadeiro e beijinho | post "Aquele docinho" |
| Copo da felicidade (maracujá, morango, Kit Kat, bombom de uva, ninho com uva) | post "Uma delícia de sobremesa" |
| Caipira de morango com saquê | post próprio |
| Cervejas, drinks, bebidas em geral | post de reabertura ("Aqui você encontra…") |

A descrição curta de alguns itens resume o texto do post.
