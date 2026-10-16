# Parada do Mano — pendências para confirmar com o restaurante

Atualizado na V4 (16/10/2026). Nada no site foi inventado: o que não foi confirmado
aparece como "sob consulta" ou como pergunta pelo WhatsApp. Confirmar todos os dados abaixo
antes de publicar — inclusive os que estão em "O que as referências confirmaram".

## O que as referências confirmaram

Da bio e das publicações do Instagram @paradadomano:

- Segunda a domingo, das 06:00 às 23:30 · "Aberto todos os dias"
- Café, almoço e janta
- Almoço: "buffet completo com variedades todos os dias"; comida caseira no almoço e no jantar, de segunda a domingo
- Espeto corrido / rodízio aos domingos, "variedade de carnes"
- Feijoada nas quartas e sábados
- Fogão a lenha ("Nosso fogão a lenha já está servido")
- BR 277, km 594 — Cascavel/PR · WhatsApp 45 99825-8916
- Logo oficial (avatar do perfil) e o slogan "Bom churrasco, bons momentos!"

## 🔴 Antes de publicar

| # | O que pedir | Onde entra |
|---|---|---|
| 1 | **Autorização para publicar** e o **domínio** | rodar `python3 tools/set-domain.py https://dominio` (canonical, og:url, og:image e twitter:image absolutas, JSON-LD, sitemap). Só com autorização: `--publicar` (libera `noindex`, `robots.txt` e o `X-Robots-Tag` do `vercel.json`). Passo a passo no README |
| 2 | Confirmar que o **WhatsApp** (45) 99825-8916 é o de atendimento, que o **horário** (seg a dom, 06h–23h30) continua valendo e que o **endereço** BR-277, km 594 basta para chegar (posto ou referência, sentido da pista) | número e mensagens em `conteudo/contato.json` (20 links), contato, rodapé, dados estruturados, botão de rota |
| 3 | Confirmar que as **artes dos posts** (feijoada e rodízio) podem ir para o site. Se a foto da feijoada ou das carnes dentro da arte veio de banco de imagens, a licença precisa cobrir uso em site | seção Feijoada, bloco do espeto corrido, cardápio |

## 🟡 Fotos do site

Desde 16/10 o site usa as **5 fotos enviadas em 1122×1402** (café da manhã, buffet com salão,
prato com carnes, feijoada no buffet e mesa de saladas), ampliadas 2x com EDSR e com ajuste leve.
Elas entram na abertura, nos momentos do dia, no mosaico do buffet, no churrasco, na feijoada,
no cardápio, na galeria, nos três vídeos e na imagem de compartilhamento. A churrasqueira da
seção Churrasco é um recorte do fundo da foto do buffet.

As fotos têm cara de **imagens geradas ou retocadas por IA** (o salão e a churrasqueira não batem
com as fotos reais do Instagram; a das saladas recria uma foto real da casa). Por isso o rodapé diz
**"Imagens ilustrativas"**. Antes de publicar, o dono precisa aprovar que elas representam o que
a casa serve — foto de comida que não corresponde ao prato pode gerar reclamação de cliente.
Se preferir fotos 100 % reais, os originais do celular entram pelo mesmo caminho
(`tools/source/<nome>.jpg` + `python3 tools/prepare-images.py`).

| Ainda vindo de print do Instagram | Pedir |
|---|---|
| Arte do rodízio (recorte sem o preço) | o arquivo da arte, sem o preço, ou foto real dos espetos |
| **Logo** (avatar do perfil, 150 px) | **arquivo vetorial (SVG/PDF/AI) ou PNG grande** |

As fotos reais tratadas dos prints (arroz, legumes, saladas decoradas, fogão a lenha, espeto,
fachada) continuam em `tools/source/`, fora do site, para quando o dono quiser usá-las.

## 🟡 Cardápio: o que falta para virar cardápio com itens e preços

Cada categoria mostra só o que é comprovado: dias e horários divulgados (etiquetas pretas),
onde consultar valores (linha laranja) e, no buffet e nas saladas, uma lista expansível do que
aparece nas fotos da casa ("Já passou pelo buffet"), com o aviso de que varia conforme o dia.
Lanches, sobremesas e bebidas convidam a consultar a equipe, sem prometer nada.

Desde a V4 o cardápio fica em **`conteudo/cardapio.json`**. Com a lista do restaurante, cada
prato vira um item (nome, descrição, categoria, preço, disponibilidade, observação, foto
opcional) e `python3 tools/build-content.py` atualiza o site. O modelo foi testado com itens de
exemplo numa cópia descartável; **nenhum item de exemplo está no site**. Pedir ao restaurante:

- a lista por categoria, com os preços **atuais** e o que muda por dia da semana;
- se sobremesas e bebidas existem como categorias (se não, basta apagar a categoria do JSON).

## 🟡 Dados comerciais ainda "sob consulta"

| Item | Situação | O que perguntar |
|---|---|---|
| **Preço do espeto corrido** | Há **dois valores** nas referências: R$ 66,90 por pessoa (post "Rodízio aos domingos") e uma promoção de Outubro Rosa, de R$ 89,90 por R$ 69,90. Nenhum aparece no site; o recorte do post deixou o preço de fora | valor atual, até quando vale a promoção, horário, o que inclui |
| Buffet | "buffet completo" confirmado | **livre ou por quilo?** valores, horário do almoço |
| Feijoada | dias confirmados | valor, acompanhamentos, horário |
| Café da manhã | só que existe e que abre às 06h | o que é servido, valores, até que horas |
| Janta | comida caseira até 23h30 | se é buffet, à la carte ou lanches |
| Lanches e salgados | a casa é lanchonete (está no nome) | lista e valores |
| Sobremesas, bebidas | **sem nenhuma informação** | existe? quais? — se não, apagar a aba |
| Estacionamento para ônibus e caminhão | uma foto mostra ônibus de turismo na porta | se é um serviço que vale divulgar |

## ⚪ Propostas minhas, sujeitas a aprovação

- Títulos das seções e textos de apoio (o slogan "bom churrasco, bons momentos" é do próprio restaurante).
- Os três vídeos (roteiro, ordem das fotos e textos) — ver abaixo.
- Categorias do cardápio (10), mensagens pré-escritas do WhatsApp, placa "BR 277 / km 594" em CSS,
  barra de atalhos no celular, fontes Anton e Barlow.
- V4: textos das categorias reescritos mais curtos; todas as mensagens do WhatsApp começam com
  "Olá! Vim pelo site do Parada do Mano e gostaria de…" (lista completa em `conteudo/contato.json`).
  Elas só abrem uma conversa: não falam em pedido, reserva ou compra.

## Vídeos

| Arquivo | Uso | Observação |
|---|---|---|
| `assets/videos/parada-do-mano-abertura.mp4` / `.webm` | fundo da abertura do site, no computador | sem texto, em loop, 17 s, 1,7 MB (MP4) / 1,3 MB (WebM); no celular, com economia de dados, rede lenta ou movimento reduzido fica a foto |
| `parada-do-mano-video-vertical.mp4` | Reels, Stories, status do WhatsApp | 1080×1920, 27 s, textos acima da área da legenda do Instagram |
| `parada-do-mano-video-horizontal.mp4` | Facebook, YouTube, TV do salão | 1920×1080, 27 s |

**Sem trilha sonora** de propósito: música só com licença. No Instagram dá para escolher uma das
músicas liberadas na hora de postar. Se o restaurante tiver vídeos reais da churrasqueira
(10–20 s, celular na horizontal), eles substituem com vantagem o movimento feito sobre as fotos.
