# Relatório — Salão Iolanda V4

Prévia para aprovação, não publicada. Versão anterior preservada em
`salao-cinematografico/`; esta versão está em `salao-iolanda-v4/`.

## 1. Auditoria da versão anterior (fase 1)

Executada no navegador antes de qualquer mudança, com capturas nos mesmos
instantes da timeline usados depois (`scripts/shots.mjs`, pasta `docs/capturas/`).

**Funcionando e preservado:** flor abrindo camada por camada, esmalte surgindo
do centro, frasco girando, tampa desenroscando pelo passo da rosca, pincel saindo
sem atravessar o vidro, gota; tudo reversível; capítulos de texto sincronizados;
fallback sem WebGL; movimento reduzido.

**Encontrado:**

- Site resumido a uma lista de categorias e um cartão de agendamento; sem
  navegação, portfólio, localização ou destaque de cabelos.
- WhatsApp desativado e textos "WhatsApp em breve" / "DDD a confirmar".
- Ombro do frasco facetado (perfil com poucos pontos); tampa marrom fora da paleta da marca.
- A sequência terminava no pincel, sem passagem para a marca nem para o site.
- Testes de rolagem falhavam no navegador de teste: cada quadro em 1440×900 custa
  ~2,4 s no WebGL por CPU e o scrub não acompanhava.

## 2. Alterações

