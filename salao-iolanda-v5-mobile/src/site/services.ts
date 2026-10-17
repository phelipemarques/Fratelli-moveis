/**
 * Serviços no desktop: a lista à esquerda escolhe a foto do quadro fixo à
 * direita (passar o mouse, focar com o teclado ou rolar até a linha).
 * No mobile cada linha tem a própria foto e nada disso é necessário.
 */
export function initServices() {
  const rows = [...document.querySelectorAll<HTMLElement>('.svc')];
  const stage = [...document.querySelectorAll<HTMLElement>('.svc-stage__item')];
  if (!rows.length || !stage.length) return;
  const wide = matchMedia('(min-width: 900px)');

  const activate = (id: string) => {
    rows.forEach((r) => r.classList.toggle('is-active', r.dataset.svc === id));
    stage.forEach((s) => s.classList.toggle('is-active', s.dataset.svc === id));
  };
  activate(rows[0].dataset.svc!);

  rows.forEach((row) => {
    row.addEventListener('pointerenter', () => wide.matches && activate(row.dataset.svc!));
    row.addEventListener('focusin', () => activate(row.dataset.svc!));
  });
  const io = new IntersectionObserver(
    (entries) => {
      if (!wide.matches) return;
      for (const e of entries) if (e.isIntersecting) activate((e.target as HTMLElement).dataset.svc!);
    },
    { rootMargin: '-48% 0px -48% 0px' },
  );
  rows.forEach((r) => io.observe(r));
}
