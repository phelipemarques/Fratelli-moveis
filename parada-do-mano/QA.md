# Parada do Mano — QA da V4

16/10/2026. Tudo o que está marcado como executado foi executado nesta data, no Chromium; o que
não foi está na seção 6. Comparação com a V3 e o porquê de cada mudança: `RELATORIO-V4.md`.

**Resultado:**

| Bateria | Onde | Resultado |
|---|---|---|
| `tools/qa-browser.mjs` | pasta do projeto | **220 de 220** |
| `tools/qa-browser.mjs` | pacote `parada-do-mano-v4-producao.zip` descompactado | **220 de 220** |
| `tools/qa-preview.mjs` | `parada-do-mano-v4-visualizacao.html` aberto do disco (file://) | **15 de 15** |
| `tools/qa-browser.mjs` na V3, para comparar | pacote da V3 | 210 de 220 |

## 1. Ambiente

| Ferramenta | Versão | Uso |
|---|---|---|
| Chromium (headless) | 141, via Playwright 1.56.1 | testes, medições, capturas |
| Lighthouse | 12.8.2 | 3 execuções mobile + 3 desktop; vale a mediana |
| axe-core | 4.14.0 | WCAG 2.0/2.1/2.2 A e AA + boas práticas, 390 e 1440 px |
| Servidor | `tools/servidor.mjs` | gzip, cache e Range, como numa hospedagem |

O Chromium do Playwright não decodifica H.264; nele o vídeo da abertura toca em WebM.

## 2. Em cada tamanho de tela

**320×568, 360×800, 375×667, 390×844, 414×896, 430×932, 844×390 e 667×375 (deitado),
768×1024, 1024×768, 640×400 (notebook 1280×800 com zoom de 200%), 1440×900, 1920×1080**:

| Verificação | Resultado |
|---|---|
| Sem rolagem horizontal (e busca por elemento passando da borda) | OK nos 13 |
| Imagens carregadas depois de rolar a página inteira | OK nos 13 |
| Console sem erros nem avisos; nenhuma requisição com falha | OK nos 13 |
| Nada preso invisível depois da rolagem; um único `h1` | OK nos 13 |
| Foto da abertura e botão "Explorar o cardápio" na primeira tela | OK nos 13 (320×568: botão de 469 a 519 px) |
| Cabeçalho: nome numa linha, marca dentro da barra | OK nos 13 (320×568: 42 px em barra de 64 px) |
| Todo link e botão, levado ao centro da tela, recebe o clique (nada por cima) | OK nos 13 (44 a 51 por tela) |
| Alvos de toque ≥ 24 px (WCAG 2.5.8) | OK nos 13; menor botão principal: 44 px |

## 3. Interações e comportamento

| Área | Verificação | Resultado |
|---|---|---|
| Menu do celular | abre com `aria-expanded`, foco no 1º link, resto `inert`; Tab preso; Escape fecha e devolve o foco; link leva à seção | OK |
| | celular deitado (844×390): 7 links visíveis sem rolar | OK |
| | tablet girado com o menu aberto: menu fecha e a página volta a rolar | OK |
| Menu do computador | link leva à seção logo abaixo do cabeçalho; item marcado com `aria-current` | OK |
| Barra de ações | escondida na abertura, aparece depois; sai com o menu aberto; no fim da página não cobre o rodapé (folga de 23 px) | OK |
| | área segura: `viewport-fit=cover` + `env(safe-area-inset-bottom)` | OK por **inspeção do código** (o Chromium não simula o entalhe) |
| Cardápio | 10 categorias; uma por vez; clique, setas, Home, End, Enter, Espaço; Tab da aba ao painel | OK |
| | nenhuma área vazia (10 de 10); trocar de categoria não move as abas; página não pula | OK |
| | "Próxima" fica no mesmo lugar ao ir para uma categoria mais baixa (713 → 713 px) | OK |
| | aba escolhida sempre visível na faixa; foto da categoria carrega quando ela abre | OK |
| | WhatsApp com mensagem própria em cada categoria; nenhum preço afirmado; nenhum "ainda vão ser publicadas" | OK |
| | `index.html` em dia com `conteudo/cardapio.json` e `conteudo/contato.json` | OK |
| Links | âncoras internas existem; 20 links de WhatsApp, 12 mensagens, todas começando com "Olá! Vim pelo site do Parada do Mano…" e bem codificadas; nenhuma fala em pedido/compra/reserva; 3 de rota, 3 de Instagram; `rel=noopener` | OK |
| Jornadas (390×844) | almoço, espeto e feijoada: 3 toques até o WhatsApp certo; rota: 1 toque, na primeira tela | OK |
| Galeria | abre, setas, Escape, foco devolvido (1440); faixa lateral no celular | OK |
| | 320×568: foto ampliada inteira na tela, nenhum botão por cima, botões de 48 px, legenda e contador anunciados (`aria-live`), versão de 800 px, Tab preso no diálogo | OK |
| Vídeo | toca no computador; pausa fora da tela; celular não baixa | OK |
| | vídeo bloqueado de propósito: fica a foto, sem quadro preto | OK |
| | economia de dados e movimento reduzido no computador: não baixa | OK |
| | na carga só a foto aparece; vídeo sem endereço e com `preload="none"` | OK |
| Movimento reduzido | sem animação de entrada, brasas e faixa; nada escondido | OK |
| Sem JavaScript | 10 categorias com título, foto (7 de 7) e WhatsApp; nada escondido; imagens carregam; rota; barra de atalhos | OK |

## 4. Acessibilidade

| Verificação | Resultado |
|---|---|
| axe-core, 390 e 1440 px | **0 violações**; `color-contrast` fica "a revisar" (texto sobre foto) — medido à parte, abaixo |
| Lighthouse Acessibilidade | 100 (mobile e desktop) |
| Foco visível em todo elemento alcançado pelo Tab | OK (31 elementos em 390 px, 29 em 1440 px) |
| Foco nunca escondido atrás do cabeçalho ou da barra (WCAG 2.4.11) | OK em 390 e 1440 px |
| Espaçamento de texto ampliado (WCAG 1.4.12: entrelinha 1,5, letras 0,12em, palavras 0,16em) | sem rolagem lateral nem texto cortado em 320 e 390 px |
| Títulos | começam no `h1` e não pulam níveis (22 títulos) |
| Contraste do texto da abertura sobre a foto, medido nos pixels (fundo: 5% mais claros da área de cada texto; transparência do texto considerada) | 390 px: pior 6:1 · 1440 px: pior 6:1 (texto pequeno, mínimo 4,5:1); título ≥ 7,5:1 |

## 5. Medições (resumo; detalhes em `RELATORIO-V4.md`)

| | V3 | V4 |
|---|---|---|
| Lighthouse mobile (mediana de 3) | 98 / 100 / 100 / 66 | 98 / 100 / 100 / 66 |
| Lighthouse desktop | 100 / 100 / 100 / 66 | 100 / 100 / 100 / 66 |
| SEO na cópia de publicação (`--publicar`, domínio fictício) | Não medido | 100 |
| LCP mobile / desktop | 2,33 s / 0,52 s | 2,25 s / 0,52 s |
| CLS mobile / desktop | 0,001 / 0,008 | 0,001 / 0,008 |
| 1ª visita 390 px | 268 KB · 14 req. | 231 KB · 13 req. |
| Pior interação em laboratório (CPU 4x, mediana de 5) | 104 ms | 80 ms |
| INP de campo | Não medido | Não medido |

Também conferido: `tools/set-domain.py` no HTML do projeto e no do pacote (duas vezes, domínios
diferentes, sem resto do anterior, `noindex` mantido; com `--publicar`, liberado);
`tools/build-content.py --check`; o ZIP contém só arquivos citados pela página e nenhum citado
falta (o script para com erro se faltar).

## 6. O que NÃO foi testado

- **Safari** (iPhone, Mac) e **Firefox**: não testados.
- **Aparelhos reais**, barras dinâmicas reais do navegador e o entalhe do iPhone: não testados
  (área segura conferida no código).
- **Leitor de tela** (NVDA, VoiceOver, TalkBack): não testado; estrutura ARIA verificada por
  script e pelo axe.
- **H.264 num Chrome real**: o teste usa o WebM; o MP4 (H.264 High, 960×960) não foi tocado num
  Chrome com H.264.
- **INP e Core Web Vitals de campo**: só depois de publicado.

## 7. Como repetir

```bash
node tools/servidor.mjs . 8130 &
NODE_PATH=$(npm root -g) node tools/qa-browser.mjs capturas/
NODE_PATH=$(npm root -g) node tools/qa-preview.mjs parada-do-mano-v4-visualizacao.html
NODE_PATH=$(npm root -g) node tools/medir.mjs http://127.0.0.1:8130/ v4 medidas/
NODE_PATH=$(npm root -g) node tools/inp-lab.mjs http://127.0.0.1:8130/ V4
```
