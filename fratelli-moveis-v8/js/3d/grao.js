/* ============================================================
   Fratelli Móveis — o veio da madeira, desenhado (V6)

   Só matemática e canvas: nenhum import. Quem usa isto:

     madeira.js   embrulha os canvas em texturas do Three.js, para a
                  cena WebGL do desktop;
     mobile25.js  usa o canvas de cor direto como background-image das
                  faces da composição 2.5D.

   O celular ganha o MESMO veio do desktop sem baixar o Three.js. Era
   essa a razão de separar este arquivo.
   ============================================================ */

/* ---------- Ruído de valor, com semente ---------- */

function embaralhar(semente) {
  var s = semente >>> 0;
  return function () {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}

/* Grade de valores aleatórios + interpolação suave. É o suficiente:
   a figura da madeira vem da DISTORÇÃO do domínio, não da qualidade
   do ruído em si. */
function grade(n, rnd) {
  var g = new Float32Array(n * n);
  for (var i = 0; i < g.length; i++) { g[i] = rnd(); }
  return g;
}

function suave(t) { return t * t * (3 - 2 * t); }

function amostra(g, n, x, y) {
  var xi = Math.floor(x), yi = Math.floor(y);
  var xf = suave(x - xi), yf = suave(y - yi);
  var x0 = ((xi % n) + n) % n, x1 = (x0 + 1) % n;
  var y0 = ((yi % n) + n) % n, y1 = (y0 + 1) % n;
  var a = g[y0 * n + x0], b = g[y0 * n + x1];
  var c = g[y1 * n + x0], d = g[y1 * n + x1];
  return (a + (b - a) * xf) + ((c + (d - c) * xf) - (a + (b - a) * xf)) * yf;
}

function fbm(g, n, x, y, oitavas) {
  var soma = 0, amp = 0.5, total = 0;
  for (var o = 0; o < oitavas; o++) {
    soma += amostra(g, n, x, y) * amp;
    total += amp;
    x *= 2; y *= 2; amp *= 0.5;
  }
  return soma / total;
}

/* ---------- O campo de altura da madeira ----------

   Três coisas acontecem aqui, e a ordem importa:

   1. O domínio é ESTICADO na vertical (y * 0.055 contra x * 2.1). É o
      que faz o veio correr ao longo da peça em vez de formar manchas.
   2. O domínio é DISTORCIDO por outro ruído antes de virar anel. Sem
      isso saem listras paralelas de papel de parede; com isso sai a
      figura em catedral que a lâmina faseada tem.
   3. O anel é uma onda triangular, não um seno: a passagem do lenho
      inicial para o tardio é abrupta de um lado e lenta do outro, e é
      essa assimetria que o olho lê como madeira.
*/
function campo(largura, altura, semente) {
  var rnd = embaralhar(semente);
  var n = 64;
  var gA = grade(n, rnd), gB = grade(n, rnd), gC = grade(n, rnd);
  var h = new Float32Array(largura * altura);

  for (var y = 0; y < altura; y++) {
    var v = y / altura;
    for (var x = 0; x < largura; x++) {
      var u = x / largura;

      /* Distorção do domínio. A amplitude é BAIXA de propósito: com
         0,62 saía uma figura de zebrano, listrada e berrante. Lâmina
         de marcenaria fina é quase reta, com a catedral aparecendo
         só aqui e ali. */
      var wx = fbm(gA, n, u * 3.0, v * 1.1, 4) - 0.5;
      var wy = fbm(gB, n, u * 2.2 + 11, v * 0.9 + 7, 3) - 0.5;

      // anéis de crescimento, esticados ao longo de y
      var d = (u * 2.1 + wx * 0.34) + (v * 0.048 + wy * 0.12);
      /* 16 anéis, não 27. Com 27 a peça fica listrada de perto: no
         ato do detalhe, a câmera a 1,3 m, aquilo lia como veludo
         cotelê em vez de madeira. Menos anéis, mais largos, e a
         variação lenta (`manso`) passa a mandar na aparência. */
      var anel = d * 16.0;
      var t = anel - Math.floor(anel);
      // onda triangular assimétrica
      t = t < 0.34 ? t / 0.34 : 1 - (t - 0.34) / 0.66;

      // poro: riscos finos, muito alongados no sentido do veio
      var poro = fbm(gC, n, u * 42.0, v * 1.6 + 3, 2);
      poro = Math.pow(Math.max(0, poro - 0.42) / 0.58, 1.6);

      // variação lenta de tom, para dois pontos da peça não se
      // parecerem exatamente
      var manso = fbm(gA, n, u * 0.8 + 31, v * 0.5 + 17, 3);

      /* Os pesos decidem se aquilo vira madeira ou papel de parede.
         O anel entra discreto (0,30): ele dá a direção, não o
         espetáculo. A variação lenta pesa mais que o anel, que é o que
         faz dois pontos da peça serem parecidos sem serem iguais. */
      h[y * largura + x] = Math.min(1, Math.max(0,
        /* O -0,10 compensa a média: dar mais peso ao `manso`, que
           orbita 0,5, clareia a peça inteira. Sem o desconto o móvel
           sai bege lavado em vez de nogueira. */
        t * 0.26 + poro * 0.12 + manso * 0.52 - 0.10));
    }
  }
  return h;
}

/* ---------- Dos campos para as três texturas ---------- */

function paraCanvas(largura, altura, pintar) {
  var c = document.createElement('canvas');
  c.width = largura; c.height = altura;
  var ctx = c.getContext('2d');
  var img = ctx.createImageData(largura, altura);
  pintar(img.data);
  ctx.putImageData(img, 0, 0);
  return c;
}

function misturar(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t,
          a[2] + (b[2] - a[2]) * t];
}

