# Maguila's — QA

Testes feitos em 14/10/2026, com Chromium (Playwright 1.56) contra o site
servido localmente (`python3 -m http.server`). Cada linha diz o que foi
verificado e como. O que **não** foi testado está no fim.

## Implementado

- Página única em HTML/CSS/JS puros, sem build, sem dependência externa em tempo de execução.
- 7 seções + rodapé (ver `DIRECAO.md`).
- Menu do celular com `aria-expanded`, Escape, foco gerenciado, fecha ao escolher um link.
- Cardápio em abas no padrão WAI-ARIA (setas, Home/End, `tabindex` móvel); sem JS, mostra todas as categorias.
- 12 links de WhatsApp com mensagem de **consulta** pronta (nada é enviado sozinho).
- Rota e busca no Google Maps por link (sem mapa incorporado).
- Barra de ação no celular que aparece após a abertura e some na Localização e no rodapé.
- Entrada da abertura em CSS (≈1,2 s no total); revelação ao rolar com IntersectionObserver, com três variações (subida, deslocamento com giro, máscara na galeria).
- `prefers-reduced-motion` respeitado; sem JS, nada fica oculto.
- Modo prévia: classe `is-preview` no `<html>` marca com pontilhado todo dado a confirmar e mostra avisos. Página com `noindex`.

## Testado

### Rolagem horizontal, console e alvos de toque — 9 resoluções

Rolagem até o fim da página, com animações ligadas, medindo `scrollWidth`
em cada passo. Alvos de toque: links e botões visíveis com menos de 24 px de altura.

| Resolução | Rolagem horizontal | Console | Alvos < 24 px |
|---|---|---|---|
| 1920×1080 | não | limpo | 0 |
| 1440×900 | não | limpo | 0 |
| 1280×800 | não | limpo | 0 |
| 1024×768 | não | limpo | 0 |
| 768×1024 | não | limpo | 0 |
| 430×932 | não | limpo | 0 |
| 390×844 | não | limpo | 0 |
| 360×800 | não | limpo | 0 |
| 320×568 | não | limpo | 0 |

### Problemas encontrados e corrigidos durante o QA

| Problema | Onde | Correção |
|---|---|---|
| Menu do celular aparecia cortado, só com "Início" | ≤ 959 px | O `backdrop-filter` do cabeçalho virava referência de posição do menu fixo. O fundo do cabeçalho foi para um pseudo-elemento. |
| Rolagem horizontal de 14 px | 390 px | A revelação da seção Buffet deslocava no eixo X; passou para Y. `main` ganhou `overflow-x: clip` como proteção. |
| Botões da abertura empurravam a coluna para 327 px | 320 px | Coluna do grid com `minmax(0, 1fr)`; abaixo de 360 px os botões empilham. |
| Foto da sobremesa e post do buffet saíam da tela | 1024 px | Tamanhos e deslocamentos próprios entre 960 e 1199 px; posts do buffet em % da coluna. |
| Rótulos "Manhã/Almoço…" saíam pequenos | todas | Conflito de especificidade com `.moment__body p`. |
| Telefone e Instagram na Localização com área de toque < 24 px | todas | `padding-block` nos links. |
| Aviso de prévia cobria os botões da abertura | ≤ 959 px | No celular, o aviso só aparece junto com a barra de ação, acima dela. |

### Teclado e acessibilidade

- **Ordem do Tab:** Pular para o conteúdo → marca → 5 links do menu → WhatsApp → Ver cardápio → Como chegar → … (ordem visual).
- **Menu do celular (390 px):** Enter abre (`aria-expanded="true"`), o foco vai para "Início"; Escape fecha e devolve o foco ao botão; clicar em "Cardápio" fecha o menu e leva a seção para logo abaixo do cabeçalho (72 px). Testado no topo e no meio da página.
- **Abas do cardápio:** → → leva a "Pratos & marmitas" e só esse painel fica visível; End → Bebidas; Home → Café da manhã; ← no início volta para Bebidas; Tab sai da lista de abas para o painel.
- **Foco visível:** contorno dourado de 2 px em todos os elementos interativos.
- **Contraste (WCAG):** texto 18:1; texto de apoio 9:1 no fundo e 7,8:1 nos cartões; dourado dos rótulos 7,7:1; botão dourado 9,6:1; textos no creme entre 4,8:1 (manuscrito, sempre grande) e 14,9:1.
- **Hierarquia:** um `h1`; um `h2` por seção; `h3` nos cartões, pilares e categorias do cardápio.
- **Imagens:** todas com `alt` descritivo; ícones decorativos com `aria-hidden`.
- **Movimento reduzido:** nenhum elemento fica oculto e a animação do título é `none`.
- **Sem JavaScript (390 px):** as 7 categorias do cardápio visíveis, abas ocultas, os 5 links do menu visíveis, sem rolagem horizontal.

