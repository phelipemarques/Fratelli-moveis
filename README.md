# Fratelli Móveis — site institucional

Prévia de aprovação do site da Fratelli Móveis, marcenaria de móveis planejados
em Cascavel, Paraná.

> **Status: pronto para revisão final.** A página não exibe mais nenhum aviso de
> obra: tudo que está nela é dado confirmado. Faltam três ajustes de publicação
> e uma definição sobre duas imagens. Ver [`PENDENCIAS.md`](PENDENCIAS.md).

## Como rodar

O site é estático: HTML, CSS e JavaScript, sem etapa de build e sem dependência
de rede em tempo de execução. As fontes e a biblioteca de animação estão dentro
do projeto.

```bash
cd Fratelli-moveis
python3 -m http.server 8123
# abra http://127.0.0.1:8123
```

Qualquer servidor estático serve (`npx serve`, `php -S`, Live Server do VS Code).
Abrir o `index.html` direto pelo sistema de arquivos também funciona, mas o
`file://` bloqueia o carregamento das fontes em alguns navegadores — prefira o
servidor local.

## Versão em arquivo único

Para abrir com dois cliques, mandar por e-mail ou hospedar sem levar pasta:

```bash
python3 tools/build-single-file.py
# gera dist/fratelli-moveis.html (~640 KB)
```

Tudo entra embutido: estilos, scripts, fontes e imagens. O arquivo funciona
offline e não faz nenhuma requisição externa. Três diferenças em relação ao
site da pasta, todas deliberadas e anotadas no próprio script:

- só o subconjunto latino das fontes, que cobre o português;
- só as imagens em WebP, sem a reserva em JPEG;
- uma variante de imagem por enquadramento, em vez do conjunto responsivo
  completo, e sem `og:image`, que precisa de endereço público para funcionar.

Para publicar de verdade, prefira a pasta: ela serve a imagem no tamanho certo
para cada tela e tem a imagem de compartilhamento.

## Estrutura

```
index.html                 página única, com todas as seções
assets/css/
  tokens.css               cor, tipografia, medidas, espaçamento, movimento
  base.css                 @font-face, reset, tipografia base, foco, utilitários
  layout.css               composição de cada seção
  components.css           cabeçalho, menu, botões, quadros de imagem, rodapé
  motion.css               estados iniciais de animação e movimento reduzido
assets/js/
  nav.js                   cabeçalho, menu em celular, rede de segurança
  motion.js                linha do tempo de abertura e cenas de rolagem
assets/vendor/             GSAP 3.13 + ScrollTrigger (licença padrão, sem custo)
assets/fonts/              Newsreader e Inter, variáveis, SIL OFL 1.1
assets/img/                imagens geradas por tools/prepare-images.py
dist/                      versão em arquivo único (gerada)
tools/
  prepare-images.py        prepara as imagens da abertura
  prepare-project-images.py  prepara as imagens dos projetos
  build-single-file.py     gera a versão em arquivo único
  source/1.jpg             material original enviado pelo cliente
PENDENCIAS.md              o que falta pedir à empresa
QA.md                      o que foi testado, como, e o que não foi
```

## Onde editar o quê

| Quero mudar | Arquivo |
| --- | --- |
| Cores, tamanhos de texto, espaçamentos | `assets/css/tokens.css` |
| Textos, seções, ordem da página | `index.html` |
| Largura de um título ou parágrafo | `--measure-*` em `tokens.css` |
| Duração e ritmo das animações | `assets/js/motion.js` |
| Trocar uma reserva por foto real | veja abaixo |
| Número do WhatsApp | `index.html` — 3 ocorrências de `5545998423488` e 3 de `(45) 99842-3488` |
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
