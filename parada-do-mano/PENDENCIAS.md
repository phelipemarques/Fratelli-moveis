# Parada do Mano — pendências para confirmar com o restaurante

Atualizado depois do envio das referências (3 fotos do buffet e 2 prints do Instagram).
Nada no site foi inventado: o que não foi confirmado aparece como "sob consulta".

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
| 1 | **Autorização para publicar** e o domínio | `noindex` no `index.html`, `robots.txt`, `og:image` com URL absoluta |
| 2 | Confirmar que o **WhatsApp** (45) 99825-8916 é o de atendimento e que o **endereço** BR-277, km 594 basta para chegar (posto ou referência, sentido da pista) | 20 links de WhatsApp, contato, rodapé, dados estruturados, botão de rota |
| 3 | Confirmar que as **artes dos posts** (feijoada e rodízio) podem ir para o site. Se a foto da feijoada ou das carnes dentro da arte veio de banco de imagens, a licença precisa cobrir uso em site | seção Feijoada, bloco do espeto corrido, cardápio |

## 🟡 Fotos: estão no site, mas pedem os arquivos originais

As 10 fotos e a logo vieram de prints, com **150 a 750 px**. Foram recortadas, limpas de ruído de
compressão e ampliadas 4x com o EDSR (`tools/enhance-photos.py`). Ficaram boas para tela, mas os
originais do celular vão ficar bem mais nítidos — principalmente na abertura e nas fotos grandes.

| Foto no site | Veio de | Pedir |
|---|---|---|
| Arroz e saladas (abertura, buffet, imagem de compartilhamento) | foto enviada, 488×279 | o original do celular |
| Saladas e ovos | foto enviada, 454×752 | o original |
| Legumes | foto enviada, 493×279 | o original |
| Saladas decoradas, pratos quentes | posts do Instagram, ~310 px | os originais |
| Espeto na brasa, fogão a lenha | post e story do Instagram, ~310 px | os originais ou um vídeo curto |
| Fachada | post do Instagram, recorte de 197 px (o ônibus com a arte do cantor ficou de fora) | uma foto da fachada sem veículos na frente |
| **Logo** | avatar do perfil, 150 px | **arquivo vetorial (SVG/PDF/AI) ou PNG grande** |

Como trocar: salvar em `tools/source/<nome>.jpg` (nomes na tabela de `tools/prepare-images.py`)
e rodar `python3 tools/prepare-images.py`. Para a logo, `tools/source/logo.png` com fundo transparente.

**Faltam fotos de:** café da manhã (o cartão do café usa um painel gráfico com "06h"), salão,
lanches, sobremesas e bebidas.

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

## Vídeos

| Arquivo | Uso | Observação |
|---|---|---|
| `assets/video/parada-do-mano-abertura.mp4` / `.webm` | fundo da abertura do site, no computador | sem texto, em loop, 17 s; no celular fica a foto |
| `parada-do-mano-video-vertical.mp4` | Reels, Stories, status do WhatsApp | 1080×1920, 27 s, textos acima da área da legenda do Instagram |
| `parada-do-mano-video-horizontal.mp4` | Facebook, YouTube, TV do salão | 1920×1080, 27 s |

**Sem trilha sonora** de propósito: música só com licença. No Instagram dá para escolher uma das
músicas liberadas na hora de postar. Se o restaurante tiver vídeos reais da churrasqueira
(10–20 s, celular na horizontal), eles substituem com vantagem o movimento feito sobre as fotos.
