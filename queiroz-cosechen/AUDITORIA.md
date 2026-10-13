# Auditoria e refinamento — Vitor Queiroz Cosechen

Auditoria feita em 13/10/2026 sobre a versão anterior (`index.html` + `assets/`,
da qual `queiroz-cosechen-visualizacao.html` é gerado). Cada problema foi achado
lendo o código e rodando o site no navegador; o que não pôde ser verificado está
marcado como **pendente de teste**.

Legenda do resultado: ✅ corrigido · 📋 depende do advogado (ver `PENDENCIAS.md`)
· ⏳ pendente de teste.

---

## 1. Bloqueadores de publicação

| # | Problema | Resultado |
|---|---|---|
| 1.1 | Inscrição na OAB ausente — aparece `[nº e seccional a confirmar]` no “Sobre” e no rodapé. A identificação com nome e número de inscrição é exigida na publicidade do advogado. | 📋 Marcador mantido de propósito (é o que impede a publicação por engano). |
| 1.2 | Espaço `[Fotografia do Vitor — a enviar]` visível no “Sobre”, com cara de seção inacabada. | ✅ Removido da página. O “Sobre” virou uma ficha de identificação; o ponto de entrada da foto ficou comentado no HTML. 📋 Foto continua pendente. |
| 1.3 | Textos jurídicos e de apresentação não aprovados pelo profissional. | 📋 Lista do que revisar em `PENDENCIAS.md`. |
| 1.4 | Sem domínio: `noindex`, `og:image` relativa, sem `canonical`/`og:url`. | ✅ `noindex` mantido (correto para prévia). Marcas `PRODUÇÃO` no `<head>`. 📋 Domínio. |

## 2. Conteúdo e confiança

| # | Problema | Resultado |
|---|---|---|
| 2.1 | “Verificado pelo Instagram”: o selo aparece na gravação de 13/10/2026, mas não dá para confirmar que continua valendo. | ✅ Afirmação removida. |
| 2.2 | “Cinco publicações recentes” sem data. | ✅ Datas lidas na gravação: todas de outubro de 2026 (PAD em 3/10, CAT em 4/10; as demais “há 1 dia” e “há 6 dias” em 13/10). Cada card mostra “Out. 2026” com `<time>`. |
| 2.3 | Card do PAD mostrava os erros 01 e 04 sem explicar o recorte. | ✅ Legenda “Dois dos cinco erros apresentados no carrossel”; leitor de tela ouve “Erro 1 de 5”, “Erro 4 de 5”. |
| 2.4 | Cards de assédio e CAT mostravam uma etapa isolada. | ✅ Legendas “Trecho: a primeira das seis provas” e “Trecho: o quarto dos cinco passos”. |
| 2.5 | Opinião apresentada como fato no card da PEC (“concurso público deixando de ser regra”). | ✅ Atribuída: “na leitura do Vitor, o concurso público deixaria de ser a regra”. |
| 2.6 | Relato pessoal sem atribuição no card do PAD (“há servidores que… acabaram demitidos”). | ✅ “Vitor relata ter visto…”. |
| 2.7 | Notícia do MPT apresentada como fato. Busca não encontrou a ação do MPT contra a Prefeitura do Rio envolvendo CRAS/CREAS/Conselhos Tutelares. | ✅ Título entre aspas como “manchete exibida no vídeo”; categoria “Notícia comentada”. 📋 Pedir a fonte da notícia. |
| 2.8 | “…e mostra de onde vem cada regra” (abertura) e “cada explicação diz de onde vem a regra” (seção violeta): afirmação genérica sem comprovação. | ✅ Removida da abertura; na seção violeta virou “quando a explicação parte de uma norma ou de um julgamento, a publicação diz qual é”, com duas referências nomeadas e consultáveis. |
| 2.9 | “A fonte, citada” não oferecia fonte consultável. | ✅ Agora “A referência, nomeada”, com links: PEC 32/2020 (ficha da Câmara) e Tema 1218 (RE 1.326.541, andamento no STF). ⏳ Links não abertos daqui (ver QA). |
| 2.10 | Reproduções em CSS das capas na abertura podiam passar por imagem original (tinham até a assinatura “QUEIROZ COSECHEN”). | ✅ Assinatura removida; cada capa tem “Abrir o original”; legenda diz que são capas “redesenhadas em texto para o site”. |
| 2.11 | Chamada do contato (“Pergunte direto.”) soava como consulta gratuita. | ✅ “Para falar com o Vitor, o canal oficial é o WhatsApp.” + aviso de caráter informativo. |
| 2.12 | Título do Threads “Conta vinculada ao perfil do Instagram” afirmava vínculo técnico. | ✅ “Conta indicada na bio do Instagram” (é o que a gravação mostra). |

