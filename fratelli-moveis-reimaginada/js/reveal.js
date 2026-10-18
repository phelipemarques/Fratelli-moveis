/* ============================================================
   Fratelli Móveis — Architectural Reveal e Materialidade

   Os dois capítulos que substituíram o armário em Three.js.

   Nada aqui desenha material: o material é FOTOGRAFIA. O que este
   arquivo faz é mover enquadramentos — abrir um quadro, deslizar um
   painel, percorrer uma superfície. É a diferença entre dirigir uma
   câmera e modelar um móvel, e foi essa troca que resolveu o problema
   de aparência que cinco versões de 3D não resolveram.

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
     ARCHITECTURAL REVEAL

     Três atos, e cada um tem um motivo:

       1. O QUADRO ABRE       o enquadramento revela que há mais
                              coisa além da folha de madeira
       2. A FOLHA DESLIZA     o painel sai de cena pela esquerda
       3. O AMBIENTE ASSENTA  a fotografia acomoda no quadro

     O que NÃO acontece: a folha não gira em dobradiça, não cai, não
     se dobra. Ela desliza, como um painel arquitetônico desliza. O
     briefing é explícito nisso, e é também o que o material permite —
     uma fotografia plana girando em perspectiva denuncia que é plana.
     ============================================================ */
  function montarReveal(secao, celular) {
    var quadro   = q('[data-reveal-quadro]', secao);
    var folha    = q('[data-reveal-folha]', secao);
    var ambiente = q('[data-reveal-ambiente]', secao);
    var legenda  = q('[data-reveal-legenda]', secao);
    if (!quadro || !folha || !ambiente) { return; }

    /* Quanto do quadro fica tampado quando só a folha aparece.
       Medido do DOM, não escrito à mão: a folha tem largura em px no
       desktop e em % no celular, e o quadro muda com a janela. */
    function tampa() {
      return Math.max(0, quadro.clientWidth - folha.offsetWidth);
    }

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: celular
        ? {
            /* CELULAR: NENHUM PIN.

               A rolagem vertical nunca é sequestrada. A cena acontece
               enquanto a seção atravessa a tela, no ritmo do dedo de
               quem rola. Era o pin que travava o scroll nas versões
               anteriores. */
            trigger: secao,
            start: 'top 76%',
            end: 'bottom 62%',
            scrub: SCRUB,
            invalidateOnRefresh: true
          }
        : {
            trigger: secao,
            start: 'top top',
            end: '+=150%',
            pin: true,
            anticipatePin: 1,
            scrub: SCRUB,
            invalidateOnRefresh: true
          }
    });

    /* ---- Ato 1: o quadro abre ----

       Duas coisas ao mesmo tempo, e a segunda só existe por causa da
       composição: o recorte abre da esquerda para a direita, e o
       quadro desliza meia-tampa para a esquerda enquanto isso.

       Sem o deslize, o quadro fechado ficaria encostado na borda
       esquerda da coluna com um vazio à direita — lê como layout
       quebrado, não como enquadramento estreito. Com ele, a folha
       nasce CENTRADA na coluna e o quadro cresce para os dois lados. */
    tl.fromTo(quadro,
      { clipPath: function () { return 'inset(0px ' + tampa() + 'px 0px 0px)'; },
        x: function () { return tampa() / 2; } },
      { clipPath: 'inset(0px 0px 0px 0px)', x: 0, duration: 0.24 }, 0);

    /* ---- Ato 2: a folha desliza ----
       `xPercent` e não `x`: a folha muda de largura entre breakpoints,
       e a porcentagem continua certa sem recalcular nada.

       No desktop há um giro de 5° no eixo Y. É pouco de propósito:
       o suficiente para a aresta iluminada aparecer e dar espessura,
       pouco o bastante para a fotografia não se denunciar plana. */
    tl.fromTo(folha,
      { xPercent: 0, rotateY: 0 },
      { xPercent: -106, rotateY: celular ? 0 : -5,
        duration: 0.38, ease: M.ease ? M.ease.inout : 'power2.inOut' }, 0.20);

    /* ---- Ato 3: o ambiente assenta ----
       Aproximação pequena — 1,06 para 1,00. A fotografia tem 1570 px
       para um quadro de no máximo 820: há folga para 6% de escala e
       não muito mais. Ampliar além disso trocaria nitidez por
       movimento, e o briefing proíbe exatamente essa troca. */
    tl.fromTo(ambiente,
      { scale: 1.06, xPercent: celular ? 0 : -2 },
      { scale: 1, xPercent: 0, duration: 0.5 }, 0.16);

    if (legenda) {
      tl.fromTo(legenda,
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.12,
          ease: M.ease ? M.ease.out : 'power3.out' }, 0.60);
    }

    return function () { tl.scrollTrigger && tl.scrollTrigger.kill(); tl.kill(); };
  }

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
  var secaoReveal = q('[data-reveal-secao]');
  var secaoMateria = q('[data-materia]');

  mm.add({
    desktop: '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
    celular: '(max-width: 899px) and (prefers-reduced-motion: no-preference)'
  }, function (ctx) {
    var celular = !!ctx.conditions.celular;
    var limpar = [];
    if (secaoReveal) { limpar.push(montarReveal(secaoReveal, celular)); }
    if (secaoMateria) { limpar.push(montarMateria(secaoMateria, celular)); }
    return function () {
      limpar.forEach(function (f) { if (f) { f(); } });
      /* Devolve os elementos ao estado do CSS. Sem isto, sair da faixa
         deixaria a folha fora da tela para sempre. */
      if (secaoReveal) {
        gsap.set(secaoReveal.querySelectorAll(
          '[data-reveal-quadro],[data-reveal-folha],[data-reveal-ambiente],[data-reveal-legenda]'),
          { clearProps: 'all' });
      }
      if (secaoMateria) { gsap.set(secaoMateria, { clearProps: '--desloca,--aprox,--varredura' }); }
    };
  });
})();
