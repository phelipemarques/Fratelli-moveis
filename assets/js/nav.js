/* ============================================================
   Fratelli Móveis — navegação
   Cabeçalho, menu em celular e rede de segurança do movimento.
   Não depende de nenhuma biblioteca.
   ============================================================ */

(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- Rede de segurança ----------
     Se o motor de animação não sinalizar que assumiu a página, os estados
     iniciais são removidos e tudo aparece no estado final. */
  window.setTimeout(function () {
    if (!window.__fratelliMotion) { root.classList.remove('motion'); }
  }, 2200);

  /* ---------- Ano do rodapé ---------- */
  var anoEl = document.querySelector('[data-ano]');
  if (anoEl) { anoEl.textContent = String(new Date().getFullYear()); }

  /* ---------- Estado do cabeçalho ----------
     Transparente só no topo da fotografia, onde o véu superior do hero
     garante o contraste. Abaixo disso, fundo sólido. */
  var TOP_THRESHOLD = 56;
  var darkZones = Array.prototype.slice.call(document.querySelectorAll('[data-dark-zone]'));
  var ticking = false;

  function syncHeader() {
    ticking = false;
    root.classList.toggle('at-top', window.scrollY < TOP_THRESHOLD);

    // A barra escurece quando a faixa que passa por baixo dela é escura.
    // Uma sonda única evita que duas zonas disputem a mesma classe.
    var probe = (parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 72) * 0.6;
    var onDark = false;
    for (var i = 0; i < darkZones.length; i++) {
      var box = darkZones[i].getBoundingClientRect();
      if (box.top <= probe && box.bottom >= probe) { onDark = true; break; }
    }
    root.classList.toggle('on-dark', onDark);
  }
  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(syncHeader); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  syncHeader();

  /* ---------- Menu em celular ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('menu-movel');
  if (!toggle || !menu) { return; }

  var FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var isOpen = false;
  var lastFocused = null;

  function openMenu() {
    if (isOpen) { return; }
    isOpen = true;
    lastFocused = document.activeElement;
    menu.removeAttribute('inert');
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-locked');
    var first = menu.querySelector(FOCUSABLE);
    if (first) { first.focus(); }
    document.addEventListener('keydown', onKeydown);
  }

  function closeMenu(returnFocus) {
    if (!isOpen) { return; }
    isOpen = false;
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
    document.removeEventListener('keydown', onKeydown);
    // `inert` só volta depois da transição, para o conteúdo não sumir de golpe.
    window.setTimeout(function () {
      if (!isOpen) { menu.setAttribute('inert', ''); }
    }, 420);
    if (returnFocus) { (lastFocused || toggle).focus(); }
  }

  function onKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
      return;
    }
    if (event.key !== 'Tab') { return; }

    // Enquanto aberto, o foco circula dentro do menu.
    var items = Array.prototype.slice.call(menu.querySelectorAll(FOCUSABLE));
    if (!items.length) { return; }
    var first = items[0];
    var last = items[items.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  toggle.addEventListener('click', function () {
    if (isOpen) { closeMenu(true); } else { openMenu(); }
  });

  // Ao escolher um destino, o menu sai da frente e a âncora segue o caminho normal.
  menu.addEventListener('click', function (event) {
    if (event.target.closest('a[href^="#"]')) { closeMenu(false); }
  });

  // Voltar ao desktop com o menu aberto não pode deixar o corpo travado.
  var wide = window.matchMedia('(min-width: 900px)');
  var onWide = function (event) { if (event.matches) { closeMenu(false); } };
  if (wide.addEventListener) { wide.addEventListener('change', onWide); }
  else if (wide.addListener) { wide.addListener(onWide); }
})();

/* ============================================================
   Mapa da seção Contato

   O mapa só é montado depois que o Google responde. Extensão de privacidade,
   rede corporativa que bloqueia terceiros e modo offline são comuns, e um
   iframe bloqueado pinta a página de erro do navegador — um retângulo claro
   no meio de uma seção escura. Sem resposta, fica o bloco de endereço, e o
   botão "Como chegar" resolve do mesmo jeito.
   ============================================================ */
(function () {
  'use strict';

  var holder = document.querySelector('[data-map]');
  if (!holder) { return; }

  var resolvido = false;

  function decidir(disponivel) {
    if (resolvido) { return; }
    resolvido = true;
    if (!disponivel) { return; }

    var frame = document.createElement('iframe');
    frame.src = holder.getAttribute('data-map-src');
    frame.title = holder.getAttribute('data-map-title');
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    holder.appendChild(frame);
  }

  var sonda = new Image();
  sonda.onload = function () { decidir(true); };
  sonda.onerror = function () { decidir(false); };
  window.setTimeout(function () { decidir(false); }, 2500);
  sonda.src = 'https://maps.gstatic.com/favicon.ico?' + Date.now();
})();
