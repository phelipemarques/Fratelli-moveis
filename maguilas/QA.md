# Maguila's — QA (versão 3)

Testes de 15/10/2026, com Chromium (Playwright 1.56) e o site servido
localmente. A V2 foi servida em paralelo, a partir do commit `9519edd`, para as
comparações. O que **não** foi testado está no fim.

## 1. Comida na primeira tela (o objetivo principal da V3)

Mesmas condições nas duas versões: movimento reduzido (nada escondido por
animação), imagens carregadas, topo da página.

| Tela | Onde a 1ª foto começa (V2 → V3) | Área de foto na 1ª tela (V2 → V3) | Botão "Ver cardápio" na 1ª tela (V2 → V3) |
|---|---|---|---|
| 320×568 | 760 px (fora da tela) → **280 px** | 0% → **19%** | sim → sim |
| 360×800 | 687 → **327 px** | 12% → **24%** | sim → sim |
| 390×844 | 656 → **327 px** | 23%* → **25%** | sim → sim |
| 430×932 | 661 → **327 px** | 29%* → 25% | sim → sim |
| 768×1024 | 685 → **351 px** | 24%* → 22% | sim → sim |
| 844×390 (celular deitado) | 681 (fora) → **168 px** | 0% → **17%** | **não → sim** |

\* Na V2, as fotos do pé da tela entravam cortadas e giradas; a caixa
de uma foto girada é maior que a foto, o que infla a porcentagem. Medindo só
a área real das fotos (largura × altura, sem rotação):

| Tela | V2 | V3 |
|---|---|---|
| 1440×900 | 279 mil px² (21%) | 250 mil px² (19%) |
| 1280×800 | 279 mil px² (27%) | 250 mil px² (24%) |
| 1024×768 | 167 mil px² (21%) | 138 mil px² (18%) |
| 390×844 | 70 mil px² (21%) | **81 mil px² (25%)** |

**No desktop, a V3 mostra ~10% menos área de foto que a V2.** O motivo: a V2
ampliava a marmita de 233 para 280 px (1,2×), e a V3 não amplia nenhuma
foto. A melhora no desktop é de composição (sem fotos tortas, com
legendas, anel dourado da marca, comida na frente), não de tamanho. Tamanho
maior depende das fotos originais (ver `FOTOGRAFIA.md`, P1).

## 2. Responsividade, console e toque — 9 resoluções

Rolagem até o fim com as animações ligadas, medindo `scrollWidth` a cada passo.

| Resolução | Rolagem horizontal | Console | Alvos < 24 px | Blocos ocultos ao fim |
|---|---|---|---|---|
| 1920×1080 | não | limpo | 0 | 0 |
| 1440×900 | não | limpo | 0 | 0 |
| 1280×800 | não | limpo | 0 | 0 |
| 1024×768 | não | limpo | 0 | 0 |
| 768×1024 | não | limpo | 0 | 0 |
| 430×932 | não | limpo | 0 | 0 |
| 390×844 | não | limpo | 0 | 0 |
| 360×800 | não | limpo | 0 | 0 |
| 320×568 | não | limpo | 0 | 0 |

Também: celular deitado (844×390) e zoom de 200% (simulado com 720 px a 2×), sem rolagem horizontal.

### Problemas que apareceram e foram corrigidos

| Problema | Correção |
|---|---|
| No celular, o texto da abertura ficou centralizado | `align-items: stretch` na coluna do celular. |
| Legenda "Sobremesas" passava da borda em 320 px | Legendas da composição escondidas abaixo de 360 px. |
| Legendas cobertas pela marmita ("BUFFET POR QUI…", "…REMESAS") | Legenda do buffet no topo e a das sobremesas à direita. |
| Celular deitado: botão fora da tela | Layout de duas colunas para telas baixas na horizontal. |
| Desktop: composição menor que a da V2 | Composição a 600 px a partir de 1280 px, fotos no tamanho nativo. |
| Composição do tablet ampliava a marmita em 5% | Largura máxima de 495 px no celular/tablet. |

