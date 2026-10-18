/* ============================================================
   Fratelli Móveis — painel ripado (fresado), em geometria real

   POR QUE ISTO EXISTE, E POR QUE É O CENTRO DESTA VERSÃO.

   As versões 6 a 9 tentaram fazer uma CHAPA LISA parecer madeira de
   verdade usando textura. Nunca fechou. A medição das referências
   novas explica por quê, e o número é constrangedoramente claro:

     tools/ref/30.jpg, painel LISO sob luz rasante   faixa de luma  73
     tools/ref/30.jpg, painel RIPADO, mesma luz      faixa de luma 197
     uma única ripa, da sombra ao realce             210 níveis

     o painel liso da V9, renderizado                faixa de luma  ~25

   Numa peça de marcenaria real a maior parte da amplitude tonal não
   vem do desenho da madeira: vem da GEOMETRIA recebendo luz
   direcional. Uma superfície plana só tem um ângulo, então só tem um
   tom; cada ripa tem todos os ângulos entre o realce e a sombra, e é
   isso que o olho lê como matéria sólida.

   Nenhum mapa de normal faz esse trabalho direito, porque normal map
   não projeta sombra na peça vizinha nem muda a silhueta. Ripa
   projeta.

   GEOMETRIA

   O painel inteiro é UM `ExtrudeGeometry`: o perfil é a seção
   horizontal (costas lisas, frente ondulada) e a extrusão é a altura.
   Sai uma malha só por medida de painel, compartilhada entre peças
   iguais.

   Medido em tools/ref/30.jpg: 10 ripas no recorte analisado. O passo
   adotado é 26 mm com 9 mm de saliência — dentro do que marcenaria
   brasileira usa em painel ripado (20 a 40 mm) e o que a referência
   aparenta na proporção da folha.

   O arco: corda de 26 mm e flecha de 9 mm dão raio de 13,9 mm. Não é
   meia-cana cheia; é o segmento que a referência mostra, com a
   lateral quase reta e o topo arredondado.
   ============================================================ */

import * as THREE from './three.module.min.js';

/* PASSO E SALTO, e os dois vieram de medição seguida de teste.

   A referência (tools/ref/29.jpg) usa ~18 mm de passo: 10 px por ripa
   numa fotografia de 2000 px, com a parede inteira no quadro. A
   primeira tentativa copiou essa escala (26 mm) e o resultado medido
   foi ruim: variação de luz na largura do painel de 34 níveis contra
   165 da referência.

   O motivo é de amostragem, não de desenho. No enquadramento mais
   aberto o painel ripado ocupa ~104 px na tela para 15 ripas — 7 px
   por ripa, com 9 facetas dentro de cada uma. A GPU faz a média das
   facetas e devolve um tom só. A fotografia não tem esse problema
   porque o sensor captura o realce especular real, que é muito mais
   brilhante que qualquer rampa de Lambert amostrada em 7 px.

   É a MESMA parede que a V9 encontrou com o poro da madeira: detalhe
   mais fino que ~3 px por elemento desaparece, e aumentar a resolução
   da textura não resolve porque quem decide é a escala na tela.

   42 mm com 14 mm de saliência: dentro do que marcenaria usa em
   painel ripado (20 a 60 mm), dá ~10 ripas numa folha de 0,40 m e
   ~16 px por ripa no enquadramento aberto. O relevo é mais profundo
   para compensar o que a média ainda come. */
var PASSO = 0.042;        // 42 mm de eixo a eixo
var SALTO = 0.014;        // 14 mm de saliência
var SEGMENTOS = 9;        // facetas por ripa
var FOLHA_L = 0.70, FOLHA_A = 2.50;   // a mesma folha de lâmina de pecas.js

var cache = {};
var criadas = [];

function chave(l, a, p) {
  return l.toFixed(4) + '|' + a.toFixed(4) + '|' + p.toFixed(4);
}

/**
 * Painel ripado centrado na origem, ripas na vertical.
 * l = largura (x), a = altura (y), p = espessura TOTAL (z),
 * incluindo a saliência das ripas.
 */
