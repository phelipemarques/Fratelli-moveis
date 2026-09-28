# QA — GRO Cascavel

Data: 28/09/2026. Ferramenta: Chromium (Playwright 1.56) em modo headless,
servidor local `python3 -m http.server`. Capturas em `docs/capturas/`.

## O que foi implementado

- Página única: header, hero, posicionamento + diferenciais, soluções, faixa
  fotográfica, para empresas + como funciona, sobre, contato + mapa, rodapé.
- Header transparente sobre o hero, sólido (off-white com desfoque) após 24 px de
  rolagem, some ao descer abaixo do hero e volta ao subir.
- Menu móvel em tela cheia abaixo de 1024 px, com `aria-expanded`, Esc, foco
  preso dentro do menu e trava de rolagem.
- WhatsApp: todos os botões abrem `wa.me/5545991068333` com mensagem
  pré-preenchida; cada solução tem mensagem própria. Botão flutuante aparece
  depois de ~metade do hero (antes disso o botão do hero já está visível).
- Movimento: fade + translateY, revelação de linhas do título, clip-path nas
  imagens, parallax de no máximo 2,5%, linha do "Como funciona" desenhada em
  sequência. Só `transform`, `opacity` e `clip-path`. Sem bibliotecas.
- SEO: title e description do briefing, H1 único, H2 por seção, canonical,
  Open Graph com imagem 1200×630, favicon SVG, ícone Apple, `robots.txt`,
  `sitemap.xml`, dados estruturados `MedicalBusiness` (sem coordenadas).
- Fontes locais (sem requisição ao Google Fonts), subconjunto latino.

## O que foi testado e como

| Verificação | Como | Resultado |
|---|---|---|
| Rolagem horizontal | `scrollWidth` vs. largura útil em 390, 430, 768, 1024, 1440, 1920 px | Nenhuma, nas 6 larguras |
| Elementos saindo da tela | varredura de `getBoundingClientRect` de todos os elementos | Nenhum (após correção 2) |
| Console | erros e avisos em todas as larguras | Limpo |
| Recursos quebrados | respostas ≥ 400 e requisições falhas (exceto Google) | Nenhuma |
| Âncoras do menu | toda `href="#…"` tem alvo | Todas válidas |
| H1 único | contagem | 1 |
| Entradas no scroll | rolagem da página inteira, contagem de `[data-reveal]` sem `.is-in` | 0 de 41 pendentes |
| Header | estados no topo, a 700 px, descendo e subindo (1440×900) | Transparente → sólido → oculto → volta |
| Menu móvel (390×844) | abrir, foco, Esc, clicar em "Sobre" | Abre com foco no 1º link; Esc fecha e devolve foco ao botão; link rola até a seção e fecha o menu |
| Teclado (1440) | sequência de Tab | Pular para o conteúdo → logo → 5 links → CTA → botão do hero; contorno de foco de 2 px em todos |
| `prefers-reduced-motion` | contexto com `reducedMotion: 'reduce'` | 41/41 elementos visíveis de imediato, parallax desligado |
| Contraste (WCAG) | cálculo de razão de contraste dos pares usados | Todos ≥ 4,5:1 (menor: 4,90 no rótulo do espaço reservado claro) |
| HTML | balanceamento de tags, ids duplicados, `img` sem alt | Sem erros |
| Desempenho (390×844, local) | Performance API | Peso total ~238 KB; CLS 0; LCP 0,08–1,2 s entre execuções |

## Problemas encontrados e correções

1. **Textos com fade nunca apareciam.** O seletor que escondia os elementos tinha
   especificidade maior que o que os revelava. Trocado por `[data-reveal=""]`.
2. **Mapa estourava a largura no celular** (491 px numa tela de 390). `min-height`
   + `aspect-ratio` forçavam a largura. Removido o `min-height` no mobile.
3. **Imagens e linhas do título não eram detectadas pelo IntersectionObserver.**
   Um alvo com `clip-path` total, ou deslocado para fora de um pai com
   `overflow: hidden`, não conta como visível. Agora o observador acompanha o
   contêiner e o recorte fica nos filhos.
4. **Título do hero em 4 linhas no desktop.** Escala reduzida de 8,25 rem para
   7,25 rem no máximo; agora são 2 linhas a partir de 1024 px.
5. **Rótulo da faixa fotográfica cortado** pela escala do parallax. Margens do
   rótulo e das marcas de corte passaram a ser proporcionais (6%).
6. **Brilho verde atrás do logo** com header sólido: o desfoque do header
   capturava o link "Pular para o conteúdo" escondido acima da tela. O link agora
   fica com opacidade 0 até receber foco.
7. **LCP de ~1,5 s** porque o texto de apoio do hero entrava com fade longo.
   Entrada do hero encurtada (450 ms); LCP local caiu para até 1,2 s.

## O que não foi testado

- **Mapa do Google** — o proxy deste ambiente bloqueia `google.com` (403). O
  iframe usa a URL pública de incorporação por endereço; atrás dele há um texto
  de reserva com o endereço. Conferir num navegador comum.
- **Links do WhatsApp e do Instagram** — conferidos no código (número, codificação
  da mensagem), mas não abertos: também são domínios externos bloqueados aqui.
- **Safari/iOS e Firefox** — só Chromium disponível. Pontos a olhar: `svh`,
  `backdrop-filter` (tem prefixo `-webkit-`), `clip-path` com transição.
- **Leitor de tela real** (NVDA, VoiceOver) — a estrutura semântica e os rótulos
  foram revisados no código, sem teste com leitor.
- **Rede lenta real** — o LCP foi medido em servidor local, sem limitação de rede.
- **Fotos reais** — o comportamento com imagens (peso, `srcset`, recorte) só
  poderá ser validado quando chegarem. As instruções estão no README.

## Avaliação (opinião, não medição)

- Em 5 segundos dá para saber o que a GRO faz, onde fica e como falar com ela:
  o hero tem serviço, cidade, endereço, horário e WhatsApp.
- O ponto fraco da prévia são os três espaços reservados. O layout foi pensado
  para fotografia grande; sem as fotos, o site parece mais técnico e mais frio
  do que deve ficar. É a pendência que mais muda a percepção final.
