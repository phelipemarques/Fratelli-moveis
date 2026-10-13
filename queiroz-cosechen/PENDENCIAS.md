# Pendências — Vitor Queiroz Cosechen

Legenda: 🔴 bloqueia a publicação · 🟡 melhora o resultado · ⚪ decisão do cliente.

Tudo o que está no site saiu do vídeo de referência (perfil, bio e publicações
abertas na gravação de 13/10/2026). O que não estava lá está listado aqui, e não
foi inventado. **O site não está pronto para publicar.**

---

## 🔴 1. Inscrição na OAB

**O que falta:** número de inscrição e seccional (ex.: OAB/PR 00.000).
**Onde entra:** ficha do “Sobre” e rodapé — hoje `[nº e seccional a confirmar]`.
**Por que bloqueia:** a identificação do advogado com nome e número de inscrição é
exigida pelas regras de publicidade da OAB. O marcador está visível de propósito.

## 🔴 2. Revisão jurídica e aprovação dos textos

Nada no site recebeu aprovação jurídica. Vitor precisa ler e aprovar a página
inteira. Ponto a ponto, com a origem de cada afirmação:

| Trecho no site | Origem | Natureza | O que confirmar |
|---|---|---|---|
| “A PEC 32/2020… alcança municípios, estados e União” | Carrossel PEC, slide 1 | Descrição de proposta legislativa | Se o resumo está fiel |
| “ampliação da contratação temporária; na leitura do Vitor, o concurso público deixaria de ser a regra” | Carrossel PEC, slide 3 | **Interpretação do autor** | Se aceita a atribuição “na leitura do Vitor” |
| “a PEC não virou emenda constitucional” | Carrossel PEC, slide 5 | Fato legislativo | Situação atual na Câmara (não consegui abrir a página oficial; buscas indicam aprovação na comissão especial em 2021 e nenhuma votação em plenário encontrada) |
| PAD: “Ignorar a notificação… cada fase tem sua importância” | Carrossel PAD, erro 1 | Orientação prática | Redação |
| PAD: “Vitor relata ter visto vários servidores… demitidos” | Carrossel PAD, erro 4 | **Relato pessoal** | Se quer manter (não é caso concreto identificado nem promessa) |
| Assédio moral: “Faça um diário… data, hora, local…” | Carrossel assédio, prova 1 | Orientação prática | Redação |
| CAT: “pode gerar direitos ligados ao afastamento e até cálculos diferenciados na aposentadoria” | Carrossel CAT, passo 4 | Afirmação jurídica geral | Se vale para todos os regimes (estatutário/celetista, RPPS/RGPS) ou precisa de ressalva |
| “MPT aciona a Prefeitura do Rio por assédio eleitoral” | Vídeo (manchete na tela) | **Notícia de terceiros** | **Fonte da notícia.** Não encontrei a ação em buscas públicas; achei só um ofício do MPT à Secretaria de Saúde do Rio (set/2026). Sem fonte, sugiro trocar este card por outra publicação. |
| “Tema 1218 — RE 1.326.541” | Título de vídeo do perfil | Julgamento no STF | Situação atual (buscas indicam julgamento interrompido por pedidos de vista, sem tese fixada); o site não afirma resultado, só aponta onde acompanhar |
| Abertura: “Direito do servidor público, explicado sem rodeio.” e texto de apoio | Proposta minha | Apresentação | Aprovar |
| “Sobre”: dois parágrafos | Proposta minha, a partir do perfil | Apresentação | Aprovar |
| “Como as explicações são feitas”: três passos | Proposta minha, a partir do formato dos carrosséis | Apresentação | Aprovar |
| Rodapé e contato: “Conteúdo informativo. Não substitui a análise individual…” | Proposta minha | Aviso | Aprovar a redação |

## 🔴 3. Checklist de publicidade (para o próprio advogado)

