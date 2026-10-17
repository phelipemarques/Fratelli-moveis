/* ============================================================
   Fratelli Móveis — "A abertura"
   Cena tridimensional do módulo de marcenaria.

   O QUE ESTA CENA É E NÃO É
   Uma visualização CONCEITUAL de marcenaria. Não representa um móvel
   instalado pela Fratelli, e em lugar nenhum do site ela é apresentada
   como obra executada — a seção carrega a etiqueta "Visualização
   conceitual" em HTML, fora do canvas.

   COMO A PORTA GIRA
   Cada porta vive dentro de um Group cujo centro está na BORDA externa
   do vão, não no centro da porta. A malha da porta é deslocada meia
   largura para dentro desse grupo. Girar o grupo em Y faz a porta
   descrever um arco em torno da borda — que é o que uma dobradiça faz.
   Girar a malha diretamente a faria rodar em torno do próprio centro,
   atravessando a lateral do móvel.

   COMO A CÂMERA É ANIMADA
   Em dois níveis separados, de propósito:
     · a timeline move `camera.position` e o alvo `mira`;
     · o ponteiro move o `rig`, que é o PAI da câmera.
   Assim as duas fontes de movimento nunca disputam a mesma propriedade.

   COMO A TIMELINE RESPONDE À ROLAGEM
   Uma única gsap.timeline({paused:true}). O ScrollTrigger não dispara
   animações: ele só escreve o progresso dela. Por isso a sequência é
   reversível quadro a quadro — rolar para cima desfaz a abertura.

   RENDERIZAÇÃO SOB DEMANDA
   Não há loop permanente. A cena só desenha quando algo mudou: o
   progresso da rolagem, o ponteiro, ou um redimensionamento. Fora da
   tela, nada é desenhado.
   ============================================================ */

import * as THREE from './three.module.min.js';

