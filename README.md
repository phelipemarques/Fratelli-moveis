# Fratelli Móveis — site institucional

Prévia de aprovação do site da Fratelli Móveis, marcenaria de móveis planejados
em Cascavel, Paraná.

> **Status: pronto para publicar.** Estrutura de produção, indexação liberada.
> Depois do primeiro deploy, três arquivos precisam da URL real — ver
> "Depois do primeiro deploy" abaixo. Pendências de conteúdo em
> [`PENDENCIAS.md`](PENDENCIAS.md).

## Como rodar

O site é estático: HTML, CSS e JavaScript, sem etapa de build e sem dependência
de rede em tempo de execução. As fontes e a biblioteca de animação estão dentro
do projeto.

```bash
cd Fratelli-moveis
python3 -m http.server 8123
# abra http://127.0.0.1:8123
```

Qualquer servidor estático serve: `npx serve`, `php -S`, Live Server do VS Code.

## Estrutura

```
index.html                 a página
404.html                   página de erro, no mesmo sistema visual
robots.txt                 libera a indexação, aponta o sitemap
sitemap.xml                uma URL: a home
_headers                   cache do Netlify (fontes por um ano, imagens por um dia,
                           CSS, JS e HTML sempre revalidados)

css/main.css               toda a folha de estilo, na ordem da cascata
js/main.js                 GSAP + ScrollTrigger + o código do site

assets/fonts/              Newsreader e Inter, variáveis, SIL OFL 1.1
assets/images/             as 62 imagens que a página usa

tools/
  prepare-images.py        gera as imagens da abertura
  prepare-project-images.py  gera as imagens dos projetos
  make-zip.py              monta o pacote do Netlify
  source/                  os arquivos originais enviados pelo cliente

PENDENCIAS.md              o que falta pedir à empresa
QA.md                      o que foi testado, como, e o que não foi
```

O `css/main.css` traz os cinco blocos na ordem em que precisam ser lidos —
tokens, base, layout, componentes, movimento — cada um com uma faixa de
comentário. Trocar a ordem quebra a herança dos tokens.

O `js/main.js` tem duas metades. A primeira é a biblioteca de animação, que
não se edita. Procure pela faixa `CÓDIGO DO SITE` para achar onde começa a
parte editável.

## Publicar no Netlify

```bash
python3 tools/make-zip.py
```

Gera `fratelli-moveis-netlify.zip` com apenas os arquivos que o site usa.
Arraste o ZIP em <https://app.netlify.com/drop>. Não precisa de conta para
o primeiro teste.

### Depois do primeiro deploy

O Netlify devolve um endereço, algo como `nome-aleatorio.netlify.app`. Com ele
em mãos, três lugares precisam do endereço real:

1. **`index.html`** — descomente as três linhas marcadas com
   `<!-- DEPOIS DO DEPLOY:` e troque `SEU-DOMINIO`. São o `canonical`, o
   `og:url` e o `og:image`. Sem o `og:image` absoluto, o link compartilhado no
   WhatsApp sai sem imagem.
2. **`robots.txt`** — troque `SEU-DOMINIO` na linha `Sitemap:`.
3. **`sitemap.xml`** — troque `SEU-DOMINIO` na tag `<loc>`.

Gere o ZIP de novo e publique. Se depois vier um domínio próprio, repita a
troca nos mesmos três lugares.

## Onde editar o quê## Onde editar o quê

| Quero mudar | Arquivo |
| --- | --- |
| Cores, tamanhos de texto, espaçamentos | bloco `1. TOKENS` em `css/main.css` |')
| Textos, seções, ordem da página | `index.html` |
| Largura de um título ou parágrafo | `--measure-*`, no bloco `1. TOKENS` |
| Duração e ritmo das animações | `js/main.js`, depois da faixa `CÓDIGO DO SITE` |
| Trocar uma reserva por foto real | veja abaixo |
| Número do WhatsApp | `index.html` e `404.html` |
| Mensagem que abre no WhatsApp | `index.html` — o parâmetro `text=` dos links `wa.me` |

### Trocar ou acrescentar uma imagem

Todos os quadros da página têm imagem; não há mais reservas. Para trocar uma,
edite o `<picture>` correspondente no `index.html` e gere os arquivos com o
script de imagens. Mantenha `width` e `height` no `<img>`: é o que impede a
página de saltar durante o carregamento.

### Regerar as imagens

```bash
python3 -m pip install pillow numpy opencv-python-headless
python3 tools/prepare-images.py
```

`prepare-images.py` lê `tools/source/1.jpg` e gera as imagens da abertura.
`prepare-project-images.py` lê os arquivos dos projetos e gera os recortes da
seção Projetos, com a força do acabamento regulada por imagem. Os dois são
independentes: mexer em um não altera as imagens do outro.

## Decisões técnicas

- **HTML, CSS e JavaScript puros.** É um site institucional de uma página, sem
  estado compartilhado nem conteúdo dinâmico. Um framework acrescentaria build,
  dependências e peso sem resolver nada aqui.
- **GSAP + ScrollTrigger.** A seção de ambientes precisa de fixação temporária,
  distância proporcional ao conteúdo e recálculo correto depois de redimensionar
  e de carregar a fonte. Fazer isso à mão com `IntersectionObserver` e `scroll`
  daria mais código e menos confiabilidade. Um motor só conduz tudo que depende
  de rolagem; o CSS cuida apenas de hover, foco e do menu.
- **Fontes servidas do projeto.** Sem requisição a terceiros, sem variação de
  desempenho por rede externa e sem envio do IP do visitante para outro domínio.
- **O estado final é o padrão.** Os estados iniciais das animações só existem com
  `html.js` e `html.motion`. Se o JavaScript falhar ou estiver desligado, nada
  fica invisível e nenhum quadro fica coberto.

## Publicação

Ainda não autorizada. Três linhas do `index.html` precisam mudar, todas
marcadas no arquivo com o comentário `<!-- PRODUÇÃO: ... -->`:

1. **Apagar** `<meta name="robots" content="noindex, nofollow">`. Sem isso o
   site não aparece em busca nenhuma.
2. **Trocar** o `og:image` relativo pela URL absoluta do domínio. Caminho
   relativo faz o link compartilhado no WhatsApp sair sem imagem.
3. **Acrescentar** `canonical`, `og:url` e a chave `url` nos dados
   estruturados, com o domínio definitivo.

Depois: subir a pasta inteira em qualquer hospedagem estática. O resto dos itens
em aberto está em `PENDENCIAS.md`.