### Links

- 20 âncoras internas, nenhuma quebrada.
- 17 links externos, todos com `target="_blank"` e `rel="noopener"`.
- Os 9 textos distintos de WhatsApp foram decodificados e conferidos (português correto, acentos, `wa.me/5545999566139`).

### Desempenho (medido, mas em simulação local)

Rede limitada pelo DevTools a ~1,6 Mbps com 150 ms de latência; servidor local.

| Cenário | LCP | CLS | Transferido na carga |
|---|---|---|---|
| 1440×900, CPU normal | 2,16 s | 0 | 306 KB |
| 390×844, CPU 4× mais lenta | 1,90 s | 0 | 231 KB |

Peso total do site: imagens 848 KB (23 arquivos, a maioria carregada só ao rolar), fontes 148 KB (3 arquivos), CSS 40 KB, JS 12 KB.
O INP **não** foi medido.

### Visual

Capturas conferidas em 1440×900, 1024×768, 768×1024, 390×844 e 320×568
(primeira tela e página inteira), mais o menu aberto em 390×844.

## Não testado

- **Safari / iOS e Firefox** — só Chromium. Pontos a olhar no iPhone: área segura da barra de ação e o `backdrop-filter`.
- **Celular de verdade** — só emulação de tamanho de tela.
- **Leitor de tela** (VoiceOver, TalkBack, NVDA) — a estrutura foi conferida no código e pelo teclado, não com leitor.
- **Lighthouse** e Core Web Vitals de campo — os números acima são de laboratório local, não de hospedagem real.
- **WhatsApp abrindo no celular** e **rota no Google Maps** — o formato dos links foi verificado; não foi conferido se o número é do restaurante nem se o Maps encontra o endereço certo.
- **Publicação** — o site não foi publicado.

## Autoavaliação

Nota de 0 a 10, com o motivo. Avalia **esta prévia**, com o material que existe hoje.

| Critério | Nota | Por quê |
|---|---|---|
| Direção de arte | 7 | Sistema coerente (filete dourado, fotos "na mesa", manuscrito pontual, seção creme). A abertura foi desenhada para fotos pequenas; com foto grande, sobe. |
| Identidade visual | 6 | Paleta e vozes tipográficas fiéis aos posts, mas a logo é provisória em texto. |
| Marketing gastronômico | 7,5 | Momentos do dia + buffet como prova; textos específicos, todos sustentados por posts. |
| Desejo visual / apetite | 5 | Maior fraqueza: fotos de ≈280 px vindas de print, muitas com arte gráfica por cima. |
| Conversão | 7,5 | Cardápio em 1 toque, rota em 1 toque, consulta por categoria, barra de ação no celular. Falta confirmar o canal. |
| UX/UI | 8 | Navegação curta, cardápio em abas, sem rolagem horizontal em 9 tamanhos. |
| Tipografia | 7,5 | Três famílias com papéis claros; o manuscrito aparece só em palavras curtas. |
| Motion | 7 | Entrada curta e revelações variadas; nada de parallax ou rolagem sequestrada. |
| Mobile | 8 | Layout próprio para o celular (abas e galeria deslizantes, barra de ação), testado até 320 px. |
| Performance | 8 | LCP < 2,5 s e CLS 0 em simulação; sem biblioteca externa. Falta medir em hospedagem real e INP. |
| Acessibilidade | 7,5 | Teclado, foco, contraste, movimento reduzido e sem JS verificados; sem teste com leitor de tela. |
| SEO local | 5 | Título, descrição, headings e Open Graph prontos; `noindex`, canonical e JSON-LD ficam de propósito para depois da confirmação dos dados. |
| Qualidade técnica | 8 | Código sem dependências, CSS por blocos e tokens, JS com melhoria progressiva. |
| Prontidão para produção | 3 | Logo, contatos, horário e fotos ainda sem confirmação. **Não publicar.** |