## 3. UX/UI

| # | Problema | Resultado |
|---|---|---|
| 3.1 | Abertura com WhatsApp como ação principal — tom de campanha de venda. | ✅ Principal: “Ver as explicações”. Secundária: “Falar pelo WhatsApp”. Botão do cabeçalho em contorno. |
| 3.2 | Canal oficial do Instagram não aparecia na primeira dobra. | ✅ Linha “Perfil oficial no Instagram: @vitorqcosechen.adv”. |
| 3.3 | Menu mobile aberto continuava cobrindo a página quando o foco saía dele pelo Tab. | ✅ Fecha ao perder o foco. |
| 3.4 | Menu mobile sem limite de altura (zoom alto ou tela baixa). | ✅ `max-height` + rolagem interna. |
| 3.5 | Item do menu continuava marcado ao rolar para a abertura ou o campo violeta. | ✅ Marca só a seção que está na faixa central; nenhuma fora delas. |
| 3.6 | Título da abertura quebrava “servidor público,” em 2 linhas a 320 px. | ✅ Escala ajustada; 4 linhas em todas as larguras de 320 a 1440 px. |
| 3.7 | Marca do cabeçalho com área de toque de 19 px no mobile. | ✅ 44 px. |
| 3.8 | Contador “48/600”. | ✅ “48 de 600 caracteres”, sem anunciar a cada tecla. |
| 3.9 | Mensagem de status “Sua mensagem foi aberta no WhatsApp”. | ✅ “O WhatsApp foi aberto em uma nova aba com a sua mensagem. Nada é enviado até você tocar em enviar por lá.” |
| 3.10 | Números da seção violeta: referências internas herdavam o contador (apareciam 03, 04 e o passo final virava 05). Erro introduzido nesta rodada e pego na revisão visual. | ✅ Seletor `> li`. |

## 4. SEO

| # | Problema | Resultado |
|---|---|---|
| 4.1 | Description com 185 caracteres. | ✅ 146. |
| 4.2 | Sem `twitter:title`/`twitter:description`, sem `og:site_name`/`og:image:alt`. | ✅ Acrescentados. |
| 4.3 | `canonical`, `og:url`, URL absoluta da imagem, `robots.txt`, `sitemap.xml`. | 📋 Dependem do domínio; instruções no `README`. Não inventei domínio. |
| 4.4 | Dados estruturados. | Não adicionados: sem OAB e área confirmadas, ficariam incompletos. |

## 5. Acessibilidade

| # | Problema | Resultado |
|---|---|---|
| 5.1 | `aria-label` em `<div class="steps">` sem papel (nome proibido para elemento genérico). | ✅ Removido; “Passo 4 de 5” já é texto visível. |
| 5.2 | `<main>` sem `tabindex="-1"`: o “Pular para o conteúdo” não movia o foco em alguns navegadores. | ✅ Testado: foco vai para `#conteudo`. |
| 5.3 | Contador com `aria-live` anunciando cada tecla. | ✅ Removido; continua ligado ao campo por `aria-describedby`. |
| 5.4 | Formulário sem nome acessível. | ✅ `aria-labelledby` + `aria-describedby` (aviso de privacidade). |
| 5.5 | Leitor de tela real (NVDA, VoiceOver). | ⏳ Verificado só pela árvore de acessibilidade do Chromium. |

## 6. Técnico e compatibilidade

| # | Problema | Resultado |
|---|---|---|
| 6.1 | `matchMedia().addEventListener` não existe no Safari < 14 — o script quebraria ali. | ✅ Fallback para `addListener`. |
| 6.2 | Slides da abertura usam `cqi` sem fallback (Safari < 16, Firefox < 110). | ✅ Valores em `rem` antes de cada `cqi`. |
| 6.3 | Sem cabeçalhos de segurança/cache para a hospedagem. | ✅ `_headers` (nosniff, referrer, frame, permissions, cache). |
| 6.4 | Gerador do arquivo único deixava comentários internos (marcas de PRODUÇÃO) na prévia. | ✅ Comentários removidos na geração. |
| 6.5 | Safari e Firefox reais. | ⏳ Só Chromium disponível. |

## 7. Refinamentos visuais opcionais (não feitos, aguardam material)

- Capas reais dos carrosséis (arquivos 1080×1350 exportados pelo designer) no lugar das capas redesenhadas — ver `PENDENCIAS.md`.
- Retrato do Vitor na abertura, ao lado das capas.
- Símbolo “Queiroz Cosechen” em vetor no cabeçalho e no rodapé.
