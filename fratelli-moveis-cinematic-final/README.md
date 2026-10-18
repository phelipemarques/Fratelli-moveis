# Fratelli Móveis — Cinematic Final

Móveis planejados em Cascavel, Paraná. Site estático: HTML, CSS e
JavaScript, sem framework e sem etapa de build.

Esta versão parte de `fratelli-moveis-3d/`, que continua **intacta** ao
lado, como todas as anteriores. Não foi reconstrução: é refinamento,
e cada mudança tem a medição de antes e depois em
`RELATORIO-CINEMATIC.md`.

Logo depois do hero vem o **capítulo tridimensional**: um painel de
marcenaria de parede, do piso ao teto, **3,38 × 2,60 × 0,62 m**, com
seis folhas — duas **ripadas** nas pontas (10 ripas cada) e quatro
lisas, das quais as duas centrais abrem **para fora** em dobradiças
reais, até 106,6°. Three.js r169 (MIT), conduzido por uma única
timeline GSAP sob o ScrollTrigger. 34 malhas, 2.116 triângulos
desenhados por quadro.

**A cena agora tem parede.** Até esta versão havia piso e mais nada, e
a borda do piso contra o vazio desenhava uma linha de horizonte dura
atravessando o quadro — medida em 42,2 de degrau de luminância no
desktop e 45,2 no celular. A parede entra no plano das costas do
módulo, que é onde ela estaria numa obra.

**Desktop e celular rodam a MESMA cena.** O perfil B usa o modo
econômico (textura de 512, sombra de 1024, teto de pixel ratio em 1,5)
e uma sequência mais curta. **O enquadramento deixou de ser o do
desktop:** o desvio lateral da câmera existe para a coluna de texto, e
em proporção de retrato ele vai a zero sozinho — a peça passou de
31% para 71% da largura da tela do celular, centrada.

**Sem WebGL a história continua.** O perfil C recebe 16 quadros
pré-renderizados da mesma linha de tempo — 136 KB, contra os 671 KB do
Three.js que ele não baixa. Com movimento reduzido, nem isso: fica a
fotografia, parada, como a pessoa pediu.

Modo de desenvolvimento: `window.__fratelli3D.estado(a)` para a cena em
qualquer abertura de 0 a 1 e congela o enquadramento;
`window.__fratelli3D.medidas()` devolve as dimensões do modelo. Não há
interface nem eixos desenhados.

**A prévia de arquivo único roda a cena inteira**, aberta de `file://`,
sem servidor — e roda **também sem WebGL**, que era o caminho que
faltava: `tools/build-single-file.py` achata os módulos de `js/3d/` num
`<script type="module">` sem nenhum `import`, e embute o índice da
sequência em `window.__fratelliSeq`, porque de `file://` o navegador
recusa tanto baixar um módulo quanto `fetch`. Testado, não declarado:
`tools/teste-previa.js`, 11 testes, 0 falhas.

Documentos: `RELATORIO-CINEMATIC.md` (o que foi feito e por quê),
`TESTES-CINEMATIC.md` (o que foi medido, e o que **não** foi),
`AUDITORIA-IMAGENS.md`, `PENDENCIAS.md`.

Comparações antes/depois em imagem: `tools/ref/comparacao/`.

## Estrutura

```
index.html                 a página
404.html                   página de erro, no mesmo sistema visual
robots.txt                 aponta o sitemap (a URL ainda é um marcador)
sitemap.xml                uma URL: a home
_headers                   cache do Netlify

css/main.css               toda a folha de estilo, na ordem da cascata
js/main.js                 GSAP + ScrollTrigger + o código do site
js/reveal.js               o capítulo de materialidade
js/3d/boot.js              os três perfis e a ligação com o ScrollTrigger
js/3d/opening.js           a cena: modelo, pivôs, câmera, luz, timeline
js/3d/ripado.js            a geometria das ripas (relevo, não mapa)
js/3d/pecas.js             painéis com canto chanfrado
js/3d/grao.js              o desenho do grão da madeira
js/3d/madeira.js           os mapas PBR gerados a partir dele
js/3d/materia.js           o capítulo de materialidade em WebGL
js/3d/sequencia.js         o perfil C: os 16 quadros pré-renderizados
js/3d/three.module.min.js  Three.js r169 (MIT, licença ao lado)

assets/images/sequencia/   os 16 quadros + indice.json
assets/images/             fotografias, em AVIF/WebP com alternativa JPEG
assets/video/              o filme institucional, em MP4
assets/fonts/              Newsreader e Inter, variáveis, SIL OFL 1.1

tools/                     ferramentas e testes (não vão para o ar)
```

## Os testes

Todos exigem `S=` — a pasta de saída das capturas, **fora do site**.
Sem ela, falham na hora e dizem por quê. (Essa exigência existe porque
um `${S}` vazio criou a pasta literal `undefined/` dentro do pacote,
com 7 MB de captura.)

```
S=/tmp/qa URL=http://localhost:8090/ node tools/teste-funcional.js   # 32 testes
S=/tmp/qa URL=http://localhost:8090/ node tools/teste-cena.js        # estados da cena
S=/tmp/qa PARES=/tmp/qa/pares URL=http://localhost:8090/ \
                              node tools/teste-contraste.js          # WCAG, 8 larguras
URL=http://localhost:8090/    node tools/teste-peso.js               # peso por perfil
                              node tools/teste-previa.js             # 11 testes, file://
```

E o que gera a sequência do perfil C, a partir da cena real:

```
node tools/render-sequencia.js http://localhost:8090/ 16
```

## O sistema de movimento

Nenhuma animação inventa duração ou curva própria. O vocabulário vive em
dois lugares que se espelham e **precisam andar juntos**:

- `css/main.css`, no bloco `--ease-*` / `--dur-*` / `--rise*`;
- `js/main.js`, no objeto `MOTION`, logo no começo do código do site.

Mudar o ritmo do site é mudar esses dois.

## Gerar os pacotes

```
python3 tools/make-zip.py            # fratelli-moveis-cinematic-final-producao.zip
python3 tools/build-single-file.py   # fratelli-moveis-cinematic-final-visualizacao.html
```

O primeiro empacota só o que vai para o ar (242 arquivos, 11,1 MB). O
segundo embute tudo num arquivo só (7,6 MB), para abrir no computador
sem servidor — é para ver, não para publicar.

## Antes de publicar

O site sai desta pasta com `noindex, nofollow` **de propósito**, e
nenhum endereço foi inventado. Na publicação, nesta ordem:

1. preencher `canonical`, `og:url` e `og:image` no `index.html`
   (estão comentados, esperando a URL real);
2. preencher a `<loc>` do `sitemap.xml` e a linha `Sitemap:` do
   `robots.txt`;
3. só então trocar o `robots` para `index, follow`.

Antes disso há dois bloqueios reais, descritos em `PENDENCIAS.md`: a
**validação em GPU de verdade** (tudo aqui rodou em WebGL por
software) e a **confirmação das fotografias não identificadas**.
Enquanto eles existirem, o site **não está pronto para ir ao ar**.

Nada foi publicado a partir desta pasta.
