/* Vitor Queiroz Cosechen — comportamento do site.
   Sem dependências. Cada bloco é independente: se um elemento não existir,
   o bloco simplesmente não faz nada. */
(function () {
  'use strict';

  window.__qcReady = true;

  var root = document.documentElement;
  var WHATSAPP = '5545991176434'; // número do link wa.me da bio do Instagram

  /* Abertura: dispara a sequência de entrada depois do primeiro quadro */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { root.classList.add('is-loaded'); });
  });

  /* Ano no rodapé */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  /* Menu mobile ---------------------------------------------------------- */
  var btn = document.querySelector('[data-menu-btn]');
  var nav = document.querySelector('[data-nav]');

  var headerEl = document.querySelector('[data-header]');

  function setMenu(open) {
    if (!btn || !nav) return;
    btn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    // Com o menu aberto o cabeçalho fica opaco, mesmo no topo da página
    if (headerEl) headerEl.classList.toggle('is-menu-open', open);
  }

  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      setMenu(open);
      if (open) {
        var first = nav.querySelector('a');
        if (first) first.focus();
      }
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        btn.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (btn.getAttribute('aria-expanded') === 'true' && !nav.contains(e.target) && !btn.contains(e.target)) {
        setMenu(false);
      }
    });
    // Se o foco sair do menu aberto (Tab depois do último link), o menu fecha:
    // assim ele nunca fica cobrindo o conteúdo que a pessoa está navegando.
    nav.addEventListener('focusout', function (e) {
      if (btn.getAttribute('aria-expanded') !== 'true') return;
      var next = e.relatedTarget;
      if (next && !nav.contains(next) && next !== btn) setMenu(false);
    });
    var desktop = window.matchMedia('(min-width: 901px)');
    var onDesktop = function (mq) { if (mq.matches) setMenu(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onDesktop);
    else if (desktop.addListener) desktop.addListener(onDesktop); // Safari < 14
  }

  /* Cabeçalho com fio + trilho de leitura ------------------------------- */
  var header = document.querySelector('[data-header]');
  var rail = document.querySelector('.rail');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (rail) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      rail.style.setProperty('--progress', max > 0 ? Math.min(1, y / max).toFixed(4) : '0');
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* Item ativo no menu --------------------------------------------------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__list a[href^="#"]'));
  if ('IntersectionObserver' in window && links.length) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var visible = {};
    // Marca a seção que cruza a faixa central da tela; se nenhuma seção do menu
    // estiver ali (abertura, campo violeta), nenhum item fica marcado.
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible[entry.target.id] = entry.isIntersecting; });
      var current = null;
      Object.keys(byId).forEach(function (id) { if (visible[id]) current = id; });
      links.forEach(function (l) { l.removeAttribute('aria-current'); });
      if (current) byId[current].setAttribute('aria-current', 'true');
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* Destaques violeta: “marca-texto” ao entrar na tela ------------------- */
  var marks = document.querySelectorAll('[data-hl]');
  if (!root.classList.contains('motion') || !('IntersectionObserver' in window)) {
    marks.forEach(function (m) { m.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.6 });
    marks.forEach(function (m) { io.observe(m); });
  }

  /* Cards e temas: entrada única, em cascata curta ---------------------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (!root.classList.contains('motion') || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var batch = 0, batchTimer = null;
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        // Elementos que entram juntos atrasam 70 ms um do outro (no máximo 280 ms)
        entry.target.style.setProperty('--d', Math.min(batch, 4) * 70 + 'ms');
        batch++;
        entry.target.classList.add('is-in');
        rio.unobserve(entry.target);
      });
      clearTimeout(batchTimer);
      batchTimer = setTimeout(function () { batch = 0; }, 120);
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { rio.observe(el); });
  }

  /* Formulário → mensagem no WhatsApp ----------------------------------- */
  var form = document.querySelector('[data-form]');
  if (!form) return;

  var status = form.querySelector('[data-form-status]');
  var msg = form.querySelector('#f-msg');
  var count = form.querySelector('#c-msg');

  var rules = [
    { field: '#f-nome', error: '#e-nome', ok: function (v) { return v.trim().length >= 2; } },
    { field: '#f-assunto', error: '#e-assunto', ok: function (v) { return v !== ''; } },
    { field: '#f-msg', error: '#e-msg', ok: function (v) { return v.trim().length >= 15; } }
  ];

  function check(rule, show) {
    var input = form.querySelector(rule.field);
    var error = form.querySelector(rule.error);
    var valid = rule.ok(input.value);
    if (show || input.getAttribute('aria-invalid') === 'true') {
      input.setAttribute('aria-invalid', String(!valid));
      error.hidden = valid;
    }
    return valid;
  }

  rules.forEach(function (rule) {
    var input = form.querySelector(rule.field);
    input.addEventListener('blur', function () { if (input.value) check(rule, true); });
    input.addEventListener('input', function () { check(rule, false); });
    input.addEventListener('change', function () { check(rule, false); });
  });

  if (msg && count) {
    var max = msg.getAttribute('maxlength');
    msg.addEventListener('input', function () {
      count.textContent = msg.value.length + ' de ' + max + ' caracteres';
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstInvalid = null;
    rules.forEach(function (rule) {
      if (!check(rule, true) && !firstInvalid) firstInvalid = form.querySelector(rule.field);
    });
    if (firstInvalid) {
      status.textContent = 'Revise os campos marcados antes de abrir o WhatsApp.';
      firstInvalid.focus();
      return;
    }

    var data = new FormData(form);
    var cargo = String(data.get('cargo') || '').trim();
    var texto = 'Olá, Vitor. Vim pelo site.\n\n' +
      'Nome: ' + String(data.get('nome')).trim() + '\n' +
      (cargo ? 'Cargo e órgão: ' + cargo + '\n' : '') +
      'Assunto: ' + data.get('assunto') + '\n\n' +
      String(data.get('mensagem')).trim();

    var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
    // Sem a flag "noopener" aqui porque, com ela, window.open sempre devolve null;
    // o vínculo com esta aba é cortado logo em seguida.
    var win = window.open(url, '_blank');
    if (win) win.opener = null;
    // Não afirmamos que a mensagem foi enviada: quem envia é a pessoa, dentro do WhatsApp.
    if (win === null) {
      status.innerHTML = '';
      var a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = 'Toque aqui para abrir o WhatsApp com a sua mensagem.';
      status.appendChild(a);
    } else {
      status.textContent = 'O WhatsApp foi aberto em uma nova aba com a sua mensagem. Nada é enviado até você tocar em enviar por lá.';
    }
  });
})();
