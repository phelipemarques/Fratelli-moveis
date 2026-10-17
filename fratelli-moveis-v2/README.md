# Fratelli Móveis — site (V2)

Móveis planejados em Cascavel, Paraná. Site estático: HTML, CSS e
JavaScript, sem framework e sem etapa de build.

Esta é a **V2**. A versão anterior continua inteira na pasta acima e não
foi alterada.

## Estrutura

```
index.html                 a página
404.html                   página de erro, no mesmo sistema visual
robots.txt                 libera a indexação, aponta o sitemap
sitemap.xml                uma URL: a home
_headers                   cache do Netlify

css/main.css               toda a folha de estilo, na ordem da cascata
js/main.js                 GSAP + ScrollTrigger + o código do site

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
python3 tools/make-zip.py            # fratelli-moveis-v2-producao.zip
python3 tools/build-single-file.py   # fratelli-moveis-v2-visualizacao.html
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