## 3. Cardápio

- **Clique, 1440×900:** as 7 abas selecionam (`aria-selected`), só o painel certo
  fica visível, e a página fica com **a mesma altura nas 7** (sem salto).
- **Toque, 390×844:** as 7 abas respondem; a faixa de abas rola para o lado e
  **fica fixa sob o cabeçalho** enquanto se lê a categoria; ao trocar de aba
  com a categoria já rolada, a página volta só o necessário para mostrar o
  início dela.
- **Teclado:** → → leva a "Pratos & marmitas"; End → Bebidas; Home → Café da
  manhã; ← no início → Bebidas; Tab sai das abas para o painel.
- **Fotos:** desktop no tamanho nativo (as de 281 px aparecem com 269 px);
  celular em miniatura de 96 × 96. Bebidas sem foto, de propósito.
- **Sem JavaScript:** as 7 categorias empilhadas, abas ocultas.

## 4. Menu, navegação, acessibilidade

- **Menu do celular:** Enter abre e leva o foco a "Início"; Escape fecha e
  devolve o foco; tocar em "Cardápio" fecha o menu e posiciona a seção 72 px
  abaixo do topo.
- **Barra de ação do celular:** aparece depois da abertura, some na
  Localização e no rodapé e não aparece com o menu aberto. Enquanto está
  visível, cobre os últimos 76 px da tela, como qualquer barra fixa.
- **Títulos:** um `h1`; `h2` por seção; `h3` nas ocasiões e nas categorias.
- **Movimento reduzido:** 0 blocos ocultos; animação da manchete desligada.
- **`main.js` bloqueado:** 0 de 12 blocos invisíveis; as 7 categorias visíveis.
- **Contraste dos novos elementos:** legendas da composição (dourado claro
  sobre preto a 82%) acima de 9:1; textos da linha do dia iguais aos da V2.

## 5. Links e WhatsApp

- 20 âncoras internas, nenhuma quebrada; 17 links externos com
  `target="_blank"` e `rel="noopener"`.
- **13 links de WhatsApp, todos para o mesmo número** (`wa.me/5545999566139`),
  ainda não confirmado. Os botões do cardápio dizem "Consultar … no WhatsApp"
  e abrem uma mensagem de consulta; "Pedir no WhatsApp" abre um pedido. Nada é
  enviado sozinho.

## 6. Desempenho — laboratório local, não campo

Rede limitada a ~1,6 Mbps com 150 ms de latência, cache desligado, mediana de 3 execuções.

| | V2 | V3 |
|---|---|---|
| LCP 1440×900 | 1,68 s | 1,67 s |
| LCP 390×844, CPU 4× mais lenta | 1,72 s | 1,70 s |
| CLS | 0 | 0 |
| Interação mais lenta (menu + 4 abas, toque, CPU 4×) | 88 ms | 72 ms |

A "interação mais lenta" vem da Event Timing API em laboratório; não é o INP
de usuários reais. Nenhuma auditoria Lighthouse foi executada.

**Prévia em arquivo único** (`maguilas-v3-visualizacao.html`, 1,05 MB): aberta
sozinha numa pasta vazia por `file://`, em 1440 e 390 px — 0 imagens
quebradas, 3 fontes ativas, abas funcionando, sem erro e sem rolagem lateral.

## 7. Comparação visual V2 × V3

Em `docs/comparacao/`, para 1440×900, 768×1024, 390×844 e 320×568:
`v2-v3-<tela>-primeira-tela.jpg` e `v2-v3-<tela>-pagina.jpg`.

## Não testado

- Safari/iOS e Firefox; aparelho real.
- Leitor de tela (VoiceOver, TalkBack, NVDA).
- Lighthouse e Core Web Vitals de campo.
- Se o WhatsApp é do restaurante e se o Google Maps acha o endereço.
- Publicação.
