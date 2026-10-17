# Pendências — Salão Iolanda V4

## Antes de publicar (do salão)

| Item | Onde entra | Situação |
|---|---|---|
| **Confirmar que (45) 3224-7223 recebe WhatsApp** | todos os botões de agendamento (`salon.whatsapp`) | Número informado pelo cliente e já usado em todos os links (`https://wa.me/554532247223`). Por ser um número com prefixo de fixo, testar o envio de uma mensagem antes de publicar |
| Logo oficial em arquivo (SVG ou PNG em alta) | cabeçalho, rodapé, favicon, imagem de compartilhamento | **Não recebida.** O cabeçalho usa o nome em texto. O losango usado como detalhe gráfico vem da forma da logo vista no Instagram, sem reproduzi-la. Com o arquivo: preencher `salon.logo` e conferir a paleta |
| Capturas do Instagram e vídeo de referência citados no briefing V4 | direção de arte, portfólio | **Não chegaram nesta conversa.** A identidade foi aplicada a partir da descrição do briefing (losango, base preta, nome em vermelho, ornamentos) |
| Fotos autorizadas de trabalhos | Portfólio (8 quadros), serviços (5), cabelos (1) | Espaços reservados identificados como "Foto autorizada pendente". Nada copiado do Instagram; nenhuma imagem gerada ou ilustrativa apresentada como trabalho do salão |
| Foto do ambiente ou fachada | seção O salão | Espaço reservado identificado |
| Autorização das clientes que aparecem nas fotos | Portfólio | Necessária antes de publicar qualquer foto de pessoa |
| Horários de atendimento | Contato (`salon.hours`) | Não informados. O site diz "Consulte o salão pelo WhatsApp" |
| Lista detalhada de serviços de estética | Serviços | O Instagram mostra só a categoria "Estética"; o site não lista procedimentos |
| Coloração | Serviços / Cabelos | Não aparece no briefing V4 como destaque; o site mostra **mechas** (destaque do Instagram) e não menciona coloração |
| Preços, duração, equipe, avaliações, prêmios, estacionamento, acessibilidade do prédio | — | Não exibidos (não informados) |
| Domínio do site | `SITE_URL` no build | Sem domínio, o build não gera canonical, `og:url` nem sitemap |

## Técnicas

- **Fluidez em aparelho real.** Os testes automáticos rodam WebGL no SwiftShader
  (renderização por CPU, sem GPU): provam que a cena desenha, segue a rolagem e
  volta, mas **não** medem fluidez. Testar em iPhone (Safari) e Android de entrada
  antes de publicar.
- **Lighthouse e Web Vitals** foram medidos em laboratório (ver relatório). LCP,
  CLS e INP de campo só existem depois de publicado.
- Objetos 3D secundários além da escova (secador, tesoura, pente, pincel de
  maquiagem): **não incluídos de propósito**. O briefing pede começar por um e
  só expandir após aprovação.
- Modelos externos (GLB feitos em Blender) poderiam dar mais realismo à flor e à
  escova; os atuais são procedurais, em tempo real, e não têm qualidade fotográfica.
- Imagem de compartilhamento (`public/og.jpg`) é um quadro da própria cena com o
  nome do salão em texto. Trocar quando a logo chegar.
- Ao trocar a logo ou as cores, regerar `public/posters/` e `public/og.jpg`
  com `node scripts/posters.mjs` (servidor de desenvolvimento rodando).
