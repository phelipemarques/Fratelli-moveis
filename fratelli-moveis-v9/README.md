# Fratelli Móveis — V8

Móveis planejados em Cascavel, Paraná. Site estático: HTML, CSS e
JavaScript, sem framework e sem etapa de build.

Esta é a **V8**, construída a partir da V7.1. A V3 continua inteira em
`fratelli-moveis-v3/` e a V2 em `fratelli-moveis-v2/` — nenhuma foi
alterada.

A V6 acrescenta um capítulo tridimensional (Three.js r169, MIT) logo
depois do hero: um módulo de marcenaria **conceitual** cujas portas abrem
em dobradiças reais, com a câmera e a luz conduzidas pela rolagem. Ele só
monta em desktop com WebGL; em toque, sem WebGL ou com movimento
reduzido, a seção mostra a fotografia real e o Three.js nem é baixado.

**A prévia de arquivo único roda o capítulo 3D.** O navegador recusa
*baixar* um módulo ES de `file://`, mas executa um módulo escrito dentro
da própria página. Então `tools/build-single-file.py` achata os seis
arquivos de `js/3d/` num `<script type="module">` sem nenhum `import`: o
`export{...}` do Three.js vira um objeto comum, cada arquivo entra
dentro da sua própria função (recebendo o que importava, devolvendo o
que exportava) e cada `import('./x.js')` do `boot.js` vira
`Promise.resolve(MOD_x)` — o que deixa o `boot.js`, com toda a decisão
de perfil, palavra por palavra como no pacote.

No pacote de publicação os seis arquivos continuam separados, com os
imports dinâmicos: é ele que mantém os 671 KB do Three.js fora dos
aparelhos que não vão usá-los. Para abrir o pacote como ele vai ao ar:

```
unzip fratelli-moveis-v6-producao.zip -d site && cd site
python3 -m http.server 8080
```

e abra `http://localhost:8080`.

## O que a V6 acrescenta à V3

- madeira PBR procedural (`js/3d/grao.js`), com veio na direção certa
  de cada peça, e um ambiente para as bordas e o metal refletirem;
- câmera em coordenadas esféricas: dolly, órbita e altura em curvas
  separadas, em cinco atos;
- rodapé recuado, gaveteiro, fita de borda, fundo em tom próprio;
- transição contínua do hero para o capítulo 3D — a fotografia
  reenquadra, o véu chega ao mesmo preto da seção seguinte e um fio
  atravessa a emenda;
- capítulo 2.5D próprio para aparelho de toque, com o mesmo veio e
  **sem baixar o Three.js**;
- `#materiais`: um capítulo sobre veio, luz rasante e espessura;
- entrada encadeada e profundidade sob o ponteiro no portfólio;
- passagem individual para cada ambiente da faixa horizontal;
- AVIF em todas as fotografias (−46% de bytes nos casos reais);
- correção de três defeitos da V3 — ver `RELATORIO-V6.md`, seção 1.

Documentos: `RELATORIO-V6.md` (o que foi feito), `TESTES-V6.md` (o que
foi medido), `IMAGENS-V6.md` (a auditoria das fotografias),
`PENDENCIAS.md` (o que falta e depende de você).

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

Antes disso há dois bloqueios reais, descritos em `RELATORIO-V8.md`:
a validação em GPU de verdade e a confirmação das duas fotografias não
identificadas. Enquanto eles existirem, o site **não está pronto para
ir ao ar**.
