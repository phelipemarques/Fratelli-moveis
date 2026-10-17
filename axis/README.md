# AXIS Academia e Fisioterapia — site institucional

Site de uma página da AXIS, academia, fisioterapia e pilates em Cascavel – PR
(Rua Riachuelo, 2397 · WhatsApp (45) 99115-9425 · @academiaaxis).

> **Status: prévia de aprovação.** Indexação bloqueada (`noindex`). O que falta
> receber da AXIS está em [`PENDENCIAS.md`](PENDENCIAS.md).

## Como rodar

Site estático, sem build e sem dependência de rede em tempo de execução: as
fontes e o GSAP estão dentro do projeto.

```bash
cd axis
python3 -m http.server 8130
# abra http://127.0.0.1:8130
```

## Estrutura

```
index.html                 a página inteira
css/main.css               toda a folha de estilo (tokens → base → componentes
                           → cabeçalho → seções → movimento)
js/main.js                 interface + movimento (GSAP/ScrollTrigger)
js/vendor/gsap.min.js      GSAP 3.13 + ScrollTrigger, não editar
assets/fonts/              Barlow Condensed (700, 800 itálico) e Inter variável,
                           SIL OFL 1.1
assets/brand/              favicon e imagem de compartilhamento (og-cover.jpg)
tools/make-zip.py          monta o pacote do Netlify
tools/build-single-file.py gera axis-visualizacao.html, versão em arquivo
                           único (tudo embutido) para visualizar ou enviar
_headers, robots.txt, sitemap.xml
```

## Ordem da página

Abertura → faixa de destaques → 01 Por que a AXIS → 02 Serviços →
03 Fisioterapia (seção clara) → 04 Para quem é → 05 Conteúdos →
06 Histórias → 07 Galeria → 08 Como funciona → 09 Dúvidas → 10 Contato → rodapé.

## Decisões de projeto

- **Força e cuidado em dois climas.** O site é escuro (treino, performance) e a
  seção de fisioterapia é clara, no off-white e vermelho dos posts clínicos do
  Instagram. A faixa "Tratar → Fortalecer → Evoluir" vai do claro ao escuro: é o
  caminho que só existe porque academia e fisioterapia dividem o endereço.
- **Tipografia.** Barlow Condensed para títulos (atlética, condensada, com
  itálico 800 para os destaques em vermelho, eco do lettering dos posts) e Inter
  para leitura.
- **Conversão.** Todo botão de WhatsApp abre com uma mensagem pronta e
  específica (musculação, fisioterapia, pilates, Gympass…). No celular, uma
  barra fixa de agendamento aparece depois da abertura e sai de cena quando
  outro botão vermelho grande ou o contato já estão na tela.
- **Abertura em CSS, o resto em GSAP.** A entrada do título é animada em CSS
  para começar na primeira pintura, sem esperar o JavaScript: LCP de ~1,2 s
  medido em 4G lento com CPU 4× mais lenta. Revelações, galeria, linha do
  "Como funciona", fechamento e parallax (só desktop com mouse) ficam com
  GSAP + ScrollTrigger. Sem fixação de seção (pinning) em lugar nenhum.
- **Sem estado invisível.** Os estados iniciais das animações só existem com
  `html.motion`, que só entra sem `prefers-reduced-motion`. Sem JavaScript, ou
  se o GSAP não carregar em 2,5 s, tudo aparece no estado final.
- **Mapa sob demanda.** O iframe do Google Maps só carrega no clique.
- **Sem números inventados.** Não há contadores de "alunos atendidos" porque
  não existe dado real. Se a AXIS fornecer números, a faixa de destaques é o
  lugar para eles.

## Onde editar o quê

| Quero mudar | Onde |
| --- | --- |
| Cores, tamanhos, espaçamentos | bloco `1. TOKENS` em `css/main.css` |
| Textos, seções, ordem | `index.html` |
| Número do WhatsApp | `index.html`: buscar `5545991159425` |
| Mensagem que abre no WhatsApp | parâmetro `text=` de cada link `wa.me` |
| Ritmo das animações | bloco `6. MOVIMENTO` do CSS e `js/main.js` |

### Trocar as molduras da galeria por fotos reais

Cada quadro da galeria é um `<figure class="shot">` com uma moldura
`<div class="shot__ph">`. Troque a moldura por uma imagem:

```html
<img src="assets/images/galeria-treino-800.webp" width="800" height="1000"
     loading="lazy" decoding="async" alt="Aluna treinando agachamento com orientação">
```

A legenda passa a aparecer sozinha quando há foto. Use WebP com ~80 de
qualidade, no máximo 1600 px no lado maior, e sempre `width`/`height`.

Os três pilares da abertura também aceitam foto: coloque um `<img>` dentro de
`<span class="pillar__media">` (sem `loading="lazy"`, porque estão na primeira
dobra).

### Trocar a marca

A logo do cabeçalho e do rodapé é uma composição tipográfica provisória
(`.brand`). Com o vetor oficial em mãos, salve em `assets/brand/axis-logo.svg`
e substitua o conteúdo dos dois `<a class="brand">` por
`<img src="assets/brand/axis-logo.svg" alt="" width="…" height="…">`, mantendo o
`aria-label` do link.

## Publicar

1. Em `index.html`, apague a linha `noindex` e descomente o bloco `PRODUÇÃO`
   (canonical, og:url, og:image absolutos).
2. Troque `SEU-DOMINIO` em `robots.txt` e `sitemap.xml`.
3. `python3 tools/make-zip.py` e arraste `axis-netlify.zip` em
   <https://app.netlify.com/drop>.
