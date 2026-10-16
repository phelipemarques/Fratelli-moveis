# Parada do Mano — pendências para confirmar com o restaurante

Nada aqui foi inventado no site: o que não foi confirmado aparece como
"sob consulta" ou como quadro provisório. Esta lista diz o que pedir e onde entra.

## 🔴 Bloqueiam a publicação

| # | O que pedir | Formato | Onde entra |
|---|---|---|---|
| 1 | **Fotografias reais** dos 22 espaços (lista em `tools/fotos-pendentes.txt`) | JPG/PNG originais, o maior tamanho disponível, sem filtro. Prints do Instagram servem, sem cortar a imagem | `tools/source/<nome>.jpg` → rodar `tools/prepare-images.py` |
| 2 | **Logo oficial** | SVG, ou PNG com fundo transparente, versão para fundo escuro | cabeçalho e rodapé (hoje: nome em texto) e favicon (hoje: chama provisória) |
| 3 | **WhatsApp** (45) 99825-8916 — confirmar que é o número de atendimento | — | 20 botões e links (busca por `5545998258916` no `index.html`) |
| 4 | **Horário** seg a dom, 06h às 23h30 — confirmar, inclusive feriados | — | abertura, seção O restaurante, cardápio (café e jantar), contato, menu do celular, rodapé, dados estruturados |
| 5 | **Endereço** BR-277, km 594, Cascavel/PR — confirmar e dizer se há referência (posto, sentido da pista) | — | contato, rodapé, dados estruturados; o botão de rota busca esse texto no Google Maps |
| 6 | **Autorização para publicar** e domínio | — | `noindex` no `index.html`, `robots.txt`, `og:image` com URL absoluta |

## 🟡 Dados comerciais ainda "sob consulta" no site

| Item | Situação na prévia | O que perguntar |
|---|---|---|
| Espeto corrido aos domingos | Divulgado. **Preço não aparece.** Uma publicação mostrava R$ 66,90 por pessoa — não foi usado por não estar confirmado como vigente | Valor atual por pessoa, horário do rodízio, se inclui buffet/acompanhamentos, se é todo domingo |
| Feijoada às quartas e sábados | Divulgado. Sem preço, sem acompanhamentos | Valor, o que acompanha, horário, se é no buffet ou à parte |
| Buffet | Mostrado como "buffet" com os tipos de prato das fotos | **Livre ou por quilo?** Valores, horário do almoço |
| Café da manhã | Só "a partir das 06h" (horário de abertura) | O que é servido, valores, até que horas |
| Jantar | Só "até 23h30" (horário de fechamento) | O que é servido à noite (buffet, à la carte, lanches?) |
| Carnes e churrasco | "Carnes assadas na churrasqueira" | Cortes, se há churrasco fora do domingo, valores |
| Lanches e salgados | Só que a casa é lanchonete (está no nome) | Lista e valores |
| Sobremesas | Categoria proposta, **sem nenhuma informação** | Existe? Quais? — se não existir, apagar a aba |
| Bebidas | Categoria proposta, **sem nenhuma informação** | Lista e valores |
| Entrega, marmita, reserva | **Não mencionados em lugar nenhum** do site | Se existirem, dá para incluir um bloco |
| Formas de pagamento, estacionamento para caminhão/ônibus | Não mencionados | Se existirem, valem destaque para quem está na estrada |

## ⚪ Propostas minhas, sujeitas a aprovação

- Título da abertura "Do fogo à mesa. Sabor de verdade." (sugerido no briefing) e os títulos das seções:
  "Uma parada para cada hora do dia", "Variedade que enche o prato", "A brasa acende. O sabor acontece.",
  "O que tem no Parada", "Comida de verdade", "Chegue com fome".
- Textos de apoio curtos de cada seção — revisar se o tom combina com a casa.
- Categorias do cardápio (10) — organização proposta pelo briefing; apagar as que não existirem.
- Mensagens pré-escritas do WhatsApp em cada botão ("Olá! Gostaria de saber...").
- Faixa laranja com os momentos do dia correndo sob a abertura.
- Placa "BR 277 / km 594" desenhada em CSS (elemento gráfico, não é foto nem logo).
- Barra fixa no celular com Cardápio / WhatsApp / Rota, que aparece depois da abertura.
- Fontes Anton (títulos), Barlow e Barlow Condensed (texto e rótulos) — escolhidas por serem
  condensadas e fortes como os posts; trocar se a identidade oficial usar outras.
- Textos alternativos (`alt`) descrevem o que cada foto **deve** mostrar. Revisar quando as fotos chegarem.

## Vídeo (opcional)

O briefing cita vídeo real. Se o restaurante tiver um vídeo curto da churrasqueira ou do buffet
(10–20 s, sem som, horizontal), ele pode entrar como fundo da seção Churrasco no lugar da foto
`churrasco-brasa`, com a foto como pôster e respeitando o movimento reduzido.
