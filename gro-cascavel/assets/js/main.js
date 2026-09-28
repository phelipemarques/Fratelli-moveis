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
    parallax();
    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  /* ---------- Parallax quase imperceptível na foto documental ---------- */
  var drifting = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  function parallax() {
    if (reduce.matches) return;
    var vh = window.innerHeight;
    drifting.forEach(function (el) {
      var r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); // -1 a 1
      el.style.transform = 'translate3d(0,' + (Math.max(-1, Math.min(1, p)) * 14).toFixed(1) + 'px,0)';
    });
  }

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

  /* ---------- Acordeão das soluções ---------- */
  var accButtons = document.querySelectorAll('.acc__btn');
  var shots = document.querySelectorAll('[data-shot]');
  // Cada solução tem uma foto; ao abrir a solução, a foto do palco troca junto.
  function showShot(id) {
    shots.forEach(function (s) { s.classList.toggle('is-on', s.getAttribute('data-shot') === id); });
  }
  function setAcc(btn, open) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);
    if (open) showShot(btn.getAttribute('aria-controls'));
  }
  accButtons.forEach(function (btn, i) {
    setAcc(btn, i === 0); // a primeira solução começa aberta, como exemplo do que há dentro
    btn.addEventListener('click', function () {
      var willOpen = btn.getAttribute('aria-expanded') !== 'true';
      accButtons.forEach(function (b) { if (b !== btn) setAcc(b, false); });
      setAcc(btn, willOpen);
    });
  });

  /* ---------- "Como ajudamos": a curva se desenha com o scroll ---------- */
  var how = document.querySelector('[data-how]');
  var howSvg = how && how.querySelector('.how__arc');
  var howLine = how && how.querySelector('.how__line');
  var steps = how ? Array.prototype.slice.call(how.querySelectorAll('.step')) : [];
  var stepAt = []; // fração da curva em que cada passo fica

  function placeNodes() {
    stepAt = [];
    if (!howSvg || getComputedStyle(howSvg).display === 'none') {
      steps.forEach(function (s) { s.style.removeProperty('--node-x'); s.style.removeProperty('--node-y'); });
      return;
    }
    var box = howSvg.getBoundingClientRect();
    var sx = box.width / 1200;
    var sy = box.height / 160;
    var total = howLine.getTotalLength();
    steps.forEach(function (step) {
      var sb = step.getBoundingClientRect();
      var targetX = (sb.left - box.left + 8) / sx; // nó alinhado ao início do texto
      // busca binária do ponto da curva com esse x
      var lo = 0, hi = total, pt;
      for (var k = 0; k < 24; k++) {
        var mid = (lo + hi) / 2;
        pt = howLine.getPointAtLength(mid);
        if (pt.x < targetX) lo = mid; else hi = mid;
      }
      stepAt.push(lo / total);
      step.style.setProperty('--node-x', (pt.x * sx - (sb.left - box.left)) + 'px');
      step.style.setProperty('--node-y', (pt.y * sy - (sb.top - box.top)) + 'px');
    });
  }

  function drawProcess() {
    if (!how) return;
    var r = how.getBoundingClientRect();
    var vh = window.innerHeight;
    // 0 quando o bloco entra pela base; 1 quando o topo chega a 35% da tela
    var p = reduce.matches ? 1 : Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.65 + 120)));
    how.style.setProperty('--p', p.toFixed(3));
    var mobile = !stepAt.length;
    steps.forEach(function (s, i) {
      var threshold = mobile ? (i + 0.5) / steps.length : stepAt[i];
      s.classList.toggle('is-on', p >= threshold);
    });
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
    ['inicio', 'solucoes', 'empresas', 'sobre', 'conteudos', 'contato'].forEach(function (id) {
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

  window.addEventListener('resize', function () { placeNodes(); drawProcess(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { placeNodes(); drawProcess(); });
  placeNodes();
  onScroll();
})();
