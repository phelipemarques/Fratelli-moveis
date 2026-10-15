# Maguila's — relatório de qualidade da V5

Medições e testes de 15/10/2026, neste ambiente, **em laboratório**. O site
não foi publicado; não há dados de usuários reais.

**Resumo.** A V5 não redesenha nada: a identidade, a abertura e a posição da
comida no celular são as mesmas da V4 (a foto começa em 327 px no 390×844, como
antes). Ela corrige dois defeitos reais que a V4 tinha (conteúdo sob o
entalhe do iPhone deitado e textos de 9,6 px), tira do site promessas de
atendimento que ninguém confirmou e fecha a entrega: zip de produção
conferido, prévia em arquivo único sem resíduos, testes novos e documentação
de pendências com o inventário das afirmações. O desempenho ficou igual ao da
V4, que já estava no teto do Lighthouse — **não há ganho de velocidade a
declarar**.

## 1. Entregas

| Arquivo | O que é |
|---|---|
| `maguilas-v5-producao.zip` | o site para publicar (pasta `maguilas-v5/`, 83 arquivos, 1,4 MB: o site e a documentação, que fica fora do deploy). Gerado por `tools/gerar-zip.py`, que confere as 65 referências de arquivo do HTML e do CSS antes de empacotar — nenhuma ausente |
| `maguilas-v5-visualizacao.html` | prévia em arquivo único (0,96 MB), para mandar ao cliente. Não é para publicar |
| esta pasta | código-fonte, ferramentas, testes e documentação |
| `PENDENCIAS.md` | o que pedir ao restaurante, por prioridade e onde entra; inventário das afirmações do site |
| `README.md` | abrir, testar, publicar na Vercel, trocar imagens, atualizar endereço, horário, WhatsApp e cardápio |
| `docs/comparacao/v4-v5-*.jpg` | capturas V4 × V5 lado a lado |

## 2. Problemas encontrados e correções

| Prioridade | Problema (V4) | Como foi verificado | Correção | Resultado (V5) |
|---|---|---|---|---|
| P0 | **iPhone deitado:** logo, título, botões, endereço e rodapé ficavam sob o entalhe | Chromium com área segura emulada (47 px nas laterais, `Emulation.setSafeAreaInsetsOverride`) | margens laterais `--gutter-l`/`--gutter-r` = `max(margem, env(safe-area-inset-*))` em `.wrap`, menu do celular, abas do cardápio, galeria e barra inferior | 16 elementos sob o entalhe → **0** |
| P0 | **Promessas não confirmadas:** "Para comer aqui, levar ou pedir pelo WhatsApp" e botões "Pedir no WhatsApp" | leitura do texto contra as fontes (`PENDENCIAS.md`, inventário) | "Veja o cardápio e consulte pelo WhatsApp"; "Falar no WhatsApp" no cabeçalho e na barra inferior; mensagem pronta geral: "Olá! Vim pelo site do Maguila's e gostaria de algumas informações." | nenhuma modalidade de atendimento afirmada sem confirmação |
| P0 | Endereço da placa de horário era a única ocorrência do endereço **sem** a marcação "a confirmar" | busca por todas as ocorrências | `class="pend"` no endereço da placa | 6 de 6 ocorrências marcadas (4 textos + 2 links de mapa, que usam o mesmo endereço) |
| P2 | **Textos de 9,6 px** (subtítulo da marca, legendas das fotos da abertura, selo "a confirmar") | varredura de todos os textos visíveis em 320, 390 e 1440 px | tamanhos aumentados, sem mudar a composição | menor texto: 9,6 → **10,6 px** |
| P3 | Texto novo da abertura quebrava em 3 linhas no desktop ("WhatsApp." sozinho), empurrando a abertura | comparação pixel a pixel (11,8% da primeira tela mudava) | texto encurtado | mesmo número de linhas da V4 em 9 larguras (320 a 1920 px); diferença da primeira tela caiu para 0,74% |
| P4 | `og:type` = `restaurant`, que não é um tipo do Open Graph | revisão do `<head>` | `website` | — |
| P1 | **Prévia em arquivo único** com 21 `<picture>` sem nenhum `<source>` | contagem no arquivo gerado | o gerador desfaz o `<picture>` (fica o `<img>` com o WebP embutido) | 21 imagens, 0 `<picture>`, 0 referência a `assets/`; abre sozinha por `file://` sem erro |
| P1 | Faltava um pacote de produção conferido | — | `tools/gerar-zip.py` | 65 referências conferidas; zip descompactado, servido e testado (48/48) |
| — | Teste "blocos ocultos" falhava às vezes em 1920 px | investigação: os 2 blocos já tinham `is-in`, estavam no meio da transição | o teste espera as animações terminarem (`document.getAnimations()`) | 0 falsos alarmes nas 5 execuções seguintes |
| — | Documentação: QA da V4 dizia 45 testes (eram 44); README dizia 12 links de WhatsApp (são 13) | contagem no código | corrigido | — |

