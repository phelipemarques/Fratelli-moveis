/* ============================================================
   Fratelli Móveis — ligação da cena com o site

   TRÊS PERFIS, decididos por capacidade e não por largura de tela:

   A — desktop com WebGL:  cena completa.
   B — aparelho limitado:  a cena não monta; fica a fotografia real,
                           com a mesma composição e o mesmo texto.
   C — sem WebGL ou com movimento reduzido: idem B, e nem o Three.js
                           chega a ser baixado.

   O corte NÃO é `innerWidth < 900`. É: existe contexto WebGL? quantos
   núcleos a máquina tem? há ponteiro fino? o visitante pediu menos
   movimento? Uma tela pequena com GPU boa não deveria ser punida, e um
   notebook largo e fraco não deveria travar.

   O Three.js (671 KB) só é baixado no perfil A, por import dinâmico.
   Nos perfis B e C ele nunca entra na rede.
   ============================================================ */

(function () {
  'use strict';

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

  /* ---------- Vale a pena montar a cena aqui? ---------- */
  function perfil() {
    if (menosMovimento()) { return 'C'; }
    if (!window.gsap || !window.ScrollTrigger) { return 'C'; }

    // contexto de verdade, criado e descartado — não é sniffing
    var teste = document.createElement('canvas');
    var gl = null;
    try { gl = teste.getContext('webgl2') || teste.getContext('webgl'); } catch (e) { gl = null; }
    if (!gl) { return 'C'; }
    var perder = gl.getExtension('WEBGL_lose_context');
    if (perder) { perder.loseContext(); }

    var nucleos = navigator.hardwareConcurrency || 2;
    var memoria = navigator.deviceMemory || 4;
    var fino = false;
    try { fino = window.matchMedia('(hover: hover) and (pointer: fine)').matches; } catch (e) {}

    // Save-Data: o visitante pediu economia. Respeitamos.
    var conexao = navigator.connection;
    if (conexao && conexao.saveData) { return 'B'; }

    if (nucleos < 4 || memoria < 4) { return 'B'; }

    /* Capacidade primeiro, tamanho depois — e nunca o tamanho sozinho.
       Um aparelho de toque com tela estreita não ganha a cena pinada
       mesmo tendo núcleos de sobra: num capítulo de 3,2 alturas de tela,
       a sequência cobraria rolagem demais num espaço pequeno, e o custo
       de GPU não se paga. A fotografia real entrega a mesma mensagem. */
    var estreito = Math.min(window.innerWidth, window.innerHeight) < 720;
    if (!fino && (estreito || nucleos < 8)) { return 'B'; }
    return 'A';
  }

  var escolhido = perfil();
  secao.setAttribute('data-perfil', escolhido);

  if (escolhido !== 'A') { return; }   // B e C: a fotografia já está lá

  /* ---------- Perfil A: carrega e monta ---------- */
  import('./opening.js').then(function (mod) {
    var cena = mod.criarAbertura({
      canvas: canvas,
      palco: palco,
      gsap: window.gsap,
      aoPerderContexto: desmontar
    });

    if (!cena) { return; }             // contexto negou: fica a fotografia

    secao.classList.add('tem-3d');

    /* A rolagem escreve o progresso. Uma timeline só, reversível: rolar
       para cima desfaz a abertura quadro a quadro. */
    var st = window.ScrollTrigger.create({
      trigger: secao,
      start: 'top top',
      end: '+=' + Math.round(window.innerHeight * 3.2),
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: 0.5,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        cena.progresso(self.progress);
        /* A passagem do canvas para a fotografia é escrita a partir do
           MESMO progresso: as duas nunca saem de sincronia. Começa em
           78% da sequência, quando a câmera já está dentro do detalhe. */
        var p = (self.progress - 0.78) / 0.22;
        foto.style.setProperty('--passagem', Math.min(1, Math.max(0, p)).toFixed(3));
      },
      onRefresh: function () { cena.redimensionar(); }
    });

    function desmontar() {
      secao.classList.remove('tem-3d');
      foto.style.setProperty('--passagem', '1');
      if (st) { st.kill(); }
      if (cena) { cena.descartar(); }
    }

    window.__fratelliAbertura = { desmontar: desmontar, st: st };
  }).catch(function () {
    /* Falha ao baixar o módulo: a fotografia continua lá, a seção
       continua inteira, e nada no console assusta o visitante. */
    secao.setAttribute('data-perfil', 'B');
  });
})();
