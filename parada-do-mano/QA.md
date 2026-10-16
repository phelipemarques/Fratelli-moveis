# Parada do Mano — QA

Rodada de 16/10/2026. Ferramenta: Chromium 141 (Playwright 1.56) em modo headless,
servindo a pasta com `python3 -m http.server`. Script: `tools/qa-browser.mjs`.
**Resultado: 75 de 75 verificações automáticas passaram**, depois das correções listadas abaixo.

## 1. O que foi implementado

- Página única em HTML, CSS e JavaScript puros, sem framework e sem biblioteca de animação.
- Seções: abertura · faixa de momentos · O restaurante (café, almoço, jantar + atalhos buffet/churrasco)
  · Buffet (mosaico de 7 fotos) · Churrasco + espeto corrido · Feijoada · Cardápio em 10 abas
  · Galeria com foto ampliada · Contato e localização · rodapé · barra de ações no celular.
- 22 espaços de foto com quadros provisórios identificados, gerados pelo `tools/prepare-images.py`
  nas proporções finais. Nenhuma foto de banco, nenhuma imagem gerada simulando comida.
- Prévia em arquivo único (`parada-do-mano-visualizacao.html`, 1,1 MB) e ZIP de produção
  (`parada-do-mano-site.zip`, 62 arquivos, 0,7 MB).

## 2. Animações implementadas

| # | Animação | Como | Movimento reduzido |
|---|---|---|---|
| 01 | Entrada da abertura: fundo imediato → foto com recuo de zoom (1,10 → 1) → etiqueta → título linha a linha subindo de uma máscara → subtítulo → botões → destaques → placa do km | CSS `@keyframes`, só `transform`/`opacity`, ~1,9 s no total; a página é clicável desde o primeiro quadro | desligada |
| 02 | Revelação na rolagem (subida curta + opacidade; cartões em sequência; fotos com cortina que recolhe e imagem que assenta) | `IntersectionObserver`; a classe que esconde só entra quando o observer existe | conteúdo aparece direto |
| 03 | Calor da churrasqueira: brilho âmbar que "respira" e 7 brasas pequenas subindo devagar | dois elementos CSS, sem canvas, sem blur | brasas removidas, brilho parado |
| 04 | Cartões: zoom leve da foto, elevação, borda/linha laranja, seta que anda | `@media (hover: hover)`; no toque, `:active` dá retorno (escala/cor) | transições instantâneas |
| 05 | Cardápio: troca imediata de painel com entrada curta (opacidade + 8 px, 0,32 s) | animação CSS reiniciada a cada troca | sem animação |
| 06 | Galeria: zoom leve, legenda sobe, botão de ampliar aparece; foto ampliada com troca suave | `<dialog>` nativo | instantâneo |
| 07 | Botões: fundo que desliza, seta que anda 4 px, foco visível em dourado | `::before` com `transform` | instantâneo |
| 08 | Menu do celular: painel desce com opacidade, links entram em sequência, ícone vira X | CSS + `hidden`/`inert` | instantâneo |
| — | Linha do dia que se preenche entre café, almoço e jantar (desktop) | `scaleX` na entrada da seção | preenchida |
| — | Faixa laranja de momentos correndo, pausa no hover | `translateX` em loop | vira texto parado em linhas |

## 3. Testes executados (automáticos)

Em cada tamanho: **320×568, 360×800, 375×667, 390×844, 430×932, 768×1024, 1440×900, 1920×1080**

| Verificação | Resultado |
|---|---|
| Sem rolagem horizontal (`scrollWidth` = largura da tela, mais busca por elementos passando da borda) | OK nos 8 |
| Todas as imagens visíveis carregadas depois de rolar a página inteira | OK nos 8 |
| Console sem erros nem avisos; nenhuma requisição com falha ou 404 | OK nos 8 |
| Nenhum conteúdo preso invisível depois da rolagem | OK nos 8 |
| Um único `h1` | OK |
| Foto da abertura começando na metade de cima da primeira tela | OK nos 8 (no celular a foto ocupa o topo, de 0 a ~470 px em 390×844) |

Interações (Chromium):

