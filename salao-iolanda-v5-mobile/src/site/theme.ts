import gsap from 'gsap';

/**
 * Transição de cor entre seções. Cada seção tem o próprio fundo (o texto nunca
 * fica sobre a cor errada); quando a cor muda, a seção nova entra como um painel
 * de cantos arredondados que se abre até a largura total, guiado pela rolagem.
 */
export function initTheme() {
  const sections = [...document.querySelectorAll<HTMLElement>('[data-theme]')];
  const mm = gsap.matchMedia();
  // a borda lateral do painel não pode passar da margem da página, senão corta o
  // conteúdo durante a revelação: no celular a margem é ~20 px, então o recuo é menor
  mm.add({ motion: '(prefers-reduced-motion: no-preference)', narrow: '(max-width: 700px)' }, (ctx) => {
    const { motion, narrow } = ctx.conditions as { motion: boolean; narrow: boolean };
    if (!motion) return;
    const side = narrow ? '2%' : '5%';
    const round = narrow ? '1.5rem' : '2.5rem';
    sections.forEach((el, i) => {
      const prev = i === 0 ? 'dark' : sections[i - 1].dataset.theme;
      if (el.dataset.theme === prev) return;
      gsap.fromTo(
        el,
        { clipPath: `inset(0% ${side} 0% ${side} round ${round} ${round} 0 0)` },
        {
          clipPath: 'inset(0% 0% 0% 0% round 0rem 0rem 0 0)',
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 35%', scrub: 0.4 },
        },
      );
    });
  });
}
