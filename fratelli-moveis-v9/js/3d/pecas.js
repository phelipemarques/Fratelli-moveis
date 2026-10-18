/* ============================================================
   Fratelli Móveis — painéis com canto chanfrado (V9)

   Até a V8 cada peça era um `BoxGeometry` escalado. Isso dá uma
   aresta matematicamente perfeita: zero largura, zero highlight. É a
   razão número um do aspecto de massinha — um canto real sempre
   devolve uma linha de luz, porque sempre tem um chanfro, nem que
   seja de um milímetro.

   Medido na fotografia de referência (tools/ref/26.jpg):

     face do painel    luminosidade 38%
     topo chanfrado    luminosidade 65%, com pico em 255

   Ou seja: o chanfro é quase o DOBRO do brilho da face, e carrega um
   realce especular. Nenhum ajuste de material produz isso sem a
   geometria estar lá.

   Aqui cada painel é um `ExtrudeGeometry` com bisel de 1,2 mm e dois
   segmentos — um chanfro levemente quebrado, não um arredondamento
   gordo. Marcenaria planejada tem aresta precisa; o que ela não tem é
   aresta infinitamente afiada.

   CUSTO: ~100 triângulos por painel contra 12. Com ~50 painéis são
   5 mil triângulos — irrelevante para qualquer GPU, e as geometrias
   são compartilhadas por medida, então peças iguais custam uma só.

   UV: UMA FOLHA DE LÂMINA POR PEÇA.

   A primeira tentativa deixou a UV em metros e usou `repeat` para
   controlar a escala. O resultado foi um xadrez: o desenho
   procedural não fecha nas bordas, então cada ladrilho mostrava a
   emenda, e a porta virava um mosaico de quadrados.

   Isso também estava errado na física. Uma porta de marcenaria é
   revestida por UMA folha de lâmina, não por um mosaico. Então o
   gerador de UV abaixo normaliza a face frontal para 0..1 das
   dimensões da própria peça: cada painel recebe o desenho inteiro,
   uma vez, sem emenda nenhuma.

   O efeito colateral é correto: o veio fica proporcionalmente mais
   aberto numa porta grande e mais fechado numa prateleira pequena —
   que é o que acontece quando se corta peças de tamanhos diferentes
   da mesma folha.
   ============================================================ */

import * as THREE from './three.module.min.js';

var CHANFRO = 0.0012;          // 1,2 mm
var cache = {};
var criadas = [];

function chave(l, a, p) {
  return l.toFixed(4) + '|' + a.toFixed(4) + '|' + p.toFixed(4);
}

/**
 * Geometria de um painel chanfrado, centrada na origem.
 * Medidas em metros: largura (x), altura (y), espessura (z).
 */
export function geoPainel(l, a, p) {
  var k = chave(l, a, p);
  if (cache[k]) { return cache[k]; }

  /* O bisel não pode comer mais que a própria peça: uma fita de borda
     de 1,5 mm levaria um chanfro maior que ela mesma e viraria um
     losango. */
  var b = Math.min(CHANFRO, l * 0.22, a * 0.22, p * 0.34);

  var forma = new THREE.Shape();
  var hx = l / 2 - b, hy = a / 2 - b;
  var prof = Math.max(0.0002, p - 2 * b);
  forma.moveTo(-hx, -hy);
  forma.lineTo(hx, -hy);
  forma.lineTo(hx, hy);
  forma.lineTo(-hx, hy);
  forma.closePath();

  var prof = Math.max(0.0002, p - 2 * b);
  /* Normaliza a face frontal/traseira para 0..1 da peça. As faces
     laterais (o chanfro e a espessura) recebem uma UV própria,
     esticada ao longo da aresta — é lá que o veio aparece
     travessado, como numa borda cortada de verdade. */
  var geradorUV = {
    generateTopUV: function (geometria, vertices, a, b, c) {
      function uv(i) {
        return new THREE.Vector2(
          (vertices[i * 3] + hx) / (2 * hx || 1),
          (vertices[i * 3 + 1] + hy) / (2 * hy || 1));
      }
      return [uv(a), uv(b), uv(c)];
    },
    generateSideWallUV: function (geometria, vertices, a, b, c, d) {
      function uv(i) {
        var x = vertices[i * 3], y = vertices[i * 3 + 1], z = vertices[i * 3 + 2];
        // ao longo da aresta, e a espessura no outro eixo
        return new THREE.Vector2(
          (Math.abs(x) > Math.abs(y) ? (x + hx) / (2 * hx || 1)
                                     : (y + hy) / (2 * hy || 1)),
          z / Math.max(0.001, prof) * 0.5 + 0.5);
      }
      return [uv(a), uv(b), uv(c), uv(d)];
    }
  };

  var geo = new THREE.ExtrudeGeometry(forma, {
    UVGenerator: geradorUV,
    depth: prof,
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelOffset: 0,
    bevelSegments: 2,
    curveSegments: 1,
    steps: 1
  });
  /* O ExtrudeGeometry nasce com a face de trás em z = -bevelThickness.
     Recentra para a peça poder ser posicionada pelo meio, como era
     com o BoxGeometry. */
  geo.translate(0, 0, -(prof / 2));
  geo.computeVertexNormals();

  cache[k] = geo;
  criadas.push(geo);
  return geo;
}

/** Descarta tudo que foi criado. Chamado no `descartar()` da cena. */
export function limparPecas() {
  criadas.forEach(function (g) { g.dispose(); });
  criadas.length = 0;
  cache = {};
}

/* ============================================================
   Puxador de barra, em perfil

   A referência (tools/ref/27.jpg) mostra barras verticais finas e
   compridas, afastadas da folha por dois pés. É a sombra entre a
   barra e a porta que dá volume ao metal — uma barra encostada na
   superfície lê como um risco desenhado.
   ============================================================ */
export function montarPuxador(THREE_, material, altura, afast) {
  var g = new THREE_.Group();
  var raio = 0.0085;

  var barra = new THREE_.Mesh(
    new THREE_.CylinderGeometry(raio, raio, altura, 20, 1), material);
  barra.castShadow = true;
  g.add(barra);
  criadas.push(barra.geometry);

  /* Os pés: cilindros curtos, deitados, ligando a barra à folha. */
  var geoPe = new THREE_.CylinderGeometry(raio * 0.62, raio * 0.62, afast, 12, 1);
  criadas.push(geoPe);
  [-1, 1].forEach(function (s) {
    var pe = new THREE_.Mesh(geoPe, material);
    pe.rotation.x = Math.PI / 2;
    pe.position.set(0, s * (altura / 2 - 0.045), -afast / 2);
    pe.castShadow = true;
    g.add(pe);
  });

  return g;
}