**Fotografias.** Nenhuma foto foi trocada, ampliada, recriada ou substituída.
Todas continuam sendo os recortes das capturas do Instagram do Maguila's
enviadas pelo cliente. Nenhuma imagem de banco ou gerada por IA.

## 3. Medições V4 × V5

Os dois sites servidos lado a lado por um servidor local que aplica os
cabeçalhos do `vercel.json` (brotli, ETag, cache, CSP). Lighthouse 12; celular
= 4G lento simulado e CPU 4× mais lenta.

| Métrica | V4 | V5 | Leitura |
|---|---|---|---|
| Peso do HTML (bruto / brotli) | 42.109 B / 7.136 B | 42.218 B / 7.122 B | igual |
| Peso do CSS (bruto / brotli) | 42.243 B / 9.014 B | 42.655 B / 9.090 B | +76 B comprimidos (margens de área segura) |
| Bytes transferidos, celular | 213 KB | 213 KB | igual |
| Requisições (Lighthouse) | 15 | 15 | igual |
| **Lighthouse celular** (mediana de 5) | 100 (96·100·100·100·100) | **100** (100 nas 5) | igual |
| Lighthouse desktop (mediana de 3) | 100 | 100 | igual |
| Acessibilidade / Boas práticas | 100 / 100 | 100 / 100 | igual |
| SEO | 66 | 66 | baixo só pelo `noindex` da prévia, de propósito |
| FCP celular | 0,76 s | 0,76 s | igual |
| LCP celular | 1,90 s | 1,89 s | igual (dentro da variação) |
| LCP desktop | 0,41 s | 0,41 s | igual |
| CLS | 0 | 0 | igual |
| TBT | 0 ms | 0 ms | igual |
| LCP 1ª visita, Chromium com 4G lento e CPU 4× (mediana de 14, ordem alternada) | 1,05 s | 1,06 s | igual |
| 2ª visita: idas ao servidor / bytes | 2 revalidações / 2 KB | 2 revalidações / 2 KB | igual |
| Erros de console | 0 | 0 | 16 tamanhos de tela, com CSP |
| INP | Não medido | Não medido | só existe com usuários reais |
| **Prévia em arquivo único** — tamanho | 0,96 MB | 0,96 MB | igual |
| Prévia — Lighthouse celular (mediana de 3) | 66 | 65 | igual (variação); continua lenta por natureza: tudo chega antes da primeira pintura |

**Comida no primeiro olhar (celular).** Posição em que a foto começa e área da
primeira tela ocupada por comida — idênticas nas duas versões:

| Tela | V4 | V5 |
|---|---|---|
| 320×568 | 280 px · 19% | 280 px · 19% |
| 390×844 | 327 px · 25% | 327 px · 25% |
| 430×932 | 327 px · 25% | 327 px · 25% |
| 768×1024 | 351 px · 20% | 351 px · 20% |
| 844×390 (deitado) | 168 px · 17% | 168 px · 17% |

## 4. Identidade preservada — capturas V4 × V5

Mesmas condições: movimento reduzido, todas as imagens carregadas, aviso de
prévia fechado. Diferença = pixels que mudaram mais de 24 em 255.

| Tela | Primeira tela | Página inteira | Altura da página | Arquivos |
|---|---|---|---|---|
| 1440×900 | 0,74% | 0,60% | 6.121 → 6.122 px | `docs/comparacao/v4-v5-1440x900-*.jpg` |
| 768×1024 | 0,73% | 0,66% | 7.583 → 7.585 px | `docs/comparacao/v4-v5-768x1024-*.jpg` |
| 390×844 | 1,67% | 1,22% | 7.237 → 7.239 px | `docs/comparacao/v4-v5-390x844-*.jpg` |
| 320×568 | 1,20% | 1,34% | 7.377 → 7.380 px | `docs/comparacao/v4-v5-320x568-*.jpg` |

