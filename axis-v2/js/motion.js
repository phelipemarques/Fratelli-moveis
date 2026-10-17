/* ============================================================
   AXIS V2 — movimento na rolagem (GSAP + ScrollTrigger)

   Vocabulário curto e repetido com intenção:
   - títulos sobem por linhas, em máscara;
   - fotografias abrem por uma cortina diagonal com fio vermelho na
     borda (a diagonal da marca);
   - a linha AXIS se desenha onde marca uma passagem;
   - grupos relacionados entram em sequência;
   - parallax só no desktop com mouse; nada é fixado na tela.
   Com movimento reduzido ou sem ScrollTrigger, nada disso roda.
   ============================================================ */

(function () {
  'use strict';

  var root = document.documentElement;
  if (!root.classList.contains('motion') || !window.gsap || !window.ScrollTrigger) return;

  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function passed(el) { return el.getBoundingClientRect().bottom < 0; }

  // Uma revelação por elemento, disparada uma vez, ao entrar.
  function onEnter(el, fn, start) {
    if (passed(el)) { fn(true); return; }
    ST.create({ trigger: el, start: start || 'top 86%', once: true, onEnter: function () { fn(false); } });
  }

  /* Títulos por linhas (o hero tem a própria timeline) */
  $$('[data-lines]').forEach(function (h) {
    var lines = $$('.ln > span', h);
    gsap.set(lines, { yPercent: 110 });
    onEnter(h, function (now) {
      gsap.to(lines, { yPercent: 0, duration: now ? 0 : 1, stagger: .08, ease: 'expo.out' });
    });
  });

  /* Grupos em sequência */
  $$('[data-stagger]').forEach(function (list) {
    var items = list.children;
    gsap.set(items, { opacity: 0, y: 18 });
    onEnter(list, function (now) {
      gsap.to(items, { opacity: 1, y: 0, duration: now ? 0 : .8, stagger: .07, ease: 'expo.out' });
    }, 'top 88%');
  });

  /* Linha AXIS: desenha quando chega */
  $$('main .axl').forEach(function (svg) {
    if (svg.closest('.hero')) return;
    var path = svg.querySelector('.axl__hot') || svg.querySelector('path');
    gsap.set(path, { strokeDashoffset: 1 });
    onEnter(svg, function (now) {
      gsap.to(path, { strokeDashoffset: 0, duration: now ? 0 : 1.4, ease: 'power3.inOut' });
    }, 'top 90%');
  });

  /* Fotografias: cortina diagonal */
  $$('[data-img]').forEach(function (box) {
    var curtain = document.createElement('span');
    curtain.className = 'curtain';
    curtain.setAttribute('aria-hidden', 'true');
    box.appendChild(curtain);
    onEnter(box, function (now) {
      if (now) { curtain.remove(); return; }
      gsap.to(curtain, { xPercent: 120, duration: 1.2, ease: 'expo.inOut', onComplete: function () { curtain.remove(); } });
      var media = box.querySelector('.media, .ph, .cover__art span');
      if (media) gsap.from(media, { scale: 1.12, duration: 1.6, ease: 'expo.out', clearProps: 'transform' });
    }, 'top 84%');
  });

  var mm = gsap.matchMedia();

  /* Desktop com mouse: profundidade discreta */
  mm.add('(min-width: 1024px) and (pointer: fine)', function () {
    $$('.hero .slice').forEach(function (s) {
      var depth = +s.getAttribute('data-depth') || 1;
      gsap.to(s, { yPercent: -4 * depth, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 } });
    });
    gsap.to('.hero__copy', { y: -40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 } });
    gsap.fromTo('.physio__media .media, .physio__media .ph', { yPercent: -5, scale: 1.12 }, {
      yPercent: 5, scale: 1.12, ease: 'none',
      scrollTrigger: { trigger: '.physio', start: 'top bottom', end: 'bottom top', scrub: .6 }
    });
  });

  /* Jornada: a linha de progresso acompanha a rolagem */
  mm.add({ wide: '(min-width: 960px)', narrow: '(max-width: 959px)' }, function (ctx) {
    var wide = ctx.conditions.wide;
    gsap.fromTo('.steps__fill', wide ? { scaleX: 0, scaleY: 1 } : { scaleY: 0, scaleX: 1 }, {
      scaleX: 1, scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: '.steps', start: wide ? 'top 75%' : 'top 70%', end: wide ? 'top 35%' : 'bottom 60%', scrub: .5 }
    });
    $$('.step').forEach(function (step, i, all) {
      ST.create({
        trigger: wide ? '.steps' : step,
        start: wide ? 'top ' + (75 - (40 / (all.length - 1)) * i) + '%' : 'top 70%',
        onEnter: function () { step.classList.add('is-on'); },
        onLeaveBack: function () { step.classList.remove('is-on'); }
      });
    });
  });

  // Posições dependem da fonte e de painéis que abrem e fecham.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
})();