/**
 * Desenha os três canvas de uma madeira: cor, rugosidade e relevo.
 *
 * Nenhuma dependência: é isto que deixa o celular usar o mesmo veio da
 * cena 3D sem baixar os 671 KB do Three.js.
 *
 * @param {object} o  claro/escuro em [r,g,b] 0-255, rugosidade base e de
 *                    poro, força do relevo, semente e tamanho.
 */
export function gerarCanvasMadeira(o) {
  var N = o.tamanho || 512;
  var h = campo(N, N, o.semente || 7);

  var claro = o.claro, escuro = o.escuro;
  var cor = paraCanvas(N, N, function (px) {
    for (var i = 0, p = 0; i < h.length; i++, p += 4) {
      var c = misturar(claro, escuro, h[i]);
      px[p] = c[0]; px[p + 1] = c[1]; px[p + 2] = c[2]; px[p + 3] = 255;
    }
  });

  var rBase = o.rugosidade, rPoro = o.rugosidadePoro;
  var rug = paraCanvas(N, N, function (px) {
    for (var i = 0, p = 0; i < h.length; i++, p += 4) {
      // o poro (altura alta) espalha mais luz que o campo liso
      var v = Math.round(255 * (rBase + (rPoro - rBase) * h[i]));
      px[p] = px[p + 1] = px[p + 2] = v; px[p + 3] = 255;
    }
  });

  /* Normal por Sobel sobre o MESMO campo de altura. É isso que faz o
     brilho acompanhar o veio em vez de brigar com ele. */
  var k = (o.relevo === undefined ? 1.0 : o.relevo) * 2.6;
  var nrm = paraCanvas(N, N, function (px) {
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        var xm = (x - 1 + N) % N, xp = (x + 1) % N;
        var ym = (y - 1 + N) % N, yp = (y + 1) % N;
        var dx = (h[y * N + xp] - h[y * N + xm]) * k;
        var dy = (h[yp * N + x] - h[ym * N + x]) * k;
        var len = Math.sqrt(dx * dx + dy * dy + 1);
        var p = (y * N + x) * 4;
        px[p]     = Math.round((-dx / len * 0.5 + 0.5) * 255);
        px[p + 1] = Math.round((-dy / len * 0.5 + 0.5) * 255);
        px[p + 2] = Math.round((1 / len * 0.5 + 0.5) * 255);
        px[p + 3] = 255;
      }
    }
  });

  return { cor: cor, rugosidade: rug, normal: nrm };
}
