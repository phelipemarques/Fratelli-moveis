# Fratelli Móveis — Reimaginada

Móveis planejados em Cascavel, Paraná. Site estático: HTML, CSS e
JavaScript, sem framework e sem etapa de build.

Esta é a **V9**, construída a partir da V8. A V3 continua inteira em
`fratelli-moveis-v3/` e a V2 em `fratelli-moveis-v2/` — nenhuma foi
alterada.

Logo depois do hero vem o **Architectural Reveal**: uma folha de
nogueira fotografada desliza e revela um ambiente planejado, com o
enquadramento se abrindo sob a rolagem. Não há WebGL — é fotografia,
máscara e transformação, dirigidas por GSAP e ScrollTrigger.

O armário em Three.js das versões 6 a 9 **foi removido**, com ele os
687 KB da biblioteca e 106 KB de módulos próprios. O porquê está em
`RELATORIO-REIMAGINACAO.md`, seção 1.

No celular a cena tem composição própria e **não usa pin**: a rolagem
vertical nunca é sequestrada.

**A prévia de arquivo único roda a cena inteira**, aberta de `file://`,
sem servidor — testado nas duas composições. `tools/build-single-file.py`
embute folha de estilo, JavaScript, fontes, imagens e o filme em data
URI. Ficou bem mais simples do que era: até a V9 ele precisava achatar
seis módulos ES e o Three.js num `<script type="module">`, porque o
navegador recusa baixar um módulo de `file://`. Agora são dois arquivos
de JavaScript comuns.

Documentos: `RELATORIO-REIMAGINACAO.md` (o que foi feito e por quê),
`TESTES-REIMAGINACAO.md` (o que foi medido, e o que **não** foi),
`AUDITORIA-IMAGENS.md` (o acervo, medido arquivo por arquivo),
`PENDENCIAS.md` (o que falta e depende de você).

Provas em imagem: `tools/provas/` — a cena em cinco estados nas duas
telas, o ANTES/DEPOIS contra a V9 e a página inteira em desktop e
celular.

## Estrutura

```
index.html                 a página
404.html                   página de erro, no mesmo sistema visual
robots.txt                 libera a indexação, aponta o sitemap
sitemap.xml                uma URL: a home
_headers                   cache do Netlify

css/main.css               toda a folha de estilo, na ordem da cascata
js/main.js                 GSAP + ScrollTrigger + o código do site
js/3d/opening.js           a cena: modelo, pivôs, câmera, luz, timeline
js/3d/boot.js              os três perfis e a ligação com o ScrollTrigger
js/3d/three.module.min.js  Three.js r169 (MIT, licença ao lado)

assets/images/             fotografias, em WebP com alternativa JPEG
assets/video/              o filme institucional, em MP4
assets/fonts/              Newsreader e Inter, variáveis, SIL OFL 1.1

tools/                     ferramentas de preparo (não vão para o ar)
```

## O sistema de movimento

Nenhuma animação inventa duração ou curva própria. O vocabulário vive em
dois lugares que se espelham e **precisam andar juntos**:

- `css/main.css`, no bloco `--ease-*` / `--dur-*` / `--rise*`;
- `js/main.js`, no objeto `MOTION`, logo no começo do código do site.

Mudar o ritmo do site é mudar esses dois.

## Gerar os pacotes

```
python3 tools/make-zip.py            # fratelli-moveis-v6-producao.zip
python3 tools/build-single-file.py   # fratelli-moveis-v6-visualizacao.html
```

O primeiro empacota só o que vai para o ar. O segundo embute tudo num
arquivo só, para abrir no computador sem servidor — é para ver, não para
publicar.

## Publicar no Netlify

Arraste o ZIP em *Deploy manually*. Depois do primeiro deploy, cinco
linhas precisam da URL real: três comentadas no `index.html` (canonical,
og:url, og:image), a linha `Sitemap:` do `robots.txt` e o `<loc>` do
`sitemap.xml`.

Veja `PENDENCIAS.md` antes de publicar.


## Antes de publicar

O site sai desta pasta com `noindex, nofollow` **de propósito**. Na
publicação, nesta ordem:

1. preencher `canonical`, `og:url` e `og:image` no `index.html`
   (estão comentados, esperando a URL real);
2. preencher a `<loc>` do `sitemap.xml`;
3. só então trocar o `robots` para `index, follow`.

Antes disso há dois bloqueios reais, descritos em `RELATORIO-REIMAGINACAO.md`:
a validação em GPU de verdade e a confirmação das duas fotografias não
identificadas. Enquanto eles existirem, o site **não está pronto para
ir ao ar**.
