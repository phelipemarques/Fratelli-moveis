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
    normalMap: textura(canvas.normal)
  };
}

/**
 * Material de madeira a partir de um trio de mapas.
 *
 * `repete` e `giro` existem porque o veio tem DIREÇÃO: numa lateral em
 * pé ele corre na vertical; numa prateleira deitada, na horizontal. Sem
 * girar a textura, a prateleira sai com o veio atravessado, que é o
 * erro que mais denuncia marcenaria falsa.
 *
 * As texturas são clonadas: a imagem é a mesma na memória da GPU, só o
 * enquadramento muda.
 */
export function materialMadeira(mapas, opcoes) {
  var o = opcoes || {};
  var rx = o.repete ? o.repete[0] : 1;
  var ry = o.repete ? o.repete[1] : 1;

  function ajustar(t) {
    var c = t.clone();
    c.needsUpdate = true;
    c.repeat.set(rx, ry);
    c.center.set(0.5, 0.5);
    c.rotation = o.giro || 0;
    c.offset.set(o.desloca ? o.desloca[0] : 0, o.desloca ? o.desloca[1] : 0);
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
