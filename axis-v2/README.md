# AXIS Academia e Fisioterapia — V2

Redesign da primeira versão (`../axis/`, preservada sem alterações). Site
estático de uma página: HTML, CSS e JavaScript, sem build. GSAP 3.13 e
ScrollTrigger vêm da V1, separados em dois arquivos.

> **Prévia, não publicada.** `noindex, nofollow` mantido. Publicar só com
> autorização da AXIS e domínio definido. Pendências em
> [`PENDENCIAS.md`](PENDENCIAS.md); medições e testes em [`TESTES.md`](TESTES.md).

## Rodar

```bash
cd axis-v2
python3 -m http.server 8140      # http://127.0.0.1:8140
python3 tools/build-single-file.py   # gera axis-v2-visualizacao.html (arquivo único)
```

## Estrutura

```
index.html
css/main.css               tokens → base → sistema → cabeçalho → abertura → seções → movimento
js/vendor/gsap.min.js      núcleo do GSAP (carrega no <head>)
js/vendor/ScrollTrigger.min.js
js/intro.js                timeline de abertura (carrega no <head>, disparada no fim do hero)
js/site.js                 WhatsApp, cabeçalho, menu, indicador, serviços, barra fixa, galeria/lightbox
js/motion.js               movimento na rolagem
assets/fonts/              Barlow Condensed 700 e 800 itálico, Inter variável (SIL OFL)
assets/brand/              favicon, og-cover.jpg (logo oficial entra aqui)
assets/images/             gerado pelo tools/fotos.py
tools/fotos.py             encaixa as fotos reais (AVIF + WebP responsivos)
tools/fotos/slots.json     os 12 espaços de foto, com alt e tamanhos
tools/build-single-file.py prévia em arquivo único
tools/make-zip.py          pacote do Netlify
docs/comparativo/          capturas antes/depois
```

## Arquitetura da página

| V1 (13 blocos) | V2 (11 seções) |
| --- | --- |
| Hero + faixa de destaques | **Abertura** cinematográfica com três recortes fotográficos |
| Diferenciais (6 cartões) | **02 Por que a AXIS**: manifesto + 4 pontos |
| Serviços (6 cartões de mesmo peso) | **01 Serviços**: 3 pilares com foto e direção de arte própria; avaliação e Gympass numa faixa complementar |
| Fisioterapia | **03 Fisioterapia**: foto + painel claro, abordagem em 4 etapas, áreas de atuação |
| Galeria (molduras) | **04 Estrutura**: grade que se adapta à quantidade de fotos, com lightbox |
| Para quem é (8 cartões) | **05 Para quem é**: duas listas (objetivos e momentos) com o serviço indicado |
| Conteúdos (carrossel) | **06 Revista AXIS**: matéria em destaque + índice |
| Histórias + 3 depoimentos fictícios | **07 Histórias reais**: só o que é público (sem depoimentos inventados) |
| Como funciona | **08 Como começar**: jornada com linha de progresso |
| FAQ | **09 Dúvidas**, respostas sem afirmar o que não foi confirmado |
| Contato | **10 Contato**: WhatsApp geral e por assunto, endereço, como chegar |

## Direção de arte

- **Diagonal da marca como sistema.** O mesmo deslocamento (`--skew: 25%`)
  desenha os recortes da abertura, o corte dos botões, a cortina das fotos e
  a **Linha AXIS** (horizontal que sobe na diagonal). A linha aparece só em
  passagens: abertura, régua dos serviços, borda da foto da fisioterapia,
  progresso da jornada e o fechamento, logo acima do botão de contato.
- **Três pilares, três climas.** Musculação: escuro, título itálico pesado,
  foto com canto cortado. Fisioterapia: painel claro e filete vermelho (o
  lado clínico). Pilates: carvão, título em Inter leve e anéis de respiração.
- **Contraste alternado.** Preto → preto → carvão → claro (fisioterapia) →
  preto → carvão → claro (revista) → preto → carvão → preto.
- **Vermelho como assinatura.** Botões, linhas, números e um destaque por
  título. Sem brilho e sem cartões vermelhos repetidos.

## Movimento

- **Abertura (GSAP, `js/intro.js`)** em cinco cenas: marca e Linha AXIS → título
  por linhas em máscara → três recortes abrindo na diagonal → ênfase em
  sequência em Musculação / Fisioterapia / Pilates → botões assentam. Os
  botões nunca ficam invisíveis.
- **Rolagem (`js/motion.js`)**: títulos por linhas, fotos por cortina diagonal
  com fio vermelho, Linha AXIS desenhando, grupos em sequência, progresso da
  jornada. Parallax só no desktop com mouse. Nada é fixado (sem pinning, sem
  sequestro de rolagem).
- **Segurança**: estados iniciais só com `html.motion`, que só existe sem
  `prefers-reduced-motion`; se a abertura não confirmar em 2,5 s, a classe sai.
  Sem JavaScript, tudo aparece e os detalhes dos serviços ficam abertos.

## Fotos reais

1. Coloque cada foto em `tools/fotos/` com o nome do espaço
   (ex.: `tools/fotos/servico-pilates.jpg`). Os 12 nomes estão em
   `tools/fotos/slots.json`.
2. Ajuste o `alt` de cada espaço em `slots.json` para descrever a foto.
3. `python3 tools/fotos.py`

O script gera AVIF e WebP nas larguras certas, escreve o `<picture>` com
`width`/`height`, `srcset`, `sizes` e `loading="lazy"` (a abertura carrega com
prioridade) e mostra os quadros 4 e 5 da galeria quando recebem foto. Com duas
fotos ou mais na galeria, o lightbox liga sozinho. Rodar de novo é seguro.

Use só fotos autorizadas e não mostre alunos ou pacientes identificáveis sem
consentimento.

## Logo oficial

O cabeçalho e o rodapé mostram o nome da marca em texto (provisório, sem
imitar o símbolo). Com o vetor oficial:

1. Salve em `assets/brand/axis-logo.svg`.
2. Nos dois `<a class="brand">` do `index.html`, troque os dois `<span>` por
   `<img src="assets/brand/axis-logo.svg" width="…" height="…" alt="">`
   (proporção original; o `aria-label` do link continua dando o nome).
3. Ajuste a altura em `.brand img { height: 32px; width: auto; }`.

## WhatsApp

Número e mensagens ficam em um só lugar: `WA_NUMBER` e `WA_TEXT` no início de
`js/site.js`. Cada link com `data-wa="geral|musculacao|fisioterapia|pilates"`
recebe a mensagem com `encodeURIComponent`. Sem JavaScript, o link abre o
WhatsApp sem texto pronto. Abrir o WhatsApp é um pedido de contato, não um
agendamento.

## Depoimentos

Os espaços reservados da V1 saíram da versão comercial. Com depoimentos reais e
autorizados, acrescente na seção `#historias`, depois de `.real__list`:

```html
<figure class="quote">
  <blockquote><p>Texto do depoimento, nas palavras da pessoa.</p></blockquote>
  <figcaption><strong>Nome autorizado</strong> · Modalidade</figcaption>
</figure>
```

## Publicar (só com autorização)

1. Apagar a linha `noindex` e preencher o bloco `PRODUÇÃO` do `index.html`.
2. Trocar `SEU-DOMINIO` em `robots.txt` e `sitemap.xml`.
3. `python3 tools/make-zip.py` e subir `axis-v2-netlify.zip`.
