/* GRO Cascavel — interações do site.
   Sem bibliotecas: IntersectionObserver para as entradas, requestAnimationFrame
   para o parallax, e só transform/opacity nas animações. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var header = document.querySelector('[data-header]');
  var waFloat = document.querySelector('[data-wa-float]');
  var hero = document.getElementById('inicio');

  /* ---------- Header: transparente sobre o hero, sólido no scroll ---------- */
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var heroH = hero ? hero.offsetHeight : 600;

    header.classList.toggle('is-scrolled', y > 24);
    // Esconde o header ao descer bem abaixo do hero; reaparece ao subir.
    header.classList.toggle('is-hidden', y > heroH && y > lastY + 4 && !root.classList.contains('menu-open'));
    if (y < lastY - 4 || y <= heroH) header.classList.remove('is-hidden');

    if (waFloat) waFloat.classList.toggle('is-visible', y > heroH * 0.55);

    parallax();
    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  /* ---------- Parallax discreto nas imagens ---------- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));

  function parallax() {
    if (reduceMotion.matches) return;
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var frame = el.parentElement;
      if (!frame.classList.contains('is-in')) return;
      var r = frame.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      // -1 (entrando por baixo) a 1 (saindo por cima). A escala de 1.06 dá
      // margem para deslocar até 2,5% sem mostrar a borda.
      var p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2)));
      el.style.transform = 'translate3d(0,' + (p * 2.5).toFixed(2) + '%,0) scale(1.06)';
    });
  }

  /* ---------- Entradas no scroll ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');

  function reveal(el) {
    el.classList.add('is-in');
    if (el.getAttribute('data-reveal') === 'clip') {
      // Libera o parallax só depois que o reveal termina.
      var ph = el.querySelector('[data-parallax]');
      if (ph) window.setTimeout(function () { ph.style.transition = 'transform 240ms linear'; parallax(); }, 1800);
    }
  }

  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          reveal(entry.target._revealTarget || entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) {
      // Linhas do título ficam fora do pai (overflow: hidden) até entrar:
      // observa o pai, que está sempre visível.
      if (el.getAttribute('data-reveal') === 'line') {
        el.parentElement._revealTarget = el;
        io.observe(el.parentElement);
      } else {
        io.observe(el);
      }
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
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
      // Força o reflow para a transição de opacidade acontecer.
      void menu.offsetWidth;
      menu.classList.add('is-open');
      menu.querySelector('a').focus({ preventScroll: true });
    } else {
      menu.classList.remove('is-open');
      closeTimer = window.setTimeout(function () { menu.hidden = true; }, reduceMotion.matches ? 0 : 400);
    }
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
      // Mantém o foco dentro do menu aberto (menu + botão de fechar).
      if (e.key === 'Tab' && toggle.getAttribute('aria-expanded') === 'true') {
        var focusables = [toggle].concat(Array.prototype.slice.call(menu.querySelectorAll('a')));
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (mq) {
      if (mq.matches) setMenu(false);
    });
  }

  /* ---------- Seção ativa no menu ---------- */
  var navLinks = document.querySelectorAll('.nav__list a');
  if ('IntersectionObserver' in window && navLinks.length) {
    var sections = ['inicio', 'solucoes', 'empresas', 'sobre', 'contato']
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navIo.observe(s); });
  }

  /* ---------- Ano no rodapé ---------- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  onScroll();
})();