export function criarAbertura(opcoes) {
  var canvas = opcoes.canvas;
  var palco  = opcoes.palco;
  var gsap   = opcoes.gsap;

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

  /* Teto de 2 no pixel ratio: acima disso o custo quadruplica e a tela
     não mostra a diferença numa cena desta escala. */
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.10;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var cena = new THREE.Scene();

  /* ---------- Câmera dentro de um rig ----------
     O rig existe só para o ponteiro. A timeline nunca toca nele. */
  var rig = new THREE.Group();
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 1.05, 4.6);
  rig.add(camera);
  cena.add(rig);
  var mira = new THREE.Vector3(0.55, 1.05, 0);

  /* ---------- Materiais, compartilhados ----------
     Um material por acabamento, reaproveitado por todas as peças: menos
     trocas de estado e menos memória. */
  var MAT = {
    carcaca: new THREE.MeshStandardMaterial({
      color: 0x4F4036, roughness: 0.88, metalness: 0.0
    }),
    porta: new THREE.MeshStandardMaterial({
      color: 0x5E4C3C, roughness: 0.80, metalness: 0.0
    }),
    interior: new THREE.MeshStandardMaterial({
      color: 0xA89C8C, roughness: 0.92, metalness: 0.0
    }),
    puxador: new THREE.MeshStandardMaterial({
      color: 0x7D6B55, roughness: 0.38, metalness: 0.45
    }),
    /* A fita de LED: emissiva, baixa, sem bloom. É luz de marcenaria,
       não de ficção científica. */
    luzFita: new THREE.MeshStandardMaterial({
      color: 0xD9A268, emissive: 0xD9A268, emissiveIntensity: 0.0,
      roughness: 1, metalness: 0
    })
  };

  /* ---------- Geometria base, compartilhada ---------- */
  var CUBO = new THREE.BoxGeometry(1, 1, 1);

  function painel(l, a, p, material, x, y, z) {
    var m = new THREE.Mesh(CUBO, material);
    m.scale.set(l, a, p);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  /* ============================================================
     O módulo de marcenaria
     Medidas em metros, proporções de um closet real:
     2,10m de altura, 1,80m de largura, 0,58m de profundidade.
     Painéis de 18mm — a espessura é modelada, não sugerida, para que
     as bordas peguem luz.
     ============================================================ */
  var L = 1.80, A = 2.10, P = 0.58, E = 0.018;

  var movel = new THREE.Group();
  /* Deslocado para a direita: a coluna de texto mora na esquerda, onde o
     véu é mais pesado. Assim o módulo ocupa o lado que o véu deixa aberto
     e as duas coisas param de disputar o mesmo espaço. */
  movel.position.set(0.62, 0, 0);
  cena.add(movel);

  var corpo = new THREE.Group();
  movel.add(corpo);

  // laterais, base, topo e fundo
  corpo.add(painel(E, A, P, MAT.carcaca, -L / 2 + E / 2, A / 2, 0));
  corpo.add(painel(E, A, P, MAT.carcaca,  L / 2 - E / 2, A / 2, 0));
  corpo.add(painel(L, E, P, MAT.carcaca, 0, E / 2, 0));
  corpo.add(painel(L, E, P, MAT.carcaca, 0, A - E / 2, 0));
  corpo.add(painel(L - 2 * E, A - 2 * E, E, MAT.interior, 0, A / 2, -P / 2 + E / 2));

  /* ---------- Interior: divisória, prateleiras, cabideiro ---------- */
  var interior = new THREE.Group();
  corpo.add(interior);

  var xDiv = -L / 6;
  interior.add(painel(E, A - 2 * E, P - E, MAT.carcaca, xDiv, A / 2, E / 2));

  // prateleiras do lado estreito
  [0.52, 0.92, 1.32, 1.72].forEach(function (y) {
    interior.add(painel(L / 2 + xDiv - E, E, P - 0.05, MAT.carcaca,
                        (-L / 2 + xDiv) / 2, y, 0.02));
  });
  // uma prateleira alta e um cabideiro do lado largo
  interior.add(painel(L / 2 - xDiv - E, E, P - 0.05, MAT.carcaca,
                      (L / 2 + xDiv) / 2, 1.72, 0.02));
  var barra = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, L / 2 - xDiv - E, 12), MAT.puxador);
  barra.rotation.z = Math.PI / 2;
  barra.position.set((L / 2 + xDiv) / 2, 1.60, 0.02);
  interior.add(barra);

  /* ---------- Fitas de luz, sob cada prateleira ---------- */
  var fitas = [];
  [0.52, 0.92, 1.32, 1.72].forEach(function (y) {
    var f = painel(L / 2 + xDiv - E - 0.04, 0.008, 0.02, MAT.luzFita,
                   (-L / 2 + xDiv) / 2, y - E, P / 2 - 0.10);
    f.castShadow = false;
    interior.add(f); fitas.push(f);
  });
  var fitaAlta = painel(L / 2 - xDiv - E - 0.04, 0.008, 0.02, MAT.luzFita,
                        (L / 2 + xDiv) / 2, 1.72 - E, P / 2 - 0.10);
  fitaAlta.castShadow = false;
  interior.add(fitaAlta); fitas.push(fitaAlta);

  /* ============================================================
     As portas e seus pivôs

     O Group fica na BORDA do vão. A malha é deslocada meia largura para
     dentro. Girar o Group em Y descreve o arco de uma dobradiça.
     ============================================================ */
  var larguraPorta = L / 2 - E;
  var zPorta = P / 2 + E / 2;

  function montarPorta(sinal) {
    var pivo = new THREE.Group();
    pivo.position.set(sinal * (L / 2 - E), 0, zPorta);
    corpo.add(pivo);

    var folha = painel(larguraPorta, A - 2 * E, E, MAT.porta,
                       -sinal * larguraPorta / 2, A / 2, 0);
    pivo.add(folha);

    // puxador vertical discreto, perto da borda livre
    var pux = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.42, 10), MAT.puxador);
    pux.position.set(-sinal * (larguraPorta - 0.055), A / 2 + 0.12, E / 2 + 0.012);
    pivo.add(pux);

    return pivo;
  }

  var pivoEsq = montarPorta(-1);
  var pivoDir = montarPorta(1);

  /* ---------- Chão, só para receber sombra ---------- */
  var chao = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.ShadowMaterial({ opacity: 0.30 }));
  chao.rotation.x = -Math.PI / 2;
  chao.receiveShadow = true;
  cena.add(chao);

  /* ============================================================
     Iluminação
     Quente, de arquitetura. Uma chave com sombra, um preenchimento
     frio e fraco para a madeira não virar uma mancha, e as luzes
     internas que só acendem quando as portas abrem.
     ============================================================ */
  var luzes = new THREE.Group();
  cena.add(luzes);

  luzes.add(new THREE.HemisphereLight(0xF4F1EC, 0x2D2923, 0.42));

  var chave = new THREE.DirectionalLight(0xFFE7C8, 2.30);
  chave.position.set(3.4, 5.0, 4.2);
  chave.castShadow = true;
  chave.shadow.mapSize.set(1024, 1024);
  chave.shadow.camera.near = 0.5;
  chave.shadow.camera.far = 18;
  chave.shadow.camera.left = -3.2;
  chave.shadow.camera.right = 3.2;
  chave.shadow.camera.top = 3.6;
  chave.shadow.camera.bottom = -0.6;
  chave.shadow.bias = -0.0012;
  chave.shadow.normalBias = 0.02;
  luzes.add(chave);

  var preenche = new THREE.DirectionalLight(0xBFCBD6, 0.28);
  preenche.position.set(-4.2, 2.4, 2.0);
  luzes.add(preenche);

  // as duas luzes de dentro, apagadas no começo
  var dentroA = new THREE.PointLight(0xFFCC8E, 0.0, 3.4, 2.0);
  dentroA.position.set(-L / 4, 1.42, 0.02);
  var dentroB = new THREE.PointLight(0xFFCC8E, 0.0, 3.4, 2.0);
  dentroB.position.set(L / 4, 0.95, 0.02);
  luzes.add(dentroA, dentroB);

  /* ============================================================
     A timeline — cinco atos
     Pausada e reversível. O ScrollTrigger só escreve o progresso.
     ============================================================ */
  var estado = { foco: 0 };            // 0 = móvel inteiro, 1 = detalhe

  var tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });

  // ATO 01 — MATERIAL: a cena se acomoda, o móvel se apresenta
  tl.fromTo(camera.position, { x: 0, y: 1.30, z: 8.4 },
                             { x: 0.30, y: 1.28, z: 7.2, duration: 1 }, 0)
    .fromTo(movel.rotation, { y: -0.42 }, { y: -0.26, duration: 1 }, 0)

  // ATO 02 — DESCOBERTA: a câmera vai para a perspectiva lateral e as
  // portas começam a girar nas dobradiças
    .to(camera.position, { x: 2.35, y: 1.34, z: 5.5, duration: 1 }, 1)
    .to(movel.rotation,  { y: 0.06, duration: 1 }, 1)
    .fromTo(pivoEsq.rotation, { y: 0 }, { y: 0.52, duration: 1 }, 1)
    .fromTo(pivoDir.rotation, { y: 0 }, { y: -0.46, duration: 1 }, 1)

  // ATO 03 — INTERIOR: as portas terminam de abrir e a luz de dentro
  // acende junto. A luz PARTICIPA da abertura; não entra depois.
    .to(pivoEsq.rotation, { y: 1.96, duration: 1 }, 2)
    .to(pivoDir.rotation, { y: -1.88, duration: 1 }, 2)
    .to(camera.position,  { x: 1.60, y: 1.38, z: 3.7, duration: 1 }, 2)
    .to(movel.rotation,   { y: 0.03, duration: 1 }, 2)
    .to(dentroA, { intensity: 2.5, duration: 1 }, 2)
    .to(dentroB, { intensity: 2.1, duration: 1 }, 2)
    .to(MAT.luzFita, { emissiveIntensity: 1.25, duration: 1 }, 2)

  // ATO 04 — TRANSFORMAÇÃO: a câmera entra num detalhe do interior.
  // `estado.foco` sobe de 0 a 1 e é lido pelo site para fazer a
  // passagem do canvas para a fotografia real.
    .to(camera.position, { x: 0.80, y: 1.50, z: 1.75, duration: 1 }, 3)
    .to(mira,            { x: 0.48, y: 1.46, z: 0.0, duration: 1 }, 3)
    .to(estado,          { foco: 1, duration: 1 }, 3);

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

  /* ---------- Desenho sob demanda ---------- */
  var precisa = true;
  var visivel = false;
  var vivo = true;
  var rafId = 0;

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
      // amortecimento: segue o cursor sem perseguir, sem tremer
      var dx = alvoPonteiro.x - ponteiro.x;
      var dy = alvoPonteiro.y - ponteiro.y;
      if (Math.abs(dx) > 0.0004 || Math.abs(dy) > 0.0004) {
        ponteiro.x += dx * 0.06;
        ponteiro.y += dy * 0.06;
        precisa = true;
      }
      // amplitude curta, e some conforme a câmera entra no detalhe
      var escala = 0.085 * (1 - estado.foco * 0.85);
      rig.position.x = ponteiro.x * escala;
      rig.position.y = -ponteiro.y * escala * 0.55;
    }

    if (precisa && visivel) {
      camera.lookAt(mira);
      renderer.render(cena, camera);
      precisa = false;
    }
    if (visivel && (precisa || temPonteiro)) { pedirQuadro(); }
  }

  function pedirQuadro() {
    if (!rafId && vivo && visivel) { rafId = window.requestAnimationFrame(quadro); }
  }

  /* Fora da tela, nada é desenhado. */
  var observador = new IntersectionObserver(function (entradas) {
    visivel = entradas[0].isIntersecting;
    if (visivel) { precisa = true; pedirQuadro(); }
  }, { rootMargin: '120px 0px' });
  observador.observe(palco);

  // A aba escondida também para o trabalho.
  function aoTrocarAba() {
    if (document.hidden) { vivo = false; }
    else { vivo = true; precisa = true; pedirQuadro(); }
  }
  document.addEventListener('visibilitychange', aoTrocarAba);

  var aoRedimensionar = function () { dimensionar(); pedirQuadro(); };
  window.addEventListener('resize', aoRedimensionar);

  /* Perda de contexto: acontece de verdade quando o sistema recupera a
     GPU. Avisamos quem chamou para mostrar o fallback. */
  canvas.addEventListener('webglcontextlost', function (ev) {
    ev.preventDefault();
    vivo = false;
    if (opcoes.aoPerderContexto) { opcoes.aoPerderContexto(); }
  });

  dimensionar();

  return {
    /* O site escreve o progresso aqui. É a única entrada da cena. */
    progresso: function (p) {
      tl.progress(Math.min(1, Math.max(0, p)));
      precisa = true;
      pedirQuadro();
    },
    /* Quanto da transformação do Ato 04 já aconteceu: o site usa para
       fazer a passagem do canvas para a fotografia. */
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
      CUBO.dispose();
      barra.geometry.dispose();
      chao.geometry.dispose();
      chao.material.dispose();
      cena.traverse(function (o) {
        if (o.isMesh && o.geometry && o.geometry !== CUBO) { o.geometry.dispose(); }
      });
      Object.keys(MAT).forEach(function (k) { MAT[k].dispose(); });
      renderer.dispose();
    }
  };
}
