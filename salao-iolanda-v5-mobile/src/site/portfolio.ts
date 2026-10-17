import { portfolio } from '../config/salon';

/**
 * Portfólio: filtro por categoria e lightbox.
 * O lightbox usa <dialog> (foco preso, Esc e restauração de foco nativos),
 * setas do teclado, botões e arraste lateral no toque.
 */
export function initPortfolio() {
  const grid = document.querySelector<HTMLElement>('.pf__grid');
  const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox]');
  if (!grid || !dialog) return;

  // ---------- filtros ----------
  const chips = [...document.querySelectorAll<HTMLButtonElement>('.pf__filters .chip')];
  const cells = [...grid.querySelectorAll<HTMLElement>('.pf__cell')];
  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      const f = chip.dataset.filter!;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      cells.forEach((cell) => (cell.hidden = f !== 'all' && cell.dataset.category !== f));
    }),
  );

  // ---------- lightbox ----------
  const media = dialog.querySelector<HTMLElement>('[data-lb-media]')!;
  const caption = dialog.querySelector<HTMLElement>('[data-lb-caption]')!;
  const count = dialog.querySelector<HTMLElement>('[data-lb-count]')!;
  let list: number[] = [];
  let pos = 0;
  let opener: HTMLElement | null = null;
  let savedY = 0;

  const render = (dir = 0) => {
    const i = list[pos];
    const item = portfolio[i];
    const source = grid.querySelector<HTMLElement>(`.pf__item[data-index="${i}"]`)!;
    // reaproveita a mesma marcação do quadro (foto ou espaço reservado identificado)
    const visual = source.querySelector('.photo, .ph')!.cloneNode(true) as HTMLElement;
    if (visual instanceof HTMLImageElement) visual.loading = 'eager';
    media.replaceChildren(visual);
    caption.textContent = `${item.category} · ${item.caption}${item.src ? '' : ' — foto autorizada pendente'}`;
    count.textContent = `${pos + 1} / ${list.length}`;
    if (dir) {
      media.style.setProperty('--dir', `${dir * 24}px`);
      media.classList.remove('is-swapping');
      void media.offsetWidth;
      media.classList.add('is-swapping');
    }
  };
  const go = (step: number) => {
    pos = (pos + step + list.length) % list.length;
    render(step);
  };

  grid.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('.pf__item');
    if (!btn) return;
    // navega só pelos quadros visíveis no filtro atual
    list = cells.filter((c) => !c.hidden).map((c) => Number(c.querySelector<HTMLElement>('.pf__item')!.dataset.index));
    pos = Math.max(0, list.indexOf(Number(btn.dataset.index)));
    opener = btn;
    savedY = scrollY;
    render();
    dialog.showModal();
    document.documentElement.classList.add('lb-open');
    dialog.querySelector<HTMLElement>('[data-lb-close]')!.focus();
  });
  dialog.querySelector('[data-lb-prev]')!.addEventListener('click', () => go(-1));
  dialog.querySelector('[data-lb-next]')!.addEventListener('click', () => go(1));
  dialog.querySelector('[data-lb-close]')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || (e.target as HTMLElement).classList.contains('lightbox__frame')) dialog.close();
  });
  dialog.addEventListener('close', () => {
    media.replaceChildren();
    document.documentElement.classList.remove('lb-open');
    opener?.focus({ preventScroll: true });
    // volta exatamente para onde a pessoa estava na página
    if (Math.abs(scrollY - savedY) > 1) window.scrollTo(0, savedY);
  });

  // fotos reais: toque duplo (ou duplo clique) amplia no ponto tocado
  media.addEventListener('dblclick', (e) => {
    const img = media.querySelector('img');
    if (!img) return;
    const r = img.getBoundingClientRect();
    img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    img.classList.toggle('is-zoomed');
  });

  // arraste lateral (toque e caneta)
  let x0: number | null = null;
  const fig = dialog.querySelector<HTMLElement>('.lightbox__figure')!;
  fig.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') x0 = e.clientX;
  });
  fig.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  });
  fig.addEventListener('pointercancel', () => (x0 = null));
}
