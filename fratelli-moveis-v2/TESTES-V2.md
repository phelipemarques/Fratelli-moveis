# Fratelli Móveis V2 — Resultados de teste

Tudo abaixo foi medido em navegador (Chromium headless via Playwright),
servido por HTTP com suporte a requisição parcial. Nenhum número aqui é
estimativa.

## Resolução — 13 larguras

| tela | overflow horizontal | erros de JS | respostas 4xx | botões de ampliar |
|---|---|---|---|---|
| 320×568 | 0 | nenhum | nenhuma | 12 |
| 360×800 | 0 | nenhum | nenhuma | 12 |
| 375×667 | 0 | nenhum | nenhuma | 12 |
| 390×844 | 0 | nenhum | nenhuma | 12 |
| 414×896 | 0 | nenhum | nenhuma | 12 |
| 430×932 | 0 | nenhum | nenhuma | 12 |
| 768×1024 | 0 | nenhum | nenhuma | 12 |
| 1024×768 | 0 | nenhum | nenhuma | 12 |
| 1280×800 | 0 | nenhum | nenhuma | 12 |
| 1366×768 | 0 | nenhum | nenhuma | 12 |
| 1440×900 | 0 | nenhum | nenhuma | 12 |
| 1600×900 | 0 | nenhum | nenhuma | 12 |
| 1920×1080 | 0 | nenhum | nenhuma | 12 |

Imagens quebradas: nenhuma. O único `<img>` sem `src` é o do diálogo de
ampliação enquanto ele está fechado — não faz requisição e está dentro de
`[hidden]`.

## Ampliação de projeto

| verificação | resultado |
|---|---|
| botões injetados | 12 (6 projetos + 6 ambientes) |
| `role="dialog"` / `aria-modal="true"` | sim / sim |
| rótulo do diálogo | "Fotografia ampliada: Closet, Projeto em 3D. Item 1 de 12." |
| classificação da imagem visível | sim — "Projeto em 3D", "Projeto executado" |
| texto alternativo preservado | sim |
| foco ao abrir | botão fechar |
| Tab preso no diálogo | sim — anterior → próxima → fechar → anterior… |
| seta direita | 1/12 → 2/12 (Closet → Dormitório) |
| duas setas esquerda a partir de 2/12 | 12/12 (dá a volta) |
| Escape fecha | sim |
| foco volta ao botão que abriu | sim |
| fundo com `inert` | 6 elementos, liberados ao fechar |
| rolagem de trás travada e destravada | sim |
| fotografia cabe na janela | sim |
| erros de JavaScript | nenhum |

## Posição da rolagem ao fechar

Regressão encontrada e corrigida nesta rodada.

| | antes | depois |
|---|---|---|
| rolagem ao abrir | 2800px | 2800px |
| com o diálogo aberto | 2800px | 2800px |
| logo após fechar | 2800px | 2800px |
| meio segundo depois | **2294px** | **2800px** |
| deslocamento | **−506px** | **0px** |

Vale também para o menu em celular, que usava a mesma trava.

## Progresso da faixa de ambientes

| modo | início | fim |
|---|---|---|
| desktop, com pin (1440×900) | 0 | 0,47 após 14 passos de rolagem |
| celular, transporte nativo (390×844) | 0 | 1,00 no fim da faixa |

## Sistema de movimento

22 valores de duração, curva, cascata, scrub, parallax e ponto de disparo
centralizados. Busca por números soltos no código editável: **nenhum
restante**.

## O que não foi medido

- **Lighthouse / Core Web Vitals.** Sem rede neste container para baixar
  a ferramenta. Não há números inventados neste documento.
- **Navegadores além do Chromium.** Só havia Chromium disponível.
- **Reprodução do vídeo H.264.** O Chromium deste ambiente não tem o
  decodificador; a lógica do filme foi exercitada em rodadas anteriores
  com uma cópia WebM.
