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

   UV: UM PEDAÇO DA FOLHA POR PEÇA, NA ESCALA CERTA.

   Isto já errou de duas maneiras, e vale guardar as duas.

   A primeira deixou a UV em metros e usou `repeat` para a escala. Deu
   xadrez: o desenho procedural não fecha nas bordas, então cada
   ladrilho mostrava a emenda e a porta virava um mosaico.

   A segunda normalizou a face para 0..1 das dimensões da PRÓPRIA
   peça. Acabou com o xadrez e criou um defeito pior, que levou tempo
   para ser isolado: numa tira de 85 mm — o quadro da porta — a folha
   INTEIRA era espremida em 85 mm. São ~26 linhas de veio em 15 px de
   tela. Aliasing garantido, e o móvel lia como painel ripado mesmo
   com a textura impecável. Desligando só o mapa de cor o painel
   ficava liso, o que apontou o caminho; a textura, ampliada, estava
   certa. Era a UV.

   E estava errado na física, apesar do comentário que dizia o
   contrário. Cortar uma tira de 85 mm de uma folha dá 85 mm DAQUELA
   folha — não a folha toda encolhida.

   Agora a UV é medida em metros contra o tamanho de uma folha de
   lâmina de verdade (FOLHA_L × FOLHA_A), e cada peça fica com a
   JANELA que lhe cabe, numa posição própria dentro da folha. Uma
   porta pega quase a folha inteira; uma tira de quadro pega uma faixa
   estreita dela, com o veio na mesma escala da porta ao lado — que é
   o que acontece quando as duas saem da mesma chapa.

   Peças maiores que a folha (o tampo de 2,46 m) ficam limitadas a
   ela: é o caso em que a emenda apareceria, e esticar é o menor dos
   males num painel que quase não se vê de frente.
   ============================================================ */

import * as THREE from './three.module.min.js';

var CHANFRO = 0.0012;          // 1,2 mm

/* Tamanho de uma folha de lâmina, em metros. Não é um número livre:
   é contra ele que a escala do veio de TODAS as peças é medida, e é
   o que faz uma tira de quadro e a porta ao lado parecerem a mesma
   madeira. */
var FOLHA_L = 0.70, FOLHA_A = 2.50;
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

  /* A janela desta peça dentro da folha: tamanho real em metros, e
     uma posição estável derivada das próprias medidas — peças de
     tamanhos diferentes caem em lugares diferentes da folha, e duas
     peças iguais caem no mesmo lugar, como duas peças cortadas juntas
     de fato cairiam. */
  var janelaU = Math.min(1, l / FOLHA_L);
  var janelaV = Math.min(1, a / FOLHA_A);
  var semente = Math.abs(Math.sin((l * 37.1 + a * 11.7 + p * 91.3) * 1000));
  var origemU = (1 - janelaU) * (semente % 1);
  var origemV = (1 - janelaV) * ((semente * 7.3) % 1);

  var geradorUV = {
    generateTopUV: function (geometria, vertices, a_, b_, c_) {
      function uv(i) {
        return new THREE.Vector2(
          origemU + (vertices[i * 3] + hx) / (2 * hx || 1) * janelaU,
          origemV + (vertices[i * 3 + 1] + hy) / (2 * hy || 1) * janelaV);
      }
      return [uv(a_), uv(b_), uv(c_)];
    },
    /* As faces laterais — o chanfro e a espessura. O veio corre ao
       longo da aresta e aparece travessado na espessura, como numa
       borda cortada de verdade. A espessura é minúscula, então ocupa
       uma fatia proporcionalmente minúscula da folha: é isso que faz
       a fita de borda ter o MESMO veio da face, e não um desenho
       inteiro comprimido em 18 mm. */
    generateSideWallUV: function (geometria, vertices, a_, b_, c_, d_) {
      var fatia = Math.min(0.5, p / FOLHA_A);
      function uv(i) {
        var x = vertices[i * 3], y = vertices[i * 3 + 1], z = vertices[i * 3 + 2];
        var ao = Math.abs(x) > Math.abs(y)
          ? origemU + (x + hx) / (2 * hx || 1) * janelaU
          : origemV + (y + hy) / (2 * hy || 1) * janelaV;
        return new THREE.Vector2(ao,
          origemV + (z / Math.max(0.001, prof) * 0.5 + 0.5) * fatia);
      }
      return [uv(a_), uv(b_), uv(c_), uv(d_)];
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
