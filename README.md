# Fratelli Móveis — site institucional

Prévia de aprovação do site da Fratelli Móveis, marcenaria de móveis planejados
em Cascavel, Paraná.

> **Status: prévia para aprovação.** O site ainda não está pronto para publicar.
> As fotografias dos projetos não foram fornecidas e o número do WhatsApp
> precisa ser conferido. A lista completa está em [`PENDENCIAS.md`](PENDENCIAS.md).

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
tools/
  prepare-images.py        prepara as imagens a partir do material recebido
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

### Trocar uma reserva de imagem por uma fotografia

No `index.html`, cada quadro reservado tem esta forma:

```html
<div class="project__frame frame frame--169 frame--tone-bone" data-parallax-frame>
  <div class="frame__veil" aria-hidden="true"></div>
  <div class="frame__reserved" aria-hidden="true"></div>
  <div class="frame__note"> … </div>
</div>
```

Substitua as duas últimas `div` por um `<picture>`, mantendo a classe do quadro:

```html
<div class="project__frame frame frame--169" data-parallax-frame>
  <div class="frame__veil" aria-hidden="true"></div>
  <picture>
    <source type="image/webp" srcset="assets/img/cozinha-640.webp 640w, assets/img/cozinha-1280.webp 1280w" sizes="100vw">
    <img class="frame__img" src="assets/img/cozinha-1280.jpg" width="1280" height="720"
         loading="lazy" decoding="async" alt="descreva o que aparece na foto">
  </picture>
</div>
```

A classe `frame--tone-*` pode sair junto: ela só define as cores da reserva.
Mantenha `width` e `height` no `<img>` para a página não saltar durante o
carregamento.

### Regerar as imagens

```bash
python3 -m pip install pillow numpy opencv-python-headless
python3 tools/prepare-images.py
```

O script lê `tools/source/1.jpg` e grava os recortes em `assets/img/`.
O que ele faz e por quê está documentado no próprio arquivo.

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

Ainda não autorizada. Quando for:

1. Resolver os itens marcados como bloqueio em `PENDENCIAS.md`.
2. Remover `<meta name="robots" content="noindex, nofollow">` do `index.html`.
3. Trocar o caminho relativo de `og:image` pela URL absoluta do domínio.
4. Subir a pasta inteira em qualquer hospedagem estática.
