/**
 * Cabeçalho, menu mobile (<dialog>: foco preso e Esc nativos) e link ativo.
 */
export function initNav() {
  const header = document.querySelector<HTMLElement>('[data-header]')!;
  const cinema = document.querySelector<HTMLElement>('.cinema')!;
  const panel = document.querySelector<HTMLDialogElement>('#menu-mobile')!;
  const openBtn = document.querySelector<HTMLButtonElement>('[data-menu-open]')!;

  // fundo sólido depois da abertura 3D (sobre a cena o cabeçalho é transparente).
  // No celular, depois da abertura, o cabeçalho recolhe ao descer e volta ao
  // subir: só transform, sem mudar o layout.
  // celular em pé ou deitado (tela baixa): o cabeçalho fixo ocupa muito da altura
  const narrow = matchMedia('(max-width: 700px), (max-height: 560px)');
  let lastY = scrollY;
  const onScroll = () => {
    const pastCinema = cinema.getBoundingClientRect().bottom <= header.offsetHeight + 1;
    header.classList.toggle('is-solid', pastCinema);
    const y = scrollY;
    const down = y > lastY + 4;
    const up = y < lastY - 4;
    if (!narrow.matches || !pastCinema || up) header.classList.remove('is-tucked');
    else if (down && y > cinema.offsetTop + cinema.offsetHeight + 200) header.classList.add('is-tucked');
    if (down || up) lastY = y;
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  // foco por teclado dentro do cabeçalho sempre o traz de volta
  header.addEventListener('focusin', () => header.classList.remove('is-tucked'));

  const close = () => panel.open && panel.close();
  openBtn.addEventListener('click', () => {
    panel.showModal();
    // trava a rolagem do fundo enquanto o menu estiver aberto
    document.documentElement.classList.add('menu-open');
    openBtn.setAttribute('aria-expanded', 'true');
  });
  panel.addEventListener('close', () => {
    document.documentElement.classList.remove('menu-open');
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
      header.classList.remove('is-tucked');
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