| Problema | Alteração | Benefício esperado | Teste | Resultado |
|---|---|---|---|---|
| Sequência acabava no pincel | Fases 7–9: o esmalte sai pela diagonal, câmera recua, fundo vira preto com halo bordô, entra "SALÃO *Iolanda*" e a escova redonda | A marca assume o protagonismo; ponte para os serviços de cabelo | Playwright: estados `polishX`, `brushScale`, capítulo 5 visível; reverso volta ao início | Aprovado (desktop e mobile) |
| Objeto secundário | Escova redonda procedural (cabo laqueado, anel champagne, tambor rosé, 324 cerdas em 2 chamadas de desenho) | Liga a abertura ao destaque de cabelos sem carregar modelo pesado | Capturas 1440, 390, 320 | Legível, sem cobrir o texto depois do ajuste mobile |
| Ombro do frasco facetado | Perfil do vidro e do líquido por spline (72 pontos), 128 segmentos | Silhueta contínua | Capturas antes/depois | Quinas não aparecem mais |
| Tampa marrom | Preto laqueado com brilho bordô leve | Coerente com a base preta da marca | Capturas | — |
| Engasgo na primeira aparição da escova e do vidro | `Stage.warmup()` compila todos os shaders antes de ligar a rolagem | Sem travada na transição em aparelhos reais | Teste de reverso e redimensionamento | Falhavam antes da correção; passam depois |
| Identidade genérica | Paleta do briefing (preto #100D10, bordô #7E2338, rosé #DCA7B4, champagne #D5BEA5, off-white #FAF7F4); losango da logo como detalhe gráfico; nome em caixa alta espaçada | Ligação com a marca real sem recriar a logo | axe (contraste) | 0 violações |
| Hero sem dados comerciais | "Seu momento de beleza começa aqui.", subtítulo do briefing, "Agendar meu horário" (WhatsApp) e "Conhecer os serviços", endereço | Visitante entende onde está e como agendar | Playwright: h1, links | Aprovado |
| Site incompleto | Seções O salão, Serviços, Cabelos, Portfólio, Agendamento, Localização e contato, rodapé | Site comercial completo | Playwright + capturas em 10 tamanhos | Aprovado |
| WhatsApp desligado | `https://wa.me/554532247223` em todos os botões, com mensagem geral e mensagens por serviço; número só em `src/config/salon.ts` | Conversão | Playwright: todos os links, texto decodificado, `target`/`rel` | Aprovado (19 links) |
| Sem localização | Endereço, "Como chegar" (Google Maps, consulta codificada), telefone `tel:+554532247223`, Instagram | Encontrar o salão | Playwright: URL exata | Aprovado |
| Portfólio inexistente | Grade assimétrica com filtro; lightbox em `<dialog>` com setas, Esc, arraste lateral, legenda, contador e foco devolvido | Pronto para fotos autorizadas | Playwright (teclado e toque) | Aprovado |
| Fotos inexistentes | Espaços reservados identificados "Foto autorizada pendente" | Não apresentar imagem ilustrativa como trabalho do salão | Playwright: todo `.ph` tem o aviso | Aprovado |
| Navegação | Cabeçalho com Início, O salão, Serviços, Portfólio, Contato e "Agendar horário"; menu mobile em `<dialog>`; barra inferior no celular (WhatsApp e Como chegar) | WhatsApp a um toque sem atravessar a animação | Playwright (menu, barra, rodapé não coberto) | Aprovado |
| Transição de cor deixava texto escuro sobre preto | Cada seção com fundo próprio; a nova cor entra como painel que se abre com a rolagem | Contraste garantido o tempo todo | axe | Era 10 nós com contraste 1,9–2:1; agora 0 |
| Rolagem lateral de 5–14 px em telas estreitas | Quadro da foto corta a escala inicial da revelação | Sem rolagem horizontal | Playwright em 10 tamanhos | Aprovado |
| Botão do cabeçalho em duas linhas no celular | Some abaixo de 700 px (a barra inferior assume) | Cabeçalho limpo | Capturas 320–430 | Corrigido |
| Texto e objeto disputando espaço em celulares baixos | Texto compacto e objeto mais alto em telas ≤ 700 px de altura | Nada essencial coberto | Capturas 320×568, 375×667 | Corrigido |
| SEO | Título, descrição, Open Graph, Twitter Card, favicon, JSON-LD `BeautySalon` (sem avaliações nem horários), robots; canonical e sitemap gerados quando houver domínio | Pronto para publicar | Playwright: JSON-LD, `noindex`, robots | Aprovado |
| Conteúdo dependia de JS | HTML das seções gerado no build a partir dos dados | Funciona sem JS e é indexável | Playwright com JS desligado | Aprovado |

## 3. Testes

Ambiente: contêiner Linux, Chromium headless do Playwright 1.56. **WebGL por
SwiftShader (CPU, sem GPU)**: os testes provam que a cena desenha, segue a
rolagem e volta; não medem fluidez em aparelho real. Nos testes de rolagem o
canvas usa `?dpr=0.3` (só a resolução cai; a lógica é a mesma).

### Playwright (build de produção, `npm test`)

54 testes em dois projetos (desktop 1440×900 e mobile Pixel 7 390×844). Os 15
"pulados" são testes de um projeto só (roda do mouse e teclado só no desktop;
menu, toque e barra só no mobile; os 10 tamanhos rodam uma vez).

| Rodada | Resultado | O que mostrou |
|---|---|---|
| 1ª | 30 aprovados, 9 falhas | 7 tamanhos com rolagem lateral de 5–14 px (foto da revelação); reverso e redimensionamento travados pela compilação de shaders na primeira aparição da escova e do vidro |
| 2ª (após correções) | 39 aprovados, 0 falhas | — |
| 3ª (após a nova transição de cor) | 38 aprovados, 1 falha | o teste de redimensionamento comparava a volta da tampa com precisão maior que a tolerância de assentamento do próprio teste; corrigido o teste (espera o scrub assentar) e rodado 3 vezes isolado: 3 aprovados |

Cobertura: carga sem erros de console; canvas desenhado; sequência completa
pela rolagem (flor → esmalte → giro → tampa → pincel → marca → escova); rolagem
reversa até o estado inicial; roda do mouse lenta e rápida; redimensionamento no
meio da sequência; "Pular apresentação" pelo teclado; movimento reduzido; sem
WebGL; sem JavaScript; todos os links de WhatsApp (número, mensagem, nova aba);
Google Maps (URL exata), telefone e Instagram; ausência de preço, avaliação,
horário e promoção; espaços de foto identificados; título, descrição, JSON-LD,
`noindex` e robots; filtro e lightbox do portfólio (teclado, toque, contador,
foco devolvido); menu mobile (Esc, foco); barra inferior sem cobrir o rodapé;
10 tamanhos (320×568, 360×800, 375×667, 390×844, 414×896, 430×932, 768×1024,
1024×768, 1440×900, 1920×1080) sem rolagem lateral e sem botão ou título cortado.

### Acessibilidade (axe-core, WCAG 2.0/2.1/2.2 A e AA + boas práticas)

`node scripts/axe.mjs <axe.min.js>` no build de produção, depois de percorrer as seções.

| Cenário | 390×844 | 1440×900 |
|---|---|---|
| Com 3D | 0 violações (45 regras aprovadas) | 0 violações (45) |
| Sem WebGL + movimento reduzido | 0 violações (46) | 0 violações (46) |

Antes da correção da transição de cor: 1 regra violada (contraste, 10 nós,
1,9–2:1). O axe marca "contraste a revisar" nos textos sobre o canvas 3D e sobre
degradês, que ele não consegue medir; esses textos ficam sobre fundo escuro e
véu, revisados nas capturas.

### Lighthouse 12 (laboratório, build de prévia, 3 execuções, mediana)

Chromium headless sem GPU, perfil padrão do Lighthouse (mobile com limitação de CPU e rede).

| Perfil | Desempenho | Acessibilidade | Boas práticas | SEO | LCP | FCP | CLS | TBT | Peso inicial |
|---|---|---|---|---|---|---|---|---|---|
| Mobile | 99 (98–99) | 100 | 100 | 66* | 1,93 s | 1,66 s | 0,001 | 65 ms | 176 KB |
| Desktop | 100 | 100 | 100 | 66* | 0,44 s | 0,38 s | 0,001 | 0 ms | 169 KB |

\* SEO 66 na prévia por causa do `noindex` intencional. O mesmo site gerado com
`PUBLICAR=1` marcou **SEO 100** (1 execução, mobile).

O peso inicial não inclui o Three.js (~137 KB gzip), que só é baixado depois que
o texto aparece. INP não foi medido: depende de interação real de visitantes.

### Capturas

`docs/capturas/`: comparação antes/depois nos mesmos instantes e seções
(`comparacao-1440x900-*.jpg`, `comparacao-390x844-*.jpg`) e todas as capturas da
V4 (`v4/`): estado inicial, flor parcial e aberta, esmalte surgindo e girando,
tampa, pincel saindo e revelado, transição para a marca, marca, e as seções
O salão, Serviços, Cabelos, Portfólio, Agendamento e Contato.

## 4. Critérios de aceitação

| Critério | Situação |
|---|---|
| Preservar a animação 3D existente | Sim: fases 1–6 com os mesmos instantes; testes de estado passam |
| Flor abre, esmalte gira, tampa desenrosca, pincel sai | Sim (Playwright, desktop e mobile) |
| Scroll reverso | Sim (Playwright, desktop e mobile) |
| Identidade do Salão Iolanda | Aplicada pela descrição do briefing; **logo em arquivo pendente** |
| Tipografia e hierarquia | Instrument Serif (títulos, marca) + Manrope (texto) |
| Serviços organizados | Sim, 5 categorias divulgadas, sem preço |
| Portfólio preparado | Sim, com espaços reservados identificados |
| WhatsApp configurado | Sim; **confirmar recebimento no número antes de publicar** |
| Endereço correto | Sim |
| Mobile refinado | Sim, verificado de 320 a 430 px |
| Fallback sem WebGL | Sim (Playwright) |
| Sem erros de console | Sim nos testes (Playwright falha em qualquer erro) |
| Larguras previstas | Sim, 10 tamanhos |
| Código organizado | Dados em `src/config`, conteúdo em `src/content`, site em `src/site`, 3D em `src/three` |
| Testes reais | Sim, com a ressalva do WebGL por CPU |
| Prévia pronta | `salao-iolanda-v4-visualizacao.html` e `salao-iolanda-v4-producao.zip` |

## 5. Limitações

- **WebGL nos testes é por CPU (SwiftShader).** Prova que a cena desenha e
  responde à rolagem nos dois sentidos, não prova fluidez. Teste em iPhone e
  Android com GPU antes de publicar.
- Lighthouse é medição de laboratório. Os números de campo (LCP, CLS e INP de
  visitantes reais) só existem depois de publicado.
- Flor e escova são procedurais, em tempo real: não têm qualidade fotográfica.
- Capturas do Instagram, vídeo de referência e logo não chegaram com o briefing V4.
