import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Transição de cor entre seções: o fundo é do <body> e acompanha a seção que
 * ocupa o centro da tela. Sem JS, cada seção mantém o próprio fundo.
 */
export function initTheme() {
  const root = document.documentElement;
  const sections = document.querySelectorAll<HTMLElement>('[data-theme]');
  if (!sections.length) return;
  root.classList.add('themed');
  const set = (t: string) => (document.body.dataset.bg = t);
  set('dark');
  sections.forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => self.isActive && set(el.dataset.theme!),
    });
  });
  // antes da primeira seção (abertura 3D) o fundo é escuro
  ScrollTrigger.create({
    trigger: sections[0],
    start: 'top 55%',
    onLeaveBack: () => set('dark'),
  });
}
