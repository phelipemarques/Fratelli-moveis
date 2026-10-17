import {
  hairHighlights, mapsLink, portfolio, salon, services, telLink, whatsappLink,
  type MessageKey, type PortfolioItem,
} from '../config/salon';

/**
 * Marcação das seções comerciais, gerada no build a partir de src/config/salon.ts.
 * O resultado vai direto para o index.html: o conteúdo existe sem JavaScript,
 * é indexável e não muda de lugar quando os scripts carregam (sem CLS).
 */

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const pad = (n: number) => String(n).padStart(2, '0');

/** losango de contorno: o motivo gráfico vem da forma da logo do salão, sem reproduzi-la */
export const diamond = (cls = 'dia') =>
  `<svg class="${cls}" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 1 19 10 10 19 1 10Z" fill="none" stroke="currentColor" stroke-width="1"/></svg>`;


const waIcon = '<svg class="btn__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z"/></svg>';

export function waButton(label: string, key: MessageKey = 'default', cls = 'btn') {
  return `<a class="${cls}" href="${esc(whatsappLink(key))}" target="_blank" rel="noopener" data-wa="${key}">${waIcon}<span>${esc(label)}</span><span class="sr-only"> (abre o WhatsApp em nova aba)</span></a>`;
}

/** foto real quando houver; senão, espaço reservado identificado como pendente */
function photo(src: string | null, alt: string, label: string, cls = '') {
  if (src) {
    return `<img class="photo ${cls}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" />`;
  }
  return `<div class="ph ${cls}" role="img" aria-label="Espaço reservado para foto: ${esc(label)}. Foto autorizada pendente.">
      ${diamond('ph__dia')}
      <span class="ph__tag">Foto autorizada pendente</span>
      <span class="ph__cap">${esc(label)}</span>
    </div>`;
}

export function servicesHTML() {
  const rows = services
    .map(
      (s, i) => `
        <li class="svc" data-svc="${s.id}">
          <div class="svc__media">${photo(s.photo, s.photoAlt, s.title)}</div>
          <div class="svc__body">
            <p class="svc__n">${diamond()}<span>${pad(i + 1)}</span></p>
            <h3 class="svc__title"><span class="line"><span>${esc(s.title)}</span></span></h3>
            ${s.items.length > 1 ? `<p class="svc__items">${s.items.map(esc).join('<span aria-hidden="true"> · </span>')}</p>` : ''}
            <p class="svc__text">${esc(s.text)}</p>
            ${waButton(s.cta, s.message, 'link-cta')}
          </div>
        </li>`,
    )
    .join('');
  const stage = services
    .map((s, i) => `<div class="svc-stage__item${i === 0 ? ' is-active' : ''}" data-svc="${s.id}">${photo(s.photo, s.photoAlt, s.title)}</div>`)
    .join('');
  return `<div class="svc-wrap">
      <ol class="svc-list">${rows}</ol>
      <div class="svc-stage" aria-hidden="true">${stage}</div>
    </div>`;
}

export function hairListHTML() {
  return `<ol class="hair__list">${hairHighlights
    .map((h, i) => `<li><span class="hair__n">${pad(i + 1)}</span><span class="hair__name">${esc(h)}</span></li>`)
    .join('')}</ol>`;
}

const shapeClass = (it: PortfolioItem) => (it.shape ? ` pf__item--${it.shape}` : '');

export function portfolioHTML() {
  const cats = [...new Set(portfolio.map((p) => p.category))];
  const filters = cats.length > 1
    ? `<div class="pf__filters" role="group" aria-label="Filtrar trabalhos por categoria">
        <button type="button" class="chip" data-filter="all" aria-pressed="true">Todos</button>
        ${cats.map((c) => `<button type="button" class="chip" data-filter="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}
      </div>`
    : '';
  const items = portfolio
    .map(
      (it, i) => `
        <li class="pf__cell${shapeClass(it)}" data-category="${esc(it.category)}">
          <button type="button" class="pf__item" data-index="${i}" aria-haspopup="dialog">
            ${photo(it.src, it.alt, `${it.category} · ${it.caption}`, 'pf__photo')}
            <span class="pf__caption"><span class="pf__cat">${esc(it.category)}</span>${esc(it.caption)}</span>
            <span class="sr-only">Ampliar</span>
          </button>
        </li>`,
    )
    .join('');
  return `${filters}<ul class="pf__grid">${items}</ul>`;
}

export function bookingChipsHTML() {
  const chips: [string, MessageKey][] = [
    ['Cabelo', 'cabelo'], ['Unhas', 'unhas'], ['Maquiagem', 'maquiagem'], ['Depilação', 'depilacao'], ['Estética', 'estetica'],
  ];
  return `<ul class="book__chips" aria-label="Agendar por serviço">${chips
    .map(([label, key]) => `<li><a class="chip chip--link" href="${esc(whatsappLink(key))}" target="_blank" rel="noopener" data-wa="${key}">${esc(label)}<span class="sr-only"> no WhatsApp</span></a></li>`)
    .join('')}</ul>`;
}

export function contactHTML() {
  const a = salon.address;
  return `<div class="contact__grid">
      <address class="contact__address">
        <span class="contact__name">${esc(salon.name)}</span>
        <span>${esc(a.street)}</span>
        <span>${esc(a.city)} — ${esc(a.regionName)}</span>
      </address>
      <dl class="contact__info">
        <div><dt>WhatsApp e telefone</dt><dd><a href="${esc(telLink())}">${esc(salon.phone.display)}</a></dd></div>
        <div><dt>Instagram</dt><dd><a href="${esc(salon.instagram.url)}" target="_blank" rel="noopener">${esc(salon.instagram.handle)}</a></dd></div>
        <div><dt>Horários</dt><dd>${salon.hours ? esc(salon.hours) : 'Consulte o salão pelo WhatsApp.'}</dd></div>
      </dl>
      <div class="contact__actions">
        <a class="btn" href="${esc(mapsLink())}" target="_blank" rel="noopener" data-maps>${diamond('btn__icon')}<span>Como chegar</span><span class="sr-only"> (abre o Google Maps)</span></a>
        ${waButton('Agendar pelo WhatsApp', 'default', 'btn btn--ghost')}
      </div>
    </div>`;
}

export function jsonLd(siteUrl: string | null) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    name: salon.name,
    description: `${salon.category} em ${salon.address.city}/${salon.address.region}: cabelo, unhas, maquiagem, depilação e estética.`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: salon.address.street,
      addressLocality: salon.address.city,
      addressRegion: salon.address.region,
      addressCountry: salon.address.country,
    },
    telephone: salon.phone.e164,
    sameAs: [salon.instagram.url],
  };
  if (siteUrl) {
    data.url = siteUrl;
    data.image = new URL('og.jpg', siteUrl).href;
  }
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

/** marcadores `<!--@nome-->` do index.html */
export const blocks: Record<string, () => string> = {
  services: servicesHTML,
  hair: hairListHTML,
  portfolio: portfolioHTML,
  bookingChips: bookingChipsHTML,
  contact: contactHTML,
};
