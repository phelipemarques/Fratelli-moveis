/* ============================================================
   AXIS V2 — interface
   Não depende de biblioteca. Módulos, em ordem:
   whatsapp · cabeçalho · menu · indicador de seção · serviços ·
   barra fixa · galeria (contagem + lightbox)
   ============================================================ */

(function () {
  'use strict';

  var d = document;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }


  /* ---------- WhatsApp ----------
     Uma fonte só para as mensagens. Sem JavaScript, o link abre o
     WhatsApp sem texto pronto; com ele, cada botão leva a sua mensagem.
     Abrir o WhatsApp é um pedido de contato, não um agendamento. */
  var WA_NUMBER = '5545991159425';
  var WA_TEXT = {
    geral: 'Olá, AXIS! Vim pelo site e gostaria de mais informações.',
    musculacao: 'Olá, AXIS! Vim pelo site e quero saber mais sobre a musculação.',
    fisioterapia: 'Olá, AXIS! Vim pelo site e quero saber mais sobre a fisioterapia.',
    pilates: 'Olá, AXIS! Vim pelo site e quero saber mais sobre o pilates.'
  };
  $$('[data-wa]').forEach(function (a) {
    var text = WA_TEXT[a.getAttribute('data-wa')] || WA_TEXT.geral;
    a.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
  });


  /* ---------- Cabeçalho ---------- */
  var hdr = $('#hdr');
  var lastY = scrollY;
  var ticking = false;
  var menuOpen = false;

  function onScroll() {
    var y = scrollY;
    hdr.classList.toggle('is-solid', y > 24);
    if (!menuOpen) {
      if (y > lastY + 4 && y > 520) hdr.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 520) hdr.classList.remove('is-hidden');
    }
    lastY = y;
    ticking = false;
  }
  addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
  hdr.addEventListener('focusin', function () { hdr.classList.remove('is-hidden'); });


  /* ---------- Menu (celular e tablet) ----------
     Painel com foco preso, Esc, rolagem travada e foco devolvido. */
  var toggle = $('.hdr__menu');
  var menu = $('#menu');
  var scrim = $('.scrim');
  var outside = [$('main'), $('footer'), $('#dock')];

  // Ordem do documento: o botão vem antes do painel.
  function focusables() { return [toggle].concat($$('a, button', menu)); }

  function setMenu(open, restoreFocus) {
    menuOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    hdr.classList.toggle('is-open', open);
    d.body.classList.toggle('is-locked', open);
    outside.forEach(function (el) { if (el) el.inert = open; });
    if (open) {
      hdr.classList.remove('is-hidden');
      menu.hidden = false;
      scrim.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add('is-open'); }); });
      $('a', menu).focus({ preventScroll: true });
    } else {
      menu.classList.remove('is-open');
      scrim.hidden = true;
      setTimeout(function () { if (!menuOpen) menu.hidden = true; }, reduce ? 0 : 300);
      if (restoreFocus) toggle.focus({ preventScroll: true });
    }
  }
  toggle.addEventListener('click', function () { setMenu(!menuOpen, true); });
  scrim.addEventListener('click', function () { setMenu(false, true); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false, false); });
  d.addEventListener('keydown', function (e) {
    if (!menuOpen) return;
    if (e.key === 'Escape') { setMenu(false, true); return; }
    if (e.key === 'Tab') {
      var f = focusables();
      var i = f.indexOf(d.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  matchMedia('(min-width: 1080px)').addEventListener('change', function (e) {
    if (e.matches && menuOpen) setMenu(false, false);
  });


  /* ---------- Indicador da seção atual (desktop) ---------- */
  var navLinks = $$('.hdr__nav a');
  var ind = $('.hdr__ind');
  var sections = $$('main > section[id]');
  var byId = {};
  navLinks.forEach(function (a) { byId[a.hash.slice(1)] = a; });

  function mark(a) {
    navLinks.forEach(function (l) { l.removeAttribute('aria-current'); });
    if (!a) { ind.style.setProperty('--o', 0); return; }
    a.setAttribute('aria-current', 'true');
    ind.style.setProperty('--x', (a.offsetLeft + 16) + 'px');
    ind.style.setProperty('--w', a.offsetWidth - 32);
    ind.style.setProperty('--o', 1);
  }
  var seen = {};
  var secIo = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });
    var current = -1;
    sections.forEach(function (s, i) { if (seen[s.id]) current = i; });
    var target = null;
    for (var i = current; i >= 0; i--) { if (byId[sections[i].id]) { target = byId[sections[i].id]; break; } }
    mark(target);
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(function (s) { secIo.observe(s); });


  /* ---------- Serviços: "Conhecer" abre o detalhe ----------
     Sem JavaScript o detalhe fica aberto; com ele, começa fechado. */
  $$('.more').forEach(function (btn) {
    var panel = d.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    btn.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  });


  /* ---------- Barra fixa ----------
     Entra depois do hero; sai quando o contato ou outro botão vermelho
     grande já estão na tela. */
  var dock = $('#dock');
  var state = { hero: true, contact: false, cta: 0 };
  function renderDock() {
    var on = !state.hero && !state.contact && state.cta === 0 && !menuOpen;
    dock.classList.toggle('is-on', on);
    dock.setAttribute('aria-hidden', String(!on));
    dock.tabIndex = on ? 0 : -1;
  }
  new IntersectionObserver(function (e) { state.hero = e[0].isIntersecting; renderDock(); }, { rootMargin: '0px 0px -30% 0px' }).observe($('.hero__cta'));
  new IntersectionObserver(function (e) { state.contact = e[0].isIntersecting; renderDock(); }).observe($('#contato'));
  var ctaIo = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.target.__on !== e.isIntersecting) { state.cta += e.isIntersecting ? 1 : -1; e.target.__on = e.isIntersecting; }
    });
    renderDock();
  });
  $$('main .btn--red.btn--lg').forEach(function (b) { b.__on = false; ctaIo.observe(b); });
  toggle.addEventListener('click', renderDock);


  /* ---------- Galeria ----------
     A grade se ajusta à quantidade de quadros visíveis. Com duas fotos
     reais ou mais (links data-lightbox), abre o lightbox. */
  var grid = $('.gal__grid');
  if (grid) grid.setAttribute('data-count', $$('.g:not([hidden])', grid).length);

  var shots = $$('.gal__grid a[data-lightbox]');
  if (shots.length >= 2 && window.HTMLDialogElement) initLightbox(shots);

  function initLightbox(links) {
    var dlg = d.createElement('dialog');
    dlg.className = 'lb';
    dlg.setAttribute('aria-label', 'Galeria de fotos');
    dlg.innerHTML =
      '<button class="lb__btn lb__close" type="button" aria-label="Fechar"><svg class="ico" aria-hidden="true"><use href="#i-close"/></svg></button>' +
      '<div class="lb__stage"><img class="lb__img" alt=""></div>' +
      '<div class="lb__bar"><p class="lb__cap" aria-live="polite"></p><span class="lb__count"></span>' +
      '<div class="lb__nav"><button class="lb__btn lb__prev" type="button" aria-label="Foto anterior"><svg class="ico" aria-hidden="true"><use href="#i-prev"/></svg></button>' +
      '<button class="lb__btn lb__next" type="button" aria-label="Próxima foto"><svg class="ico" aria-hidden="true"><use href="#i-next"/></svg></button></div></div>';
    d.body.appendChild(dlg);

    var img = $('.lb__img', dlg);
    var cap = $('.lb__cap', dlg);
    var count = $('.lb__count', dlg);
    var index = 0;
    var opener = null;

    function show(i) {
      index = (i + links.length) % links.length;
      var a = links[index];
      var inner = $('img', a);
      img.src = a.getAttribute('href');
      img.alt = inner ? inner.alt : '';
      var fig = a.closest('figure');
      var fc = fig && $('figcaption', fig);
      cap.textContent = fc ? fc.textContent : '';
      count.textContent = (index + 1) + ' / ' + links.length;
    }
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        opener = a;
        show(i);
        dlg.showModal();
        d.body.classList.add('is-locked');
      });
    });
    $('.lb__close', dlg).addEventListener('click', function () { dlg.close(); });
    $('.lb__prev', dlg).addEventListener('click', function () { show(index - 1); });
    $('.lb__next', dlg).addEventListener('click', function () { show(index + 1); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
    dlg.addEventListener('close', function () {
      d.body.classList.remove('is-locked');
      if (opener) opener.focus({ preventScroll: true });
    });
    // Toque: arrastar para os lados troca a foto. Um toque fora da foto fecha.
    var x0 = null;
    var swipedAt = 0;
    var stage = $('.lb__stage', dlg);
    stage.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    stage.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) { swipedAt = Date.now(); show(index + (dx < 0 ? 1 : -1)); }
    });
    dlg.addEventListener('click', function (e) {
      if (Date.now() - swipedAt < 400) return;
      if (e.target === dlg || e.target === stage) dlg.close();
    });
  }
})();
