/* ============================================================
   Fratelli Móveis — movimento

   Um único motor (GSAP + ScrollTrigger) conduz tudo o que depende de
   rolagem. O CSS cuida apenas de hover, foco e do menu.

   Três momentos: entrada do hero, exploração dos projetos e dos
   ambientes, e um encerramento mais contido.
   ============================================================ */

(function () {
  'use strict';

  var root = document.documentElement;
  var wantsMotion = root.classList.contains('motion');

  // Avisa a rede de segurança do nav.js que este arquivo assumiu a página.
  window.__fratelliMotion = true;

  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.remove('motion');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  // Sem movimento pedido: o conteúdo já está no estado final e nada é criado.
  if (!wantsMotion) { return; }

  // A barra de endereço do celular muda a altura da janela o tempo todo;
  // recalcular a cada mudança dessas só produz trabalho inútil.
  ScrollTrigger.config({ ignoreMobileResize: true });

  var EASE = 'power3.out';
  var BONE = '#F4F1EC';
  var INK  = '#191714';
  var q = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var qa = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  /* ============================================================
     Divisor de títulos
     Mede onde o texto quebra naturalmente e envolve cada linha em uma
     janela. Nada de quebra fixa: a contagem de linhas é a que a largura
     real produziu, com a fonte real já carregada.
     ============================================================ */

  function splitLines(el) {
    var source = el.getAttribute('data-text');
    if (source === null) {
      source = el.textContent.replace(/\s+/g, ' ').trim();
      el.setAttribute('data-text', source);
    }

    var words = source.split(' ');
    var probes = [];
    el.textContent = '';
    words.forEach(function (word, i) {
      var span = document.createElement('span');
      span.textContent = word;
      el.appendChild(span);
      probes.push(span);
      if (i < words.length - 1) { el.appendChild(document.createTextNode(' ')); }
    });

    var lines = [];
    var lastTop = null;
    probes.forEach(function (span) {
      var top = span.offsetTop;
      if (lastTop === null || Math.abs(top - lastTop) > 2) {
        lines.push([]);
        lastTop = top;
      }
      lines[lines.length - 1].push(span.textContent);
    });

    el.textContent = '';
    var inners = [];
    lines.forEach(function (wordsOfLine, i) {
      var outer = document.createElement('span');
      outer.className = 'line';
      var inner = document.createElement('span');
      inner.className = 'line__i';
      inner.textContent = wordsOfLine.join(' ');
      outer.appendChild(inner);
      el.appendChild(outer);
      // Espaço entre linhas para que a leitura por voz não emende palavras.
      if (i < lines.length - 1) { el.appendChild(document.createTextNode(' ')); }
      inners.push(inner);
    });

    el.style.opacity = '1';
    return inners;
  }

  var splits = qa('[data-split]').map(function (el) {
    return { el: el, inners: [], played: false };
  });

  function applySplit(record, toFinalState) {
    record.inners = splitLines(record.el);
    gsap.set(record.inners, toFinalState
      ? { yPercent: 0, opacity: 1 }
      : { yPercent: 116, opacity: 0 });
  }

  /* ============================================================
     Espera curta pela fonte definitiva
     A quebra de linha muda com a fonte. Medir com a substituta e animar
     depois produziria uma composição diferente da final.
     ============================================================ */

  function whenFontsSettled(callback) {
    var called = false;
    var run = function (ready) { if (!called) { called = true; callback(ready); } };
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(function () { run(true); });
      window.setTimeout(function () { run(false); }, 500);   // nunca segura a abertura além disso
    } else {
      run(false);
    }
  }

  whenFontsSettled(function (fontsReady) {
    splits.forEach(function (record) { applySplit(record, false); });
    buildEntrance();
    buildScrollScenes();
    ScrollTrigger.refresh();

    // A abertura não esperou a fonte definitiva. Quando ela chegar, as quebras
    // são medidas de novo — a composição tem de ser a da fonte final.
    if (!fontsReady && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        splits.forEach(function (record) { applySplit(record, record.played); });
        ScrollTrigger.refresh();
      });
    }
  });

  /* ============================================================
     1. Entrada do hero
     A fotografia se acomoda, as linhas do título sobem uma a uma e os
     apoios entram logo atrás. O elemento que recebe a entrada não é o
     mesmo que depois recebe a rolagem.
     ============================================================ */

  function buildEntrance() {
    var picture = q('.hero__media picture');
    var heroEls = qa('[data-hero-el]');
    var heroTitle = splits.filter(function (r) { return r.el.classList.contains('hero__title'); })[0];

    gsap.set(heroEls, { y: 18 });
    gsap.set(picture, { scale: 1.14, transformOrigin: '52% 56%' });

    var tl = gsap.timeline({ defaults: { ease: EASE } });

    tl.to(picture, { opacity: 1, duration: 0.9, ease: 'power2.out' }, 0)
      .to(picture, { scale: 1, duration: 1.9, ease: 'power3.out' }, 0);

    if (heroEls[0]) { tl.to(heroEls[0], { opacity: 1, y: 0, duration: 0.7 }, 0.12); }

    if (heroTitle && heroTitle.inners.length) {
      tl.to(heroTitle.inners, {
        yPercent: 0, opacity: 1, duration: 1.0, stagger: 0.075
      }, 0.20);
      heroTitle.played = true;
    }

    heroEls.slice(1).forEach(function (el, i) {
      tl.to(el, { opacity: 1, y: 0, duration: 0.7 }, 0.46 + i * 0.09);
    });

    tl.eventCallback('onComplete', function () {
      gsap.set(picture, { clearProps: 'willChange' });
    });
  }

  /* ============================================================
     2. Cenas de rolagem
     ============================================================ */

  function buildScrollScenes() {
    var mm = gsap.matchMedia();

    /* ---------- Hero: profundidade ---------- */
    var hero = q('.hero');
    var media = q('.hero__media');
    var content = q('.hero__content');

    function heroDepth(amount) {
      gsap.fromTo(media, { yPercent: -amount }, {
        yPercent: amount, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4 }
      });
    }

    mm.add('(min-width: 741px)', function () {
      heroDepth(7);
      gsap.to(content, {
        yPercent: -14, opacity: 0.12, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 45%', scrub: 0.4 }
      });
    });

    // No celular o recorte é vertical e o desempenho importa mais:
    // a amplitude cai para um terço e o texto não se desloca.
    mm.add('(max-width: 740px)', function () { heroDepth(2.5); });

    // A varredura do fio de rolagem para quando o hero sai de vista.
    if (hero) {
      ScrollTrigger.create({
        trigger: hero, start: 'top bottom', end: 'bottom top',
        onToggle: function (self) { hero.classList.toggle('is-offscreen', !self.isActive); }
      });
    }

    /* ---------- Blocos de texto ---------- */
    gsap.set('[data-reveal]', { y: 18 });
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 82%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1, y: 0, duration: 0.85, ease: EASE, stagger: 0.08, overwrite: 'auto'
        });
      }
    });

    /* ---------- Títulos de seção ---------- */
    splits.forEach(function (record) {
      if (record.played) { return; }
      ScrollTrigger.create({
        trigger: record.el,
        start: 'top 86%',
        once: true,
        onEnter: function () {
          record.played = true;
          gsap.to(record.inners, {
            yPercent: 0, opacity: 1, duration: 0.95, ease: EASE, stagger: 0.07
          });
        }
      });
    });

    /* ---------- Quadros: véu que recolhe ----------
       A entrada mora no véu e na imagem interna. O deslocamento de
       rolagem mora no elemento de fora. Nunca no mesmo. */
    qa('[data-reveal-frame]').forEach(function (block) {
      var veil = q('.frame__veil', block);
      var img = q('.frame__img', block);
      var tl = gsap.timeline({
        scrollTrigger: { trigger: block, start: 'top 86%', once: true }
      });
      if (veil) { tl.to(veil, { scaleY: 0, duration: 1.1, ease: 'expo.out' }, 0); }
      if (img) { tl.fromTo(img, { scale: 1.09 }, { scale: 1, duration: 1.5, ease: 'expo.out' }, 0); }
    });

    /* ---------- Quadros: profundidade interna (só no desktop) ---------- */
    mm.add('(min-width: 900px)', function () {
      qa('[data-parallax-frame]').forEach(function (frame) {
        var fill = frame.querySelector(':scope > picture, :scope > .frame__reserved');
        if (!fill) { return; }
        gsap.fromTo(fill, { yPercent: -5 }, {
          yPercent: 5, ease: 'none',
          scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
        });
      });
    });

    /* ---------- Faixas de fundo acompanhando a rolagem ----------
       A cor muda enquanto a borda da faixa sobe pela tela. Todo o texto
       de dentro só aparece depois que a troca terminou, então nenhuma
       palavra é lida sobre uma cor intermediária. */
    function wash(el, from, to) {
      if (!el) { return; }
      gsap.fromTo(el, { backgroundColor: from }, {
        backgroundColor: to, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 76%', scrub: true }
      });
    }
    wash(q('.band-dark'), BONE, INK);
    wash(q('.about'), INK, BONE);
    wash(q('.contact'), BONE, INK);

    /* ---------- Ambientes: faixa horizontal ---------- */
    buildRooms(mm);

    /* ---------- Processo ---------- */
    buildProcess(mm);

    /* ---------- Recalculo depois que tudo terminou de carregar ---------- */
    if (document.readyState === 'complete') {
      ScrollTrigger.refresh();
    } else {
      window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    }

    /* ---------- Largura mudou: remedir as quebras de linha ----------
       Só a largura conta. A altura muda sozinha no celular quando a
       barra de endereço aparece, e isso não altera quebra nenhuma. */
    var lastWidth = window.innerWidth;
    var timer = null;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastWidth) { return; }
      lastWidth = window.innerWidth;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        splits.forEach(function (record) { applySplit(record, record.played); });
        ScrollTrigger.refresh();
      }, 220);
    });
  }

  /* ============================================================
     Ambientes
     No desktop com altura suficiente, a rolagem vertical conduz a faixa
     horizontal. Fora disso, permanece a rolagem horizontal nativa que
     já existe no CSS — inclusive sem JavaScript.
     ============================================================ */

  function buildRooms(mm) {
    var viewport = q('[data-rooms-viewport]');
    var track = q('[data-rooms-track]');
    var hint = q('[data-rooms-hint]');
    if (!viewport || !track) { return; }

    var rooms = qa('[data-room]');

    mm.add('(min-width: 900px) and (min-height: 620px)', function () {
      viewport.classList.add('is-pinned');
      if (hint) { hint.classList.add('is-hidden'); }

      var distance = function () {
        return Math.max(0, track.scrollWidth - viewport.clientWidth);
      };

      var tween = gsap.to(track, {
        x: function () { return -distance(); },
        ease: 'none',
        scrollTrigger: {
          trigger: viewport,
          start: 'center center',
          end: function () { return '+=' + distance(); },
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: 0.6,
          invalidateOnRefresh: true
        }
      });

      // Enquanto a faixa é conduzida pela rolagem vertical, o transporte
      // horizontal nativo tem de ficar em zero, senão as duas posições brigam.
      var keepLeft = function () { if (viewport.scrollLeft !== 0) { viewport.scrollLeft = 0; } };
      viewport.addEventListener('scroll', keepLeft);

      // Teclado: ao focar um ambiente, a página anda até ele.
      var onFocus = function (event) {
        var st = tween.scrollTrigger;
        var total = distance();
        if (!st || !total) { return; }
        var offset = Math.min(total, Math.max(0, event.currentTarget.offsetLeft - track.offsetLeft));
        var progress = offset / total;
        window.scrollTo({ top: st.start + (st.end - st.start) * progress, behavior: 'auto' });
      };
      rooms.forEach(function (room) { room.addEventListener('focus', onFocus); });

      return function () {
        viewport.classList.remove('is-pinned');
        if (hint) { hint.classList.remove('is-hidden'); }
        viewport.removeEventListener('scroll', keepLeft);
        rooms.forEach(function (room) { room.removeEventListener('focus', onFocus); });
        gsap.set(track, { x: 0 });
      };
    });
  }

  /* ============================================================
     Processo
     O fio avança com a rolagem e o marcador da etapa corrente acende.
     Os parágrafos continuam com a mesma cor do início ao fim.
     ============================================================ */

  function buildProcess(mm) {
    var fill = q('[data-steps-fill]');
    var list = q('[data-steps]');
    if (!fill || !list) { return; }

    var railTween = function (prop) {
      gsap.fromTo(fill, { scaleX: prop === 'scaleX' ? 0 : 1, scaleY: prop === 'scaleY' ? 0 : 1 },
        (function () {
          var to = { ease: 'none', scrollTrigger: {
            trigger: list, start: 'top 72%', end: 'bottom 78%', scrub: 0.5
          } };
          to[prop] = 1;
          return to;
        })());
    };

    mm.add('(min-width: 900px)', function () { railTween('scaleX'); });
    mm.add('(max-width: 899px)', function () { railTween('scaleY'); });

    qa('[data-step]').forEach(function (step) {
      ScrollTrigger.create({
        trigger: step,
        start: 'top 80%',
        onEnter: function () { step.classList.add('is-active'); },
        onLeaveBack: function () { step.classList.remove('is-active'); }
      });
    });
  }
})();
