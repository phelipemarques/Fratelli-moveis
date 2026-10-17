/* GRO Cascavel — interações e movimento (V2).

   Dois motores, um por contexto:
   - Celular e tablet: cenas de rolagem próprias e leves (um único listener
     de scroll com requestAnimationFrame). Nada de biblioteca no celular.
   - Desktop (≥ 1024 px): GSAP + ScrollTrigger, carregados depois do HTML,
     só quando a tela é larga e o movimento não foi reduzido. Fixam o
     processo por pouco tempo, coordenam a troca de soluções e o
     enquadramento do hero.
   Sem JavaScript, sem GSAP ou com movimento reduzido, todo o conteúdo fica
   visível e funcional: a animação nunca guarda informação. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var desk = window.matchMedia('(min-width: 1024px)');
  var G = null;
  var ST = null;
  var gsapOn = false; // true enquanto o contexto desktop do GSAP está ativo

  /* Tokens de movimento — os mesmos de :root em main.css */
  var M = {
    dur: { xs: 0.12, s: 0.2, m: 0.36, l: 0.72, xl: 1.1 },
    ease: { out: 'expo.out', io: 'power3.inOut', in: 'power3.in' },
    dist: { s: 8, m: 16, l: 40 },
    stagger: 0.07,
    dim: 0.42 // opacidade mínima das palavras do manifesto (mantém contraste 3:1)
  };

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v) { return Math.min(1, Math.max(0, v)); }

  var header = $('[data-header]');
  var hero = document.getElementById('inicio');
  var contact = document.getElementById('contato');
  var wa = $('[data-wa]');
  var darkSecs = $$('[data-theme="dark"]');
  var solNav = $('.sol__nav');

  /* ---------- Header, cor do header e botão flutuante ---------- */
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var vh = window.innerHeight;
    var heroH = hero ? hero.offsetHeight : 700;
    var menuOpen = root.classList.contains('menu-open');
    var hh = header.offsetHeight / 2;

    header.classList.toggle('is-solid', y > 32);
    if (!menuOpen) {
      if (y > heroH && y > lastY + 6) header.classList.add('is-hidden');
      else if (y < lastY - 6 || y <= heroH) header.classList.remove('is-hidden');
    }
    // o header assume a cor da superfície que está passando por baixo dele
    var dark = darkSecs.some(function (s) { var r = s.getBoundingClientRect(); return r.top <= hh && r.bottom >= hh; });
    header.classList.toggle('is-dark', dark);

    // o botão flutuante some no hero, quando o contato já está na tela e,
    // no celular, sobre o acordeão de soluções (cada solução já tem o seu
    // botão de WhatsApp e o flutuante cobriria os controles)
    if (wa) {
      var c = contact ? contact.getBoundingClientRect() : null;
      var contactOn = c && c.top < vh * 0.75 && c.bottom > 0;
      var s = !desk.matches && solNav ? solNav.getBoundingClientRect() : null;
      var overSol = s && s.top < vh - 24 && s.bottom > vh - 96;
      wa.classList.toggle('is-on', y > heroH * 0.6 && !contactOn && !overSol);
    }

    if (!gsapOn) runScenes(vh);
    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  /* ---------- Entradas por viewport (fora do hero) ---------- */
  var rvs = $$('.rv').filter(function (el) { return !el.closest('.hero'); });
  if ('IntersectionObserver' in window && !reduce.matches) {
    // um elemento recortado (clip-path) não é visto pelo observador:
    // nesses casos observa-se o pai e a classe vai para o filho
    var watched = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        (watched.get(e.target) || []).forEach(function (el) { el.classList.add('is-in'); });
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    rvs.forEach(function (el) {
      var t = el.classList.contains('rv--clip') ? el.parentElement : el;
      watched.set(t, (watched.get(t) || []).concat(el));
      io.observe(t);
    });
  } else {
    rvs.forEach(function (el) { el.classList.add('is-in'); });
  }
  root.classList.add('io');

  /* ---------- Soluções ----------
     Uma só marcação: no celular é acordeão (abre e fecha, um por vez); no
     desktop a lista fica à esquerda e sempre há uma solução no palco. */
  var acc = $('[data-acc]');
  var solButtons = $$('.sol__btn');

  function panelOf(btn) { return document.getElementById(btn.getAttribute('aria-controls')); }
  function setSol(btn, open) {
    btn.setAttribute('aria-expanded', String(open));
    panelOf(btn).classList.toggle('is-open', open);
    btn.closest('.sol__item').classList.toggle('is-open', open);
    if (open && acc) {
      var i = solButtons.indexOf(btn) + 1;
      acc.setAttribute('data-active', String(i));
      acc.style.setProperty('--i', String(i));
    }
  }

  // Desktop com GSAP: título sobe por trás de uma máscara, itens em sequência
  function animatePanel(btn) {
    if (!gsapOn) return;
    var panel = panelOf(btn);
    var title = $('.sol__title', panel);
    var items = [$('.sol__phrase', panel)].concat($$('.sol__list li', panel), [$('.btn', panel)]);
    G.killTweensOf([title].concat(items));
    G.timeline()
      .fromTo(title, { yPercent: 35, opacity: 0, clipPath: 'inset(0% 0% 100% 0%)' },
        { yPercent: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: M.dur.l, ease: M.ease.out, clearProps: 'clipPath' })
      .fromTo(items, { y: M.dist.m, opacity: 0 },
        { y: 0, opacity: 1, duration: M.dur.l, ease: M.ease.out, stagger: M.stagger }, '-=0.55');
  }

  // No celular, o cabeçalho tocado fica parado na tela enquanto o item de
  // cima fecha (sem salto); depois, se o conteúdo passou da tela, rola só o
  // necessário para mostrá-lo.
  function keepInPlace(btn) {
    var top0 = btn.getBoundingClientRect().top;
    var t0 = performance.now();
    (function frame(now) {
      var diff = btn.getBoundingClientRect().top - top0;
      if (Math.abs(diff) > 0.5) window.scrollBy({ top: diff, behavior: 'instant' });
      if (now - t0 < 420) window.requestAnimationFrame(frame);
      else revealPanel(btn);
    })(t0);
  }
  function revealPanel(btn) {
    if (btn.getAttribute('aria-expanded') !== 'true') return;
    var r = panelOf(btn).getBoundingClientRect();
    var b = btn.getBoundingClientRect();
    var over = r.bottom - window.innerHeight + 16;
    var room = b.top - header.offsetHeight - 8;
    if (over > 0 && room > 0) window.scrollBy({ top: Math.min(over, room), behavior: reduce.matches ? 'instant' : 'smooth' });
  }

  function chooseSol(btn, opts) {
    opts = opts || {};
    var isOpen = btn.getAttribute('aria-expanded') === 'true';
    if (desk.matches) {
      if (isOpen) return;
      solButtons.forEach(function (b) { if (b !== btn) setSol(b, false); });
      setSol(btn, true);
      animatePanel(btn);
      return;
    }
    if (opts.instant) acc.classList.add('no-anim');
    solButtons.forEach(function (b) { if (b !== btn) setSol(b, false); });
    setSol(btn, opts.forceOpen ? true : !isOpen);
    if (opts.instant) { void acc.offsetHeight; acc.classList.remove('no-anim'); }
    else keepInPlace(btn);
  }

  solButtons.forEach(function (btn, i) {
    setSol(btn, i === 0);
    btn.addEventListener('click', function () { chooseSol(btn); });
  });

  // Atalhos do hero: abrem a solução e levam até ela
  $$('[data-sol-open]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var btn = solButtons[Number(a.getAttribute('data-sol-open')) - 1];
      if (!btn) return;
      e.preventDefault();
      chooseSol(btn, { forceOpen: true, instant: true });
      var target = desk.matches ? document.getElementById('solucoes') : btn;
      target.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
      btn.focus({ preventScroll: true });
    });
  });

  /* ---------- Processo: o símbolo percorre a linha e acende cada etapa ---------- */
  var how = $('[data-how]');
  var howBody = how && $('.how__body', how);
  var steps = how ? $$('.step', how) : [];
  var dot = $('[data-how-dot]');
  var fill = $('[data-how-fill]');
  var howN = $('[data-how-n]');
  var track = how && $('.how__track', how);
  var nodes = [];
  var horizontal = false;

  function layoutHow() {
    if (!how) return;
    horizontal = desk.matches;
    var tr = track.getBoundingClientRect();
    nodes = steps.map(function (s) {
      var n = $('.step__node', s).getBoundingClientRect();
      return horizontal ? n.left + n.width / 2 - tr.left : n.top + n.height / 2 - tr.top;
    });
  }

  function setHow(p) {
    if (!how || nodes.length < 2) return;
    var last = nodes.length - 1;
    var seg = clamp(p) * last;
    var i = Math.min(last - 1, Math.floor(seg));
    var pos = nodes[i] + (nodes[i + 1] - nodes[i]) * (seg - i);
    var len = horizontal ? track.offsetWidth : track.offsetHeight;
    dot.style.setProperty(horizontal ? '--x' : '--y', pos.toFixed(1) + 'px');
    dot.style.setProperty(horizontal ? '--y' : '--x', '0px');
    fill.style.setProperty('--p', (pos / len).toFixed(4));
    var active = 0;
    steps.forEach(function (s, k) {
      var on = seg >= k - 0.12;
      s.classList.toggle('is-on', on);
      if (on) active = k;
    });
    if (howN) howN.textContent = '0' + (active + 1);
  }

  /* ---------- Cenas de rolagem próprias (celular, tablet, desktop sem GSAP) ----------
     progresso 0 → 1 entre "o topo do elemento cruza a linha a" e
     "o fim do elemento (ou o topo, em modo 'top') cruza a linha b". */
  var words = $$('.dif__t .w');
  var difLine = $('.dif__line');
  var contactLine = $('.contact__line');

  function progress(el, a, b, mode, vh) {
    var r = el.getBoundingClientRect();
    var span = mode === 'top' ? vh * (a - b) : vh * (a - b) + r.height;
    return clamp((vh * a - r.top) / span);
  }

  function runScenes(vh) {
    if (reduce.matches) return;
    if (howBody) setHow(progress(howBody, 0.72, 0.62, 'end', vh));
    if (words.length) {
      var p = progress($('.dif__t'), 0.85, 0.55, 'end', vh) * words.length;
      words.forEach(function (w, i) {
        var k = clamp(p - i);
        w.style.opacity = (M.dim + (1 - M.dim) * k).toFixed(3);
        w.style.transform = 'translate3d(0,' + ((1 - k) * M.dist.s).toFixed(1) + 'px,0)';
      });
    }
    if (difLine) difLine.style.transform = 'scaleX(' + progress($('.dif__plus'), 0.9, 0.6, 'top', vh).toFixed(3) + ')';
    if (contactLine) contactLine.style.strokeDashoffset = (1 - progress(contact, 0.85, 0.15, 'top', vh)).toFixed(4);
  }

  function clearScenes() {
    words.forEach(function (w) { w.style.opacity = ''; w.style.transform = ''; });
    if (difLine) difLine.style.transform = '';
    if (contactLine) contactLine.style.strokeDashoffset = '';
  }

  /* ---------- Desktop: GSAP + ScrollTrigger, carregados sob demanda ---------- */
  function loadScript(src) {
    return new Promise(function (ok, fail) {
      var s = document.createElement('script');
      s.src = src; s.async = false;
      s.onload = ok; s.onerror = fail;
      document.head.appendChild(s);
    });
  }

  var gsapLoading = false;
  function bootGsap() {
    if (gsapLoading || reduce.matches || !desk.matches) return;
    gsapLoading = true;
    var ready = window.gsap && window.ScrollTrigger
      ? Promise.resolve()
      : Promise.all([loadScript('assets/vendor/gsap.min.js'), loadScript('assets/vendor/ScrollTrigger.min.js')]);
    ready.then(initGsap, function () { /* sem GSAP: as cenas próprias continuam */ });
  }

  function initGsap() {
    G = window.gsap; ST = window.ScrollTrigger;
    if (!G || !ST) return;
    G.registerPlugin(ST);
    root.classList.add('gsap');
    var mm = G.matchMedia();

    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', function () {
      gsapOn = true;
      clearScenes();
      layoutHow();

      // Processo fixo por pouco tempo (≈ 0,9 tela); se não couber, só acompanha
      var fits = how && how.offsetHeight < window.innerHeight * 0.85;
      if (how) ST.create({
        trigger: how,
        start: fits ? 'center center' : 'top 15%',
        end: fits ? '+=' + Math.round(window.innerHeight * 0.9) : 'bottom 60%',
        pin: fits,
        anticipatePin: 1,
        scrub: 0.5,
        invalidateOnRefresh: true,
        onRefresh: layoutHow,
        onUpdate: function (s) { setHow(s.progress); }
      });

      // Enquadramento do hero ao sair: o símbolo gira um quarto de volta
      G.to('.hero__mark g', { rotation: 90, transformOrigin: '50% 50%', ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } });
      G.to('.hero__band', { yPercent: -8, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } });

      // Manifesto: palavras acendem com a leitura; a linha lima se desenha
      if (words.length) G.fromTo(words, { opacity: M.dim, y: M.dist.s }, {
        opacity: 1, y: 0, ease: 'none', stagger: 0.25,
        scrollTrigger: { trigger: '.dif__t', start: 'top 85%', end: 'bottom 55%', scrub: 0.6 }
      });
      if (difLine) G.fromTo(difLine, { scaleX: 0 }, { scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: '.dif__plus', start: 'top 90%', end: 'top 60%', scrub: 0.6 } });

      // Contato: a curva da marca se desenha enquanto a seção entra
      if (contactLine) G.fromTo(contactLine, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none',
        scrollTrigger: { trigger: contact, start: 'top 85%', end: 'top 15%', scrub: 0.6 } });

      return function () { gsapOn = false; layoutHow(); onScroll(); };
    });

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  }

  // Carrega depois que a página terminou de abrir (não disputa com o primeiro
  // desenho); se a tela crescer até o desktop depois, carrega nessa hora.
  if (document.readyState === 'complete') bootGsap();
  else window.addEventListener('load', function () { window.setTimeout(bootGsap, 0); });
  desk.addEventListener('change', function (mq) {
    layoutHow();
    if (mq.matches) {
      bootGsap();
      if (!solButtons.some(function (b) { return b.getAttribute('aria-expanded') === 'true'; })) setSol(solButtons[0], true);
    }
  });

  /* ---------- Menu móvel ---------- */
  var toggle = $('[data-menu-toggle]');
  var menu = $('[data-menu]');
  var label = $('[data-menu-label]');
  var closeTimer;

  function setMenu(open) {
    window.clearTimeout(closeTimer);
    toggle.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Fechar menu' : 'Abrir menu';
    root.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      menu.hidden = false;
      void menu.offsetWidth; // garante a transição
      menu.classList.add('is-open');
      $('a', menu).focus({ preventScroll: true });
    } else {
      menu.classList.remove('is-open');
      closeTimer = window.setTimeout(function () { menu.hidden = true; }, reduce.matches ? 0 : 720);
    }
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (e.key === 'Escape') { setMenu(false); toggle.focus(); return; }
      if (e.key === 'Tab') { // foco preso entre o botão e os links do menu
        var f = [toggle].concat($$('a', menu));
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.matchMedia('(min-width: 1100px)').addEventListener('change', function (mq) { if (mq.matches) setMenu(false); });
  }

  /* ---------- Seção ativa no menu, com indicador que desliza ---------- */
  var navLinks = $$('.nav a');
  var navBar = $('[data-nav-bar]');
  var current = null;
  function moveBar() {
    if (!navBar) return;
    if (!current) { navBar.style.setProperty('--o', '0'); return; }
    navBar.style.setProperty('--x', current.offsetLeft + 'px');
    navBar.style.setProperty('--w', current.offsetWidth + 'px');
    navBar.style.setProperty('--o', '1');
  }
  if ('IntersectionObserver' in window && navLinks.length) {
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        current = null;
        navLinks.forEach(function (a) {
          if (a.getAttribute('href') === '#' + e.target.id) { a.setAttribute('aria-current', 'true'); current = a; }
          else a.removeAttribute('aria-current');
        });
        moveBar();
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['inicio', 'solucoes', 'empresas', 'sobre', 'conteudos', 'contato'].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) navIo.observe(s);
    });
  }

  /* ---------- Mapa sob demanda ----------
     O iframe do Google só carrega quando a pessoa pede: página mais leve e
     nenhum cookie de terceiros antes disso. */
  var map = $('[data-map]');
  var mapBtn = $('[data-map-load]');
  function refreshLater() { if (ST) window.setTimeout(function () { ST.refresh(); }, 800); }
  if (map && mapBtn) {
    mapBtn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.google.com/maps?q=' + encodeURIComponent('Rua Maranhão, 539 - Centro, Cascavel - PR, 85802-002') + '&output=embed';
      f.title = 'Mapa: GRO Cascavel, Rua Maranhão, 539, Centro, Cascavel/PR';
      f.loading = 'lazy';
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
      var close = document.createElement('button');
      close.type = 'button';
      close.className = 'btn map__close';
      close.textContent = 'Fechar mapa';
      close.addEventListener('click', function () {
        f.remove(); close.remove();
        map.classList.remove('is-loaded');
        mapBtn.focus();
        refreshLater();
      });
      map.appendChild(f);
      map.appendChild(close);
      map.classList.add('is-loaded');
      close.focus();
      refreshLater();
    });
  }

  /* ---------- Ano no rodapé ---------- */
  var year = $('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  var resizeT;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeT);
    resizeT = window.setTimeout(function () { layoutHow(); moveBar(); if (!gsapOn) runScenes(window.innerHeight); }, 120);
  });
  layoutHow();
  onScroll();
})();