| Verificação | Resultado |
|---|---|
| Menu abre, `aria-expanded="true"`, foco no primeiro link, resto da página `inert` | OK |
| Tab fica preso dentro do menu aberto | OK |
| Escape fecha e devolve o foco ao botão | OK |
| Link do menu leva à seção e fecha o painel | OK |
| Cardápio: só uma categoria visível; clique troca; **a página não pula** (scrollY igual antes e depois) | OK |
| Cardápio: setas, Home e End; `aria-selected` e `tabindex` coerentes; botões Anterior/Próxima | OK |
| Galeria: abre a foto certa, seta avança, Escape fecha e devolve o foco | OK |
| `prefers-reduced-motion: reduce`: sem animação de entrada, sem brasas, faixa parada, nada escondido | OK |
| JavaScript desligado: as 10 categorias do cardápio aparecem em sequência e nenhum conteúdo fica oculto | OK |
| Prévia em arquivo único aberta por `file://`: sem erros, fontes e imagens carregadas, abas funcionando | OK |

Capturas analisadas visualmente: primeira tela nos 8 tamanhos, página inteira, cada seção em
1440×900 e 390×844, menu aberto, cardápio, galeria ampliada e movimento reduzido.

## 4. Problemas encontrados e correções

| Problema | Correção |
|---|---|
| Acento do "À" de "À MESA" cortado pela máscara da animação do título | máscara ganhou folga em cima (padding com margem negativa) e a linha ganhou espaço extra para o acento não encostar em "DO FOGO" |
| Título "Uma parada para cada hora do dia" quebrando em 4 linhas no desktop | escala dos títulos de seção reduzida (máx. 4,8 rem) |
| Na linha do dia (desktop), os cartões em degrau deixavam os marcadores fora da linha e a linha cortava o texto do horário | cartões alinhados; o rótulo do horário recebe fundo próprio por cima da linha |
| Quadro provisório da abertura com texto grande demais, cortado no recorte do celular | texto do quadro da abertura reduzido e centrado numa área segura |
| Emenda horizontal no degradê dos quadros provisórios | brilho refeito com queda radial suave |
| Legenda do mosaico no hover: creme sobre laranja queimado com contraste 3,5:1 | hover passa a usar texto preto carvão sobre laranja (8:1) |
| O próprio teste não revelava as seções: a rolagem suave do site atrasava o `scrollTo` | o teste desliga a rolagem suave só durante a varredura |

## 5. Contraste (calculado, WCAG)

Creme sobre carvão 18,1:1 · texto secundário (creme 74 %) 9,9:1 · texto terciário (creme 50 %) 4,96:1 ·
laranja sobre carvão 8,0:1 · carvão sobre laranja (botões) 8,0:1 · laranja queimado escuro `#9E3D0B`
sobre creme 6,1:1 (rótulos pequenos das seções claras) · dourado sobre carvão 9,2:1.

## 6. Performance (medido nos arquivos, não é Lighthouse)

- HTML 54 KB (9 KB com gzip) · CSS 51 KB (10,5 KB gzip) · JS 11 KB (3,3 KB gzip) · 4 fontes WOFF2, 86 KB no total, 2 com preload.
- Foto da abertura com `fetchpriority="high"` e preload responsivo; todas as outras com `loading="lazy"`,
  `decoding="async"`, `srcset`/`sizes` e largura/altura declaradas (sem salto de layout ao carregar).
- Imagens em WebP. AVIF não foi usado: o WebP já cobre todos os navegadores atuais e manteria o HTML
  mais simples; dá para acrescentar depois que as fotos reais chegarem, se o peso justificar.
- Animações só em `transform` e `opacity` (a cortina das fotos é um `scaleY`); nenhum `backdrop-filter`
  nem `filter: blur`; nenhuma rolagem sequestrada.
- **Os pesos de imagem hoje são dos quadros provisórios** (684 KB somando todas as larguras). Com fotos
  reais o total vai subir; o script já limita as larguras e comprime em WebP qualidade 80.

## 7. Não verificado

- **Lighthouse / Core Web Vitals**: não rodado nesta sessão. Nenhuma nota de Lighthouse foi informada.
- **Safari (iOS/macOS) e Firefox**: só Chromium estava disponível. Pontos a olhar no Safari:
  `<dialog>` (suportado desde 15.4), `inert` (desde 15.5), `svh`.
- **Celular físico** e leitor de tela real (TalkBack/VoiceOver): não testados; a estrutura ARIA foi
  verificada pelo script, não por uso com leitor.
- **Links externos** (WhatsApp, Google Maps, Instagram): a rede deste ambiente bloqueia esses domínios,
  então só o formato dos links foi conferido, não o destino aberto.
- **Fotos reais**: nenhuma foi enviada; enquadramento, cor e peso finais só podem ser avaliados com elas.
