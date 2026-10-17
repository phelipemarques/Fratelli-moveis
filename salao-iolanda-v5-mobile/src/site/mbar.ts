/**
 * Barra inferior do celular (WhatsApp + rota).
 * Some na primeira tela (o hero já tem o botão de agendamento) e nas partes em
 * que a própria página mostra os mesmos botões (agendamento e contato), para
 * não repetir ações nem cobrir conteúdo. Volta no resto do caminho.
 */
export function initMobileBar() {
  const bar = document.querySelector<HTMLElement>('[data-mbar]');
  if (!bar) return;
  const narrow = matchMedia('(max-width: 700px)');
  const dupes = new Set<Element>();
  const zones = document.querySelectorAll('#agendamento .actions, #contato .contact__actions, .site-footer');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? dupes.add(e.target) : dupes.delete(e.target);
    update();
  });
  zones.forEach((z) => io.observe(z));

  function update() {
    const pastHero = scrollY > innerHeight * 0.6;
    const show = narrow.matches && pastHero && dupes.size === 0;
    bar!.classList.toggle('is-shown', show);
  }
  addEventListener('scroll', update, { passive: true });
  narrow.addEventListener('change', update);
  update();
}
