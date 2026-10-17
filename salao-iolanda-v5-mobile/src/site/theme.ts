import gsap from 'gsap';

/**
 * Transição de cor entre seções. Cada seção tem o próprio fundo (o texto nunca
 * fica sobre a cor errada); quando a cor muda, a seção nova entra como um painel
 * de cantos arredondados que se abre até a largura total, guiado pela rolagem.
 */
export function initTheme() {
  const sections = [...document.querySelectorAll<HTMLElement>('[data-theme]')];
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    sections.forEach((el, i) => {
      const prev = i === 0 ? 'dark' : sections[i - 1].dataset.theme;
      if (el.dataset.theme === prev) return;
      gsap.fromTo(
        el,
        { clipPath: 'inset(0% 5% 0% 5% round 2.5rem 2.5rem 0 0)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 0rem 0rem 0 0)',
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 35%', scrub: 0.4 },
        },
      );
    });
  });
}
