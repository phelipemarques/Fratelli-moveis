/* ============================================================
   Fratelli Móveis — a cena de marcenaria (V6)

   O que mudou em relação à V3, e por quê:

   MATERIAL   A V3 usava cor chapada. Agora a madeira vem de
              madeira.js: cor, rugosidade e relevo desenhados no
              carregamento, com o veio na DIREÇÃO certa de cada peça.
              Uma prateleira deitada não tem veio em pé.

   LUZ        Entrou um ambiente procedural (PMREM) para as bordas e os
              metais terem o que refletir. Sem isso o puxador é um tubo
              cinza; com isso ele é metal.

   PEÇAS      Entraram rodapé recuado, gaveteiro com frentes e frestas,
              fita de borda nos cantos vivos e um fundo em tom próprio.
              São as peças que o olho usa para decidir se aquilo é um
              móvel ou uma caixa.

   CÂMERA     A V3 movia camera.position em linha reta. Agora a câmera
              mora em coordenadas esféricas em volta de um alvo: raio
              (dolly), theta (órbita), phi (altura) e o próprio alvo se
              movem em curvas separadas. É o que separa um travelling
              de arquitetura de um voo de videogame.

   ATOS       Cinco, não quatro. O quinto entrega a composição para a
              fotografia real.

   A cena inteira é conduzida por UMA timeline pausada. O ScrollTrigger
   só escreve o progresso nela. Por isso ela é reversível quadro a
   quadro e nada disputa a posição da câmera.
   ============================================================ */

import * as THREE from './three.module.min.js';
import { gerarMadeira, materialMadeira } from './madeira.js';

