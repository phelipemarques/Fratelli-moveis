/* ============================================================
   Fratelli Móveis — o capítulo 2.5D (perfil B)

   Isto NÃO é o fallback sem graça. É uma segunda encenação da mesma
   ideia, feita para aparelho de toque: sem WebGL, sem Three.js, sem
   671 KB na rede.

   O que existe aqui, e por que cada coisa precisa existir:

   CAIXA      O móvel é montado em `transform-style: preserve-3d` com
              fundo, duas laterais, tampo e base posicionados em Z. Não
              é um retângulo com sombra: quando a câmera inclina, a
              lateral direita aparece e a esquerda some, porque elas
              estão de fato em ângulo.

   ESPESSURA  Cada porta é uma peça de duas faces — a frente e o canto
              de 18 mm. Ao girar na dobradiça o canto entra em quadro.
              É a espessura que separa marcenaria de papel.

   VEIO       As faces usam o MESMO desenho de madeira da cena WebGL,
              vindo de grao.js. O celular não ganha um marrom chapado.

   LUZ        Não há luz de verdade, então ela é encenada: cada face
              tem um brilho próprio conforme a orientação, a porta
              carrega um reflexo que VARRE a superfície conforme o
              ângulo, o interior acende junto com a abertura e a sombra
              de contato abre quando a peça se afasta.

   CÂMERA     Um grupo externo faz o travelling (inclinação, giro,
              aproximação) e as camadas internas andam em velocidades
              diferentes. É a mesma coreografia dos cinco atos da cena
              grande, encurtada.

   Tudo é escrito por UMA função `progresso(p)`, chamada pelo mesmo
   ScrollTrigger. Reversível, sem timeline própria competindo.
   ============================================================ */

import { gerarCanvasMadeira } from './grao.js';

/* Interpola entre dois números. */
function ip(a, b, t) { return a + (b - a) * t; }

/* Recorta um trecho [a,b] do progresso e devolve 0..1 dentro dele.
   É o que divide a rolagem em atos sem precisar de uma timeline. */
function ato(p, a, b) {
  return Math.min(1, Math.max(0, (p - a) / (b - a)));
}

/* Suavização; as curvas do site, só que em número. */
function suave(t) { return t * t * (3 - 2 * t); }
function saida(t) { return 1 - Math.pow(1 - t, 3); }