Não declaro o site conforme às normas. Não consegui abrir o texto oficial do
Provimento 205/2021 nem a página de marketing jurídico da OAB deste ambiente
(acesso bloqueado). Conferi só por fontes secundárias. Antes de publicar, o
próprio Vitor deve conferir, no texto vigente
(<https://www.oab.org.br/leisnormas/legislacao/provimentos/205-2021> e
<https://marketingjuridico.oab.org.br/>):

- [ ] Nome completo e número de inscrição na OAB aparecem na página.
- [ ] Nenhuma promessa de resultado nem garantia de êxito.
- [ ] Nenhum caso concreto usado para oferecer serviço (rever o card do PAD, erro 4, e o card do MPT).
- [ ] Nenhuma menção a clientes, número de clientes ou avaliações (os números da bio ficaram fora — ver item ⚪).
- [ ] Nenhuma especialidade anunciada sem a titulação correspondente (o site só diz “Advogado do Servidor Público e Sindicatos”, como a bio, e a seção Temas avisa que não é lista de serviços).
- [ ] Tom do contato informativo, sem apelo à contratação.
- [ ] Nenhum símbolo da OAB.
- [ ] Uso do WhatsApp como canal de contato conforme as orientações vigentes.

## 🔴 4. Domínio

Sem domínio definido. Depois de definido: tirar o `noindex`, colocar URL
absoluta em `og:image`, acrescentar `canonical` e `og:url`, e criar
`robots.txt` e `sitemap.xml` com o endereço real (ver `README`).

## 🔴 5. Confirmar os links (um clique em cada)

O Instagram, o Threads, a Câmara e o STF estão bloqueados no ambiente onde o site
foi montado. Os links foram transcritos ou montados, **não abertos**:

| Link | Origem |
|---|---|
| instagram.com/p/DeX9d3KjVAA/ — PEC 32/2020 | barra de endereço da gravação |
| instagram.com/p/DeDVl7DjUzm/ — PAD | idem (l minúsculo, resolvido por altura dos pixels) |
| instagram.com/p/DeLBcEWDVIH/ — assédio moral | idem (I maiúsculo, idem) |
| instagram.com/p/DeF3yIGDbfH/ — CAT | idem (I maiúsculo, idem) |
| instagram.com/p/DeXYz79ivDr/ — MPT | idem |
| threads.net/@vitorqcosechen.adv | ícone do Threads na bio |
| camara.leg.br/…fichadetramitacao?idProposicao=2262083 — PEC 32/2020 | identificador citado em fonte secundária |
| portal.stf.jus.br/processos/listarProcessos.asp?classe=RE&numeroProcesso=1326541 — Tema 1218 | consulta processual do STF pelo número do RE |
| wa.me/5545991176434 | link da bio |

---

## 🟡 6. Fotografia

**O que falta:** retrato autorizado de Vitor, vertical (4:5), mínimo 1200 px de
largura. **Onde entra:** acima da ficha no “Sobre” (o código está pronto,
comentado no `index.html`) e, se ele quiser, na abertura.
Não usei os quadros do vídeo: a foto de perfil tem ~150 px, e a gravação de tela
não é autorização de uso de imagem.

## 🟡 7. Capas originais dos carrosséis

As capas da abertura são **redesenhadas em texto** e a página diz isso. Para
usar as capas reais, preciso dos arquivos exportados (PNG/JPG 1080×1350) dos
cinco carrosséis, com autorização de uso no site. Capturas de tela da gravação
não servem: têm as setas e os pontos do Instagram por cima e ~860 px.

## 🟡 8. Símbolo “Queiroz Cosechen”

Arquivo vetorial (SVG ou PDF) do símbolo que fecha os carrosséis, se ele quiser
no cabeçalho e no rodapé. Não redesenhei a marca.

## 🟡 9. Fonte dos carrosséis

Usei Manrope (licença livre). Se o designer informar a fonte dos posts, troco.

---

## ⚪ 10. Números da bio

“+ de 900 avaliações 5 estrelas no Google” e “+ de 4000 servidores atendidos”
ficaram fora de propósito: número de clientes e avaliações em publicidade de
advogado pede verificação nas regras da OAB (item 3). Entram só com decisão e
redação dele.

## ⚪ 11. Ícone da aba

Bloco violeta com “QC” — proposta minha, não é a marca oficial.

## ⚪ 12. E-mail, endereço e política de privacidade

Não estavam no perfil. Hoje o site não usa cookies, análise, pixels nem
servidor: o formulário só monta o texto e abre o WhatsApp, e a página diz isso.
Por isso não criei uma política de privacidade. Se forem adicionados analytics,
pixel ou formulário com envio, a política passa a ser necessária.
