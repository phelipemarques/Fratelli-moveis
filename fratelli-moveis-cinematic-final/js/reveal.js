/* ============================================================
   Fratelli Móveis — capítulo de materialidade

   O enquadramento percorre uma fotografia macro de madeira enquanto a
   luz rasante atravessa. A seção de abertura voltou a ser o capítulo
   3D (js/3d/), então aqui ficou só a materialidade.

   Lê o sistema de movimento de main.js (`window.FRATELLI_MOTION`).
   Nenhuma duração ou curva nasce aqui.
   ============================================================ */
(function () {
  'use strict';

  if (!window.gsap || !window.ScrollTrigger) { return; }
  if (!document.documentElement.classList.contains('motion')) { return; }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var M = window.FRATELLI_MOTION || {};
  var SCRUB = (M.scrub && M.scrub.base) || 0.6;

  var q = function (sel, ctx) { return (ctx || document).querySelector(sel); };

  var mm = gsap.matchMedia();

  /* ============================================================
     MATERIALIDADE

     O enquadramento percorre a superfície enquanto a luz rasante
     atravessa. É o gesto de inclinar uma amostra na mão.

     Três passos de texto acendem em sequência, cada um ligado ao
     trecho da rolagem em que o enquadramento está mostrando o que
     aquele passo descreve.
     ============================================================ */
  function montarMateria(secao, celular) {
    var amostra = q('[data-materia-amostra] img', secao);
    var passos = Array.prototype.slice.call(
      secao.querySelectorAll('[data-materia-passo]'));
    if (!amostra) { return; }

    var st = {
      trigger: secao,
      start: 'top 70%',
      end: 'bottom 40%',
      scrub: SCRUB,
      invalidateOnRefresh: true
    };

    var tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: st });

    /* O enquadramento desce pela peça e aproxima de leve. As duas
       coisas escrevem variáveis de CSS; quem as aplica é a folha de
       estilo, então o movimento continua sendo transform e
       object-position, sem nada que force layout. */
    tl.fromTo(secao,
      { '--desloca': '-9%', '--aprox': 1.10 },
      { '--desloca': '9%', '--aprox': 1.00, duration: 1 }, 0);

    /* A luz rasante atravessa uma vez, de um lado ao outro. */
    tl.fromTo(secao,
      { '--varredura': '-34%' },
      { '--varredura': '96%', duration: 1 }, 0);

    if (passos.length) {
      passos.forEach(function (p, i) {
        var fatia = 1 / passos.length;
        ScrollTrigger.create({
          trigger: secao,
          start: 'top ' + (70 - i * 14) + '%',
          end: 'bottom 40%',
          onToggle: function (self) { p.classList.toggle('is-ativo', self.isActive); }
        });
        void fatia;
      });
    }

    return function () { tl.scrollTrigger && tl.scrollTrigger.kill(); tl.kill(); };
  }

  /* ============================================================
     Ligação

     `matchMedia` monta e DESMONTA a cada troca de faixa. É isso que
     impede o defeito de transformação acumulada no redimensionamento:
     ao sair da faixa, a timeline morre e os elementos voltam ao
     estado do CSS.
     ============================================================ */
  var secaoMateria = q('[data-materia]');

  mm.add({
    desktop: '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
    celular: '(max-width: 899px) and (prefers-reduced-motion: no-preference)'
  }, function (ctx) {
    var celular = !!ctx.conditions.celular;
    var limpar = [];
    if (secaoMateria) { limpar.push(montarMateria(secaoMateria, celular)); }
    return function () {
      limpar.forEach(function (f) { if (f) { f(); } });
      if (secaoMateria) { gsap.set(secaoMateria, { clearProps: '--desloca,--aprox,--varredura' }); }
    };
  });
})();