O que mudou nas capturas é só o planejado: textos pequenos um pouco maiores
(marca, legendas, selos), o novo texto da abertura e "Falar no WhatsApp".

## 5. Testes realizados

**`tools/testar.mjs` — 48 de 48 passaram** no site em pastas e no zip
descompactado. As 4 verificações novas da V5 **falham na V4** (texto de
9,6 px em 3 larguras; 16 elementos sob o entalhe), o que mostra que pegam o
problema que corrigem.

| Grupo | Verificações |
|---|---|
| 16 tamanhos de tela (1920 a 320, mais 2 deitados) | rolagem lateral, erros de console, imagens quebradas, blocos ocultos, alvos de toque < 24 px |
| Menu do celular (7) | abre com Enter, foco, Tab não escapa (`inert`), Escape, foco volta, link fecha, conteúdo volta |
| Abas do cardápio (14) | setas, Home, End, Enter, Espaço; painel certo nas 7; altura constante no desktop |
| Robustez (3) | sem JavaScript, `main.js` bloqueado, movimento reduzido |
| Links (4) | âncoras, `target`/`rel` dos externos, um único número de WhatsApp, `noindex` |
| **Novos na V5 (4)** | menor texto ≥ 10,5 px em 320, 390 e 1440 px; nada sob o entalhe no iPhone deitado |

Outros:

- **"Falar no WhatsApp" cabe** no cabeçalho (198×44 px de 960 a 1280 px) e na
  barra inferior (155×51 px em 320 px), sem quebrar nem transbordar.
- **Prévia em arquivo único** aberta por `file://` em 390 e 1440 px: 21 imagens,
  0 quebradas, 3 fontes ativas, 0 erros, sem rolagem lateral.
- **Zip:** descompactado e servido sozinho; 48/48.

## 6. Links externos — validação × abertura real

| | Validado | Abertura real |
|---|---|---|
| WhatsApp (13 links) | todos `wa.me/5545999566139`, formato 55 + DDD + 9 dígitos; 8 mensagens prontas decodificadas e conferidas | **não testada** — a rede deste ambiente bloqueia `wa.me` (proxy 403) |
| Google Maps (2) | `dir/?api=1&destination=` e `search/?api=1&query=` com "Rua Aimorés, 171 - Santo Onofre, Cascavel - PR" | **não testada** — `www.google.com` bloqueado; não se sabe se o Maps acha o endereço |
| Instagram (3) | `instagram.com/maguilas_restaurante/` | **não testada** — `www.instagram.com` bloqueado |

Todos têm `target="_blank"` e `rel="noopener noreferrer"`. Validar a URL não
garante que o número seja do restaurante: isso é o item 1 de `PENDENCIAS.md`.

## 7. Limitações e o que não foi testado

- **Aparelhos reais:** só emulação no Chromium. Safari no iPhone (incluindo a
  área segura real e a barra dinâmica), Chrome em Android e Firefox não foram
  testados.
- **Leitor de tela** (VoiceOver, TalkBack, NVDA): não testado; estrutura e foco
  verificados por teclado e pelo Lighthouse.
- **INP e Core Web Vitals de campo:** não medidos — o site não está no ar.
- **Deploy na Vercel:** não feito (não publicar sem autorização). O
  `vercel.json` foi validado pelo servidor local que aplica os mesmos
  cabeçalhos.
- **Abertura real dos links externos:** não testada (seção 6).
- **Prévia do link no WhatsApp/Facebook:** depende de domínio e `og:image`
  absoluto (`PUBLICACAO.md`).

## 8. O que continua pendente

Tudo depende do restaurante, em ordem, em [`PENDENCIAS.md`](PENDENCIAS.md):
WhatsApp, modalidades de atendimento, endereço, horário, logo, autorização das
fotos, aprovação dos textos, domínio; depois fotos em alta resolução, fachada,
cardápio atualizado, preços e imagem de compartilhamento.

Até lá a página segue como **prévia**: `noindex` na página e no cabeçalho
`X-Robots-Tag`, classe `is-preview` e dados a confirmar sublinhados.