export function geoRipado(l, a, p) {
  var k = chave(l, a, p);
  if (cache[k]) { return cache[k]; }

  /* Quantas ripas cabem na largura, em número inteiro. O passo real é
     reajustado para fechar certo nas duas bordas — um painel que
     termina com meia ripa denuncia desenho, não marcenaria. */
  var n = Math.max(3, Math.round(l / PASSO));
  var passo = l / n;
  var raio = (passo * passo / 4 + SALTO * SALTO) / (2 * SALTO);
  var costas = Math.max(0.004, p - SALTO);   // o compensado atrás das ripas

  var forma = new THREE.Shape();
  var hx = l / 2;
  forma.moveTo(-hx, 0);
  forma.lineTo(hx, 0);                       // face de trás
  forma.lineTo(hx, costas);                  // sobe pela lateral

  /* A frente, da direita para a esquerda: uma sequência de arcos. */
  for (var i = n - 1; i >= 0; i--) {
    var cx = -hx + (i + 0.5) * passo;
    var meio = Math.asin(Math.min(1, (passo / 2) / raio));
    for (var s = 0; s <= SEGMENTOS; s++) {
      var ang = meio - (2 * meio) * (s / SEGMENTOS);
      var x = cx + Math.sin(ang) * raio;
      var y = costas + (Math.cos(ang) * raio - (raio - SALTO));
      forma.lineTo(x, y);
    }
  }
  forma.lineTo(-hx, costas);
  forma.closePath();

  /* A UV segue a convenção de pecas.js: metros contra uma folha de
     lâmina real, e não 0..1 da própria peça. Foi essa troca que
     acabou com o aspecto de ripado FALSO na V9 — lá a folha inteira
     era espremida dentro de cada tira estreita. Aqui as ripas são
     ripas de verdade e a madeira continua na escala certa. */
  var janelaU = Math.min(1, l / FOLHA_L);
  var janelaV = Math.min(1, a / FOLHA_A);
  var semente = Math.abs(Math.sin((l * 23.7 + a * 41.3 + p * 77.1) * 1000));
  var origemU = (1 - janelaU) * (semente % 1);
  var origemV = (1 - janelaV) * ((semente * 5.1) % 1);

  var geradorUV = {
    /* As tampas (topo e base do painel) quase nunca aparecem: ficam
       encostadas no teto e no rodapé. UV simples basta. */
    generateTopUV: function (geo, vert, a_, b_, c_) {
      function uv(i) {
        return new THREE.Vector2(
          origemU + (vert[i * 3] + hx) / l * janelaU, origemV);
      }
      return [uv(a_), uv(b_), uv(c_)];
    },
    /* As paredes: é aqui que a madeira aparece. `u` acompanha a
       LARGURA do painel e `v` acompanha a ALTURA (o eixo da extrusão),
       que é o sentido do veio. */
    generateSideWallUV: function (geo, vert, a_, b_, c_, d_) {
      function uv(i) {
        return new THREE.Vector2(
          origemU + (vert[i * 3] + hx) / l * janelaU,
          origemV + (vert[i * 3 + 2] / a) * janelaV);
      }
      return [uv(a_), uv(b_), uv(c_), uv(d_)];
    }
  };

  var geo = new THREE.ExtrudeGeometry(forma, {
    UVGenerator: geradorUV,
    depth: a, bevelEnabled: false, curveSegments: 1, steps: 1
  });
  /* Nasce deitado — o perfil está no plano XY e a extrusão corre em
     +Z — e com a origem num canto. De pé e centrado, para a peça
     poder ser posicionada pelo meio como qualquer outra.

     O giro é +90° e não −90°, e a diferença não é cosmética: com
     −90° o eixo da extrusão vai para +Y (o painel sobe a partir da
     base, em vez de ficar centrado) E a frente do perfil aponta para
     −Z, ou seja, as ripas ficam viradas para a parede. Com +90° a
     altura corre para −Y, que o `translate` recentra, e a frente
     aponta para +Z, que é para onde olha quem vê. */
  geo.rotateX(Math.PI / 2);
  geo.translate(0, a / 2, -costas / 2);
  geo.computeVertexNormals();

  cache[k] = geo;
  criadas.push(geo);
  return geo;
}

/** Quantas ripas um painel desta largura terá. Para o relatório. */
export function contarRipas(l) {
  return Math.max(3, Math.round(l / PASSO));
}

export function limparRipado() {
  criadas.forEach(function (g) { g.dispose(); });
  criadas.length = 0;
  cache = {};
}
