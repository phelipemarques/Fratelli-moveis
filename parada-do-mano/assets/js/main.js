/* =====================================================================
   PARADA DO MANO — comportamento da página
   Sem bibliotecas. Tudo aqui é melhoria progressiva: sem JavaScript o
   conteúdo inteiro continua visível e os links continuam funcionando.
   ===================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Cabeçalho: fundo sólido depois do topo ---------- */
  var header = document.querySelector('[data-header]');
  var actionBar = document.querySelector('[data-action-bar]');
  var hero = document.getElementById('inicio');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('is-scrolled', y > 24);
    if (actionBar && hero) {
      actionBar.classList.toggle('is-visible', y > hero.offsetHeight * 0.6);
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- Menu do celular ---------- */
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-menu]');
  var label = toggle && toggle.querySelector('.menu-toggle-label');
  var outside = [document.querySelector('main'), document.querySelector('.site-footer'), actionBar];
  var lastFocus = null;

  if (toggle && menu) {
    menu.querySelectorAll('.mobile-menu-nav li').forEach(function (li, i) {
      li.style.setProperty('--i', i);
    });

    var setOutsideInert = function (on) {
      outside.forEach(function (el) {
        if (!el) return;
        if (on) { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true'); }
        else { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); }
      });
    };

    var openMenu = function () {
      lastFocus = document.activeElement;
      menu.hidden = false;
      // um quadro depois, para a transição partir do estado fechado
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { menu.classList.add('is-open'); });
      });
      toggle.setAttribute('aria-expanded', 'true');
      if (label) label.textContent = 'Fechar';
      header.classList.add('menu-open');
      document.body.style.overflow = 'hidden';
      setOutsideInert(true);
      var first = menu.querySelector('a');
      if (first) first.focus({ preventScroll: true });
    };

    var closeMenu = function (returnFocus) {
      if (menu.hidden) return;
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (label) label.textContent = 'Menu';
      header.classList.remove('menu-open');
      document.body.style.overflow = '';
      setOutsideInert(false);
      var done = function () { if (!menu.classList.contains('is-open')) menu.hidden = true; };
      if (reduceMotion.matches) done(); else window.setTimeout(done, 320);
      if (returnFocus !== false) toggle.focus({ preventScroll: true });
    };

    toggle.addEventListener('click', function () {
      if (toggle.getAttribute('aria-expanded') === 'true') closeMenu(); else openMenu();
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('[data-menu-link]')) closeMenu(false);
    });

    document.addEventListener('keydown', function (e) {
      if (menu.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
      if (e.key !== 'Tab') return;
      // foco preso entre o botão do menu e os itens do painel
      var items = [toggle].concat(Array.prototype.slice.call(menu.querySelectorAll('a, button')));
      var firstEl = items[0], lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    });

    window.matchMedia('(min-width: 1100px)').addEventListener('change', function (mq) {
      if (mq.matches) closeMenu(false);
    });
  }

  /* ---------- Revelação na rolagem ---------- */
  if ('IntersectionObserver' in window) {
    var targets = document.querySelectorAll('[data-reveal], [data-day]');
    root.classList.add('reveal-ready');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });

    // item do menu do topo que corresponde à seção na tela
    var navLinks = document.querySelectorAll('.nav-desktop a');
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = byId[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.remove('is-current'); a.removeAttribute('aria-current'); });
          link.classList.add('is-current');
          link.setAttribute('aria-current', 'location');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) spy.observe(sec);
    });
  }

  /* ---------- Vídeo da abertura ----------
     Só no computador, sem movimento reduzido e sem economia de dados.
     A foto continua por baixo: se o vídeo não carregar, nada muda. */
  var heroVideo = document.querySelector('.hero-video');
  var wide = window.matchMedia('(min-width: 960px)');
  var saveData = navigator.connection && navigator.connection.saveData;
  if (heroVideo && wide.matches && !reduceMotion.matches && !saveData) {
    // H.264 quando o navegador tiver (decodificação por hardware); senão, VP9
    var mp4 = heroVideo.canPlayType('video/mp4; codecs="avc1.640028"');
    heroVideo.src = heroVideo.getAttribute(mp4 ? 'data-src-mp4' : 'data-src-webm') || heroVideo.getAttribute('data-src-mp4');
    heroVideo.addEventListener('playing', function () { heroVideo.classList.add('is-playing'); });
    var tryPlay = function () {
      var p = heroVideo.play();
      if (p && p.catch) p.catch(function () { /* autoplay bloqueado: fica a foto */ });
    };
    var started = false;
    // espera a entrada da abertura terminar para não disputar banda com a foto
    window.setTimeout(function () { started = true; tryPlay(); }, 1200);
    // fora da tela, o vídeo pausa (economiza bateria); de volta, continua
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (!started) return;
        if (entries[0].isIntersecting) tryPlay(); else heroVideo.pause();
      }).observe(heroVideo);
    }
    reduceMotion.addEventListener('change', function (mq) {
      if (mq.matches) { heroVideo.pause(); heroVideo.classList.remove('is-playing'); }
    });
  }

  /* ---------- Cardápio em abas ---------- */
  var tabsRoot = document.querySelector('[data-tabs]');
  if (tabsRoot) {
    var tablist = tabsRoot.querySelector('[data-tablist]');
    var tabs = Array.prototype.slice.call(tabsRoot.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var stepper = tabsRoot.querySelector('[data-stepper]');
    var current = 0;

    var scrollTabIntoView = function (tab) {
      var left = tab.offsetLeft - (tablist.clientWidth - tab.offsetWidth) / 2;
      tablist.scrollTo({ left: Math.max(0, left), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    };

    var activate = function (index, opts) {
      opts = opts || {};
      if (index < 0) index = tabs.length - 1;
      if (index >= tabs.length) index = 0;
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
      var panel = panels[index];
      panel.classList.remove('is-entering');
      void panel.offsetWidth; // reinicia a animação curta de entrada
      panel.classList.add('is-entering');
      current = index;
      scrollTabIntoView(tabs[index]);
      if (opts.focusTab) tabs[index].focus({ preventScroll: true });
    };

    tablist.hidden = false;
    if (stepper) stepper.hidden = false;

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { activate(i); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = i + 1;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = i - 1;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        if (next === null) return;
        e.preventDefault();
        activate(next, { focusTab: true });
      });
    });

    panels.forEach(function (p) {
      p.addEventListener('animationend', function () { p.classList.remove('is-entering'); });
    });

    if (stepper) {
      stepper.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-step]');
        if (!btn) return;
        activate(current + Number(btn.getAttribute('data-step')));
        // se o topo do cardápio saiu da tela, traz a categoria nova para a vista
        var top = tablist.getBoundingClientRect().top;
        if (top < 0) {
          tabsRoot.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
        }
      });
    }

    // link direto para uma categoria: #cat-feijoada, por exemplo
    var fromHash = panels.findIndex(function (p) { return '#' + p.id === window.location.hash; });
    activate(fromHash > -1 ? fromHash : 0);
    tabsRoot.querySelectorAll('.menu-panel').forEach(function (p) { p.classList.remove('is-entering'); });
  }

  /* ---------- Galeria ampliada ---------- */
  var gallery = document.querySelector('[data-gallery]');
  var dialog = document.querySelector('[data-lightbox]');
  if (gallery && dialog && typeof dialog.showModal === 'function') {
    var links = Array.prototype.slice.call(gallery.querySelectorAll('.g-link'));
    var lbImg = dialog.querySelector('[data-lightbox-img]');
    var lbCap = dialog.querySelector('[data-lightbox-cap]');
    var lbCount = dialog.querySelector('[data-lightbox-count]');
    var idx = 0;
    var opener = null;

    links.forEach(function (link) {
      link.setAttribute('aria-haspopup', 'dialog');
      var cap = link.querySelector('.g-cap');
      link.setAttribute('aria-label', 'Ampliar foto: ' + (cap ? cap.textContent : ''));
    });

    var show = function (i, swap) {
      idx = (i + links.length) % links.length;
      var link = links[idx];
      var thumb = link.querySelector('img');
      lbImg.src = link.getAttribute('data-full');
      lbImg.alt = thumb ? thumb.alt : '';
      lbCap.textContent = (link.querySelector('.g-cap') || {}).textContent || '';
      lbCount.textContent = (idx + 1) + ' / ' + links.length;
      if (swap) {
        lbImg.classList.remove('is-swapping');
        void lbImg.offsetWidth;
        lbImg.classList.add('is-swapping');
      }
    };

    links.forEach(function (link, i) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        opener = link;
        show(i, false);
        dialog.showModal();
        document.body.classList.add('lb-open');
        dialog.querySelector('[data-lightbox-close]').focus();
      });
    });

    dialog.querySelector('[data-lightbox-close]').addEventListener('click', function () { dialog.close(); });
    dialog.querySelector('[data-lightbox-prev]').addEventListener('click', function () { show(idx - 1, true); });
    dialog.querySelector('[data-lightbox-next]').addEventListener('click', function () { show(idx + 1, true); });
    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1, true); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1, true); }
    });
    // clique fora da foto e dos botões fecha
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog || e.target.classList.contains('lightbox-inner')) dialog.close();
    });
    dialog.addEventListener('close', function () {
      document.body.classList.remove('lb-open');
      if (opener) opener.focus({ preventScroll: true });
    });
  }
})();
