# Fratelli Móveis — site (V2)

Móveis planejados em Cascavel, Paraná. Site estático: HTML, CSS e
JavaScript, sem framework e sem etapa de build.

Esta é a **V3**. A V2 continua inteira em `fratelli-moveis-v2/` e não foi
alterada.

A V3 acrescenta um capítulo tridimensional (Three.js r169, MIT) logo
depois do hero: um módulo de marcenaria **conceitual** cujas portas abrem
em dobradiças reais, com a câmera e a luz conduzidas pela rolagem. Ele só
monta em desktop com WebGL; em toque, sem WebGL ou com movimento
reduzido, a seção mostra a fotografia real e o Three.js nem é baixado.

**A prévia de arquivo único roda o capítulo 3D.** O navegador recusa
*baixar* um módulo ES de `file://`, mas executa um módulo escrito dentro
da própria página. Então `tools/build-single-file.py` achata os três
arquivos de `js/3d/` num `<script type="module">` sem nenhum `import`: o
`export{...}` do Three.js vira um objeto comum, o `import * as THREE` sai
(THREE já está no escopo) e o `import('./opening.js')` vira chamada
direta. A cena é a mesma — muda só como as peças se ligam.

No pacote de publicação os três arquivos continuam separados, com o
import dinâmico: é ele que mantém os 671 KB do Three.js fora dos
aparelhos que não vão usá-los. Para abrir o pacote como ele vai ao ar:

```
unzip fratelli-moveis-v3-producao.zip -d site && cd site
python3 -m http.server 8080
```

e abra `http://localhost:8080`.

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
python3 tools/make-zip.py            # fratelli-moveis-v3-producao.zip
python3 tools/build-single-file.py   # fratelli-moveis-v3-visualizacao.html
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
