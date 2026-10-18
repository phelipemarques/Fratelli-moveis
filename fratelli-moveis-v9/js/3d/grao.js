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

/* ---------- Os campos da madeira ----------

   DOIS CAMPOS, não um — e é esta a segunda correção da V9.

   Até aqui existia UM campo de altura, e dele saíam as três texturas:
   cor, rugosidade e relevo. Parece econômico e está errado na física.

   Numa lâmina de nogueira, a CATEDRAL é cor: o lenho tardio é mais
   escuro que o inicial, mas a superfície é plana — ela passou por uma
   lixadeira calibrada e por verniz. O que tem relevo é só o PORO:
   alguns centésimos de milímetro de vale.

   Derivar o normal do campo inteiro fazia o mapa herdar a ondulação
   larga da figura. O render disso está fotografado: o painel parecia
   cobre derretido, uma chapa empenada, e quanto melhor ficava o
   desenho pior ficava a superfície. Não era exagero de `normalScale`
   — era relevo na frequência errada.

   Agora:

     TOM      figura + variação lenta + risco  → vira a cor
     RELEVO   só o risco                       → vira normal e rugosidade

   A figura continua visível, e a superfície volta a ser plana.
*/
function campos(largura, altura, semente) {
  var rnd = embaralhar(semente);
  var n = 64;
  var gA = grade(n, rnd), gB = grade(n, rnd), gC = grade(n, rnd);
  var tom = new Float32Array(largura * altura);
  var relevo = new Float32Array(largura * altura);

  for (var y = 0; y < altura; y++) {
    var v = y / altura;
    for (var x = 0; x < largura; x++) {
      var u = x / largura;

      /* Distorção do domínio: é ela que entorta a banda e produz o
         arco da catedral. Discreta de propósito — lâmina de marcenaria
         fina é quase reta, com a catedral aparecendo só aqui e ali.
         Com 0,42 saía uma figura de madeira de oliveira, redemoinhada. */
      var wx = fbm(gA, n, u * 1.7, v * 0.85, 4) - 0.5;
      var wy = fbm(gB, n, u * 1.3 + 11, v * 0.6 + 7, 3) - 0.5;

      /* FIGURA: 11 bandas por folha. Uma folha cobre ~0,6 m de porta,
         então são ~18 bandas por metro — a escala da catedral na
         referência, não a do risco. */
      var d = (u * 1.0 + wx * 0.16) + (v * 0.052 + wy * 0.06);
      var figura = d * 11.0;
      figura = figura - Math.floor(figura);
      /* Onda triangular assimétrica: a passagem do lenho inicial para
         o tardio é abrupta de um lado e lenta do outro, e é essa
         assimetria que o olho lê como madeira. */
      figura = figura < 0.34 ? figura / 0.34 : 1 - (figura - 0.34) / 0.66;

      /* RISCO: o poro — as linhas finas e escuras que o olho chama
         de "veio".

         A primeira tentativa afiou um fBm por limiar. Medido no dump
         da textura: não sobrava quase nada. Um fBm de ruído de valor
         com duas oitavas tem desvio padrão perto de 0,1 em torno de
         0,5, então `max(0, n - 0,47)` deixa passar um fiapo, e elevar
         ao quadrado apaga o resto. A textura saía sem UMA linha —
         um cetim marrom, que é exatamente o que a bancada mostrou.

         Agora o risco é uma crista de SENO no mesmo domínio
         distorcido da figura: `|sin|` elevado dá vales estreitos em
         posições previsíveis, e a distorção se encarrega de curvá-los
         junto com a catedral. ~95 linhas por folha ≈ 150 por metro;
         contadas na referência (tools/ref/26.jpg), ~45 numa face de
         cerca de 0,35 m.

         O `onde` liga e desliga trechos: madeira de verdade tem
         bandas de poro aberto e bandas quase lisas. Sem ele as linhas
         saem todas iguais do topo à base, que é a cara de impressão
         digital em MDF. */
            /* 62 linhas por folha ≈ 100 por metro, dentro do que a
         referência mede (~45 numa face de ~0,35 m). Era 95, e 95 não
         cabe: com 512 texels por folha sobram 5,4 texels por linha, e
         o núcleo escuro saía com menos de um décimo de texel. O dump
         do campo mostra o efeito — as linhas VERTICAIS saíam
         contínuas e as INCLINADAS saíam picotadas, porque o núcleo
         passava entre os centros dos pixels. Aliasing, não madeira. */
      var fase = d * 62.0 + fbm(gC, n, u * 7.0, v * 1.4 + 3, 2) * 0.9;
      var crista = Math.abs(Math.sin(fase * Math.PI));
            /* `onde` varia de linha para linha (em u) e quase nada ao longo
         da peça (em v). Tem de ser assim: um poro é um vaso que corre
         o comprimento da tábua inteira. Com variação rápida em v as
         linhas saíam PICOTADAS, como pontilhado — está no dump
         anterior, e é um defeito que não existe em madeira. */
      var onde = fbm(gC, n, u * 16.0 + 23, v * 0.45 + 41, 3);
      /* O expoente varia com `onde`: onde o poro é aberto a linha sai
         mais larga, onde é fechado sai quase um fio. Linhas de
         espessura toda igual são a assinatura de uma textura gerada,
         e o olho pega isso antes de saber por quê. */
            /* O expoente fica entre 2 e 4,4: dá um núcleo de ~1,5 texel,
         que a grade consegue desenhar. Com 4,5 a 11,5 a linha era
         mais fina que um texel e virava pontilhado. */
      var risco = Math.pow(1 - crista, 1.8 + onde * 3.2);
      /* Peso e presença vêm de ruídos DIFERENTES. Com um só, linha
         grossa e linha escura andavam sempre juntas e o conjunto saía
         penteado — todas as linhas iguais, do topo à base. Na
         referência há meia dúzia de riscos fortes no meio de muitos
         quase apagados. */
      var peso = fbm(gB, n, u * 11.0 + 71, v * 0.38 + 5, 3);
      risco *= Math.min(1, Math.max(0, (peso - 0.26) / 0.52));

      // variação lenta de tom, para dois pontos da peça não se
      // parecerem exatamente
      var manso = fbm(gA, n, u * 0.8 + 31, v * 0.5 + 17, 3);

      /* FIBRA: ruído fino, alongado no sentido do veio, com amplitude
         pequena. Não desenha nada que se possa apontar — e é
         justamente por isso que entra. Sem ela o espaço ENTRE as
         linhas fica um degradê perfeitamente liso, e superfície lisa
         demais é metade do aspecto de massinha. A referência, ampliada,
         é fibrosa em toda parte. */
      var fibra = fbm(gB, n, u * 150.0 + 61, v * 22.0 + 13, 2) - 0.5;

      /* A figura e a variação lenta carregam o tom; o risco entra com
         pouco, porque ele é fino e escuro, não uma faixa.

         Sem corte e sem deslocamento aqui: a escala é acertada na
         normalização, logo abaixo. */
      var i = y * largura + x;
      tom[i] = figura * 0.17 + manso * 0.27 + risco * 0.58 + fibra * 0.085;
      relevo[i] = risco;
    }
  }

  /* ---------- Normalização: a correção que faltava ----------

     Os componentes somados nunca chegam perto de 0 nem de 1. O
     `manso` é um fBm, que orbita 0,5 com variação pequena; a figura é
     triangular, média 0,5. Somados com esses pesos, o campo ficava
     entre ~0,34 e ~0,54 — 20% da escala.

     Consequência MEDIDA: a textura de cor saía com faixa de luma de
     10 níveis, quando a fotografia de referência tem 51. Os tons
     `claro` e `escuro`, escolhidos com cuidado, nunca eram
     alcançados — o material era um marrom chapado, e nenhum ajuste
     de luz corrigia isso, porque não havia variação para a luz
     revelar.

     Estica por PERCENTIL (5% e 95%), não por mínimo e máximo: um
     pixel extremo solitário não pode definir a escala de uma peça
     inteira.

     5 e 95, e não 2 e 98, porque é nesses percentis que a faixa da
     referência foi medida: assim o p05 da textura cai exatamente no
     tom `escuro` e o p95 no `claro`. Com 2 e 98 a textura saía com
     faixa de 38 contra os 52 medidos — perto, e ainda assim mais
     lavada que a fotografia. O que estoura nos 5% das pontas é o
     núcleo das linhas de poro, que satura no tom escuro; é o que a
     própria madeira faz.

     Só o TOM é normalizado. O relevo não: ele deve mesmo ser quase
     todo zero, com picos esparsos — é um risco, não uma paisagem. */
  var ordenado = Array.prototype.slice.call(tom);
  ordenado.sort(function (a, b) { return a - b; });
  var lo = ordenado[Math.floor(ordenado.length * 0.05)];
  var hi = ordenado[Math.floor(ordenado.length * 0.95)];
  var faixa = Math.max(1e-4, hi - lo);
  for (var j = 0; j < tom.length; j++) {
    tom[j] = Math.min(1, Math.max(0, (tom[j] - lo) / faixa));
  }

  return { tom: tom, relevo: relevo };
}