export function criar25D(opcoes) {
  var palco = opcoes.palco;
  if (!palco) { return null; }

  /* ---------- O veio, uma vez ----------
     256px é suficiente: a peça inteira ocupa menos de 400 CSS px num
     celular, e o canvas ainda é esticado pelo background-size. */
  var canvas;
  try {
    canvas = gerarCanvasMadeira({
      tamanho: 256,
      semente: 20261018,
      claro: [172, 136, 99],
      escuro: [76, 54, 36],
      rugosidade: 0.52,
      rugosidadePoro: 0.86,
      relevo: 1.0
    });
  } catch (e) {
    return null;
  }
  var veio = canvas.cor.toDataURL('image/webp', 0.86);
  if (veio.indexOf('data:image/webp') !== 0) {
    veio = canvas.cor.toDataURL('image/png');
  }

  /* ---------- Montagem ---------- */
  var raiz = document.createElement('div');
  raiz.className = 'm25';
  raiz.setAttribute('aria-hidden', 'true');   // é ilustração; o texto conta a história

  function peca(classe, pai) {
    var d = document.createElement('div');
    d.className = classe;
    (pai || raiz).appendChild(d);
    return d;
  }

  var camera = peca('m25__camera');
  var movel  = peca('m25__movel', camera);

  // caixa: fundo, laterais, tampo, base — cada um no seu plano
  var fundo    = peca('m25__face m25__fundo', movel);
  var ladoEsq  = peca('m25__face m25__lado m25__lado--esq', movel);
  var ladoDir  = peca('m25__face m25__lado m25__lado--dir', movel);
  var tampo    = peca('m25__face m25__tampo', movel);
  var base     = peca('m25__face m25__base', movel);

  // interior: divisória, prateleiras, gaveteiro, barra
  var interior = peca('m25__interior', movel);
  peca('m25__divisoria', interior);
  var prateleiras = [];
  for (var i = 0; i < 4; i++) {
    var pr = peca('m25__prateleira', interior);
    pr.style.setProperty('--i', i);
    prateleiras.push(pr);
  }
  peca('m25__prateleira m25__prateleira--alta', interior);
  peca('m25__barra', interior);
  for (var g = 0; g < 3; g++) {
    var gv = peca('m25__gaveta', interior);
    gv.style.setProperty('--i', g);
  }
  var brilhoDentro = peca('m25__dentro', interior);

  // portas: cada uma com frente e canto
  function porta(lado) {
    var p = peca('m25__porta m25__porta--' + lado, movel);
    var frente = peca('m25__folha', p);
    peca('m25__reflexo', frente);
    peca('m25__canto', p);
    peca('m25__puxador', p);
    return p;
  }
  var portaEsq = porta('esq');
  var portaDir = porta('dir');

  var sombra = peca('m25__sombra', camera);

  // o veio vai para todas as faces de madeira de uma vez
  raiz.style.setProperty('--veio', 'url(' + veio + ')');

  palco.appendChild(raiz);

  /* ---------- A coreografia ----------

     Quatro atos curtos. Mais do que isso num celular vira rolagem
     demais para pouca coisa: a sequência inteira cabe em 2,2 alturas
     de tela, contra 4 no desktop.

       0,00 – 0,22  apresentação: a peça entra e se assenta
       0,22 – 0,58  abertura: as portas giram na dobradiça
       0,58 – 0,80  descoberta: a câmera entra, o interior acende
       0,80 – 1,00  transformação: entrega para a fotografia
  */
  var ultimo = -1;

  function progresso(p) {
    p = Math.min(1, Math.max(0, p));
    if (Math.abs(p - ultimo) < 0.0015) { return; }
    ultimo = p;

    var a1 = suave(ato(p, 0.00, 0.22));
    var a2 = saida(ato(p, 0.22, 0.58));
    var a3 = suave(ato(p, 0.58, 0.80));
    var a4 = suave(ato(p, 0.80, 1.00));

    /* Câmera: inclina, gira e aproxima. O giro muda de sinal no ato 3
       — a câmera passa do três-quartos para quase de frente, que é o
       eixo da fotografia que vem depois. */
    var incl  = ip(9, 2.5, a1) - a3 * 2.0;
    var giro  = ip(-19, -13, a1) + a2 * 5.5 + a3 * 7.5 - a4 * 1.2;
    var zoom  = ip(0.80, 0.92, a1) + a3 * 0.26 - a4 * 0.06;
    var sobe  = ip(26, 0, a1) - a3 * 14;

    camera.style.transform =
      'translate3d(0,' + sobe.toFixed(2) + 'px,0) scale(' + zoom.toFixed(4) + ')';
    movel.style.transform =
      'rotateX(' + incl.toFixed(2) + 'deg) rotateY(' + giro.toFixed(2) + 'deg)';

    /* Portas: giro na dobradiça, de 0 a 78°.

       A cena grande abre mais (116°), mas lá a câmera orbita e vê a
       folha de lado. Aqui a vista é quase frontal: passando de ~80° a
       porta fica de perfil, some da tela e a abertura deixa de ser
       legível justamente no quadro em que ela importa. 78° mantém a
       folha visível, pegando a varredura de luz, e ainda escancara o
       vão. */
    var ang = a2 * 78;
    portaEsq.style.transform = 'rotateY(' + ang.toFixed(2) + 'deg)';
    portaDir.style.transform = 'rotateY(' + (-ang).toFixed(2) + 'deg)';

    /* O reflexo varre a folha conforme ela gira: é o que diz ao olho
       que existe uma fonte de luz fixa e uma superfície que se move. */
    raiz.style.setProperty('--varredura', (a2 * 128 - 18).toFixed(1) + '%');
    /* A frente escurece de leve ao sair do eixo da luz. */
    raiz.style.setProperty('--folha-luz', (1 - a2 * 0.34).toFixed(3));

    /* Interior: acende DURANTE a abertura, não depois. */
    raiz.style.setProperty('--dentro', Math.min(1, a2 * 0.75 + a3 * 0.45).toFixed(3));
    brilhoDentro.style.opacity = Math.min(1, a2 * 0.8 + a3 * 0.4).toFixed(3);

    /* Sombra de contato: fecha quando a peça está longe, abre quando
       ela chega perto — o contrário borracha o chão. */
    raiz.style.setProperty('--sombra-borrao', (30 - a1 * 10 + a3 * 16).toFixed(1) + 'px');
    raiz.style.setProperty('--sombra-opaca', (0.34 + a1 * 0.12 - a4 * 0.2).toFixed(3));

    /* A entrega para a fotografia. Mesmo nome de variável da cena
       grande, lido pelo mesmo CSS. */
    return a4;
  }

  return {
    progresso: progresso,
    descartar: function () {
      if (raiz.parentNode) { raiz.parentNode.removeChild(raiz); }
    }
  };
}
