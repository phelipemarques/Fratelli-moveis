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
  var camera = new THREE.PerspectiveCamera(38, 1, 0.08, 100);
  rig.add(camera);
  cena.add(rig);

  var alvo = new THREE.Vector3(-1.72, 1.08, 0);
  var orbita = { raio: 8.6, theta: -0.16, phi: 1.30, fov: 40 };

  function posicionarCamera() {
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
  var GEO_CHAO = new THREE.PlaneGeometry(22, 22);
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

  /* ATO 1 — APRESENTAÇÃO
     Dolly de aproximação, órbita curta, e a luz chave subindo: a peça
     sai da penumbra em vez de já estar acesa. */
  tl.fromTo(orbita, { raio: 8.6, theta: -0.14, phi: 1.30, fov: 40 },
                    { raio: 6.6, theta: 0.08, phi: 1.31, fov: 39, duration: 1,
                      ease: 'power1.out' }, 0)
    .fromTo(alvo, { x: -1.98, y: 1.02 }, { x: -1.62, y: 1.06, duration: 1 }, 0)
    .fromTo(chave,   { intensity: 1.30 }, { intensity: 2.05, duration: 1 }, 0)
    .fromTo(hemi,    { intensity: 0.22 }, { intensity: 0.30, duration: 1 }, 0)
    .fromTo(rasante, { intensity: 0.10 }, { intensity: 0.55, duration: 1 }, 0)

  /* ATO 2 — ABERTURA
     A câmera roda para o lado e desce um pouco; as portas começam a
     girar na dobradiça. A órbita e a abertura andam juntas, então o
     visitante vê a folha varrer o espaço em perspectiva. */
    .to(orbita, { raio: 5.0, theta: 0.46, phi: 1.34, duration: 1,
                  ease: 'sine.inOut' }, 1)
    .to(alvo,   { x: -1.18, y: 1.10, duration: 1 }, 1)
    .fromTo(pivoEsq.rotation, { y: 0 }, { y: 0.58, duration: 1, ease: 'power1.in' }, 1)
    .fromTo(pivoDir.rotation, { y: 0 }, { y: -0.50, duration: 1, ease: 'power1.in' }, 1)

  /* ATO 3 — DESCOBERTA
     As portas terminam de abrir e a luz de dentro acende NO MESMO
     intervalo: a luz participa da abertura, não entra depois dela. */
    .to(pivoEsq.rotation, { y: 1.82, duration: 1, ease: 'power2.out' }, 2)
    .to(pivoDir.rotation, { y: -1.74, duration: 1, ease: 'power2.out' }, 2)
    .to(orbita, { raio: 3.4, theta: 0.16, phi: 1.37, fov: 42, duration: 1,
                  ease: 'sine.inOut' }, 2)
    .to(alvo,   { x: -1.02, y: 1.14, duration: 1 }, 2)
    .to(dentroA, { intensity: 2.4, duration: 1 }, 2)
    .to(dentroB, { intensity: 2.0, duration: 1 }, 2)
    .to(MAT.luzFita, { emissiveIntensity: 1.20, duration: 1 }, 2)

  /* ATO 4 — DETALHE
     Entra no encontro da divisória com a prateleira: o canto onde a
     fita de borda, o veio deitado da prateleira, o veio em pé da
     divisória e a fita de luz se cruzam. É um detalhe de marcenaria,
     não um pedaço de painel liso — o alvo é aquele ponto, não "perto
     do móvel". A lente fecha (fov 34) para comprimir o plano. */
    .to(orbita, { raio: 1.34, theta: -0.52, phi: 1.40, fov: 36, duration: 1,
                  ease: 'power1.inOut' }, 3)
    .to(alvo,   { x: xDiv - 0.05, y: 1.345, z: 0.17, duration: 1 }, 3)
    .to(rasante, { intensity: 1.25, duration: 1 }, 3)

  /* ATO 5 — TRANSFORMAÇÃO
     A câmera recua e reenquadra na composição da fotografia: eixo
     quase frontal, altura de olho, lente mais aberta. `estado.foco`
     sobe de 0 a 1 e é o que o site lê para abrir a passagem. Não é um
     fade — a composição chega onde a foto começa. */
    .to(orbita, { raio: 2.55, theta: -0.03, phi: 1.41, fov: 46, duration: 1,
                  ease: 'power2.inOut' }, 4)
    .to(alvo,   { x: -0.34, y: 1.14, z: 0.0, duration: 1, ease: 'power2.inOut' }, 4)
    .to(estado, { foco: 1, duration: 1, ease: 'power2.in' }, 4);

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