/* ---------- Dos campos para as três texturas ----------

   ATLAS DE FOLHAS — a correção do emendão.

   Até agora cada peça recebia a MESMA textura com um `offset`
   diferente, para que duas peças vizinhas não mostrassem o mesmo
   desenho. Isso tinha um defeito que só apareceu no render: com
   `RepeatWrapping` e `repeat` igual a 1, um `offset` de 0,30 põe a
   emenda da textura — que não é cíclica — DENTRO do painel. O
   resultado é uma faixa horizontal atravessando as duas portas e a
   lateral, na mesma altura. Está na fotografia do diagnóstico; é o
   defeito mais visível da peça parada.

   A troca: o canvas passa a ser um ATLAS de folhas independentes,
   lado a lado. Cada peça usa UMA folha inteira (`repeat` 1/n,
   `offset` num múltiplo exato de 1/n), então a janela cai sempre
   dentro de uma folha e nunca atravessa uma emenda.

   Elas continuam sendo folhas diferentes — é o que a lâmina faseada
   de verdade faz —, só que agora são desenhos de fato distintos, e
   não a mesma folha deslizada.
*/

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
 *                    poro, força do relevo, semente, tamanho do atlas e
 *                    `folhas` (o atlas é folhas × folhas).
 */
export function gerarCanvasMadeira(o) {
  var N = o.tamanho || 512;
  var F = o.folhas || 2;               // atlas F × F
  var S = Math.floor(N / F);           // lado de uma folha

  /* Uma semente por folha: desenhos independentes, não a mesma folha
     deslocada. */
  var folhas = [];
  for (var i = 0; i < F * F; i++) {
    folhas.push(campos(S, S, (o.semente || 7) + i * 7919));
  }

  /* Lê o atlas pela folha a que o pixel pertence, com as coordenadas
     PRESAS dentro dela. É o que impede o Sobel de atravessar a
     fronteira entre duas folhas e inventar um relevo que não existe
     no desenho. */
  function amostraAtlas(campo, x, y) {
    /* O Sobel pede x-1 e x+1, que saem do atlas nas bordas. Prende
       nos dois extremos: fora da folha, repete a borda dela. */
    var fx = Math.min(F - 1, Math.max(0, Math.floor(x / S)));
    var fy = Math.min(F - 1, Math.max(0, Math.floor(y / S)));
    var lx = Math.min(S - 1, Math.max(0, x - fx * S));
    var ly = Math.min(S - 1, Math.max(0, y - fy * S));
    return folhas[fy * F + fx][campo][ly * S + lx];
  }

  var AT = N; // o atlas sempre fecha em F*S; usa F*S como lado real
  AT = F * S;

  var claro = o.claro, escuro = o.escuro;
  var cor = paraCanvas(AT, AT, function (px) {
    for (var y = 0; y < AT; y++) {
      for (var x = 0; x < AT; x++) {
        var c = misturar(claro, escuro, amostraAtlas('tom', x, y));
        var p = (y * AT + x) * 4;
        px[p] = c[0]; px[p + 1] = c[1]; px[p + 2] = c[2]; px[p + 3] = 255;
      }
    }
  });

  var rBase = o.rugosidade, rPoro = o.rugosidadePoro;
  var rug = paraCanvas(AT, AT, function (px) {
    for (var y = 0; y < AT; y++) {
      for (var x = 0; x < AT; x++) {
        // o poro espalha mais luz que o verniz liso entre os riscos
        var v = Math.round(255 * (rBase + (rPoro - rBase) * amostraAtlas('relevo', x, y)));
        var p = (y * AT + x) * 4;
        px[p] = px[p + 1] = px[p + 2] = v; px[p + 3] = 255;
      }
    }
  });

  /* Normal por Sobel sobre o campo de RELEVO — o risco, só ele. É
     isso que faz o brilho correr ao longo do veio sem empenar o
     painel. Ver o comentário em `campos`. */
  var k = (o.relevo === undefined ? 1.0 : o.relevo) * 2.6;
  var nrm = paraCanvas(AT, AT, function (px) {
    for (var y = 0; y < AT; y++) {
      for (var x = 0; x < AT; x++) {
        var dx = (amostraAtlas('relevo', x + 1, y) - amostraAtlas('relevo', x - 1, y)) * k;
        var dy = (amostraAtlas('relevo', x, y + 1) - amostraAtlas('relevo', x, y - 1)) * k;
        var len = Math.sqrt(dx * dx + dy * dy + 1);
        var p = (y * AT + x) * 4;
        px[p]     = Math.round((-dx / len * 0.5 + 0.5) * 255);
        px[p + 1] = Math.round((-dy / len * 0.5 + 0.5) * 255);
        px[p + 2] = Math.round((1 / len * 0.5 + 0.5) * 255);
        px[p + 3] = 255;
      }
    }
  });

  return { cor: cor, rugosidade: rug, normal: nrm, folhas: F };
}
