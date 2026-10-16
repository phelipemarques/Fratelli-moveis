/* =====================================================================
   PARADA DO MANO — comportamento da página (V4)
   Sem bibliotecas. Tudo aqui é melhoria progressiva: sem JavaScript o
   conteúdo inteiro continua visível e os links continuam funcionando.
   ===================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Tokens de movimento: os mesmos do CSS (:root), lidos só quando a primeira
  // animação acontece, nunca durante a carga
  var styles = null;
  function token(name, fallback) {
    if (!styles) styles = window.getComputedStyle(root);
    return styles.getPropertyValue(name).trim() || fallback;
  }
  function ms(value) { return /ms$/.test(value) ? parseFloat(value) : parseFloat(value) * 1000; }

  // Animação curta via Web Animations API: não precisa forçar reflow para reiniciar
  function entrance(el, frames) {
    if (reduceMotion.matches || !el.animate) return;
    el.animate(frames, { duration: ms(token('--dur-s', '.28s')), easing: token('--ease-out', 'ease-out') });
  }

  // Roda depois que o quadro foi desenhado: aí o layout já está calculado e ler
  // medidas (scrollY, scrollWidth, getBoundingClientRect) não custa nada
  function afterPaint(fn) {
    window.requestAnimationFrame(function () { setTimeout(fn, 0); });
  }

  /* ---------- Cabeçalho: fundo sólido depois do topo ---------- */
  var header = document.querySelector('[data-header]');
  var actionBar = document.querySelector('[data-action-bar]');
  var hero = document.getElementById('inicio');
  var heroLimit = null; // medido no primeiro quadro de rolagem, nunca durante a carga
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (heroLimit === null) heroLimit = hero ? hero.offsetHeight * 0.6 : 0;
    header.classList.toggle('is-scrolled', y > 24);
    if (actionBar) actionBar.classList.toggle('is-visible', y > heroLimit);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', function () { heroLimit = null; }, { passive: true });
  // página aberta já rolada (âncora, voltar): a medida espera o primeiro quadro desenhado,
  // para não obrigar o navegador a calcular o layout no meio do carregamento
  afterPaint(function () { if (window.scrollY > 0) onScroll(); });

  /* ---------- Menu do celular ---------- */
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-menu]');
  var label = toggle && toggle.querySelector('.menu-toggle-label');
  var outside = [document.querySelector('main'), document.querySelector('.site-footer'), actionBar];

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
      menu.hidden = false;
      // um quadro depois, para a transição partir do estado fechado
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { menu.classList.add('is-open'); });
      });
      toggle.setAttribute('aria-expanded', 'true');
      if (label) label.textContent = 'Fechar';
      header.classList.add('menu-open');
      document.body.classList.add('menu-is-open');
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
      document.body.classList.remove('menu-is-open');
      document.body.style.overflow = '';
      setOutsideInert(false);
      var done = function () { if (!menu.classList.contains('is-open')) menu.hidden = true; };
      if (reduceMotion.matches) done(); else window.setTimeout(done, ms(token('--dur-m', '.45s')));
      if (returnFocus !== false) toggle.focus({ preventScroll: true });
    };

    toggle.addEventListener('click', function () {
      if (toggle.getAttribute('aria-expanded') === 'true') closeMenu(); else openMenu();
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('[data-menu-link]')) closeMenu(false);
    });

    // tablet girado com o menu aberto: a tela larga não tem esse menu, então ele fecha
    // (senão a página ficaria travada, sem rolagem e inerte)
    var wide = window.matchMedia('(min-width: 1100px)');
    var onWide = function () { if (wide.matches) closeMenu(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide); else wide.addListener(onWide);

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

  /* ---------- Revelação na rolagem e menu do topo ---------- */
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
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });
    targets.forEach(function (el) { io.observe(el); });

    // brasas, brilho e faixa corrida param quando saem da tela
    var loops = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { entry.target.classList.toggle('is-paused', !entry.isIntersecting); });
    });
    document.querySelectorAll('.hero, .ticker, .grill').forEach(function (el) { loops.observe(el); });

    // item do menu do topo que corresponde à seção na tela
    var navLinks = document.querySelectorAll('.nav-desktop a');
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var link = byId[entry.target.id];
        navLinks.forEach(function (a) { a.classList.remove('is-current'); a.removeAttribute('aria-current'); });
        // na abertura nenhum item fica marcado
        if (!link) return;
        link.classList.add('is-current');
        link.setAttribute('aria-current', 'location');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).concat(['inicio']).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) spy.observe(sec);
    });
  }

  /* ---------- Vídeo da abertura ----------
     Só no computador e só depois que a página terminou de carregar (a foto da
     abertura, que é o maior elemento da tela, nunca disputa banda com ele).
     Não carrega com movimento reduzido, economia de dados ou rede lenta.
     A foto fica por baixo: se o vídeo falhar, a abertura continua igual. */
  var heroVideo = document.querySelector('.hero-video');
  var conn = navigator.connection || {};
  var slowNet = /(^|-)2g|3g/.test(conn.effectiveType || '');
  var canVideo = heroVideo && window.matchMedia('(min-width: 960px)').matches &&
    !reduceMotion.matches && !conn.saveData && !slowNet;

  if (canVideo) {
    var startVideo = function () {
      // H.264 quando o navegador tiver (decodificação por hardware); senão, VP9
      var mp4 = heroVideo.getAttribute('data-src-mp4');
      var webm = heroVideo.getAttribute('data-src-webm');
      var canMp4 = mp4 && heroVideo.canPlayType('video/mp4; codecs="avc1.640028"');
      heroVideo.src = canMp4 ? mp4 : (webm || mp4);
      heroVideo.addEventListener('playing', function () { heroVideo.classList.add('is-playing'); });
      heroVideo.addEventListener('error', function () { heroVideo.removeAttribute('src'); }, { once: true });
      var visible = true;
      var tryPlay = function () {
        if (!visible || document.hidden) return;
        var p = heroVideo.play();
        if (p && p.catch) p.catch(function () { /* autoplay bloqueado: fica a foto */ });
      };
      // fora da tela ou com a aba em segundo plano, o vídeo pausa
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          if (visible) tryPlay(); else heroVideo.pause();
        }).observe(heroVideo);
      }
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) heroVideo.pause(); else tryPlay();
      });
      reduceMotion.addEventListener('change', function (mq) {
        if (mq.matches) { heroVideo.pause(); heroVideo.classList.remove('is-playing'); }
      });
      tryPlay();
    };
    var whenIdle = function () {
      if ('requestIdleCallback' in window) window.requestIdleCallback(startVideo, { timeout: 2500 });
      else window.setTimeout(startVideo, 800);
    };
    if (document.readyState === 'complete') whenIdle();
    else window.addEventListener('load', whenIdle, { once: true });
  }

  /* ---------- Cardápio em abas ---------- */
  var tabsRoot = document.querySelector('[data-tabs]');
  if (tabsRoot) {
    var tablist = tabsRoot.querySelector('[data-tablist]');
    var tabsWrap = tabsRoot.querySelector('[data-tabs-wrap]');
    var tabs = Array.prototype.slice.call(tabsRoot.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var stepper = tabsRoot.querySelector('[data-stepper]');
    var stepStatus = tabsRoot.querySelector('[data-step-status]');
    var current = 0;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };

    // a aba escolhida fica sempre à vista; só rola a lista se ela estiver cortada
    var keepTabVisible = function (tab) {
      var listBox = tablist.getBoundingClientRect();
      var tabBox = tab.getBoundingClientRect();
      var margin = 28;
      if (tabBox.left >= listBox.left + margin && tabBox.right <= listBox.right - margin) return;
      var delta = (tabBox.left + tabBox.width / 2) - (listBox.left + listBox.width / 2);
      tablist.scrollBy({ left: delta, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    };

    // bordas esmaecidas só onde a lista continua
    var edgeTick = false;
    var updateEdges = function () {
      var max = tablist.scrollWidth - tablist.clientWidth;
      tabsWrap.classList.toggle('is-scrolled', tablist.scrollLeft > 4);
      tabsWrap.classList.toggle('is-end', tablist.scrollLeft >= max - 4);
      edgeTick = false;
    };
    tablist.addEventListener('scroll', function () {
      if (!edgeTick) { edgeTick = true; window.requestAnimationFrame(updateEdges); }
    }, { passive: true });

    // Fotos sob demanda: as fotos das categorias fechadas guardam o endereço e só o
    // recebem quando a categoria (ou a vizinha, para a troca sair instantânea) é aberta.
    // Sem JavaScript, todas aparecem normalmente, uma categoria embaixo da outra.
    var park = function (panel) {
      panel.querySelectorAll('source[srcset]').forEach(function (src) {
        src.setAttribute('data-srcset', src.getAttribute('srcset'));
        src.removeAttribute('srcset');
      });
      panel.querySelectorAll('img[src]').forEach(function (img) {
        img.setAttribute('data-src', img.getAttribute('src'));
        if (img.hasAttribute('srcset')) img.setAttribute('data-srcset', img.getAttribute('srcset'));
        img.removeAttribute('srcset');
        img.removeAttribute('src');
      });
    };
    var wake = function (panel) {
      if (!panel) return;
      panel.querySelectorAll('source[data-srcset]').forEach(function (src) {
        src.setAttribute('srcset', src.getAttribute('data-srcset'));
        src.removeAttribute('data-srcset');
      });
      panel.querySelectorAll('img[data-src]').forEach(function (img) {
        if (img.hasAttribute('data-srcset')) img.setAttribute('srcset', img.getAttribute('data-srcset'));
        img.setAttribute('src', img.getAttribute('data-src'));
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
      });
    };

    var activate = function (index, opts) {
      opts = opts || {};
      index = (index + tabs.length) % tabs.length;
      wake(panels[index]);
      if (index === current && !opts.force) {
        if (opts.focusTab) tabs[index].focus({ preventScroll: true });
        return;
      }
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
      current = index;
      if (stepStatus) stepStatus.textContent = pad(index + 1) + ' / ' + pad(tabs.length);
      // com o GSAP ativo (cinema.js), a transição é dele; senão, a entrada curta daqui
      if (opts.animate !== false && !root.classList.contains('cine-on')) {
        entrance(panels[index], [{ opacity: 0, transform: 'translateY(' + token('--swap-shift', '8px') + ')' }, { opacity: 1, transform: 'none' }]);
      }
      tabsRoot.dispatchEvent(new CustomEvent('menu:change', {
        detail: { index: index, tab: tabs[index], panel: panels[index], animate: opts.animate !== false }
      }));
      // na carga não mede nada: medir logo depois de mudar o DOM força o navegador
      // a recalcular o layout da página inteira (reflow forçado)
      if (!opts.init) keepTabVisible(tabs[index]);
      if (opts.focusTab) tabs[index].focus({ preventScroll: true });
      // a vizinha da frente e a de trás já ficam carregadas
      wake(panels[(index + 1) % tabs.length]);
      wake(panels[(index - 1 + tabs.length) % tabs.length]);
    };


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

    if (stepper) {
      stepper.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-step]');
        if (!btn) return;
        var headerH = header ? header.offsetHeight : 0;
        var listOut = tablist.getBoundingClientRect().top < headerH;
        var before = stepper.getBoundingClientRect().top;
        activate(current + Number(btn.getAttribute('data-step')));
        if (listOut) {
          // o topo do cardápio estava fora da tela: traz a categoria nova para a vista
          tabsRoot.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
        } else {
          // cada categoria tem a altura do próprio conteúdo: o botão fica parado sob o dedo
          var shift = stepper.getBoundingClientRect().top - before;
          if (shift) window.scrollBy(0, shift);
        }
      });
    }

    // link direto para uma categoria: #cat-feijoada, por exemplo
    var fromHash = panels.findIndex(function (p) { return '#' + p.id === window.location.hash; });
    panels.forEach(function (p, i) { if (i !== (fromHash > -1 ? fromHash : 0)) park(p); });
    current = -1;
    tablist.hidden = false;
    if (stepper) stepper.hidden = false;
    activate(fromHash > -1 ? fromHash : 0, { animate: false, init: true });
    afterPaint(function () {
      if (fromHash > 0) keepTabVisible(tabs[fromHash]);
      updateEdges();
    });
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
      // o nome acessível começa pelo texto visível (WCAG 2.5.3)
      link.setAttribute('aria-label', (cap ? cap.textContent : 'Foto') + ': ampliar foto');
    });

    // tela pequena recebe a versão de 800 px; a de 1200 px fica para telas grandes
    var fullSrc = function (link) {
      var small = link.getAttribute('data-full-sm');
      return small && window.innerWidth * (window.devicePixelRatio || 1) <= 1100 ? small : link.getAttribute('data-full');
    };
    var preload = function (i) {
      var img = new Image();
      img.decoding = 'async';
      img.src = fullSrc(links[(i + links.length) % links.length]);
    };

    var show = function (i, swap) {
      idx = (i + links.length) % links.length;
      var link = links[idx];
      var thumb = link.querySelector('img');
      // largura e altura da miniatura: o espaço da foto fica reservado enquanto ela carrega
      if (thumb) {
        lbImg.width = thumb.getAttribute('width');
        lbImg.height = thumb.getAttribute('height');
      }
      lbImg.src = fullSrc(link);
      lbImg.alt = thumb ? thumb.alt : '';
      lbCap.textContent = (link.querySelector('.g-cap') || {}).textContent || '';
      lbCount.textContent = (idx + 1) + ' / ' + links.length;
      if (swap) entrance(lbImg, [{ opacity: 0, transform: 'scale(' + token('--swap-scale', '.985') + ')' }, { opacity: 1, transform: 'none' }]);
      // as vizinhas só depois que esta já está na tela: o clique responde primeiro
      var ahead = idx;
      var later = window.requestIdleCallback || function (fn) { return window.setTimeout(fn, 200); };
      later(function () { preload(ahead + 1); preload(ahead - 1); });
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
    // deslizar o dedo na foto ampliada troca de foto
    var touchX = null;
    dialog.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    dialog.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1), true);
    }, { passive: true });
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
