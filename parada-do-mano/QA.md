# Parada do Mano — QA

Terceira rodada, 16/10/2026, depois da troca pelas 5 fotos enviadas em 1122×1402.
Ferramenta: Chromium 141 (Playwright 1.56) em modo headless, servindo a pasta com
`python3 -m http.server`. Script: `tools/qa-browser.mjs`.
**Resultado: 78 de 78 verificações automáticas passaram.**

## 1. O que foi implementado

- Página única em HTML, CSS e JavaScript puros, sem framework e sem biblioteca de animação.
- Seções: abertura · faixa de momentos · O restaurante (café, almoço, jantar + atalhos buffet/churrasco)
  · Buffet (mosaico de 5 fotos) · Churrasco, fogão a lenha e espeto corrido · Feijoada · Cardápio em 10 abas
  · Galeria com foto ampliada · Contato e localização · rodapé · barra de ações no celular.
- **Fotos (16/10):** as 5 imagens enviadas (café da manhã, buffet com salão, prato com carnes,
  feijoada, mesa de saladas) foram ampliadas 2x com EDSR (`tools/enhance-photos.py novas`) e
  receberam o ajuste leve que preserva a cor. Comparação lado a lado conferida (carne grelhada:
  mais definição, mesma cor). A churrasqueira da seção Churrasco é um recorte do fundo da foto do
  buffet. Elas substituem todas as fotos tiradas de prints; ficaram de fora do site só a arte do
  rodízio (recorte sem o preço) e a logo, que continuam vindo do Instagram.
- O rodapé passou a dizer **"Imagens ilustrativas"** e a galeria virou "Mesa farta" (antes
  "Comida de verdade"), porque as fotos novas aparentam ser geradas/retocadas por IA.
- Os três vídeos foram refeitos com as fotos novas por `tools/make-film.py`: abertura (960×960, loop,
  sem texto) e dois com texto para redes (1080×1920 e 1920×1080, ~28 s).
- Prévia em arquivo único (`parada-do-mano-visualizacao.html`, 9,7 MB, vídeo embutido) e ZIP de produção
  (`parada-do-mano-site.zip`, 50 arquivos, 6,3 MB).

## 2. Animações implementadas

| # | Animação | Como | Movimento reduzido |
|---|---|---|---|
| 01 | Entrada da abertura: fundo imediato → foto com recuo de zoom (1,10 → 1) → etiqueta → título linha a linha subindo de uma máscara → subtítulo → botões → destaques → placa do km | CSS `@keyframes`, só `transform`/`opacity`, ~1,9 s no total; a página é clicável desde o primeiro quadro | desligada |
| 02 | Revelação na rolagem (subida curta + opacidade; cartões em sequência; fotos com cortina que recolhe e imagem que assenta) | `IntersectionObserver`; a classe que esconde só entra quando o observer existe | conteúdo aparece direto |
| 03 | Calor da churrasqueira: brilho âmbar que "respira", 7 brasas pequenas subindo devagar e, no computador, o vídeo das fotos reais (espeto, buffet, fogão a lenha) em fusão lenta | CSS + `<video>` carregado só no computador, pausado fora da tela | brasas removidas, brilho parado, vídeo não carrega |
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
| Vídeo da abertura toca no computador (WebM no Chromium de teste), pausa quando a abertura sai da tela | OK |
| No celular o vídeo não é baixado (`src` vazio, fica a foto) | OK |
| `prefers-reduced-motion: reduce`: sem animação de entrada, sem brasas, faixa parada, nada escondido | OK |
| JavaScript desligado: as 10 categorias do cardápio aparecem em sequência e nenhum conteúdo fica oculto | OK |
| Prévia em arquivo único aberta por `file://`: sem erros, imagens carregadas, vídeo tocando no computador | OK |
| Vídeos de redes: conferidos por quadros-chave (textos dentro da margem, fora da área da legenda do Instagram no vertical) | OK, depois de 2 correções (abaixo) |

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
| Vídeo vertical: textos pequenos e baixos demais (a legenda do Instagram cobriria) | textos 30 % maiores e bloco de texto a 20 % da base |
| Vídeo vertical: "comida caseira de segunda a domingo" passava da borda | cada linha encolhe até caber entre as margens |
| Imagem de compartilhamento sem véu escuro atrás do nome | degradê refeito; conferido pelos valores dos pixels |
| `<img src="">` da galeria ampliada fazia o navegador pedir a própria página | atributo removido; o JS preenche ao abrir |

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
- Imagens: 37 arquivos, 2,8 MB somando todas as larguras; o navegador baixa só a largura que precisa.
- Vídeo da abertura: 1,6–1,8 MB, baixado **só no computador**, depois de 1,2 s (não disputa banda com a
  foto da abertura) e nunca com economia de dados ligada ou movimento reduzido.

## 7. Não verificado

- **Lighthouse / Core Web Vitals**: não rodado nesta sessão. Nenhuma nota de Lighthouse foi informada.
- **Safari (iOS/macOS) e Firefox**: só Chromium estava disponível. Pontos a olhar no Safari:
  `<dialog>` (suportado desde 15.4), `inert` (desde 15.5), `svh`.
- **Celular físico** e leitor de tela real (TalkBack/VoiceOver): não testados; a estrutura ARIA foi
  verificada pelo script, não por uso com leitor.
- **Links externos** (WhatsApp, Google Maps, Instagram): a rede deste ambiente bloqueia esses domínios,
  então só o formato dos links foi conferido, não o destino aberto.
- **H.264 no navegador de teste**: o Chromium do Playwright não decodifica MP4 (codec proprietário), então
  o teste tocou o WebM. O MP4 foi conferido com `ffprobe` e por quadros extraídos com `ffmpeg`, não tocando
  num navegador. Chrome, Edge, Safari e Firefox comuns tocam H.264.
- **Nitidez das fotos**: a origem tem 150–750 px; a ampliação melhora, mas não substitui o original.
