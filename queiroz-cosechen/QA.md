# QA — Vitor Queiroz Cosechen

Testes feitos em 13/10/2026, com Chromium (Playwright) servindo a pasta por
`python3 -m http.server`. O que não foi testado está no fim.

## Referência analisada

Vídeo de 30 s (gravação de tela, 1920×1080), extraído quadro a quadro (1 por
segundo). Registrado: bio, nome, link do WhatsApp, cinco carrosséis/vídeos
abertos (endereços na barra do navegador) e os títulos visíveis na grade.
Cores medidas por amostragem de pixels nos quadros: fundo `#1c1c1c`, destaque
`#2d0cd5`, campo violeta `#3415d8`.

## Testado

| Item | Como | Resultado |
|---|---|---|
| Console e recursos | desktop 1440×900 e mobile 390×844, rolagem da página inteira | Sem erro de console, sem requisição falha, sem resposta 4xx/5xx |
| Fonte | `document.fonts` após o carregamento | Manrope 200–800 carregada nos dois tamanhos |
| Rolagem horizontal | 320, 360, 390, 768, 1024, 1280, 1440, 1920 px | `scrollWidth = clientWidth` em todas; nenhum elemento passa da borda |
| Menu mobile | clique, Esc, clique em link, clique fora | Abre com `aria-expanded=true` e foco no primeiro link; Esc fecha e devolve foco ao botão; link leva à seção e fecha o menu |
| Âncoras | menu → `#temas` | Seção para logo abaixo do cabeçalho fixo (72 px do topo) |
| Formulário vazio | envio sem preencher | 3 mensagens de erro, foco no primeiro campo, aviso “Revise os campos…”; não abre WhatsApp |
| Formulário preenchido | nome, assunto, mensagem | Abre `https://wa.me/5545991176434?text=…` em nova aba, com nome, cargo (se houver), assunto e mensagem; `window.opener` nulo; aviso diz que a mensagem foi **aberta**, não enviada |
| Contador | digitação | Atualiza “48/600” |
| Teclado | Tab a partir do topo | 1º Tab = “Pular para o conteúdo”, visível no topo; ordem: marca, menu, WhatsApp, botões da abertura; contorno de foco em todos |
| Movimento reduzido | `prefers-reduced-motion: reduce` | Sem classe `motion`; títulos com opacidade 1; todos os destaques violeta já visíveis |
| Sem JavaScript | JS desligado, 390 px | Menu aparece aberto em linha, botão de menu escondido, todo o conteúdo visível |
| Contraste | cálculo WCAG das combinações principais | Texto `#f4f4f2`/`#1c1c1c` ≈ 15,5:1 · apoio `#a8a8ae`/`#1c1c1c` ≈ 7:1 · `#b6abff`/`#1c1c1c` ≈ 8:1 · branco/`#2d0cd5` ≈ 9,9:1 · placeholder `#8f8f96`/`#242426` ≈ 4,8:1 |
| Imagem de compartilhamento | captura de `tools/og-cover.html` | 1200×630, 64 KB |

## Problemas encontrados e corrigidos

1. **Texto dos slides da abertura minúsculo.** As medidas `cqi` estavam no
   próprio container; passaram para um elemento interno (`.slide__in`).
2. **Título da abertura quebrando em 5 linhas a 1440 px.** Escala reduzida e
   quebras definidas em 4 linhas.
3. **Bloco violeta invadindo a linha de cima** (a Manrope tem ascendente alto).
   O destaque passou a ser um degradê recortado na altura das letras.
4. **Slide escuro escondido atrás do violeta.** Texto alinhado ao topo e slide
   violeta mais abaixo.
5. **Numeral “32” sobre o título do card da PEC.** O numeral entrou no fluxo,
   acima do título.
6. **`window.open` com `noopener` sempre devolve `null`**, o que mostraria o
   aviso de falha mesmo com a aba aberta. O vínculo agora é cortado depois.

## Não testado

- **Links do Instagram e do Threads:** o Instagram é bloqueado pela rede deste
  ambiente; os endereços não foram abertos. Ver `PENDENCIAS.md`.
- **WhatsApp de verdade:** a abertura de `wa.me` foi interceptada no teste; o
  número é o da bio, mas a conversa não foi iniciada.
- **Safari e Firefox:** só Chromium disponível. Pontos a olhar: `cqi`
  (Safari 16+), `text-wrap: balance` (sem suporte some sem quebrar nada).
- **Leitor de tela:** estrutura verificada no código (landmarks, títulos,
  rótulos, `aria-live`), mas sem teste com NVDA/VoiceOver.
- **Lighthouse:** não disponível aqui.
