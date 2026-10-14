/* Maguila's Restaurante & Grill — comportamento da página.
   Tudo aqui é melhoria: sem JavaScript, a página continua legível,
   o cardápio aparece inteiro e os links funcionam. */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- cabeçalho: ganha fundo depois de rolar ---------- */
  var header = document.querySelector('[data-header]');
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- menu do celular ---------- */
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-menu]');
  var mqDesktop = window.matchMedia('(min-width: 960px)');

  function setMenu(open, returnFocus) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.menu-toggle__label').textContent = open ? 'Fechar' : 'Menu';
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    if (open) {
      menu.querySelector('a').focus();
    } else if (returnFocus) {
      toggle.focus();
    }
  }

  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true', true);
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a') && toggle.getAttribute('aria-expanded') === 'true') setMenu(false, false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  mqDesktop.addEventListener('change', function (e) {
    if (e.matches) setMenu(false, false);
  });

  /* ---------- cardápio em abas (padrão WAI-ARIA, ativação automática) ---------- */
  var tablist = document.querySelector('[data-tabs]');
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });

    function select(index, focus) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
      var panel = panels[index];
      if (!reducedMotion) {
        panel.classList.remove('is-entering');
        void panel.offsetWidth; // reinicia a animação
        panel.classList.add('is-entering');
      }
      if (focus) {
        tabs[index].focus();
        tabs[index].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    }

    tablist.addEventListener('click', function (e) {
      var tab = e.target.closest('[role="tab"]');
      if (tab) select(tabs.indexOf(tab), true);
    });
    tablist.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var next = null;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next !== null) {
        e.preventDefault();
        select(next, true);
      }
    });

    tablist.hidden = false;
    select(0, false);
  }

  /* ---------- revelação ao rolar ---------- */
  var revealables = document.querySelectorAll('[data-reveal], .gallery__grid');

  // pequeno escalonamento dentro de cada grupo de irmãos
  document.querySelectorAll('[data-reveal-group], .moments__grid').forEach(function (group) {
    group.querySelectorAll(':scope > [data-reveal]').forEach(function (el, i) {
      el.style.setProperty('--d', (i * 0.09).toFixed(2) + 's');
    });
  });
  document.querySelectorAll('.gallery__grid li').forEach(function (li, i) {
    li.style.setProperty('--d', ((i % 6) * 0.07).toFixed(2) + 's');
  });

  if (!hasIO || reducedMotion) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { revealIO.observe(el); });
  }

  /* ---------- link ativo no menu ---------- */
  if (hasIO) {
    var navLinks = {};
    document.querySelectorAll('.nav__list a[href^="#"]').forEach(function (a) {
      navLinks[a.getAttribute('href').slice(1)] = a;
    });
    var sectionIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = navLinks[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          Object.keys(navLinks).forEach(function (k) { navLinks[k].removeAttribute('aria-current'); });
          link.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(navLinks).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) sectionIO.observe(s);
    });
  }

  /* ---------- barra de ação no celular ----------
     Aparece depois que a abertura sai da tela; some quando a seção de
     localização ou o rodapé entram (lá os mesmos botões já estão visíveis). */
  var dock = document.querySelector('[data-dock]');
  if (dock && hasIO) {
    var dockLinks = dock.querySelectorAll('a');
    var state = { pastHero: false, nearEnd: false };

    function renderDock() {
      var show = state.pastHero && !state.nearEnd;
      dock.classList.toggle('is-visible', show);
      dock.setAttribute('aria-hidden', String(!show));
      dockLinks.forEach(function (a) { a.tabIndex = show ? 0 : -1; });
      document.body.classList.toggle('dock-on', show);
    }

    new IntersectionObserver(function (entries) {
      state.pastHero = !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0;
      renderDock();
    }).observe(document.querySelector('.hero'));

    var endTargets = new Map();
    var endIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { endTargets.set(entry.target, entry.isIntersecting); });
      state.nearEnd = Array.from(endTargets.values()).some(Boolean);
      renderDock();
    });
    [document.getElementById('visite'), document.querySelector('.footer')].forEach(function (el) {
      endTargets.set(el, false);
      endIO.observe(el);
    });
  }

  /* ---------- aviso de prévia ---------- */
  var pill = document.querySelector('[data-preview-pill]');
  if (pill) {
    pill.querySelector('[data-preview-close]').addEventListener('click', function () {
      pill.classList.add('is-closed');
    });
  }
})();
