/**
 * Cabeçalho, menu mobile (<dialog>: foco preso e Esc nativos) e link ativo.
 */
export function initNav() {
  const header = document.querySelector<HTMLElement>('[data-header]')!;
  const cinema = document.querySelector<HTMLElement>('.cinema')!;
  const panel = document.querySelector<HTMLDialogElement>('#menu-mobile')!;
  const openBtn = document.querySelector<HTMLButtonElement>('[data-menu-open]')!;

  // fundo sólido depois da abertura 3D (sobre a cena o cabeçalho é transparente)
  const solid = () => header.classList.toggle('is-solid', cinema.getBoundingClientRect().bottom <= header.offsetHeight + 1);
  solid();
  addEventListener('scroll', solid, { passive: true });
  addEventListener('resize', solid, { passive: true });

  const close = () => panel.open && panel.close();
  openBtn.addEventListener('click', () => {
    panel.showModal();
    openBtn.setAttribute('aria-expanded', 'true');
  });
  panel.addEventListener('close', () => {
    openBtn.setAttribute('aria-expanded', 'false');
    openBtn.focus({ preventScroll: true });
  });
  panel.querySelector('[data-menu-close]')!.addEventListener('click', close);
  // clicar fora do conteúdo (no ::backdrop) fecha
  panel.addEventListener('click', (e) => {
    if (e.target === panel) close();
  });
  panel.querySelectorAll<HTMLAnchorElement>('[data-menu-link]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.hash);
      if (!target) return;
      e.preventDefault();
      panel.close();
      target.scrollIntoView();
      history.replaceState(null, '', a.hash);
    }),
  );
  // o menu não faz sentido aberto em tela larga
  matchMedia('(min-width: 960px)').addEventListener('change', (m) => m.matches && close());

  // link ativo no menu conforme a seção na tela
  const links = new Map<string, HTMLAnchorElement>();
  document.querySelectorAll<HTMLAnchorElement>('.site-nav__list a').forEach((a) => links.set(a.hash.slice(1), a));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach((a, id) => a.setAttribute('aria-current', String(id === e.target.id)));
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  ['inicio', 'salao', 'servicos', 'portfolio', 'contato'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  });
}
