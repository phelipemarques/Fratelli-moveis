/* ============================================================
   Fratelli Móveis — madeira procedural (V6)

   A V3 pintava o móvel de marrom liso. De perto isso é um bloco, não
   uma peça de marcenaria: falta veio, falta variação de tom, falta a
   diferença entre o poro e o verniz.

   Aqui os mapas são DESENHADOS em canvas, no carregamento, e viram
   três texturas PBR:

     map           cor      — alburno claro e cerne escuro, figura em
                              catedral, raios de medula
     roughnessMap  brilho   — o poro espalha a luz, o acabamento não
     normalMap     relevo   — derivado do mesmo campo de altura, por
                              Sobel, então o relevo CONCORDA com o veio

   Por que procedural e não uma fotografia de madeira: não temos foto
   autorizada de nenhuma lâmina da Fratelli, e usar uma textura
   qualquer de banco de imagens seria dizer que o móvel é de um
   material que ninguém confirmou. O desenho é declaradamente
   conceitual — está escrito na própria seção.

   Custo medido no cliente: ver TESTES-V6.md.
   ============================================================ */

import * as THREE from './three.module.min.js';

import { gerarCanvasMadeira } from './grao.js';

/**
 * Gera o trio de mapas PBR de uma madeira, prontos para o Three.js.
 * O desenho em si mora em grao.js; aqui só vira textura.
 */
export function gerarMadeira(o) {
  var canvas = gerarCanvasMadeira(o);

  function textura(canvas, espaco) {
    var t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    if (espaco) { t.colorSpace = espaco; }
    return t;
  }

  return {
    map: textura(canvas.cor, THREE.SRGBColorSpace),
    roughnessMap: textura(canvas.rugosidade),
    normalMap: textura(canvas.normal),
    folhas: canvas.folhas,
    lado: canvas.cor.width / canvas.folhas
  };
}

/**
 * Material de madeira a partir de um trio de mapas.
 *
 * `folha` escolhe QUAL folha do atlas esta peça usa (0 .. folhas²-1).
 * Não é mais um deslocamento livre: a janela cai exatamente sobre uma
 * folha, com uma folga de dois texels nas bordas.
 *
 * Por que não é mais livre: com `offset` arbitrário e
 * `RepeatWrapping`, a emenda da textura — que não é cíclica — caía
 * DENTRO do painel, e aparecia como uma faixa atravessando a porta.
 * Ver o comentário no topo de grao.js.
 *
 * `giro` existe porque o veio tem DIREÇÃO: numa lateral em pé ele
 * corre na vertical; numa prateleira deitada, na horizontal. Sem
 * girar a textura, a prateleira sai com o veio atravessado, que é o
 * erro que mais denuncia marcenaria falsa. O giro acontece em torno
 * do centro da própria janela, então continua dentro da mesma folha.
 *
 * As texturas são clonadas: a imagem é a mesma na memória da GPU, só o
 * enquadramento muda.
 */
export function materialMadeira(mapas, opcoes) {
  var o = opcoes || {};
  var F = mapas.folhas || 1;
  var lado = mapas.lado || 512;
  var i = (o.folha || 0) % (F * F);

  /* Dois texels de folga de cada lado: o mip-map mistura texels
     vizinhos, e sem essa folga a folha do lado vazaria numa linha
     fina na borda do painel. */
  var escala = (1 / F) * (1 - 4 / lado);
  var cx = ((i % F) + 0.5) / F;
  var cy = (Math.floor(i / F) + 0.5) / F;

  function ajustar(t) {
    var c = t.clone();
    c.needsUpdate = true;
    c.repeat.set(escala, escala);
    c.center.set(0.5, 0.5);
    c.rotation = o.giro || 0;
    /* O Three.js monta a janela em torno de 0,5 + offset; para
       centrá-la na folha i o deslocamento é a diferença entre os dois
       centros. */
    c.offset.set(cx - 0.5, cy - 0.5);
    return c;
  }

  var m = new THREE.MeshStandardMaterial({
    map: ajustar(mapas.map),
    roughnessMap: ajustar(mapas.roughnessMap),
    normalMap: ajustar(mapas.normalMap),
    roughness: 1.0,            // o mapa manda; este valor é multiplicador
    metalness: 0.0,
    envMapIntensity: o.reflexo === undefined ? 0.55 : o.reflexo
  });
  if (o.tingir) { m.color.setHex(o.tingir); }
  if (o.normal !== undefined) { m.normalScale.set(o.normal, o.normal); }
  return m;
}