export function criarAbertura(opcoes) {
  var canvas = opcoes.canvas;
  var palco  = opcoes.palco;
  var gsap   = opcoes.gsap;
  var leve   = !!opcoes.leve;          // perfil econômico: menos mapa, menos sombra

  /* ---------- Renderizador ---------- */
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: window.devicePixelRatio < 1.5,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch (e) {
    return null;                       // sem contexto: quem chamou cuida do fallback
  }
  if (!renderer || !renderer.getContext()) { return null; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, leve ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = leve ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;

  var cena = new THREE.Scene();
  var lixo = [];                        // tudo que precisa de dispose()

  /* ============================================================
     Ambiente: o que as bordas e o metal refletem

     Um gradiente quente em cima, frio embaixo, com uma faixa clara na
     altura de uma janela. Vai para o PMREM e vira o envMap da cena.
     Custa um canvas de 128px e uma passada de convolução, uma vez.
     ============================================================ */
  function ambiente() {
    var c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    var ctx = c.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0.00, '#3A332B');
    g.addColorStop(0.34, '#C9BCA8');
    g.addColorStop(0.46, '#F6F0E6');   // a "janela"
    g.addColorStop(0.62, '#8E8375');
    g.addColorStop(1.00, '#1C1915');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 64);

    var tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;

    var pmrem = new THREE.PMREMGenerator(renderer);
    var alvo = pmrem.fromEquirectangular(tex);
    pmrem.dispose();
    tex.dispose();
    return alvo.texture;
  }
  cena.environment = ambiente();

  /* ---------- Câmera numa órbita de verdade ----------

     `orbita` é o que a timeline anima. `rig` é a camada do ponteiro e a
     timeline nunca encosta nele: duas mãos, dois controles, sem briga. */
  var rig = new THREE.Group();
  /* near curto porque a câmera ENTRA no móvel no ato 4; far curto
     para a precisão de profundidade não sofrer com isso. */
  var camera = new THREE.PerspectiveCamera(38, 1, 0.03, 40);
  rig.add(camera);
  cena.add(rig);

  var alvo = new THREE.Vector3(0, 1.05, 0);
  var orbita = { theta: -0.26, phi: 1.30, fov: 40, raio: 6 };

  /* ============================================================
     O ENQUADRAMENTO

     A V7 escolhia o raio da câmera a dedo: 8,6 … 5,0 … 3,4 … 2,55.
     Números assim só funcionam na proporção de tela em que foram
     escolhidos. Em 21:9 sobrava vazio; em 390×844 o móvel saía pelas
     bordas. E não havia como pedir "ocupe 90% da tela".

     Agora a distância é RESOLVIDA a cada quadro, a partir de:
       - o tamanho real do que se quer enquadrar (metros),
       - quanto da tela ele deve ocupar (`cheio`, de 0 a 1),
       - o fov e a proporção REAL do canvas naquele instante.

     Com `auto`, o tamanho vem de um Box3 do próprio móvel — então
     quando as portas abrem e a peça fica mais larga, a câmera recua
     sozinha o quanto for preciso para manter os 90% pedidos. É isso
     que faz o mesmo código enquadrar certo em 1920×1080 e em 320×568.

     `desvio` é o quanto a câmera olha para a ESQUERDA do centro da
     peça. Ele entra na conta da largura, senão a peça deslocada
     sairia do quadro em vez de só mudar de lugar nele.
     ============================================================ */
  var enq = {
    auto: true,       // medir a peça viva, ou usar larg/alt abaixo
    larg: 1.9,
    alt: 2.3,
    prof: 0.5,        // profundidade da caixa sintética (modo manual)
    cheio: 0.52,      // quanto da tela o canto mais extremo deve ocupar
    desvio: 1.45      // quanto o olhar se afasta do centro da peça
  };

  var CAIXA = new THREE.Box3();
  var TAM = new THREE.Vector3();
  var CENTRO = new THREE.Vector3();
  var CANTOS = [];
  for (var _i = 0; _i < 8; _i++) { CANTOS.push(new THREE.Vector3()); }

  var _dir = new THREE.Vector3();
  var _direita = new THREE.Vector3();
  var _cima = new THREE.Vector3();
  var _rel = new THREE.Vector3();
  var ACIMA = new THREE.Vector3(0, 1, 0);

  function cantosDaCaixa(min, max) {
    for (var i = 0; i < 8; i++) {
      CANTOS[i].set(i & 1 ? max.x : min.x,
                    i & 2 ? max.y : min.y,
                    i & 4 ? max.z : min.z);
    }
    return CANTOS;
  }

  /* A distância que faz TODOS os cantos caberem.

     A primeira tentativa usava `(altura/2) / tan(fov/2)` — a fórmula
     de folheto, que supõe o objeto achatado num plano à distância do
     centro. Com as portas abertas o móvel tem 1,44 m de PROFUNDIDADE:
     os cantos da frente ficam muito mais perto da câmera que o centro
     e abrem um ângulo bem maior. Medido, a conta ingênua entregava
     126% da altura da tela quando eu havia pedido 90% — o móvel saía
     cortado em cima e embaixo.

     Esta versão resolve canto a canto. Para cada um:

       profundidade = quanto ele avança na direção da câmera
       lateral      = o quanto ele se afasta do eixo de visão

     e a distância mínima para esse canto caber é
     `profundidade + lateral / (tan * cheio)`. O maior valor entre os
     oito manda. É exato, fecha em forma fechada e vale para qualquer
     proporção de tela. */
  function resolverRaio(cantos) {
    var sp = Math.sin(orbita.phi), cp = Math.cos(orbita.phi);
    _dir.set(sp * Math.sin(orbita.theta), cp, sp * Math.cos(orbita.theta)).normalize();
    _direita.crossVectors(ACIMA, _dir);
    if (_direita.lengthSq() < 1e-6) { _direita.set(1, 0, 0); }
    _direita.normalize();
    _cima.crossVectors(_dir, _direita).normalize();

    var meio = THREE.MathUtils.degToRad(orbita.fov) / 2;
    var tanY = Math.tan(meio);
    var tanX = tanY * (camera.aspect || 1);
    var k = Math.max(0.05, Math.min(1, enq.cheio));

    var d = 0.22;                       // nunca encostar no near plane
    for (var i = 0; i < cantos.length; i++) {
      _rel.copy(cantos[i]).sub(alvo);
      var prof = _rel.dot(_dir);
      var lx = Math.abs(_rel.dot(_direita));
      var ly = Math.abs(_rel.dot(_cima));
      d = Math.max(d, prof + lx / (tanX * k), prof + ly / (tanY * k));
    }
    return d;
  }

  function medirMovel() {
    CAIXA.setFromObject(movel);
    CAIXA.getSize(TAM);
    CAIXA.getCenter(CENTRO);
  }

  function posicionarCamera() {
    var cantos;
    if (enq.auto) {
      medirMovel();
      /* Enquanto o enquadramento é automático, o alvo é DERIVADO da
         peça e do desvio. A partir do ato 4 quem manda no alvo é a
         timeline — escrever aqui apagaria o movimento dela. */
      alvo.x = CENTRO.x - enq.desvio;
      alvo.y = CENTRO.y;
      alvo.z = CENTRO.z;
      cantos = cantosDaCaixa(CAIXA.min, CAIXA.max);
    } else {
      /* Caixa sintética em volta do alvo: é assim que se pede "enquadre
         este pedaço do interior", e a mesma conta resolve a distância. */
      var hx = enq.larg / 2, hy = enq.alt / 2, hz = enq.prof / 2;
      CAIXA.min.set(alvo.x - hx, alvo.y - hy, alvo.z - hz);
      CAIXA.max.set(alvo.x + hx, alvo.y + hy, alvo.z + hz);
      cantos = cantosDaCaixa(CAIXA.min, CAIXA.max);
    }
    orbita.raio = resolverRaio(cantos);

    var sp = Math.sin(orbita.phi), cp = Math.cos(orbita.phi);
    camera.position.set(
      alvo.x + orbita.raio * sp * Math.sin(orbita.theta),
      alvo.y + orbita.raio * cp,
      alvo.z + orbita.raio * sp * Math.cos(orbita.theta));
    if (camera.fov !== orbita.fov) {
      camera.fov = orbita.fov;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(alvo);
  }

  /* ============================================================
     Materiais
     ============================================================ */
  var MAPAS = gerarMadeira({
    tamanho: leve ? 256 : 512,
    semente: 20261018,
    /* Nogueira clara, dessaturada. A V6 começou com [168,132,96] sobre
       [74,52,35] e o móvel saiu laranja de plástico: contraste demais
       entre lenho inicial e tardio. Aproximar os dois tons é o que
       transforma listra em veio. */
    claro: [143, 117, 92],
    escuro: [84, 65, 50],
    rugosidade: 0.58,
    rugosidadePoro: 0.80,
    relevo: 1.0
  });
  lixo.push(MAPAS.map, MAPAS.roughnessMap, MAPAS.normalMap);

  function madeira(o) {
    var m = materialMadeira(MAPAS, o);
    lixo.push(m, m.map, m.roughnessMap, m.normalMap);
    return m;
  }

  /* Uma lâmina diferente para cada peça.

     Era este o maior denunciador da V6: `repete: [1, 2.4]` fazia a
     textura LADRILHAR dentro da porta, e a emenda aparecia como duas
     linhas horizontais atravessando o painel. Nenhuma marcenaria tem
     isso.

     Agora `repete` fica em 1 ou menos — cada face usa UMA janela da
     textura, nunca duas — e cada peça recebe um `desloca` diferente,
     então duas peças vizinhas nunca mostram o mesmo desenho. É o que
     uma lâmina faseada faz de verdade: folhas distintas da mesma
     tora.

     O `tingir` também varia de leve entre as peças. Lâmina natural
     não sai toda do mesmo tom, e um móvel em que tudo tem exatamente
     a mesma cor lê como plástico. */
  function lamina(desloca, tom, extra) {
    var o = { repete: [0.82, 0.78], desloca: desloca, tingir: tom,
              normal: 0.26, reflexo: 0.30 };
    if (extra) {
      Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
    }
    return madeira(o);
  }

  var MAT = {
    /* Laterais, em pé: veio na vertical. */
    ladoEsq: lamina([0.04, 0.11], 0xC9BCA9),
    ladoDir: lamina([0.63, 0.47], 0xD1C5B2),
    /* Portas: duas folhas vizinhas, desenhos próximos mas distintos —
       como um par casado sairia da mesma tora. */
    portaEsq: lamina([0.22, 0.30], 0xD6CABA, { normal: 0.30, reflexo: 0.42 }),
    portaDir: lamina([0.31, 0.68], 0xD2C6B6, { normal: 0.30, reflexo: 0.42 }),
    /* Divisória e peças internas em pé. */
    divisoria: lamina([0.78, 0.19], 0xC4B7A4),
    /* Peças deitadas: o giro de 90° põe o veio no sentido do
       comprimento, como a lâmina é aplicada de verdade. */
    deitadaA: lamina([0.12, 0.55], 0xCBBFAE, { giro: Math.PI / 2, normal: 0.20, reflexo: 0.24 }),
    deitadaB: lamina([0.57, 0.08], 0xC6BAA8, { giro: Math.PI / 2, normal: 0.20, reflexo: 0.24 }),
    deitadaC: lamina([0.88, 0.41], 0xD0C4B1, { giro: Math.PI / 2, normal: 0.20, reflexo: 0.24 }),
    /* Frentes de gaveta: três folhas seguidas, como num gaveteiro
       casado. */
    gavetaA: lamina([0.25, 0.52], 0xD4C8B8, { normal: 0.28, reflexo: 0.40 }),
    gavetaB: lamina([0.25, 0.60], 0xD2C6B6, { normal: 0.28, reflexo: 0.40 }),
    gavetaC: lamina([0.25, 0.68], 0xD6CABA, { normal: 0.28, reflexo: 0.40 }),
    /* Fundo: mais claro e mais fosco, para o interior não virar um
       buraco preto quando a porta abre. */
    fundo:   lamina([0.45, 0.33], 0xCFC4B4, { repete: [0.9, 0.9], normal: 0.12, reflexo: 0.14 }),
    /* Fita de borda: o mesmo material com o veio travessado e mais
       brilho. É o que acende no canto vivo quando a luz raspa. */
    borda:   madeira({ repete: [0.22, 0.22], desloca: [0.5, 0.5], giro: Math.PI / 2,
                       tingir: 0xE6DCCC, normal: 0.16, reflexo: 0.78 }),

    metal: new THREE.MeshStandardMaterial({
      color: 0x9E9182, roughness: 0.28, metalness: 0.82, envMapIntensity: 1.1
    }),
    /* O piso. Não é cenário: é o que tira a peça do vazio preto. Bem
       escuro, com rugosidade média, para devolver um reflexo vago do
       móvel em vez de uma sombra flutuando no nada. */
    piso: new THREE.MeshStandardMaterial({
      color: 0x15130F, roughness: 0.52, metalness: 0.0, envMapIntensity: 0.5
    }),
    /* A fita de LED: emissiva, baixa, sem bloom. É luz de marcenaria,
       não de ficção científica. */
    luzFita: new THREE.MeshStandardMaterial({
      color: 0xE8BE8A, emissive: 0xE8BE8A, emissiveIntensity: 0.0,
      roughness: 1, metalness: 0
    })
  };
  lixo.push(MAT.metal, MAT.piso, MAT.luzFita);

  /* ---------- Geometria base, compartilhada ---------- */
  var CUBO = new THREE.BoxGeometry(1, 1, 1);
  lixo.push(CUBO);

  function painel(l, a, p, material, x, y, z) {
    var m = new THREE.Mesh(CUBO, material);
    m.scale.set(l, a, p);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  /* ============================================================
     O módulo
     1,80 × 2,10 × 0,58 m, painéis de 18 mm. A espessura é modelada,
     não sugerida: é dela que vem a borda que pega luz.
     ============================================================ */
  var L = 1.80, A = 2.10, P = 0.58, E = 0.018;
  var RODAPE = 0.09;                   // recuo da base, como em obra

  /* O móvel fica na ORIGEM. Quem decide onde ele aparece na tela é o
     alvo da câmera: olhar para a esquerda do móvel joga o móvel para a
     direita do quadro, que é onde o véu é mais claro e o texto não
     está. Compor pela câmera, e não movendo o objeto, é o que mantém a
     órbita previsível — girar em volta de um móvel deslocado faz a
     peça escorregar pelo quadro a cada ato. */
  var movel = new THREE.Group();
  cena.add(movel);

  var corpo = new THREE.Group();
  movel.add(corpo);

  // rodapé recuado: o móvel não nasce do chão, ele pousa
  corpo.add(painel(L - 0.08, RODAPE, P - 0.07, MAT.deitadaB, 0, RODAPE / 2, -0.02));

  var y0 = RODAPE;                     // base da caixa
  var Ac = A - RODAPE;                 // altura útil da caixa

  // laterais, base, topo
  corpo.add(painel(E, Ac, P, MAT.ladoEsq, -L / 2 + E / 2, y0 + Ac / 2, 0));
  corpo.add(painel(E, Ac, P, MAT.ladoDir,  L / 2 - E / 2, y0 + Ac / 2, 0));
  corpo.add(painel(L, E, P, MAT.deitadaA, 0, y0 + E / 2, 0));
  corpo.add(painel(L, E, P, MAT.deitadaC, 0, y0 + Ac - E / 2, 0));
  // fundo
  corpo.add(painel(L - 2 * E, Ac - 2 * E, E, MAT.fundo, 0, y0 + Ac / 2, -P / 2 + E / 2));

  /* ---------- Fita de borda nos cantos vivos da frente ----------
     Uma lasca de 1,5 mm na quina de cada painel que termina na frente.
     Não aparece em prosa nenhuma; aparece quando a luz raspa. */
  function fitaBorda(l, a, x, y) {
    var m = painel(l, a, 0.0015, MAT.borda, x, y, P / 2 + 0.0012);
    m.castShadow = false;
    return m;
  }
  corpo.add(fitaBorda(E, Ac, -L / 2 + E / 2, y0 + Ac / 2));
  corpo.add(fitaBorda(E, Ac,  L / 2 - E / 2, y0 + Ac / 2));
  corpo.add(fitaBorda(L, E, 0, y0 + Ac - E / 2));

  /* ---------- Interior ---------- */
  var interior = new THREE.Group();
  corpo.add(interior);

  var xDiv = -L / 6;                   // divisória: coluna estreita à esquerda
  interior.add(painel(E, Ac - 2 * E, P - E, MAT.divisoria, xDiv, y0 + Ac / 2, E / 2));
  interior.add(fitaBorda(E, Ac - 2 * E, xDiv, y0 + Ac / 2));

  var largaEsq = L / 2 + xDiv - E;     // vão estreito (esquerda)
  var cEsq = (-L / 2 + xDiv) / 2;
  var largaDir = L / 2 - xDiv - E;     // vão largo (direita)
  var cDir = (L / 2 + xDiv) / 2;

  // prateleiras do vão estreito
  var ALTURAS = [0.62, 1.00, 1.38, 1.76];
  ALTURAS.forEach(function (y, i) {
    interior.add(painel(largaEsq, E, P - 0.05,
                        [MAT.deitadaA, MAT.deitadaB, MAT.deitadaC][i % 3], cEsq, y, 0.02));
    interior.add(fitaBorda(largaEsq, E, cEsq, y));
  });

  // vão largo: prateleira alta + cabideiro
  interior.add(painel(largaDir, E, P - 0.05, MAT.deitadaB, cDir, 1.76, 0.02));
  interior.add(fitaBorda(largaDir, E, cDir, 1.76));

  var GEO_BARRA = new THREE.CylinderGeometry(0.014, 0.014, largaDir, 14);
  lixo.push(GEO_BARRA);
  var barra = new THREE.Mesh(GEO_BARRA, MAT.metal);
  barra.rotation.z = Math.PI / 2;
  barra.position.set(cDir, 1.63, 0.02);
  barra.castShadow = true;
  interior.add(barra);

  /* ---------- Gaveteiro no vão largo ----------
     Três frentes, com fresta de 3 mm entre elas e puxador embutido.
     A fresta existe porque marcenaria tem fresta; sem ela as frentes
     viram um painel só. */
  var gavetas = [];
  var GEO_PUX = new THREE.BoxGeometry(1, 1, 1);
  lixo.push(GEO_PUX);
  var hGav = 0.21, fresta = 0.003;
  for (var i = 0; i < 3; i++) {
    var yg = y0 + 0.06 + i * (hGav + fresta) + hGav / 2;
    var g = new THREE.Group();
    g.position.set(cDir, yg, P / 2 - 0.02);
    var frente = painel(largaDir - 0.012, hGav, E,
                        [MAT.gavetaA, MAT.gavetaB, MAT.gavetaC][i], 0, 0, 0);
    g.add(frente);
    // puxador em perfil, rente ao topo da frente
    var pux = new THREE.Mesh(GEO_PUX, MAT.metal);
    pux.scale.set(largaDir * 0.46, 0.012, 0.022);
    pux.position.set(0, hGav / 2 - 0.028, E / 2 + 0.011);
    pux.castShadow = true;
    g.add(pux);
    interior.add(g);
    gavetas.push(g);
  }

  /* ---------- Fitas de luz, sob cada prateleira ---------- */
  var fitas = [];
  ALTURAS.forEach(function (y) {
    var f = painel(largaEsq - 0.04, 0.008, 0.02, MAT.luzFita, cEsq, y - E, P / 2 - 0.10);
    f.castShadow = false;
    interior.add(f); fitas.push(f);
  });
  var fitaAlta = painel(largaDir - 0.04, 0.008, 0.02, MAT.luzFita, cDir, 1.76 - E, P / 2 - 0.10);
  fitaAlta.castShadow = false;
  interior.add(fitaAlta); fitas.push(fitaAlta);

  /* ============================================================
     As portas e seus pivôs

     O Group fica na BORDA do vão. A malha é deslocada meia largura
     para dentro. Girar o Group em Y descreve o arco de uma dobradiça
     de verdade — a folha varre o espaço, não encolhe.
     ============================================================ */
  /* A FRESTA.

     Na V6 as folhas encostavam no corpo e uma na outra: o móvel lia
     como uma caixa pintada com linhas desenhadas em cima. Marcenaria
     de verdade tem folga — 3 mm entre folha e folha, 1,5 mm de cada
     lado contra a lateral. É a sombra dentro dessa folga que diz ao
     olho que são peças separadas, e não um desenho.

     É a mudança mais barata e a que mais muda a leitura da peça. */
  var FOLGA = 0.003;
  var larguraPorta = L / 2 - E - FOLGA;
  var zPorta = P / 2 + E / 2 + 0.0015;
  var GEO_PUXV = new THREE.CylinderGeometry(0.0105, 0.0105, 0.46, 16);
  lixo.push(GEO_PUXV);

  function montarPorta(sinal) {
    var pivo = new THREE.Group();
    pivo.position.set(sinal * (L / 2 - E - FOLGA / 2), 0, zPorta);
    corpo.add(pivo);

    var folha = painel(larguraPorta, Ac - 2 * E - 2 * FOLGA, E,
                       sinal < 0 ? MAT.portaEsq : MAT.portaDir,
                       -sinal * larguraPorta / 2, y0 + Ac / 2, 0);
    pivo.add(folha);

    // fita de borda na quina livre da folha — a que o giro traz para a luz
    var q = painel(0.0015, Ac - 2 * E - 2 * FOLGA, E, MAT.borda,
                   -sinal * (larguraPorta - 0.0008), y0 + Ac / 2, 0);
    q.castShadow = false;
    pivo.add(q);

    /* Puxador em perfil, não um tubo de arame. Dois elementos: a
       barra e dois pés que a afastam da folha — é a sombra entre a
       barra e a porta que dá volume ao metal. */
    var barraPux = new THREE.Mesh(GEO_PUXV, MAT.metal);
    barraPux.position.set(-sinal * (larguraPorta - 0.058), y0 + Ac / 2 + 0.10,
                          E / 2 + 0.026);
    barraPux.castShadow = true;
    pivo.add(barraPux);
    [-0.19, 0.19].forEach(function (dy) {
      var pe = new THREE.Mesh(CUBO, MAT.metal);
      pe.scale.set(0.012, 0.012, 0.026);
      pe.position.set(-sinal * (larguraPorta - 0.058),
                      y0 + Ac / 2 + 0.10 + dy, E / 2 + 0.013);
      pe.castShadow = true;
      pivo.add(pe);
    });

    return pivo;
  }

  var pivoEsq = montarPorta(-1);
  var pivoDir = montarPorta(1);

  /* ---------- Chão, só para receber sombra ---------- */
  /* O piso é material, não só sombra.

     A V6 usava um ShadowMaterial transparente: a peça ficava boiando
     num vazio preto com uma mancha embaixo. Um piso escuro de
     verdade, com rugosidade média, devolve um reflexo vago do móvel
     e um pouco da luz de dentro quando as portas abrem. É o que põe
     a peça EM UM LUGAR. */
  /* 120 m e não 22: a 22 a BORDA do piso entrava em quadro no ato 1
     e lia como uma linha de horizonte diagonal atravessando a cena. */
  var GEO_CHAO = new THREE.PlaneGeometry(120, 120);
  lixo.push(GEO_CHAO);
  var chao = new THREE.Mesh(GEO_CHAO, MAT.piso);
  chao.rotation.x = -Math.PI / 2;
  chao.position.y = -0.001;
  chao.receiveShadow = true;
  cena.add(chao);

  /* ============================================================
     Iluminação
     Uma chave quente com sombra, um preenchimento frio e fraco, e as
     luzes internas que só acendem quando as portas abrem.
     ============================================================ */
  var luzes = new THREE.Group();
  cena.add(luzes);

  var hemi = new THREE.HemisphereLight(0xF4F1EC, 0x2D2923, 0.30);
  luzes.add(hemi);

  var chave = new THREE.DirectionalLight(0xFFE7C8, 2.05);
  chave.position.set(3.4, 5.0, 4.2);
  chave.castShadow = true;
  chave.shadow.mapSize.set(leve ? 1024 : 2048, leve ? 1024 : 2048);
  chave.shadow.radius = leve ? 2 : 5;      // borda macia: sombra de ambiente, não de sol a pino
  chave.shadow.camera.near = 0.5;
  chave.shadow.camera.far = 18;
  chave.shadow.camera.left = -3.2;
  chave.shadow.camera.right = 3.2;
  chave.shadow.camera.top = 3.6;
  chave.shadow.camera.bottom = -0.6;
  chave.shadow.bias = -0.0010;
  chave.shadow.normalBias = 0.018;
  luzes.add(chave);

  var preenche = new THREE.DirectionalLight(0xBFCBD6, 0.26);
  preenche.position.set(-4.2, 2.4, 2.0);
  luzes.add(preenche);

  /* Rasante: quase paralela à frente do móvel. É esta que faz a fita de
     borda e o veio aparecerem — luz de frente achata, luz raspando
     revela relevo. */
  var rasante = new THREE.DirectionalLight(0xFFF1DC, 0.0);
  rasante.position.set(-2.2, 2.0, 6.4);
  luzes.add(rasante);

  var dentroA = new THREE.PointLight(0xFFCC8E, 0.0, 4.2, 2.0);
  dentroA.position.set(cEsq, 1.48, 0.02);
  var dentroB = new THREE.PointLight(0xFFCC8E, 0.0, 4.2, 2.0);
  dentroB.position.set(cDir, 1.02, 0.02);
  luzes.add(dentroA, dentroB);

  /* ============================================================
     A timeline — cinco atos, uma linha só, reversível
     ============================================================ */
  var estado = { foco: 0 };            // 0 = móvel, 1 = fotografia

  var tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });

  /* ============================================================
     O SENTIDO DAS DOBRADIÇAS

     Medido antes de mexer, com uma sonda que lê a ponta LIVRE de cada
     folha em coordenadas do mundo:

       progresso   ponta esquerda z   ponta direita z
       0%              +0,300            +0,300
       50%             −0,575            −0,578
       70%             −0,551            −0,566

     A frente do móvel está em z = +0,290. As pontas terminavam em
     z ≈ −0,56: as folhas giravam PARA DENTRO e atravessavam a
     carcaça inteira, saindo atrás do fundo.

     Por que: o pivô esquerdo fica em x negativo e a folha se estende
     para +x; um giro POSITIVO em Y leva um ponto de +x para −z. Logo
     a esquerda precisa de giro NEGATIVO e a direita de POSITIVO —
     o contrário do que a V7 fazia.

     Os valores abaixo já estão corrigidos, e o teste em
     tools/teste-dobradicas.js refaz a medição a cada execução: as
     pontas têm de TERMINAR à frente de z = +0,290, nunca atrás.
     ============================================================ */
  var ABRE_ESQ = -1.86;    // negativo = para fora, em direção a quem vê
  var ABRE_DIR =  1.86;    // positivo = para fora

  /* ATO 1 — APRESENTAÇÃO (0–15%)
     O móvel fechado, inteiro, reconhecível. A câmera faz um dolly
     curto e vai ficando mais frontal. Nada abre antes de o visitante
     entender que ali existem duas portas. */
  tl.fromTo(enq, { cheio: 0.62, desvio: 1.30 },
                 { cheio: 0.72, desvio: 1.20, duration: 0.15, ease: 'power1.out' }, 0)
    .fromTo(orbita, { theta: -0.30, phi: 1.30, fov: 40 },
                    { theta: -0.20, phi: 1.31, fov: 40, duration: 0.15,
                      ease: 'power1.out' }, 0)
    .fromTo(chave,   { intensity: 1.25 }, { intensity: 2.05, duration: 0.15 }, 0)
    .fromTo(hemi,    { intensity: 0.20 }, { intensity: 0.30, duration: 0.15 }, 0)
    .fromTo(rasante, { intensity: 0.08 }, { intensity: 0.52, duration: 0.15 }, 0)

  /* ATO 2 — PRIMEIRA ABERTURA (15–40%)
     As folhas avançam PARA FORA, em direção à câmera. A aproximação
     é moderada de propósito: se o zoom corresse junto, a direção do
     movimento ficaria escondida justamente no quadro em que ela
     precisa ser entendida. */
    .fromTo(pivoEsq.rotation, { y: 0 }, { y: ABRE_ESQ * 0.34, duration: 0.25,
                                          ease: 'power1.in' }, 0.15)
    .fromTo(pivoDir.rotation, { y: 0 }, { y: ABRE_DIR * 0.34, duration: 0.25,
                                          ease: 'power1.in' }, 0.15)
    .to(enq,    { cheio: 0.82, desvio: 0.62, duration: 0.25, ease: 'sine.inOut' }, 0.15)
    .to(orbita, { theta: -0.10, phi: 1.33, duration: 0.25, ease: 'sine.inOut' }, 0.15)

  /* ATO 3 — ABERTURA COMPLETA (40–60%)
     O grande momento. As folhas terminam de abrir e o enquadramento
     passa a pedir 90% da tela — com `auto` ligado, quem calcula a
     distância é o Box3 do móvel JÁ COM as portas abertas, então a
     peça cresce até dominar a composição sem nunca sair do quadro.
     O olhar vai para o centro: aqui o móvel é o assunto. */
    .to(pivoEsq.rotation, { y: ABRE_ESQ, duration: 0.20, ease: 'power2.out' }, 0.40)
    .to(pivoDir.rotation, { y: ABRE_DIR, duration: 0.20, ease: 'power2.out' }, 0.40)
    .to(enq,    { cheio: 0.99, desvio: 0.0, duration: 0.20, ease: 'power2.inOut' }, 0.40)
    .to(orbita, { theta: 0.02, phi: 1.36, fov: 42, duration: 0.20,
                  ease: 'sine.inOut' }, 0.40)
    .to(dentroA, { intensity: 2.5, duration: 0.18 }, 0.40)
    .to(dentroB, { intensity: 2.1, duration: 0.18 }, 0.40)
    .to(MAT.luzFita, { emissiveIntensity: 1.25, duration: 0.18 }, 0.40)

  /* ATO 4 — IMERSÃO (60–82%)
     A câmera deixa de enquadrar o móvel e passa a enquadrar o VÃO.
     `auto` desliga: o alvo agora é um recorte do interior, e como a
     distância sai do tamanho desse recorte, a câmera entra no espaço
     do móvel pela conta, não por um raio escolhido a dedo.

     O caminho desce pelo eixo central, entre as duas folhas abertas
     — que a esta altura já estão fora do caminho, apontando para
     fora. tools/teste-camera.js confere que a câmera não encosta em
     nenhum painel. */
    /* `auto` é interruptor, não número: interpolado, ele passaria por
       0,5 — que continua sendo verdadeiro — e o enquadramento só
       trocaria no fim do ato. `set` troca de uma vez, e o GSAP o
       desfaz sozinho quando a rolagem volta. Entra ANTES do tween do
       alvo para que o alvo já esteja sob controle da timeline quando
       ela capturar o valor inicial dele. */
    .set(enq, { auto: 0 }, 0.60)
    .to(enq, { larg: 1.30, alt: 1.45, prof: 0.46, cheio: 0.94, duration: 0.22,
               ease: 'power2.inOut' }, 0.60)
    .to(alvo, { y: 1.28, z: 0.02, duration: 0.22, ease: 'power2.inOut' }, 0.60)
    .to(orbita, { theta: -0.06, phi: 1.46, fov: 46, duration: 0.22,
                  ease: 'power2.inOut' }, 0.60)
    .to(rasante, { intensity: 0.95, duration: 0.22 }, 0.60)

  /* ATO 5 — DETALHE (82–93%)
     O encontro da divisória com a prateleira: fita de borda, veio
     deitado da prateleira, veio em pé da divisória e a fita de luz,
     tudo no mesmo quadro. */
    .to(enq,  { larg: 0.42, alt: 0.34, prof: 0.20, cheio: 0.92, duration: 0.11,
                ease: 'power1.inOut' }, 0.82)
    .to(alvo, { x: xDiv + 0.06, y: 1.37, z: 0.17, duration: 0.11,
                ease: 'power1.inOut' }, 0.82)
    .to(orbita, { theta: -0.34, phi: 1.44, fov: 38, duration: 0.11,
                  ease: 'power1.inOut' }, 0.82)
    .to(rasante, { intensity: 1.25, duration: 0.11 }, 0.82)

  /* ATO 6 — TRANSIÇÃO (93–100%)
     Recua ao eixo e à altura da fotografia, e a passagem abre do
     centro para as bordas — o mesmo gesto das portas que o visitante
     acabou de ver. Não é fade. */
    .to(enq,  { larg: 1.70, alt: 1.15, prof: 0.40, cheio: 0.96, duration: 0.07,
                ease: 'power2.inOut' }, 0.93)
    .to(alvo, { x: 0, y: 1.20, z: 0.0, duration: 0.07, ease: 'power2.inOut' }, 0.93)
    .to(orbita, { theta: 0, phi: 1.42, fov: 48, duration: 0.07,
                  ease: 'power2.inOut' }, 0.93)
    .to(estado, { foco: 1, duration: 0.07, ease: 'power2.in' }, 0.93);

  /* ---------- Ponteiro: camada secundária, no rig ---------- */
  var alvoPonteiro = { x: 0, y: 0 };
  var ponteiro = { x: 0, y: 0 };
  var temPonteiro = false;
  try {
    temPonteiro = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  } catch (e) { temPonteiro = false; }

  function aoMover(ev) {
    alvoPonteiro.x = (ev.clientX / window.innerWidth - 0.5) * 2;
    alvoPonteiro.y = (ev.clientY / window.innerHeight - 0.5) * 2;
    pedirQuadro();
  }
  if (temPonteiro) { window.addEventListener('pointermove', aoMover, { passive: true }); }

  /* ---------- Desenho sob demanda ----------

     A visibilidade decide se vale desenhar. O IntersectionObserver é a
     fonte barata, mas sozinho ele NÃO basta aqui: o pin do ScrollTrigger
     passa a seção para `position: fixed` no meio do caminho, e o
     observador criado antes disso para de reportar — foi exatamente o
     que deixou o canvas em branco na primeira montagem desta versão.

     Então o observador vale como atalho para o "sim" e a medida do
     retângulo tem a palavra final. Um getBoundingClientRect por quadro
     custa microssegundos e é o que garante que a cena realmente pare
     quando sai da tela. */
  var precisa = true;
  var ioVisivel = null;        // null = o observador ainda não falou
  var vivo = true;
  var rafId = 0;

  function noQuadro() {
    var r = palco.getBoundingClientRect();
    var h = window.innerHeight || document.documentElement.clientHeight || 0;
    return r.width > 0 && r.height > 0 && r.bottom > -120 && r.top < h + 120;
  }

  function visivel() { return ioVisivel === true || noQuadro(); }

  function dimensionar() {
    var r = palco.getBoundingClientRect();
    var l = Math.max(1, Math.round(r.width));
    var a = Math.max(1, Math.round(r.height));
    renderer.setSize(l, a, false);
    camera.aspect = l / a;
    camera.updateProjectionMatrix();
    precisa = true;
  }

  function quadro() {
    rafId = 0;
    if (!vivo) { return; }

    if (temPonteiro) {
      var dx = alvoPonteiro.x - ponteiro.x;
      var dy = alvoPonteiro.y - ponteiro.y;
      if (Math.abs(dx) > 0.0004 || Math.abs(dy) > 0.0004) {
        ponteiro.x += dx * 0.06;
        ponteiro.y += dy * 0.06;
        precisa = true;
      }
      // amplitude curta, e some conforme a câmera entra no detalhe
      var escala = 0.075 * (1 - estado.foco * 0.9);
      rig.position.x = ponteiro.x * escala;
      rig.position.y = -ponteiro.y * escala * 0.55;
    }

    var naTela = visivel();
    if (precisa && naTela) {
      posicionarCamera();
      renderer.render(cena, camera);
      precisa = false;
    }
    if (naTela && (precisa || temPonteiro)) { pedirQuadro(); }
  }

  function pedirQuadro() {
    if (!rafId && vivo && visivel()) { rafId = window.requestAnimationFrame(quadro); }
  }

  var observador = new IntersectionObserver(function (entradas) {
    ioVisivel = entradas[entradas.length - 1].isIntersecting;
    if (ioVisivel) { precisa = true; pedirQuadro(); }
  }, { rootMargin: '120px 0px' });
  observador.observe(palco);

  function aoTrocarAba() {
    if (document.hidden) { vivo = false; }
    else { vivo = true; precisa = true; pedirQuadro(); }
  }
  document.addEventListener('visibilitychange', aoTrocarAba);

  var aoRedimensionar = function () { dimensionar(); pedirQuadro(); };
  window.addEventListener('resize', aoRedimensionar);

  canvas.addEventListener('webglcontextlost', function (ev) {
    ev.preventDefault();
    vivo = false;
    if (opcoes.aoPerderContexto) { opcoes.aoPerderContexto(); }
  });

  dimensionar();
  posicionarCamera();
  window.__sonda = { pivoEsq: pivoEsq, pivoDir: pivoDir, corpo: corpo, movel: movel,
                     camera: camera, cena: cena, orbita: orbita, alvo: alvo,
                     THREE: THREE, L: L, A: A, P: P, E: E, Ac: Ac, y0: y0,
                     larguraPorta: larguraPorta };

  return {
    /* O site escreve o progresso aqui. É a única entrada da cena. */
    progresso: function (p) {
      tl.progress(Math.min(1, Math.max(0, p)));
      precisa = true;
      pedirQuadro();
    },
    /* Quanto do Ato 5 já aconteceu: o site usa para a passagem. */
    foco: function () { return estado.foco; },
    redimensionar: dimensionar,
    descartar: function () {
      vivo = false;
      if (rafId) { window.cancelAnimationFrame(rafId); }
      observador.disconnect();
      window.removeEventListener('resize', aoRedimensionar);
      document.removeEventListener('visibilitychange', aoTrocarAba);
      if (temPonteiro) { window.removeEventListener('pointermove', aoMover); }
      tl.kill();
      if (cena.environment) { cena.environment.dispose(); }
      lixo.forEach(function (o) { if (o && o.dispose) { o.dispose(); } });
      renderer.dispose();
    }
  };
}
