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
import { geoPainel, limparPecas, montarPuxador } from './pecas.js';

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
  /* ============================================================
     O AMBIENTE

     A V8 usava um degradê vertical de 128x64. Isso dá ao material um
     céu e um chão, mas nada para refletir: um chanfro só acende se
     houver uma FONTE com forma. Numa foto de produto essa forma é a
     janela, ou o softbox.

     Aqui o equirretangular ganha uma janela alta e larga à
     esquerda-frente, um rebatedor fraco à direita e um teto claro.
     É isso que produz a linha de luz contínua ao longo do canto
     chanfrado — o detalhe que a referência mostra e que nenhum ajuste
     de roughness inventa.

     128x64 continua sendo barato: o PMREM convolui uma vez, no
     carregamento, e o resultado vira o envMap da cena inteira.
     ============================================================ */
  function ambiente() {
    var L = 256, A = 128;
    var c = document.createElement('canvas');
    c.width = L; c.height = A;
    var ctx = c.getContext('2d');

    // céu/teto -> parede -> piso
    var g = ctx.createLinearGradient(0, 0, 0, A);
    g.addColorStop(0.00, '#E8E3DA');
    g.addColorStop(0.34, '#BCB4A8');
    g.addColorStop(0.52, '#8A8278');
    g.addColorStop(0.70, '#4A443C');
    g.addColorStop(1.00, '#1A1714');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L, A);

    /* A janela. Retângulo claro, com borda suave: é a fonte que o
       chanfro vai espelhar. Fica à frente-esquerda, de onde a luz
       chave também vem — reflexo e sombra têm de concordar. */
    function painelLuz(x, y, w, h, brilho) {
      var r = ctx.createRadialGradient(x + w / 2, y + h / 2, 1,
                                       x + w / 2, y + h / 2, Math.max(w, h) * 0.62);
      r.addColorStop(0, 'rgba(255,252,246,' + brilho + ')');
      r.addColorStop(0.55, 'rgba(255,250,242,' + (brilho * 0.55) + ')');
      r.addColorStop(1, 'rgba(255,250,242,0)');
      ctx.fillStyle = r;
      ctx.fillRect(x - w * 0.4, y - h * 0.4, w * 1.8, h * 1.8);
    }
    painelLuz(L * 0.08, A * 0.16, L * 0.26, A * 0.40, 1.0);   // janela
    painelLuz(L * 0.62, A * 0.22, L * 0.20, A * 0.26, 0.34);  // rebatedor

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
    tamanho: leve ? 512 : 1024,
    /* O teto real da GPU, não um palpite. */
    anisotropia: renderer.capabilities.getMaxAnisotropy(),
    /* Quatro folhas independentes num atlas 2x2. Ver grao.js: o que
       diferencia uma peça da outra passou a ser a FOLHA, não um
       deslocamento dentro da mesma folha — era o deslocamento que
       punha a emenda no meio do painel. */
    folhas: 2,
    semente: 20261018,
    /* Nogueira medida na referência (tools/ref/26.jpg).

       Os dois tons não foram escolhidos: foram LIDOS. Recorte de
       600×600 px na face frontal, pixels ordenados por luminosidade,
       média dos percentis 2–8 e 92–98:

         escuro  #684633   H=21°  S=51%  luma 76
         médio   #85624F   H=22°  S=40%  luma 105
         claro   #9F7B65   H=22°  S=36%  luma 129

       A tentativa anterior usava #A6765C e #553C2F — mais saturados e
       mais afastados um do outro. O lado a lado com a fotografia
       mostrou o custo: a textura saía alaranjada, cor de pinho
       envernizado, enquanto a nogueira da referência é um marrom
       acinzentado. A faixa larga demais também endurecia as linhas,
       que saíam pretas em vez de escuras.

       CONVENÇÃO, e vale dizer: estes valores são o que a CÂMERA
       registrou, não o albedo puro da madeira — a fotografia já traz
       a luz do estúdio dentro dela. Usá-los como albedo e depois
       iluminar a cena devolve um render mais escuro que a foto. É uma
       aproximação assumida, não uma medição de albedo. */
    claro: [159, 123, 101],
    escuro: [104, 70, 51],
    rugosidade: 0.46,
    rugosidadePoro: 0.72,
    /* Relevo fraco, e de propósito.

       Com 1,0 o móvel inteiro lia como painel RIPADO: a vista de
       longe mostrava sulcos verticais com luz e sombra próprias, como
       se o poro tivesse milímetros. Ele tem centésimos. A linha do
       veio existe sobretudo como COR; o relevo entra só para o brilho
       não escorregar liso por cima dela.

       Teste de sanidade: a 3 m de distância o poro de uma lâmina
       envernizada não se vê. Se o render mostra, está errado. */
    relevo: 0.34
  });
  lixo.push(MAPAS.map, MAPAS.roughnessMap, MAPAS.normalMap);

  function madeira(o) {
    var m = materialMadeira(MAPAS, o);
    lixo.push(m, m.map, m.roughnessMap, m.normalMap);
    return m;
  }

  /* Uma lâmina diferente para cada peça.

     A V6 usava `repete: [1, 2.4]`: a textura LADRILHAVA dentro da
     porta e a emenda aparecia como duas linhas horizontais
     atravessando o painel. A correção de então foi `repete: [1,1]`
     com um `desloca` diferente por peça — e isso trocou duas emendas
     por uma, porque com `RepeatWrapping` o deslocamento leva a
     emenda para DENTRO do painel. A fotografia de diagnóstico mostra
     a faixa atravessando as duas portas na mesma altura.

     Agora cada peça aponta para uma FOLHA do atlas (grao.js): a
     janela cai inteira dentro de um desenho fechado, e não existe
     emenda nenhuma para aparecer. Peças vizinhas continuam
     diferentes — como folhas distintas da mesma tora —, só que agora
     são desenhos de fato distintos.

     `metalness` é ZERO em toda madeira. Ela é dielétrica; qualquer
     valor acima de zero produz aquele reflexo acinzentado de plástico
     metalizado que é meio caminho do aspecto de massinha. */
  function lamina(folha, tom, extra) {
    var o = { folha: folha, tingir: tom, normal: 0.16, reflexo: 0.85 };
    if (extra) {
      Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
    }
    return madeira(o);
  }

  /* As tintas são quase neutras de propósito.

     Na V8 elas iam de 0xC4B7A4 a 0xE6DCCC — um multiplicador forte,
     que empurrava o albedo para longe do medido e devolvia a cor que
     a textura já deveria ter. Agora a cor certa está no albedo, e a
     tinta serve só para diferenciar uma folha da outra em ±4%, como
     lâminas da mesma tora diferem. */
  var MAT = {
    ladoEsq:   lamina(0, 0xF2ECE4),
    ladoDir:   lamina(1, 0xFAF4EC),
    portaEsq:  lamina(2, 0xFFFAF2, { reflexo: 1.0 }),
    portaDir:  lamina(3, 0xFBF5ED, { reflexo: 1.0 }),
    fixoEsq:   lamina(1, 0xFCF6EE, { reflexo: 1.0 }),
    fixoDir:   lamina(0, 0xF6F0E8, { reflexo: 1.0 }),
    moldura:   lamina(3, 0xF4EEE6, { reflexo: 0.92 }),
    divisoria: lamina(1, 0xEFE9E1),
    /* Peças deitadas: o giro de 90° põe o veio no sentido do
       comprimento, como a lâmina é aplicada de verdade. */
    deitadaA:  lamina(0, 0xF5EFE7, { giro: Math.PI / 2, reflexo: 0.72 }),
    deitadaB:  lamina(2, 0xEFE9E1, { giro: Math.PI / 2, reflexo: 0.72 }),
    deitadaC:  lamina(3, 0xF8F2EA, { giro: Math.PI / 2, reflexo: 0.72 }),
    gavetaA:   lamina(1, 0xF7F1E9, { reflexo: 0.95 }),
    gavetaB:   lamina(2, 0xF3EDE5, { reflexo: 0.95 }),
    gavetaC:   lamina(3, 0xFBF5ED, { reflexo: 0.95 }),
    /* Fundo: um pouco mais claro e bem mais fosco, para o interior
       não virar um buraco preto quando a porta abre. */
    fundo:     lamina(0, 0xFFFBF4, { normal: 0.22, reflexo: 0.30 }),

    /* Latão escovado, como na referência 27. `metalness` alto aqui é
       correto — isto É metal, ao contrário da madeira. */
    metal: new THREE.MeshStandardMaterial({
      color: 0xB08D5B, roughness: 0.33, metalness: 0.92, envMapIntensity: 1.25
    }),
    /* O piso. Não é cenário: é o que tira a peça do vazio preto. */
    piso: new THREE.MeshStandardMaterial({
      color: 0x17140F, roughness: 0.48, metalness: 0.0, envMapIntensity: 0.6
    }),
    /* A fita de LED: emissiva, baixa, sem bloom. É luz de marcenaria,
       não de ficção científica. */
    luzFita: new THREE.MeshStandardMaterial({
      color: 0xE8BE8A, emissive: 0xE8BE8A, emissiveIntensity: 0.0,
      roughness: 1, metalness: 0
    })
  };
  lixo.push(MAT.metal, MAT.piso, MAT.luzFita);

  /* ---------- Painéis com canto chanfrado ----------
     Cada medida vira uma geometria própria, reaproveitada por todas
     as peças iguais. Ver pecas.js para o porquê do chanfro. */
  function painel(l, a, p, material, x, y, z) {
    var m = new THREE.Mesh(geoPainel(l, a, p), material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  /* ============================================================
     O módulo

     2,46 × 2,42 × 0,62 m, painéis de 18 mm, quatro folhas.

     A V8 tinha 1,80 × 2,10 com DUAS folhas de 0,89 m. O render de
     argila — a mesma cena com um cinza fosco no lugar de todos os
     materiais — mostrou por que isso nunca ia convencer: uma caixa
     quase sem aresta interna, com duas folhas quase quadradas e um
     rodapé. Marcenaria planejada não tem essa proporção. Na referência
     (tools/ref/27.jpg) são quatro folhas estreitas e altas, perto de
     1:4, dentro de uma moldura que avança alguns milímetros sobre
     elas. É a moldura, e a sombra que ela projeta na folha, que diz
     ao olho que aquilo é um móvel montado e não um volume pintado.

     As duas folhas CENTRAIS abrem; as duas laterais são fixas. É o
     arranjo da referência, e é o que a aproximação de câmera pede:
     o vão que se abre fica no meio do quadro.
     ============================================================ */
  var L = 2.46, A = 2.42, P = 0.62, E = 0.018;
  var RODAPE = 0.08;                   // recuo da base, como em obra
  var FOLGA = 0.003;                   // a fresta entre peças

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
  corpo.add(painel(L - 0.09, RODAPE, P - 0.08, MAT.deitadaB, 0, RODAPE / 2, -0.025));

  var y0 = RODAPE;                     // base da caixa
  var Ac = A - RODAPE;                 // altura útil da caixa

  // laterais, base, topo
  corpo.add(painel(E, Ac, P, MAT.ladoEsq, -L / 2 + E / 2, y0 + Ac / 2, 0));
  corpo.add(painel(E, Ac, P, MAT.ladoDir,  L / 2 - E / 2, y0 + Ac / 2, 0));
  corpo.add(painel(L, E, P, MAT.deitadaA, 0, y0 + E / 2, 0));
  corpo.add(painel(L, E, P, MAT.deitadaC, 0, y0 + Ac - E / 2, 0));
  // fundo
  corpo.add(painel(L - 2 * E, Ac - 2 * E, E, MAT.fundo, 0, y0 + Ac / 2, -P / 2 + E / 2));

  /* ---------- As quatro folhas: medidas ----------
     Tudo o que vem depois — moldura, divisórias, gaveteiro, puxadores
     — é posicionado a partir daqui, para que nada precise ser
     reconciliado à mão quando uma medida mudar. */
  var larguraPorta = (L - 2 * E - 3 * FOLGA) / 4;
  var alturaPorta = Ac - 2 * E - 2 * FOLGA;
  var yPorta = y0 + Ac / 2;
  var zPorta = P / 2 + E / 2 + 0.0015;
  function xFolha(i) {
    return -L / 2 + E + i * (larguraPorta + FOLGA) + larguraPorta / 2;
  }
  // bordas internas do vão central, entre as folhas 1 e 2
  var vaoEsq = xFolha(1) - larguraPorta / 2;
  var vaoDir = xFolha(2) + larguraPorta / 2;

  /* ---------- A moldura ----------

     Uma faixa de 70 mm em todo o perímetro da frente, avançando 12 mm
     sobre as folhas. Não é enfeite: é a peça que a V8 não tinha e cuja
     ausência deixava o móvel sem nenhuma aresta própria na frente. A
     sombra que ela lança na folha é a primeira coisa que o olho usa
     para medir profundidade num armário fechado. */
  var MOLD = 0.070, SALTO = 0.012;
  var zMold = zPorta + E / 2 + SALTO / 2;
  corpo.add(painel(MOLD, Ac, SALTO, MAT.moldura, -L / 2 + MOLD / 2, y0 + Ac / 2, zMold));
  corpo.add(painel(MOLD, Ac, SALTO, MAT.moldura,  L / 2 - MOLD / 2, y0 + Ac / 2, zMold));
  corpo.add(painel(L - 2 * MOLD, MOLD, SALTO, MAT.moldura, 0, y0 + MOLD / 2, zMold));
  corpo.add(painel(L - 2 * MOLD, MOLD, SALTO, MAT.moldura, 0, y0 + Ac - MOLD / 2, zMold));

  /* ---------- Interior ---------- */
  var interior = new THREE.Group();
  corpo.add(interior);

  /* Divisórias de corpo, nas bordas do vão central. Elas fecham o vão
     que as portas revelam: sem isso a abertura mostra uma caixa larga
     e vazia, e a câmera entra num lugar que não tem paredes. */
  [vaoEsq, vaoDir].forEach(function (x) {
    interior.add(painel(E, Ac - 2 * E, P - E, MAT.divisoria, x, y0 + Ac / 2, E / 2));
  });

  var bEsq = vaoEsq + E / 2, bDir = vaoDir - E / 2;   // vão útil, entre divisórias
  var xDiv = 0.04;                                    // divisória interna do vão
  var Y_GAV = 0.98;                                   // topo do gaveteiro

  interior.add(painel(E, y0 + Ac - E - Y_GAV, P - E, MAT.divisoria,
                      xDiv, (Y_GAV + y0 + Ac - E) / 2, E / 2));

  /* Lado do cabideiro (esquerda do vão): prateleira alta, barra logo
     abaixo, e uma prateleira na metade. */
  var largCab = xDiv - E / 2 - bEsq;
  var cCab = (bEsq + xDiv - E / 2) / 2;
  interior.add(painel(largCab, E, P - 0.06, MAT.deitadaA, cCab, y0 + Ac - 0.30, 0.025));
  interior.add(painel(largCab, E, P - 0.06, MAT.deitadaB, cCab, 1.46, 0.025));

  var GEO_BARRA = new THREE.CylinderGeometry(0.014, 0.014, largCab, 14);
  lixo.push(GEO_BARRA);
  var barra = new THREE.Mesh(GEO_BARRA, MAT.metal);
  barra.rotation.z = Math.PI / 2;
  barra.position.set(cCab, y0 + Ac - 0.38, 0.025);
  barra.castShadow = true;
  interior.add(barra);

  /* Lado das prateleiras (direita do vão): quatro, passo regular. */
  var largPrat = bDir - (xDiv + E / 2);
  var cPrat = (xDiv + E / 2 + bDir) / 2;
  var ALTURAS = [y0 + Ac - 0.30, 1.86, 1.52, 1.18];
  ALTURAS.forEach(function (y, i) {
    interior.add(painel(largPrat, E, P - 0.06,
                        [MAT.deitadaA, MAT.deitadaB, MAT.deitadaC][i % 3], cPrat, y, 0.025));
  });

  /* ---------- Gaveteiro, duas colunas ----------

     Quatro fiadas em cada coluna, com fresta de 3 mm e puxador
     FRESADO: a frente é 16 mm mais baixa que o vão e encostada
     embaixo, de modo que sobra uma sombra contínua no alto de cada
     gaveta. É como a referência resolve, e tem a vantagem de não
     precisar de nenhuma peça a mais. Um puxador aplicado ali
     atravancaria o caminho da câmera. */
  interior.add(painel(E, Y_GAV - y0 - E, P - E, MAT.divisoria, 0,
                      (y0 + E + Y_GAV) / 2, E / 2));

  var gavetas = [];
  var hGav = (Y_GAV - y0 - E - 0.06) / 4;
  [[bEsq, -E / 2], [E / 2, bDir]].forEach(function (col, ci) {
    var larg = col[1] - col[0] - 2 * FOLGA;
    var cx = (col[0] + col[1]) / 2;
    for (var i = 0; i < 4; i++) {
      var yg = y0 + E + 0.02 + i * hGav + hGav / 2;
      var g = new THREE.Group();
      g.position.set(cx, yg, P / 2 - 0.03);
      g.add(painel(larg, hGav - 0.016, E,
                   [MAT.gavetaA, MAT.gavetaB, MAT.gavetaC][(i + ci) % 3],
                   0, -0.008, 0));
      interior.add(g);
      gavetas.push(g);
    }
  });

  /* ---------- Fitas de luz ----------
     Sob o topo de cada lado do vão. Acendem só quando as portas
     abrem — ver a linha do tempo. */
  var fitas = [];
  [[largCab - 0.05, cCab], [largPrat - 0.05, cPrat]].forEach(function (f) {
    var fita = painel(f[0], 0.008, 0.02, MAT.luzFita, f[1],
                      y0 + Ac - 0.30 - E, P / 2 - 0.12);
    fita.castShadow = false;
    interior.add(fita); fitas.push(fita);
  });

  /* ============================================================
     As folhas

     O Group fica na BORDA do vão. A malha é deslocada meia largura
     para dentro. Girar o Group em Y descreve o arco de uma dobradiça
     de verdade — a folha varre o espaço, não encolhe.

     A FRESTA. Na V6 as folhas encostavam no corpo e uma na outra: o
     móvel lia como uma caixa pintada com linhas desenhadas em cima.
     Marcenaria de verdade tem folga, e é a sombra dentro dela que diz
     ao olho que são peças separadas, e não um desenho.
     ============================================================ */

  /* A folha não é uma chapa lisa.

     Na referência cada folha tem um painel REBAIXADO: um quadro de
     ~85 mm em volta, saliente, e o campo no meio. Quatro tiras finas
     resolvem — e o que elas trazem não é o desenho, é a sombra que
     cai do quadro sobre o campo quando a luz vem de lado. Uma chapa
     lisa não tem como produzir isso, por melhor que seja a textura. */
  var QUADRO = 0.085, FUNDO_Q = 0.007;
  function montarFolha(material, larg, alt) {
    var g = new THREE.Group();

    /* O quadro — quatro peças de verdade, não uma tira colada sobre
       uma chapa inteira. A primeira tentativa foi a chapa inteira com
       o quadro SALIENTE por cima, e de longe não aparecia nada: 9 mm
       de saliência dão menos de dois pixels, e com a luz quase de
       frente não há sombra para marcá-los.

       Agora o campo central é REBAIXADO. A diferença é que um rebaixo
       devolve uma linha ESCURA no encontro das peças, e linha escura
       se lê em qualquer escala — é o mesmo motivo de a fresta entre
       as folhas funcionar. */
    g.add(painel(QUADRO, alt, E, material, -larg / 2 + QUADRO / 2, 0, 0));
    g.add(painel(QUADRO, alt, E, material,  larg / 2 - QUADRO / 2, 0, 0));
    var meio = larg - 2 * QUADRO;
    g.add(painel(meio, QUADRO, E, material, 0, -alt / 2 + QUADRO / 2, 0));
    g.add(painel(meio, QUADRO, E, material, 0,  alt / 2 - QUADRO / 2, 0));

    /* O campo, atrás do plano do quadro. Entra 4 mm por baixo das
       peças do quadro para não abrir um vazio no canto. */
    g.add(painel(meio + 0.008, alt - 2 * QUADRO + 0.008, E, material,
                 0, 0, -FUNDO_Q));
    return g;
  }

  /* As duas folhas fixas, nas pontas. Não giram: estão aqui porque
     sem elas o móvel tem 1,2 m e não 2,46 m, e porque é contra elas
     que as folhas que abrem se destacam. */
  [[0, MAT.fixoEsq], [3, MAT.fixoDir]].forEach(function (f) {
    var folha = montarFolha(f[1], larguraPorta, alturaPorta);
    folha.position.set(xFolha(f[0]), yPorta, zPorta);
    corpo.add(folha);
  });

  /* As duas folhas centrais.

     `sinal` -1 é a da esquerda: dobradiça na aresta ESQUERDA dela, que
     é a que encosta na folha fixa. Ela abre varrendo para fora e para
     a esquerda, como na referência. */
  function montarPorta(sinal) {
    var i = sinal < 0 ? 1 : 2;
    var pivo = new THREE.Group();
    pivo.position.set(xFolha(i) + sinal * larguraPorta / 2, 0, zPorta);
    corpo.add(pivo);

    var folha = montarFolha(sinal < 0 ? MAT.portaEsq : MAT.portaDir,
                            larguraPorta, alturaPorta);
    folha.position.set(-sinal * larguraPorta / 2, yPorta, 0);
    pivo.add(folha);

    /* Puxador de barra, longo e afastado da folha, como na referência.
       O afastamento não é enfeite: é a sombra entre a barra e a porta
       que dá volume ao metal. Barra encostada na superfície lê como
       risco desenhado.

       Fica junto da aresta LIVRE, que é a do meio do móvel — os dois
       puxadores ficam lado a lado no centro, que é onde a referência
       os põe e onde a mão de fato pega. */
    var pux = montarPuxador(THREE, MAT.metal, 0.95, 0.032);
    pux.position.set(-sinal * (larguraPorta - 0.055),
                     yPorta - 0.10, E / 2 + 0.032);
    pivo.add(pux);

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

  /* As duas luzes de dentro ficam nos dois lados do vão central —
     o único que as portas revelam. Posicionadas a partir das MEDIDAS
     do interior, não por números soltos: assim continuam no lugar
     quando o módulo muda de tamanho. */
  var dentroA = new THREE.PointLight(0xFFCC8E, 0.0, 4.2, 2.0);
  dentroA.position.set(cCab, y0 + Ac - 0.55, 0.04);
  var dentroB = new THREE.PointLight(0xFFCC8E, 0.0, 4.2, 2.0);
  dentroB.position.set(cPrat, 1.30, 0.04);
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
  window.__render = function () { renderer.render(cena, camera); };
  window.__rend = renderer;
  window.__sonda = { pivoEsq: pivoEsq, pivoDir: pivoDir, corpo: corpo, movel: movel,
                     renderer: renderer,
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

    /* Onde o móvel está NA TELA, em pixels de CSS.

       O site precisa disso para decidir se o texto ainda cabe ao lado
       da cena. Um retângulo do DOM não serve: o móvel não é um
       elemento, é um desenho dentro de um canvas. Então os oito
       cantos do Box3 são projetados pela mesma câmera que desenha o
       quadro, e o retângulo que os envolve é a área que ele realmente
       ocupa.

       Os cantos atrás da câmera são descartados: a projeção deles
       explode e inventaria uma área que não existe. Se sobrarem menos
       de dois, a câmera está dentro da peça — e aí o móvel ocupa tudo,
       que é o que a função devolve. */
    retanguloNaTela: function () {
      var r = palco.getBoundingClientRect();
      if (!r.width || !r.height) { return null; }
      camera.updateMatrixWorld();
      var cantos = cantosDaCaixa(CAIXA.min, CAIXA.max);
      var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, bons = 0;
      for (var i = 0; i < cantos.length; i++) {
        _rel.copy(cantos[i]).applyMatrix4(camera.matrixWorldInverse);
        if (_rel.z > -camera.near) { continue; }    // atrás da câmera
        bons++;
        _rel.copy(cantos[i]).project(camera);
        if (_rel.x < x0) { x0 = _rel.x; }
        if (_rel.x > x1) { x1 = _rel.x; }
        if (_rel.y < y0) { y0 = _rel.y; }
        if (_rel.y > y1) { y1 = _rel.y; }
      }
      if (bons < 2) {
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom,
                 width: r.width, height: r.height };
      }
      var esq = r.left + (x0 * 0.5 + 0.5) * r.width;
      var dir = r.left + (x1 * 0.5 + 0.5) * r.width;
      // NDC cresce para cima; a tela cresce para baixo
      var topo = r.top + (0.5 - y1 * 0.5) * r.height;
      var base = r.top + (0.5 - y0 * 0.5) * r.height;
      return { left: esq, top: topo, right: dir, bottom: base,
               width: dir - esq, height: base - topo };
    },
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
      limparPecas();
      renderer.dispose();
    }
  };
}
