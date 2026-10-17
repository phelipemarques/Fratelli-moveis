/* ============================================================
   AXIS Academia e Fisioterapia — código do site
   Cascavel, Paraná

   Duas metades:
   1. Interface (não depende de biblioteca): cabeçalho, menu,
      indicador de seção, barra fixa, mapa sob demanda, luz dos
      cartões.
   2. Movimento (GSAP + ScrollTrigger): revelações na rolagem,
      linha do "Como funciona", fechamento e parallax no desktop.
   A abertura é animada em CSS (ver css/main.css, bloco 6), para não
   esperar o JavaScript.
   ============================================================ */

(function () {
  'use strict';

  var d = document;
  var root = d.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function $(sel, ctx) { return (ctx || d).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || d).querySelectorAll(sel)); }


  /* ----------------------------------------------------------
     Cabeçalho: fundo sólido depois de rolar, some ao descer e
     volta ao subir. Um único listener passivo, com rAF.
     ---------------------------------------------------------- */
  var nav = $('#nav');
  var lastY = window.scrollY;
  var ticking = false;
  var menuOpen = false;

  function updateNav() {
    var y = window.scrollY;
    nav.classList.toggle('is-solid', y > 24);
    if (!menuOpen) {
      var goingDown = y > lastY + 4;
      var goingUp = y < lastY - 4;
      if (goingDown && y > 480) nav.classList.add('is-hidden');
      else if (goingUp || y < 480) nav.classList.remove('is-hidden');
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(updateNav); }
  }, { passive: true });
  updateNav();

  // Foco por teclado no cabeçalho escondido o traz de volta.
  nav.addEventListener('focusin', function () { nav.classList.remove('is-hidden'); });


  /* ----------------------------------------------------------
     Menu em tela cheia
     ---------------------------------------------------------- */
  var toggle = $('.nav__toggle');
  var menu = $('#menu');
  var main = $('main');
  var footer = $('footer');

  function setMenu(open) {
    menuOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    d.body.classList.toggle('is-locked', open);
    main.inert = open;
    footer.inert = open;
    dockHide(open);

    if (open) {
      nav.classList.remove('is-hidden');
      menu.hidden = false;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { menu.classList.add('is-open'); });
      });
      var first = $('a', menu);
      if (first) first.focus({ preventScroll: true });
    } else {
      menu.classList.remove('is-open');
      var done = function () { if (!menuOpen) menu.hidden = true; };
      if (reduceMotion) done();
      else setTimeout(done, 380);
    }
  }

  toggle.addEventListener('click', function () { setMenu(!menuOpen); });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen) { setMenu(false); toggle.focus(); }
  });
  // Ao passar para o desktop com o menu aberto, fecha sem drama.
  window.matchMedia('(min-width: 1080px)').addEventListener('change', function (e) {
    if (e.matches && menuOpen) setMenu(false);
  });


  /* ----------------------------------------------------------
     Indicador da seção atual (desktop)
     ---------------------------------------------------------- */
  var links = $$('.nav__links a');
  var ind = $('.nav__ind');
  var linkFor = {};
  links.forEach(function (a) { linkFor[a.getAttribute('href').slice(1)] = a; });

  function moveIndicator(a) {
    links.forEach(function (l) { l.removeAttribute('aria-current'); });
    if (!a) { ind.style.setProperty('--o', 0); return; }
    a.setAttribute('aria-current', 'true');
    ind.style.setProperty('--x', (a.offsetLeft + 14) + 'px');
    ind.style.setProperty('--w', a.offsetWidth - 28);
    ind.style.setProperty('--o', 1);
  }

  if ('IntersectionObserver' in window) {
    var visible = {};
    var sectionIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var current = null;
      $$('main > section[id]').forEach(function (s) {
        if (visible[s.id]) current = s.id;
      });
      // Seções sem link (ex.: galeria) mantêm o link anterior aceso.
      var target = null;
      if (current) {
        var ids = $$('main > section[id]').map(function (s) { return s.id; });
        for (var i = ids.indexOf(current); i >= 0; i--) {
          if (linkFor[ids[i]]) { target = linkFor[ids[i]]; break; }
        }
      }
      moveIndicator(target);
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach(function (s) { sectionIo.observe(s); });
  }


  /* ----------------------------------------------------------
     Barra fixa de agendamento: entra depois da abertura e sai
     quando o contato aparece (ali o botão grande já está na tela).
     ---------------------------------------------------------- */
  var dock = $('#dock');
  var heroGone = false;
  var contactIn = false;
  var forcedHidden = false;
  var inlineCta = false;

  function dockRender() {
    var show = heroGone && !contactIn && !inlineCta && !forcedHidden;
    dock.classList.toggle('is-visible', show);
    dock.setAttribute('aria-hidden', String(!show));
    dock.tabIndex = show ? 0 : -1;
  }
  function dockHide(v) { forcedHidden = v; dockRender(); }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      heroGone = !en[0].isIntersecting;
      dockRender();
    }, { rootMargin: '0px 0px -35% 0px' }).observe($('.hero__actions'));

    new IntersectionObserver(function (en) {
      contactIn = en.some(function (e) { return e.isIntersecting; });
      dockRender();
    }).observe($('#contato'));

    // Com um botão vermelho grande já na tela, a barra sai de cena
    // para não repetir o mesmo chamado duas vezes.
    var inlineCtas = $$('main .btn--red.btn--lg, main .svc--featured .svc__cta');
    var ctaVisible = 0;
    var ctaIo = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (e.target.__seen !== e.isIntersecting) {
          ctaVisible += e.isIntersecting ? 1 : -1;
          e.target.__seen = e.isIntersecting;
        }
      });
      inlineCta = ctaVisible > 0;
      dockRender();
    });
    inlineCtas.forEach(function (b) { b.__seen = false; ctaIo.observe(b); });
  }


  /* ----------------------------------------------------------
     Mapa sob demanda: o iframe só existe depois do clique.
     ---------------------------------------------------------- */
  var mapBtn = $('.map__load');
  if (mapBtn) {
    mapBtn.addEventListener('click', function () {
      var f = d.createElement('iframe');
      f.src = mapBtn.getAttribute('data-src');
      f.title = 'Mapa: AXIS Academia e Fisioterapia, Rua Riachuelo, 2397, Cascavel – PR';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.allowFullscreen = true;
      mapBtn.replaceWith(f);
    });
  }


  /* ----------------------------------------------------------
     Luz que segue o ponteiro nos cartões de serviço (só mouse).
     ---------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    $$('.svc').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }


  /* ----------------------------------------------------------
     MOVIMENTO — GSAP + ScrollTrigger
     Sem a biblioteca ou com movimento reduzido, a classe "motion"
     sai e tudo fica no estado final.
     ---------------------------------------------------------- */
  if (!root.classList.contains('motion')) return;
  if (!window.gsap || !window.ScrollTrigger) { root.classList.remove('motion'); return; }

  window.__axisMotion = true;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  gsap.defaults({ ease: 'expo.out', duration: 1 });

  // Revelação genérica: fade + subida curta, em lotes escalonados.
  function revealBatch(selector, vars) {
    var els = $$(selector);
    if (!els.length) return;
    // O que já ficou para trás (recarga no meio da página) aparece já.
    els.forEach(function (el) {
      if (el.getBoundingClientRect().bottom < 0) gsap.set(el, { opacity: 1, y: 0, clipPath: 'none' });
    });
    ST.batch(els, {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, Object.assign({ opacity: 1, y: 0, duration: .9, stagger: .07, overwrite: true }, vars || {}));
      }
    });
  }

  revealBatch('[data-reveal]');

  // Conteúdos: no carrossel do celular os cartões laterais nem estão
  // na tela; revelam juntos com a faixa.
  gsap.set('.post', { opacity: 0, y: 24 });
  ST.create({
    trigger: '.posts__track',
    start: 'top 88%',
    once: true,
    onEnter: function () { gsap.to('.post', { opacity: 1, y: 0, duration: .9, stagger: .06 }); }
  });

  var mm = gsap.matchMedia();

  mm.add('(min-width: 1024px)', function () {
    // Galeria: abertura em máscara, quadro a quadro.
    gsap.set('.shot', { opacity: 1, clipPath: 'inset(14% 14% 14% 14% round 14px)' });
    gsap.set('.shot__ph, .shot img', { scale: 1.15 });
    ST.batch('.shot', {
      start: 'top 85%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.2, ease: 'expo.inOut', stagger: .08 });
        gsap.to(batch.map(function (b) { return b.firstElementChild; }), {
          scale: 1, duration: 1.6, stagger: .08,
          // Devolve o transform ao CSS para o zoom do hover voltar a funcionar.
          onComplete: function () { gsap.set(this.targets(), { clearProps: 'transform' }); }
        });
      }
    });

    // Parallax leve na abertura: só desktop com mouse.
    if (finePointer) {
      var heroScroll = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 };
      gsap.to('.hero__ghost', { yPercent: 22, ease: 'none', scrollTrigger: heroScroll });
      gsap.to('.hero__pillars', { y: -70, ease: 'none', scrollTrigger: heroScroll });
      gsap.to('.hero__slash', { yPercent: -40, ease: 'none', scrollTrigger: heroScroll });
    }
  });

  mm.add('(max-width: 1023px)', function () {
    revealBatch('.shot', { duration: .8 });
  });

  // Como funciona: a linha enche com a rolagem e acende cada etapa.
  gsap.fromTo('.steps__fill', { scaleY: 0 }, {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: { trigger: '.steps', start: 'top 62%', end: 'bottom 62%', scrub: .5 }
  });
  $$('.step').forEach(function (step) {
    ST.create({
      trigger: step,
      start: 'top 62%',
      onEnter: function () { step.classList.add('is-active'); },
      onLeaveBack: function () { step.classList.remove('is-active'); }
    });
  });

  // Fechamento: o título sobe em máscara, o resto acompanha.
  var contactTl = gsap.timeline({
    scrollTrigger: { trigger: '.contact', start: 'top 72%', once: true }
  });
  contactTl
    .to('.contact__title .line__in', { y: 0, duration: 1.2, stagger: .1 })
    .fromTo('.contact__btn', { scale: .94 }, { scale: 1, duration: 1, clearProps: 'transform' }, .45);

  // A posição dos gatilhos depende da fonte; recalcula quando ela chega.
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { ST.refresh(); });
})();
