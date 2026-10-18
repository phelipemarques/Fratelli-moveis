/* ============================================================
   Fratelli Móveis — ligação das cenas com o site (V6)

   TRÊS PERFIS, decididos por capacidade e não por largura de tela:

   A — máquina com WebGL e folga:  cena Three.js completa, cinco atos.
   B — aparelho de toque ou com pouca folga:  capítulo 2.5D em CSS 3D,
       com o mesmo veio de madeira e a mesma coreografia encurtada.
       O Three.js NÃO entra na rede.
   C — sem WebGL, sem GSAP ou com movimento reduzido:  a fotografia
       real, com o mesmo texto e a mesma altura. Nada é baixado.

   O corte NÃO é `innerWidth < 900`. É: existe contexto WebGL? quantos
   núcleos? há ponteiro fino? o visitante pediu menos movimento ou
   economia de dados?

   Os dois capítulos animados são conduzidos pelo MESMO ScrollTrigger e
   escrevem a MESMA variável `--passagem`. Quem troca é a encenação,
   não a narrativa.
   ============================================================ */

(function () {
  'use strict';

  function menosMovimentoGlobal() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  }

  /* ---------- O capítulo de materialidade ----------
     Independente da abertura: é CSS 3D, não precisa de WebGL, e roda
     em qualquer aparelho que tenha GSAP e não tenha pedido menos
     movimento. Um Save-Data também o dispensa — ele gera um canvas de
     384px, e quem pediu economia não deve pagar por isso. */
  (function () {
    var materia = document.querySelector('[data-materia]');
    if (!materia) { return; }
    if (menosMovimentoGlobal()) { return; }
    if (!window.gsap || !window.ScrollTrigger) { return; }
    var conexao = navigator.connection;
    if (conexao && conexao.saveData) { return; }

    import('./materia.js').then(function (mod) {
      var cena = mod.criarMateria({
        secao: materia,
        gsap: window.gsap,
        ScrollTrigger: window.ScrollTrigger
      });
      if (cena) { window.__fratelliMateria = cena; }
    }).catch(function () { /* fica a seção parada, inteira e legível */ });
  })();

  var secao = document.querySelector('[data-abertura]');
  if (!secao) { return; }

  var palco  = secao.querySelector('[data-abertura-palco]');
  var canvas = secao.querySelector('[data-abertura-canvas]');
  var foto   = secao.querySelector('[data-abertura-foto]');
  if (!palco || !canvas || !foto) { return; }

  function menosMovimento() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  }

  /* ---------- Qual encenação cabe aqui? ---------- */
  function perfil() {
    if (menosMovimento()) { return 'C'; }
    if (!window.gsap || !window.ScrollTrigger) { return 'C'; }

    // Save-Data: o visitante pediu economia. Respeitamos antes de tudo.
    var conexao = navigator.connection;
    if (conexao && conexao.saveData) { return 'C'; }

    var nucleos = navigator.hardwareConcurrency || 2;
    var memoria = navigator.deviceMemory || 4;
    var fino = false;
    try { fino = window.matchMedia('(hover: hover) and (pointer: fine)').matches; }
    catch (e) {}

    // contexto de verdade, criado e descartado — não é sniffing
    var teste = document.createElement('canvas');
    var gl = null;
    try { gl = teste.getContext('webgl2') || teste.getContext('webgl'); }
    catch (e) { gl = null; }
    if (gl) {
      var perder = gl.getExtension('WEBGL_lose_context');
      if (perder) { perder.loseContext(); }
    }

    // Sem WebGL ainda há o 2.5D: ele é só CSS. Só cai para C quem
    // também não tem folga nenhuma.
    if (!gl) { return (nucleos >= 4 && memoria >= 4) ? 'B' : 'C'; }

    if (nucleos < 4 || memoria < 4) { return 'B'; }

    /* Capacidade primeiro, tamanho depois — e nunca o tamanho sozinho.
       Um aparelho de toque com tela estreita não ganha a cena pinada
       mesmo tendo núcleos de sobra: num capítulo de quatro alturas de
       tela, a sequência cobraria rolagem demais num espaço pequeno. O
       2.5D conta a mesma história em 2,2 alturas. */
    var estreito = Math.min(window.innerWidth, window.innerHeight) < 720;
    if (!fino && (estreito || nucleos < 8)) { return 'B'; }
    return 'A';
  }

  var escolhido = perfil();
  secao.setAttribute('data-perfil', escolhido);

  if (escolhido === 'C') { return; }      // a fotografia já está lá

  /* ---------- Monta o capítulo e prende a rolagem nele ----------

     `montar` recebe a cena pronta e é igual para A e B: um pin, um
     scrub, um `progresso(p)` e uma `--passagem`. A diferença entre os
     perfis está só em quantas alturas de tela a sequência ocupa e em
     qual classe a seção ganha. */
  function montar(cena, classe, alturas) {
    secao.classList.add(classe);

    var st = window.ScrollTrigger.create({
      trigger: secao,
      start: 'top top',
      end: '+=' + Math.round(window.innerHeight * alturas),
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: 0.5,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        cena.progresso(self.progress);
        /* A passagem do capítulo para a fotografia sai do MESMO
           progresso que move a câmera: as duas nunca saem de
           sincronia. A cena devolve quanto do último ato já passou. */
        var f = cena.foco ? cena.foco() : (self.progress - 0.80) / 0.20;
        secao.style.setProperty('--passagem',
          Math.min(1, Math.max(0, f)).toFixed(3));

        /* A partir do ato 3 o móvel toma a tela, e o texto passaria a
           ser lido POR CIMA de painéis em movimento — que é o que não
           pode acontecer. A coluna recua.

           A classe (e não uma variável contínua) existe porque o CSS
           precisa pôr `visibility: hidden` no fim da transição: texto
           invisível mas focável é uma armadilha para quem navega por
           teclado. O botão de pular fica de fora e continua
           alcançável o tempo todo. */
        secao.classList.toggle('texto-recuado', self.progress > 0.44);
      },
      onRefresh: function () { if (cena.redimensionar) { cena.redimensionar(); } }
    });

    function desmontar() {
      secao.classList.remove(classe);
      secao.style.setProperty('--passagem', '1');
      if (st) { st.kill(); }
      if (cena) { cena.descartar(); }
    }

    /* Ver a nota em materia.js: dois pins que chegam por import
       dinâmico precisam ser reordenados e remedidos depois que ambos
       existem. Quem montar por último acerta os dois. */
    if (window.ScrollTrigger.sort) { window.ScrollTrigger.sort(); }
    window.ScrollTrigger.refresh();

    window.__fratelliAbertura = { desmontar: desmontar, st: st, perfil: escolhido };
    return desmontar;
  }

  function recuar() {
    /* Falhou em montar: a fotografia continua lá, a seção continua
       inteira, e nada no console assusta o visitante. */
    secao.setAttribute('data-perfil', 'C');
  }

  if (escolhido === 'B') {
    import('./mobile25.js').then(function (mod) {
      var cena = mod.criar25D({ palco: palco });
      if (!cena) { recuar(); return; }
      /* O 2.5D não tem `foco()`: o último ato dele vai de 0,80 a 1,00,
         que é o que o `onUpdate` assume por padrão. */
      montar(cena, 'tem-25d', 2.2);
    }).catch(recuar);
    return;
  }

  /* ---------- Perfil A ---------- */
  import('./opening.js').then(function (mod) {
    var cena = mod.criarAbertura({
      canvas: canvas,
      palco: palco,
      gsap: window.gsap,
      aoPerderContexto: function () {
        if (window.__fratelliAbertura) { window.__fratelliAbertura.desmontar(); }
      }
    });
    if (!cena) { recuar(); return; }     // contexto negou: fica a fotografia
    montar(cena, 'tem-3d', 4.0);
  }).catch(recuar);
})();
