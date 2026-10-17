# Pendências

## Do cliente (bloqueiam a publicação)

| Item | Onde entra | Situação |
|---|---|---|
| Nome | `src/config/salon.ts` → `name` | **Salão Iolanda**, informado |
| Logo oficial (SVG de preferência) | cabeçalho e rodapé; base da paleta | **Não recebida.** O cabeçalho mostra o nome em texto, sem recriar a marca. A paleta escura atual segue o briefing e será conferida com a logo |
| Endereço | Agendamento / Localização, link "Como chegar" | Rua Castro Alves, 2995 — Cascavel/PR, informado |
| Instagram | botão de contato | https://www.instagram.com/salaoiolanda/, informado |
| Telefone | Agendamento | 3224-7223 informado **sem DDD confirmado**: exibido como texto, sem link `tel:` |
| WhatsApp (número completo, com DDD) | `salon.whatsapp` → ativa o botão | **Pendente.** Botão desativado ("WhatsApp em breve"); ao ativar, o texto diz que abre uma conversa, nunca que o agendamento foi feito |
| Horários de atendimento | Agendamento / Localização | **Pendente.** Exibido "a confirmar"; nenhum horário inventado |
| Mechas e coloração | lista de serviços | Marcado "a confirmar", como no briefing |
| Preços, duração, promoções | — | Não exibidos (não informados) |
| Fotos autorizadas de trabalhos do salão | Portfólio (fase 7) | Não recebidas; nenhuma foto ilustrativa usada como trabalho do salão; nada copiado do Instagram |
| Esmalte | rótulo do frasco | Produto **genérico demonstrativo** ("Rosé · Esmalte Nº 01"), sem marca atribuída ao salão |

## Técnicas (próximas fases)

- Fase 6: objetos secundários (secador, escova, tesoura, pente, batom, pincel de
  maquiagem, frasco capilar) e a coreografia entre eles.
- Fase 7: seções Hero, Sobre, Serviços, Tratamentos, Portfólio, Agendamento,
  Localização e horários, Rodapé.
- Transição contínua da última composição 3D para a seção de serviços
  (hoje a seção seguinte entra por rolagem comum).
- Imagens de fallback: quadros reais desta cena, gerados por
  `node scripts/posters.mjs` (servidor de desenvolvimento rodando). Regerar
  sempre que a cena mudar.
- Medir LCP, CLS e INP em aparelho real e Lighthouse mobile; não há números
  medidos ainda. Os testes automáticos rodam WebGL no SwiftShader (CPU): provam
  que a cena desenha e responde à rolagem, **não** provam fluidez em GPU real.
- Testar em iPhone (Safari) e Android de entrada com GPU real antes de publicar.
- Avaliar modelos GLB feitos em Blender para os objetos secundários (os atuais
  são procedurais). A peônia e o esmalte procedurais não têm qualidade
  fotográfica: são modelos em tempo real, com materiais físicos e luz de estúdio.
