/* GRO Cascavel — interações.
   Sem bibliotecas. Só transform, opacity e stroke-dashoffset animados. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var header = document.querySelector('[data-header]');
  var hero = document.getElementById('inicio');
  var wa = document.querySelector('[data-wa]');

  /* ---------- Header e botão flutuante ---------- */
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var heroH = hero ? hero.offsetHeight : 700;
    var menuOpen = root.classList.contains('menu-open');

    header.classList.toggle('is-solid', y > 32);
    if (!menuOpen) {
      if (y > heroH && y > lastY + 6) header.classList.add('is-hidden');
      else if (y < lastY - 6 || y <= heroH) header.classList.remove('is-hidden');
    }
    if (wa) wa.classList.toggle('is-on', y > heroH * 0.6);

    drawProcess();
    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  /* ---------- Entradas por viewport (fora do hero) ---------- */
  var rvs = Array.prototype.filter.call(document.querySelectorAll('.rv'), function (el) {
    return !el.closest('.hero');
  });

  if ('IntersectionObserver' in window && !reduce.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    rvs.forEach(function (el) { io.observe(el); });
  } else {
    rvs.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Soluções ----------
     Uma só marcação: no celular é acordeão (abre e fecha); no desktop o CSS
     põe a lista à esquerda e o painel aberto à direita, e sempre há uma
     solução aberta. */
  var desk = window.matchMedia('(min-width: 1024px)');
  var solButtons = Array.prototype.slice.call(document.querySelectorAll('.sol__btn'));
  function setSol(btn, open) {
    btn.setAttribute('aria-expanded', String(open));
    document.getElementById(btn.getAttribute('aria-controls')).classList.toggle('is-open', open);
  }
  solButtons.forEach(function (btn, i) {
    setSol(btn, i === 0);
    btn.addEventListener('click', function () {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      if (isOpen && desk.matches) return; // no desktop, clicar no ativo não o fecha
      solButtons.forEach(function (b) { if (b !== btn) setSol(b, false); });
      setSol(btn, !isOpen);
    });
  });
  desk.addEventListener('change', function (mq) {
    if (mq.matches && !solButtons.some(function (b) { return b.getAttribute('aria-expanded') === 'true'; })) setSol(solButtons[0], true);
  });

  /* ---------- Processo: a linha acompanha a leitura dos passos ---------- */
  var how = document.querySelector('[data-how]');
  var stepsBox = how && how.querySelector('.steps');
  var steps = how ? Array.prototype.slice.call(how.querySelectorAll('.step')) : [];
  var howN = how && how.querySelector('[data-how-n]');

  function drawProcess() {
    if (!how) return;
    var vh = window.innerHeight;
    var r = stepsBox.getBoundingClientRect();
    var mark = vh * 0.55; // linha de leitura: um pouco abaixo do meio da tela
    var p = reduce.matches ? 1 : Math.min(1, Math.max(0, (mark - r.top) / r.height));
    how.style.setProperty('--p', p.toFixed(3));
    var active = -1;
    steps.forEach(function (s, i) {
      var on = reduce.matches || s.getBoundingClientRect().top < mark;
      s.classList.toggle('is-on', on);
      if (on) active = i;
    });
    if (howN) howN.textContent = '0' + Math.max(1, active + 1);
  }

  /* ---------- Menu móvel ---------- */
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-menu]');
  var label = document.querySelector('[data-menu-label]');
  var closeTimer;

  function setMenu(open) {
    window.clearTimeout(closeTimer);
    toggle.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Fechar menu' : 'Abrir menu';
    root.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      menu.hidden = false;
      void menu.offsetWidth; // garante a transição de opacidade
      menu.classList.add('is-open');
      menu.querySelector('a').focus({ preventScroll: true });
    } else {
      menu.classList.remove('is-open');
      closeTimer = window.setTimeout(function () { menu.hidden = true; }, reduce.matches ? 0 : 360);
    }
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (e.key === 'Escape') { setMenu(false); toggle.focus(); return; }
      if (e.key === 'Tab') { // foco preso entre o botão e os links do menu
        var f = [toggle].concat(Array.prototype.slice.call(menu.querySelectorAll('a')));
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.matchMedia('(min-width: 1100px)').addEventListener('change', function (mq) { if (mq.matches) setMenu(false); });
  }

  /* ---------- Seção ativa no menu ---------- */
  var navLinks = document.querySelectorAll('.nav a');
  if ('IntersectionObserver' in window && navLinks.length) {
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) {
          if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['inicio', 'solucoes', 'empresas', 'sobre', 'conteudos'].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) navIo.observe(s);
    });
  }

  /* ---------- Mapa sob demanda ----------
     O iframe do Google só carrega quando a pessoa pede: página mais leve e
     nenhum cookie de terceiros antes disso. */
  var map = document.querySelector('[data-map]');
  var mapBtn = document.querySelector('[data-map-load]');
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
      });
      map.appendChild(f);
      map.appendChild(close);
      map.classList.add('is-loaded');
      close.focus();
    });
  }

  /* ---------- Ano no rodapé ---------- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  window.addEventListener('resize', drawProcess);
  onScroll();
})();
