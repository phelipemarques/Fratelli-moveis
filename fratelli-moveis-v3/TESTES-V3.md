# Fratelli Móveis V3 — Resultados de teste

Medido em Chromium (Playwright) servido por HTTP com requisição parcial.
Nenhum número aqui é estimativa.

## Ambiente gráfico

```
WebGL 2.0 (OpenGL ES 3.0 Chromium)
ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device), SwiftShader driver)
MAX_TEXTURE_SIZE 8192
```

SwiftShader é renderização por **software**. Serve para verificar
correção e capturar quadros; **não serve para medir FPS**.

## A cena

| verificação | resultado |
|---|---|
| perfil detectado (1440×900, ponteiro fino) | A |
| canvas dimensionado | 1440×900, razão 1.600 |
| cena desenhou | PNG de 38 KB (não vazio) |
| progresso acompanha a rolagem | 0 → 0,25 → 0,5 → 0,75 → 1, exato |
| passagem 3D→foto | 0 até 78%, chega a 1,000 no fim |
| erros de JavaScript | nenhum |

Quadros capturados dos cinco atos: portas fechadas, portas girando nos
pivôs, interior iluminado, câmera no detalhe, fotografia real.

## Fallbacks

| cenário | perfil | canvas | fotografia | altura | Three.js baixado |
|---|---|---|---|---|---|
| movimento reduzido | C | `display:none` | opacidade 1 | 900px | **não** |
| WebGL indisponível | C | oculto | opacidade 1 | 900px | **não** |
| 390×844 com toque | B | oculto | opacidade 1 | — | **não** |
| 768×1024 com toque | B | oculto | opacidade 1 | — | **não** |
| 1440×900 ponteiro fino | A | ativo | entra no fim | — | sim |

Nos perfis B e C o módulo de 671 KB **nunca é requisitado**.
Com movimento reduzido a seção mantém título, texto, link de pular e a
mesma altura — sem buraco na página.

## Resolução

| tela | overflow horizontal | erros | WhatsApp |
|---|---|---|---|
| 320×568 | 0 | nenhum | presente |
| 390×844 | 0 | nenhum | presente |
| 430×932 | 0 | nenhum | presente |
| 768×1024 | 0 | nenhum | presente |
| 1280×800 | 0 | nenhum | presente |
| 1440×900 | 0 | nenhum | presente |
| 1920×1080 | 0 | nenhum | presente |

## Herdado da V2, revalidado

Lightbox (12 fotografias, foco preso, Escape, setas com volta, fundo
inerte, foco devolvido), trava de rolagem sem deslocamento, progresso da
faixa de ambientes nos dois modos.

## O que NÃO foi medido

- **FPS e estabilidade de quadro.** SwiftShader é software.
- **Lighthouse / Core Web Vitals.** Sem rede para baixar a ferramenta.
- **Perda de contexto WebGL real.** O caminho está escrito e tratado
  (`webglcontextlost` → desmonta → fotografia), mas não forcei o evento.
- **Navegadores além do Chromium.**
