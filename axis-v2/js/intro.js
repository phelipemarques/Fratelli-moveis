/* ============================================================
   AXIS V2 — abertura (timeline GSAP)

   Carrega no <head>, logo depois do núcleo do GSAP, e é disparada por
   uma linha no fim do hero: a timeline começa antes da primeira pintura,
   sem esperar o resto da página. Os estados iniciais vêm do CSS
   (html.motion); sem GSAP a classe sai e tudo aparece pronto.

   Cenas: 1 identidade · 2 título · 3 fotografia · 4 assinatura · 5 CTA.
   Os botões nunca ficam invisíveis: só assentam com um deslocamento curto.
   ============================================================ */

window.AXIS_INTRO = function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('motion')) return;
  if (!window.gsap) { root.classList.remove('motion'); return; }
  window.__axisIntro = true;

  var gsap = window.gsap;
  var closed = 'polygon(25% 0%, 25% 0%, 0% 100%, 0% 100%)';
  var open = 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)';

  gsap.timeline({ defaults: { ease: 'expo.out' } })
    // 1 · identidade: a marca acende e a linha AXIS se desenha
    .to('.hdr .brand', { opacity: 1, duration: .5 }, 0)
    .to('.hero__axl path', { strokeDashoffset: 0, duration: .9, ease: 'power3.inOut' }, .1)

    // 2 · título por linhas, em máscara
    .to('.hero__title .ln > span', { y: 0, duration: 1.05, stagger: .08 }, .15)
    .to('.hero__lead', { opacity: 1, y: 0, duration: .8 }, .4)

    // 5 · CTA: já clicáveis, apenas assentam
    .from('.hero__cta .btn', { y: 12, duration: .6, stagger: .06, clearProps: 'transform' }, .5)

    // 3 · fotografia: três recortes abrem na diagonal da marca
    .fromTo('.slice', { clipPath: closed }, { clipPath: open, duration: 1.2, stagger: .1, ease: 'expo.inOut' }, .3)
    .from('.slice .ph, .slice .media', { scale: 1.16, duration: 1.6, stagger: .1, clearProps: 'transform' }, .3)
    .to('.hero__bar', { scaleY: 1, duration: .8, ease: 'power4.out' }, 1)

    // 4 · assinatura: cada serviço ganha ênfase uma vez, em sequência
    .to('.hero__sig span', { color: '#e30613', duration: .22, stagger: .22, ease: 'none' }, .95)
    .to('.hero__sig span', { color: '#ffffff', duration: .5, stagger: .22, ease: 'power1.out' }, 1.17);
};
