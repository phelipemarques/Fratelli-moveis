# Pendências

## Do cliente (bloqueiam a publicação)

| Item | Onde entra | Situação |
|---|---|---|
| Nome do salão | `src/config/salon.ts` → `name` (cabeçalho, rodapé, título) | Provisório: "Seu Salão" |
| Logo (SVG de preferência) | cabeçalho, rodapé, rótulo do frasco (opcional) | Não recebido |
| Endereço e link do mapa | seção Localização (fase 7) | Não recebido |
| WhatsApp | `salon.whatsapp` → ativa o botão de agendamento | Não recebido; botão desativado com aviso |
| Instagram | rodapé | Não recebido |
| Horários | seção Localização | Não recebido |
| Lista real de serviços | seção Serviços e Tratamentos | Categorias atuais são **demonstrativas** |
| Fotos autorizadas de trabalhos | Portfólio | Não recebidas; nenhuma foto ilustrativa foi usada como prova |
| Cor do esmalte / nome do tom | rótulo do frasco (`Polish` em `src/three/stage.ts`) | Provisório: "Rosé", `#a3284f` |

## Técnicas (próximas fases)

- Fase 6: objetos secundários (secador, escova, tesoura, pente, batom, pincel de
  maquiagem, frasco capilar) e a coreografia entre eles.
- Fase 7: seções Hero, Sobre, Serviços, Tratamentos, Portfólio, Agendamento,
  Localização e horários, Rodapé.
- Transição contínua da última composição 3D para a seção de serviços
  (hoje a seção seguinte entra por rolagem comum).
- Imagens de fallback: hoje são quadros reais desta cena, capturados por
  `scripts/capture.mjs`. Regerar sempre que a cena mudar.
- Medir LCP, CLS e INP em aparelho real e Lighthouse mobile; não há números
  medidos ainda.
- Avaliar modelos GLB feitos em Blender para os objetos secundários (os atuais
  são procedurais). A peônia e o esmalte procedurais não têm qualidade
  fotográfica: são modelos em tempo real, com materiais físicos e luz de estúdio.
