/* =====================================================================
   PARADA DO MANO — animações cinematográficas (V5): GSAP + ScrollTrigger
   Tudo aqui é camada extra. O conteúdo já está visível e funcionando com
   main.js e o CSS; este arquivo só entra no "modo cine" (classe .cine, posta
   no <head> quando há movimento permitido, sem economia de dados e fora de
   rede 2G/3G) e carrega as bibliotecas sob demanda:
     1. gsap.min.js logo após o HTML  -> entrada da abertura
     2. ScrollTrigger.min.js depois da carga da página -> efeitos de rolagem
   Se o GSAP não chegar a tempo, a entrada em CSS (reserva) mostra tudo.
   Three.js não é usado: o site não tem modelo 3D (ver tools/3d/LEIA-ME.md).
   ===================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  if (!root.classList.contains('cine')) return;

  var VENDOR = 'assets/js/vendor/';
  // a reserva em CSS da abertura começa 1,1 s depois do primeiro estilo; até 1 s o GSAP assume
  var LIMITE_ABERTURA = 1000;
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)');

  function carregar(arquivo, pronto) {
    return new Promise(function (ok, falha) {
      if (pronto()) { ok(); return; }
      var s = document.createElement('script');
      s.src = VENDOR + arquivo;
      s.onload = ok;
      s.onerror = falha;
      document.head.appendChild(s);
    });
  }
  function depoisDaCarga(fn) {
    var ocioso = function () {
      if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 1500 });
      else window.setTimeout(fn, 300);
    };
    if (document.readyState === 'complete') ocioso();
    else window.addEventListener('load', ocioso, { once: true });
  }
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  carregar('gsap.min.js', function () { return !!window.gsap; }).then(function () {
    var gsap = window.gsap;
    gsap.defaults({ ease: 'expo.out' });
    // cine-on: o GSAP está aqui (o cardápio passa a ser animado por este arquivo)
    root.classList.add('cine-on');

    var entrada = abertura(gsap);
    cardapio(gsap);

    // a rolagem só começa depois da entrada: os dois nunca disputam o mesmo elemento
    depoisDaCarga(function () {
      carregar('ScrollTrigger.min.js', function () { return !!window.ScrollTrigger; }).then(function () {
        gsap.registerPlugin(window.ScrollTrigger);
        return entrada;
      }).then(function () {
        rolagem(gsap, window.ScrollTrigger);
      }).catch(function () { /* sem ScrollTrigger: as revelações em CSS continuam */ });
    });
  }).catch(function () { /* sem GSAP: a reserva em CSS faz a abertura */ });

  /* ---------- 1. Abertura ---------------------------------------------
     Computador: a cortina recolhe como uma lente abrindo, a foto recua de
     um zoom de 1,28 enquanto o título sobe linha a linha de dentro da máscara;
     "Sabor de verdade." chega letra a letra; o resto entra em cascata curta.
     Celular: sem cortina (a foto aparece na hora) e zoom menor. ~2 s no total,
     com os botões clicáveis desde o primeiro quadro. */
  function abertura(gsap) {
    var desde = performance.now() - (window.__cineInicio || 0);
    if (desde > LIMITE_ABERTURA || calmo.matches) { root.classList.add('cine-late'); return Promise.resolve(); }

    var hero = $('.hero');
    if (!hero) return Promise.resolve();
    var computador = window.matchMedia('(min-width: 960px)').matches;
    var img = $('.hero-img', hero);
    var cortina = $('.hero-curtain', hero);
    var linhas = $$('.hero-title .line:not(.line-accent) > span', hero);
    var letras = letrasDe($('.hero-title .line-accent > span', hero));
    var botoes = $$('.hero-actions > *', hero);
    var fatos = $$('.hero-facts > li', hero);

    // primeiro desliga a reserva em CSS, depois define os estados de partida — no mesmo
    // quadro (nada é pintado entre as duas coisas) e com o GSAP lendo o elemento já limpo
    root.classList.add('cine-ready');
    gsap.set(img, { scale: computador ? 1.28 : 1.12, transformOrigin: '60% 50%' });
    gsap.set(linhas, { y: 0, yPercent: 140, rotate: 4, transformOrigin: '0% 100%' });
    gsap.set(letras, { y: 0, yPercent: 140 });
    gsap.set(['.hero-tag', '.hero-sub'], { autoAlpha: 0, y: 18 });
    gsap.set(botoes, { autoAlpha: 0, y: 22 });
    gsap.set(fatos, { autoAlpha: 0, y: 16 });
    gsap.set('.hero-marker', { autoAlpha: 0, y: 40, rotate: -8 });
    gsap.set('.hero-glow', { autoAlpha: 0 });
    if (cortina && computador) gsap.set(cortina, { scaleX: 1, transformOrigin: 'left center' });

    var tl = gsap.timeline({ defaults: { duration: 1.1, ease: 'expo.out' } });
    if (cortina && computador) tl.to(cortina, { scaleX: 0, duration: 1.05, ease: 'power4.inOut' }, 0);
    tl.to(img, { scale: 1, duration: computador ? 2 : 1.6 }, computador ? 0.1 : 0)
      .to('.hero-glow', { autoAlpha: 1, duration: 1.6, ease: 'power2.out' }, 0.2)
      .to('.hero-tag', { autoAlpha: 1, y: 0, duration: 0.8 }, computador ? 0.35 : 0.1)
      .to(linhas, { yPercent: 0, rotate: 0, stagger: 0.1 }, computador ? 0.45 : 0.15)
      .to(letras, { yPercent: 0, duration: 0.9, stagger: 0.022 }, computador ? 0.75 : 0.42)
      .to('.hero-sub', { autoAlpha: 1, y: 0, duration: 0.9 }, computador ? 1 : 0.6)
      .to(botoes, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.07 }, computador ? 1.08 : 0.68)
      .to(fatos, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.06 }, computador ? 1.2 : 0.8)
      .to('.hero-marker', { autoAlpha: 1, y: 0, rotate: 0, duration: 1, ease: 'back.out(1.6)' }, 1.3)
      .add(function () {
        // o resto fica com o CSS (hover, foco) e com a rolagem
        gsap.set(linhas.concat(letras, botoes, fatos), { clearProps: 'transform' });
      });
    return new Promise(function (pronto) { tl.eventCallback('onComplete', pronto); });
  }

  // "Sabor de verdade." em letras, sem quebrar palavras. O título ganha aria-label com o
  // texto inteiro: leitor de tela ouve a frase, não letra por letra
  function letrasDe(el) {
    if (!el) return [];
    var h1 = el.closest('h1');
    if (h1) h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
    var texto = el.textContent;
    var vis = document.createElement('span');
    vis.className = 'ch-wrap';
    texto.split(/(\s+)/).forEach(function (parte) {
      if (/^\s+$/.test(parte)) { vis.appendChild(document.createTextNode(parte)); return; }
      var palavra = document.createElement('span');
      palavra.className = 'ch-wrap';
      parte.split('').forEach(function (c) {
        var ch = document.createElement('span');
        ch.className = 'ch';
        ch.textContent = c;
        palavra.appendChild(ch);
      });
      vis.appendChild(palavra);
    });
    el.textContent = '';
    el.appendChild(vis);
    return $$('.ch', vis);
  }

  /* ---------- 2. Cardápio: indicador da aba e troca de categoria -------
     O indicador escuro desliza até a aba escolhida; a foto da categoria abre
     da esquerda para a direita e o texto sobe em cascata. Tudo em menos de
     0,6 s: a informação fica legível quase na hora. */
  function cardapio(gsap) {
    var tabsRoot = $('[data-tabs]');
    var lista = tabsRoot && $('[data-tablist]', tabsRoot);
    if (!lista) return;
    var tinta = document.createElement('span');
    tinta.className = 'menu-ink';
    tinta.setAttribute('aria-hidden', 'true');
    lista.insertBefore(tinta, lista.firstChild);
    lista.classList.add('has-ink');

    var posicionar = function (tab, animar) {
      if (!tab) return;
      var alvo = { x: tab.offsetLeft, y: tab.offsetTop, width: tab.offsetWidth, height: tab.offsetHeight };
      if (animar && !calmo.matches) gsap.to(tinta, Object.assign({ duration: 0.55, ease: 'expo.out', overwrite: true }, alvo));
      else gsap.set(tinta, alvo);
    };
    var atual = function () { return $('[role="tab"][aria-selected="true"]', lista); };
    // medidas só depois do primeiro quadro e quando as fontes chegarem (a largura das abas muda)
    window.requestAnimationFrame(function () { window.setTimeout(function () { posicionar(atual(), false); }, 0); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { posicionar(atual(), false); });
    var espera;
    window.addEventListener('resize', function () {
      window.clearTimeout(espera);
      espera = window.setTimeout(function () { posicionar(atual(), false); }, 150);
    }, { passive: true });

    tabsRoot.addEventListener('menu:change', function (e) {
      posicionar(e.detail.tab, e.detail.animate);
      if (!e.detail.animate || calmo.matches) return;
      var painel = e.detail.panel;
      var midia = $('.menu-photo, .menu-mark', painel);
      var partes = $$('.menu-body > *', painel);
      gsap.killTweensOf([midia].concat(partes));
      var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      if (midia) tl.fromTo(midia, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.6, clearProps: 'clipPath' }, 0);
      tl.fromTo(partes, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.045, clearProps: 'transform,opacity,visibility' }, 0.05);
    });
  }

  /* ---------- 3. Rolagem (ScrollTrigger) -------------------------------
     Nada prende a página: nenhum "pin". Só scrub (o movimento acompanha a
     rolagem, nos dois sentidos) e revelações que tocam uma vez. */
  function rolagem(gsap, ScrollTrigger) {
    ScrollTrigger.config({ ignoreMobileResize: true });
    var mm = gsap.matchMedia();

    mm.add({
      movimento: '(prefers-reduced-motion: no-preference)',
      computador: '(min-width: 960px)',
      celular: '(max-width: 959px)'
    }, function (ctx) {
      if (!ctx.conditions.movimento) return;
      var pc = ctx.conditions.computador;

      // 3.1 Abertura saindo: a foto desce e cresce devagar, o texto sobe mais rápido (profundidade)
      var heroTl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 }
      });
      heroTl.to('.hero-photo', { yPercent: pc ? 7 : 6, scale: pc ? 1.15 : 1.12, transformOrigin: '50% 0%' }, 0);
      if (pc) {
        heroTl.to('.hero-content', { y: -70, autoAlpha: 0.35 }, 0)
              .to('.hero-marker', { y: -160 }, 0);
      }

      // 3.2 Títulos sobem de dentro de uma máscara, linha a linha
      $$('.section-title, .display-title:not(#churrasco-title), .feijoada-title, .spit-title').forEach(function (titulo) {
        var linhas = mascarar(titulo);
        gsap.from(linhas, {
          yPercent: 108, duration: 1.05, stagger: 0.09,
          scrollTrigger: { trigger: titulo, start: 'top 88%', once: true }
        });
      });

      // 3.3 Enquadramento das fotos: a imagem desliza dentro da moldura e o zoom
      //     diminui enquanto ela atravessa a tela (escala sempre cobre o deslocamento)
      var enquadrar = function (fig, amp, de, ate) {
        if (!fig) return;
        fig.classList.add('px-photo');
        gsap.fromTo(fig, { '--py': -amp + '%', '--ps': de }, {
          '--py': amp + '%', '--ps': ate, ease: 'none',
          scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      };
      // mosaico do buffet em camadas: cada foto numa velocidade
      enquadrar($('.tile-salao'), pc ? 4 : 3, 1.16, 1.09);
      enquadrar($('.tile-saladas'), pc ? 7 : 4, 1.22, 1.15);
      enquadrar($('.tile-quentes'), pc ? 5 : 4, 1.18, 1.11);
      enquadrar($('.grill-side'), 4, 1.16, 1.09);
      enquadrar($('.spit-photo'), 4, 1.16, 1.09);
      enquadrar($('.feijoada-photo'), pc ? 5 : 4, 1.2, 1.11);
      if (pc) {
        $$('.g-link').forEach(function (g, i) { enquadrar(g, i % 2 ? 6 : 4, i % 2 ? 1.2 : 1.16, i % 2 ? 1.13 : 1.09); });
        $$('.moment-photo').forEach(function (m) { enquadrar(m, 3, 1.12, 1.07); });
      }

      // 3.4 Churrasco: a câmera avança sobre a brasa, o calor sobe, o título entra pelos lados
      var palco = $('.grill-stage');
      if (palco) {
        var foto = $('.grill-photo', palco);
        foto.classList.add('px-photo');
        gsap.fromTo(foto, { '--py': '0%', '--ps': 1 }, {
          '--py': '6%', '--ps': 1.18, ease: 'none',
          scrollTrigger: { trigger: palco, start: 'top bottom', end: 'bottom top', scrub: true }
        });
        gsap.fromTo('.grill-heat', { autoAlpha: 0.2 }, {
          autoAlpha: 0.95, ease: 'none',
          scrollTrigger: { trigger: palco, start: 'top 80%', end: 'bottom 40%', scrub: true }
        });
        var titulo = $$('#churrasco-title > span');
        gsap.fromTo(titulo, { xPercent: function (i) { return i ? 14 : -14; }, autoAlpha: 0.2 }, {
          xPercent: 0, autoAlpha: 1, ease: 'none',
          scrollTrigger: { trigger: '#churrasco-title', start: 'top 95%', end: 'top 45%', scrub: 0.6 }
        });
        // brasa tremulando só enquanto a seção está na tela
        var tremor = gsap.timeline({ repeat: -1, repeatRefresh: true, paused: true });
        tremor.to('.grill-heat', {
          scaleY: function () { return gsap.utils.random(1, 1.09); },
          x: function () { return gsap.utils.random(-6, 6); },
          transformOrigin: '50% 100%', duration: function () { return gsap.utils.random(0.14, 0.32); },
          ease: 'sine.inOut', repeatRefresh: true, repeat: 1, yoyo: true
        });
        ScrollTrigger.create({
          trigger: '.grill', start: 'top bottom', end: 'bottom top',
          onToggle: function (self) { if (self.isActive) tremor.play(); else tremor.pause(); }
        });
      }
      gsap.fromTo('.grill-band-track', { xPercent: 0 }, {
        xPercent: pc ? -38 : -55, ease: 'none',
        scrollTrigger: { trigger: '.grill-band', start: 'top bottom', end: 'bottom top', scrub: 0.4 }
      });

      // 3.5 Feijoada: os dias chegam com um pulo curto
      gsap.from('.feijoada-days li', {
        scale: 0.6, rotate: -10, autoAlpha: 0, duration: 0.8, stagger: 0.12, ease: 'back.out(1.8)',
        clearProps: 'transform,opacity,visibility',
        scrollTrigger: { trigger: '.feijoada-days', start: 'top 90%', once: true }
      });

      // 3.6 O restaurante (computador): a linha do dia se enche com a rolagem
      if (pc) {
        gsap.fromTo('.day-track-fill', { scaleX: 0, transition: 'none' }, {
          scaleX: 1, ease: 'none',
          scrollTrigger: { trigger: '.day', start: 'top 75%', end: 'bottom 55%', scrub: 0.5 }
        });
      }

      // 3.7 Contato: a placa da BR entra girando de leve
      gsap.from('.road-sign', {
        rotate: -10, scale: 0.85, autoAlpha: 0, duration: 1, ease: 'back.out(1.5)',
        clearProps: 'transform,opacity,visibility',
        scrollTrigger: { trigger: '.road-card', start: 'top 85%', once: true }
      });

      return function () { $$('.px-photo').forEach(function (f) { f.classList.remove('px-photo'); }); };
    });

    // Seções com content-visibility mudam de altura quando aparecem pela primeira vez:
    // as posições dos gatilhos precisam ser recalculadas. Mas o refresh() devolve a
    // rolagem à posição em que ela estava — se rodar no meio de uma rolagem (um link do
    // menu, uma rolagem suave), ele a interrompe. Então ele só roda com a página parada.
    if ('ResizeObserver' in window) {
      var pendente = false, rolando = false, espera, parada;
      var talvezRecalcular = function () {
        window.clearTimeout(espera);
        espera = window.setTimeout(function () {
          if (!pendente || rolando) return;
          pendente = false;
          ScrollTrigger.refresh();
        }, 300);
      };
      new ResizeObserver(function () { pendente = true; talvezRecalcular(); }).observe(document.body);
      window.addEventListener('scroll', function () {
        rolando = true;
        window.clearTimeout(parada);
        parada = window.setTimeout(function () { rolando = false; talvezRecalcular(); }, 250);
      }, { passive: true });
    }
  }

  // envolve cada linha do título numa máscara (.ln) — por <br> ou pelos <span> filhos
  function mascarar(titulo) {
    if (titulo.querySelector('.ln')) return $$('.ln > span', titulo);
    titulo.classList.add('has-ln');
    var filhos = Array.prototype.slice.call(titulo.children).filter(function (c) { return c.tagName === 'SPAN'; });
    if (filhos.length && filhos.length === titulo.children.length) {
      filhos.forEach(function (f) {
        var ln = document.createElement('span');
        ln.className = 'ln';
        titulo.insertBefore(ln, f);
        ln.appendChild(f);
      });
    } else {
      var partes = titulo.innerHTML.split(/<br\s*\/?>/i);
      titulo.innerHTML = partes.map(function (p) { return '<span class="ln"><span>' + p.trim() + '</span></span>'; }).join('');
    }
    return $$('.ln > span', titulo);
  }
})();
