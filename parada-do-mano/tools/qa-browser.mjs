// Parada do Mano — verificação no navegador (Chromium via Playwright).
//
//   node tools/servidor.mjs . 8130                    (na pasta parada-do-mano)
//   NODE_PATH=$(npm root -g) node tools/qa-browser.mjs [saida-das-capturas]
//
// Testa cada tamanho de tela pedido no briefing (e zoom de 200%), o menu,
// o cardápio por teclado, a galeria ampliada, foco, alvos de toque, contraste
// sobre foto, espaçamento de texto, vídeo, movimento reduzido e a página sem
// JavaScript. Imprime um relatório e grava capturas de tela.
// QA_URL aponta para outro endereço (o pacote de produção descompactado, por exemplo).
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.QA_URL || 'http://127.0.0.1:8130/';
const OUT = process.argv[2] || 'qa-shots';
const fs = require('fs');
fs.mkdirSync(OUT, { recursive: true });

const SIZES = [
  [320, 568], [360, 800], [375, 667], [390, 844], [414, 896], [430, 932],
  [844, 390], [667, 375], [768, 1024], [1024, 768], [640, 400], [1440, 900], [1920, 1080],
];
// 640x400 = notebook de 1280x800 com zoom de 200%

const results = [];
const ok = (name, pass, info = '') => results.push({ name, pass, info });

async function scrollThrough(page) {
  await page.evaluate(async () => {
    // rolagem instantânea durante o teste (o site usa rolagem suave nos links)
    document.documentElement.style.scrollBehavior = 'auto';
    const step = Math.round(window.innerHeight * 0.6);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1600);
}

const browser = await chromium.launch();

for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  const failed = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  page.on('requestfailed', r => failed.push(r.url()));
  page.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url()); });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200); // entrada da abertura
  await page.screenshot({ path: `${OUT}/${w}x${h}-primeira-tela.png` });
  await scrollThrough(page);

  const m = await page.evaluate(() => {
    const doc = document.documentElement;
    // imagens de abas fechadas do cardápio ficam sem carregar de propósito (lazy)
    const imgs = [...document.images].filter(i => i.getAttribute('src') && !i.closest('[hidden]'));
    const broken = imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.src);
    const notLoaded = imgs.filter(i => !i.complete).map(i => i.src);
    // elementos que passam da borda direita
    const wide = [...document.querySelectorAll('body *')].filter(el => {
      const r = el.getBoundingClientRect();
      if (!r.width) return false;
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed') return false;
      let p = el.parentElement, clipped = false;
      while (p && p !== document.body) {
        const o = getComputedStyle(p).overflowX;
        if (o === 'hidden' || o === 'auto' || o === 'scroll' || o === 'clip') { clipped = true; break; }
        p = p.parentElement;
      }
      return !clipped && (r.right > window.innerWidth + 1 || r.left < -1);
    }).map(el => el.tagName.toLowerCase() + '.' + [...el.classList].join('.'));
    const ocultos = [...document.querySelectorAll('[data-reveal]')].filter(el => getComputedStyle(el).opacity === '0');
    const hidden = ocultos.length;
    const quais = ocultos.map(el => (el.className || el.tagName) + ' "' + el.textContent.trim().slice(0, 24) + '" a ' + Math.round(el.getBoundingClientRect().top + scrollY) + 'px');
    const h1 = document.querySelectorAll('h1').length;
    const heroImg = document.querySelector('.hero-img').getBoundingClientRect();
    return {
      scrollW: doc.scrollWidth, innerW: window.innerWidth,
      broken, notLoaded, wide: wide.slice(0, 8), hidden, quais, h1,
      heroImgTop: Math.round(heroImg.top), heroImgBottom: Math.round(heroImg.bottom),
    };
  });

  const tag = `${w}x${h}`;
  ok(`${tag} sem rolagem horizontal`, m.scrollW <= m.innerW, `scrollWidth ${m.scrollW} / viewport ${m.innerW}` + (m.wide.length ? ' — passam da borda: ' + m.wide.join(', ') : ''));
  ok(`${tag} imagens carregadas`, m.broken.length === 0 && m.notLoaded.length === 0, m.broken.concat(m.notLoaded).join(' ') || 'todas');
  ok(`${tag} console limpo`, errors.length === 0, errors.join(' | ') || 'sem erros nem avisos');
  ok(`${tag} requisições`, failed.length === 0, failed.join(' ') || 'nenhuma falha');
  ok(`${tag} conteúdo revelado após rolar`, m.hidden === 0, `${m.hidden} elementos ainda ocultos` + (m.hidden ? ': ' + m.quais.join('; ') : ''));
  ok(`${tag} um único h1`, m.h1 === 1, `${m.h1}`);
  const cab = await page.evaluate(() => {
    const h = document.querySelector('[data-header]').getBoundingClientRect().height;
    const nome = document.querySelector('.brand-name');
    const linhas = Math.round(nome.getBoundingClientRect().height / parseFloat(getComputedStyle(nome).lineHeight === 'normal' ? getComputedStyle(nome).fontSize : getComputedStyle(nome).lineHeight));
    const marca = document.querySelector('.brand').getBoundingClientRect().height;
    return { h: Math.round(h), marca: Math.round(marca), linhas };
  });
  ok(`${tag} cabeçalho: nome numa linha e marca dentro da barra`, cab.marca <= cab.h && cab.linhas <= 1, `marca ${cab.marca}px em barra de ${cab.h}px`);
  ok(`${tag} foto na primeira tela`, m.heroImgTop < h * 0.5, `foto da abertura de ${m.heroImgTop}px a ${m.heroImgBottom}px`);
  const cta = await page.evaluate(() => {
    const r = document.querySelector('.hero-cta-main').getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
  });
  ok(`${tag} botão do cardápio na primeira tela`, cta.bottom <= h, `de ${cta.top} a ${cta.bottom}px (tela: ${h}px)`);

  // cada link e botão, levado ao centro da tela, recebe o clique (nada por cima dele)
  const cobertos = await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    const els = [...document.querySelectorAll('main a, main button, main summary, footer a, header a, header button')]
      .filter(el => !el.closest('[hidden], dialog, [inert]') && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
    const ruins = [];
    for (const el of els) {
      el.scrollIntoView({ block: 'center', inline: 'nearest' });
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.right < 0 || r.left > innerWidth) continue; // fora da faixa lateral (abas, galeria)
      const x = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1);
      const y = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1);
      const hit = document.elementFromPoint(x, y);
      if (!hit || !(hit === el || el.contains(hit) || hit.contains(el) && hit.tagName !== 'BODY')) {
        ruins.push((el.textContent.trim() || el.getAttribute('aria-label') || el.className).slice(0, 30) + ' ← ' + (hit ? hit.tagName.toLowerCase() + '.' + [...hit.classList].join('.') : 'nada'));
      }
    }
    window.scrollTo(0, 0);
    return { total: els.length, ruins };
  });
  ok(`${tag} links e botões clicáveis (nada por cima)`, cobertos.ruins.length === 0, `${cobertos.total} verificados` + (cobertos.ruins.length ? ' — cobertos: ' + cobertos.ruins.slice(0, 5).join('; ') : ''));

  // WCAG 2.5.8: alvo de pelo menos 24x24 px (links dentro de frase são exceção)
  const alvos = await page.evaluate(() => {
    const els = [...document.querySelectorAll('a, button, summary')]
      .filter(el => !el.closest('[hidden], dialog, .sprite') && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
    const peq = els.filter(el => {
      const r = el.getBoundingClientRect();
      const emFrase = getComputedStyle(el).display === 'inline' && el.parentElement && el.parentElement.textContent.trim() !== el.textContent.trim();
      return !emFrase && (r.width < 24 || r.height < 24) && !el.classList.contains('skip-link');
    }).map(el => (el.textContent.trim() || el.className).slice(0, 24) + ' ' + Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height));
    const min = Math.min(...els.filter(el => el.closest('.action-bar, .hero-actions, .menu-tabs, .menu-body, .menu-stepper, .road-actions')).map(el => el.getBoundingClientRect().height));
    return { peq, min: Math.round(min) };
  });
  ok(`${tag} alvos de toque ≥ 24 px`, alvos.peq.length === 0, (alvos.peq.join('; ') || 'todos') + ` · menor botão principal: ${alvos.min}px de altura`);

  await page.screenshot({ path: `${tag}-pagina.png`.replace(/^/, OUT + '/'), fullPage: true });
  await ctx.close();
}

/* ---------- Menu do celular ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const toggle = page.locator('[data-menu-toggle]');
  await toggle.click();
  await page.waitForTimeout(600);
  const opened = await page.evaluate(() => ({
    expanded: document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded'),
    visible: !document.querySelector('[data-menu]').hidden,
    focus: document.activeElement.textContent.trim(),
    mainInert: document.querySelector('main').hasAttribute('inert'),
  }));
  ok('menu abre com aria-expanded=true', opened.expanded === 'true' && opened.visible, JSON.stringify(opened));
  ok('menu: foco vai para o primeiro link e o resto fica inerte', /restaurante/i.test(opened.focus) && opened.mainInert, opened.focus);
  await page.screenshot({ path: `${OUT}/390x844-menu-aberto.png` });
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
  const trapped = await page.evaluate(() => !!document.activeElement.closest('[data-header]'));
  ok('menu: Tab não escapa do painel', trapped);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const closed = await page.evaluate(() => ({
    expanded: document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded'),
    hidden: document.querySelector('[data-menu]').hidden,
    focusOnToggle: document.activeElement === document.querySelector('[data-menu-toggle]'),
    mainInert: document.querySelector('main').hasAttribute('inert'),
  }));
  ok('menu fecha com Escape e devolve o foco ao botão', closed.expanded === 'false' && closed.hidden && closed.focusOnToggle && !closed.mainInert, JSON.stringify(closed));
  await toggle.click();
  await page.waitForTimeout(500);
  await page.locator('[data-menu] a[href="#cardapio"]').click();
  await page.waitForTimeout(1200);
  const navigated = await page.evaluate(() => ({
    hidden: document.querySelector('[data-menu]').hidden,
    top: Math.round(document.getElementById('cardapio').getBoundingClientRect().top),
  }));
  ok('menu: link leva à seção e fecha o painel', navigated.hidden && Math.abs(navigated.top) < 120, JSON.stringify(navigated));
  await ctx.close();
}

/* ---------- Cardápio ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '#cardapio', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const visiblePanels = () => page.evaluate(() => [...document.querySelectorAll('.menu-panel')].filter(p => !p.hidden).map(p => p.id));
  ok('cardápio: só um painel visível', (await visiblePanels()).length === 1, (await visiblePanels()).join());
  const y0 = await page.evaluate(() => window.scrollY);
  await page.locator('#tab-feijoada').click();
  await page.waitForTimeout(400);
  const y1 = await page.evaluate(() => window.scrollY);
  ok('cardápio: clique troca a categoria', (await visiblePanels())[0] === 'cat-feijoada', (await visiblePanels()).join());
  ok('cardápio: troca não faz a página pular', Math.abs(y1 - y0) < 4, `scrollY ${y0} → ${y1}`);
  await page.locator('#tab-feijoada').focus();
  await page.keyboard.press('ArrowRight');
  const afterArrow = await page.evaluate(() => ({ panel: [...document.querySelectorAll('.menu-panel')].find(p => !p.hidden).id, focus: document.activeElement.id }));
  ok('cardápio: seta para a direita vai à próxima aba', afterArrow.panel === 'cat-saladas' && afterArrow.focus === 'tab-saladas', JSON.stringify(afterArrow));
  await page.keyboard.press('End');
  const afterEnd = await page.evaluate(() => document.activeElement.id);
  await page.keyboard.press('Home');
  const afterHome = await page.evaluate(() => document.activeElement.id);
  ok('cardápio: Home e End', afterEnd === 'tab-bebidas' && afterHome === 'tab-cafe', `${afterEnd} / ${afterHome}`);
  const tabsVisible = await page.evaluate(() => {
    const t = document.getElementById('tab-cafe'); return t.getAttribute('aria-selected') === 'true' && t.tabIndex === 0;
  });
  ok('cardápio: aria-selected e tabindex coerentes', tabsVisible);
  await page.locator('[data-step="1"]').click();
  await page.waitForTimeout(400);
  ok('cardápio: botão "Próxima"', (await visiblePanels())[0] === 'cat-buffet', (await visiblePanels()).join());
  await page.locator('#tab-carnes').click();
  await page.waitForTimeout(500);
  await page.locator('[data-tabs]').screenshot({ path: `${OUT}/390x844-cardapio.png` });
  await ctx.close();
}

/* ---------- Cardápio: as dez categorias, altura estável, foto sob demanda ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('cardapio').scrollIntoView(); });
  await page.waitForTimeout(600);
  const ids = await page.evaluate(() => [...document.querySelectorAll('[role="tab"]')].map(t => t.id));
  ok('cardápio: dez categorias', ids.length === 10, ids.join(', '));
  const vazios = []; const topos = new Set(); const fotos = []; const semFoto = []; const visiveis = [];
  for (const id of ids) {
    await page.locator('#' + id).click();
    await page.waitForTimeout(700);
    const r = await page.evaluate((id) => {
      const panel = document.getElementById(document.getElementById(id).getAttribute('aria-controls'));
      const open = [...document.querySelectorAll('.menu-panel')].filter(p => !p.hidden).map(p => p.id);
      const img = panel.querySelector('img');
      const tab = document.getElementById(id).getBoundingClientRect();
      const list = document.querySelector('[data-tablist]').getBoundingClientRect();
      return {
        open, area: Math.round(document.querySelector('[data-panels]').getBoundingClientRect().height),
        painel: Math.round(panel.getBoundingClientRect().height),
        topoAbas: Math.round(document.querySelector('[data-tablist]').getBoundingClientRect().top + scrollY),
        img: img ? (img.complete && img.naturalWidth > 0) : null,
        tabVisivel: tab.left >= list.left - 1 && tab.right <= list.right + 1,
        wa: (panel.querySelector('a[href*="wa.me"]') || {}).href || '',
      };
    }, id);
    if (r.area - r.painel > 1) vazios.push(`${id}: ${r.area - r.painel}px`);
    topos.add(r.topoAbas);
    if (r.img === false) fotos.push(id);
    if (!r.wa.includes('text=')) semFoto.push(id + ' sem mensagem de WhatsApp');
    if (!r.tabVisivel) visiveis.push(id);
    if (r.open.length !== 1) semFoto.push(id + ' com ' + r.open.length + ' painéis abertos');
  }
  ok('cardápio: cada categoria abre sozinha e tem WhatsApp com mensagem própria', semFoto.length === 0, semFoto.join('; ') || '10 de 10');
  ok('cardápio: foto da categoria carrega quando ela é aberta', fotos.length === 0, fotos.join(', ') || 'todas as que têm foto');
  ok('cardápio: nenhuma área vazia (a área tem a altura da categoria aberta)', vazios.length === 0, vazios.join(', ') || '10 de 10');
  ok('cardápio: trocar de categoria não move as abas', topos.size === 1, [...topos].join(' / ') + ' px');
  ok('cardápio: aba escolhida sempre visível na faixa', visiveis.length === 0, visiveis.join(', ') || '10 de 10');
  const textos = await page.evaluate(() => document.querySelector('#cardapio').innerText);
  ok('cardápio: nenhum "ainda vão ser publicadas"', !/ainda vai|ainda vão|publicad/i.test(textos));
  ok('cardápio: nenhum preço afirmado', !/R\$\s*\d/.test(textos), (textos.match(/R\$\s*\d[\d,.]*/g) || []).join(' '));
  // teclado: Tab sai da aba para o painel; Enter e Espaço na aba mantêm a seleção
  await page.locator('#tab-feijoada').click();
  await page.locator('#tab-feijoada').focus();
  await page.keyboard.press('Tab');
  const foco = await page.evaluate(() => document.activeElement.id);
  ok('cardápio: Tab vai da aba para o painel', foco === 'cat-feijoada', foco);
  await page.locator('#tab-feijoada').focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  const sel = await page.evaluate(() => document.querySelector('[aria-selected="true"]').id);
  ok('cardápio: seta + Enter + Espaço', sel === 'tab-espeto', sel);
  // "Próxima" fica parado sob o dedo mesmo quando a categoria seguinte é mais baixa
  await page.locator('#tab-buffet').click();
  await page.evaluate(() => { const t = document.querySelector('[data-tablist]'); window.scrollTo(0, t.getBoundingClientRect().top + scrollY - 90); });
  await page.waitForTimeout(400);
  const antes = await page.evaluate(() => Math.round(document.querySelector('[data-step="1"]').getBoundingClientRect().top));
  await page.locator('[data-step="1"]').click();
  await page.waitForTimeout(500);
  const depois = await page.evaluate(() => ({ top: Math.round(document.querySelector('[data-step="1"]').getBoundingClientRect().top), aberta: document.querySelector('[aria-selected="true"]').id }));
  ok('cardápio: "Próxima" fica no mesmo lugar ao trocar para uma categoria mais baixa', Math.abs(depois.top - antes) <= 2 && depois.aberta === 'tab-jantar', `${antes} → ${depois.top}px (${depois.aberta})`);
  // lista do que já passou pelo buffet
  await page.locator('#tab-buffet').click();
  await page.waitForTimeout(300);
  await page.locator('#cat-buffet summary').click();
  const aberto = await page.evaluate(() => document.querySelector('#cat-buffet details').open);
  ok('cardápio: lista "já passou pelo buffet" abre ao tocar', aberto);
  await page.locator('[data-tabs]').screenshot({ path: `${OUT}/390x844-cardapio-buffet.png` });
  await ctx.close();
}

/* ---------- Âncoras e links externos ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const r = await page.evaluate(() => {
    const quebradas = [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href'))
      .filter(h => h.length > 1 && !document.getElementById(h.slice(1)));
    const wa = [...document.querySelectorAll('a[href*="wa.me"]')].map(a => a.href);
    const waRuins = wa.filter(h => !/^https:\/\/wa\.me\/5545998258916(\?text=[^&]+)?$/.test(h));
    const msgs = new Set(wa.map(h => (h.split('text=')[1] || '')));
    const maps = [...document.querySelectorAll('a[href*="google.com/maps"]')].map(a => a.href);
    const insta = [...document.querySelectorAll('a[href*="instagram.com"]')].map(a => a.href);
    const externosSemRel = [...document.querySelectorAll('a[target="_blank"]')].filter(a => !/noopener/.test(a.rel)).length;
    return { quebradas, wa: wa.length, waRuins, msgs: msgs.size, maps: maps.length, mapsOk: maps.every(h => h.includes('query=Parada%20do%20Mano')), insta: insta.length, instaOk: insta.every(h => h === 'https://www.instagram.com/paradadomano/'), externosSemRel };
  });
  ok('âncoras internas levam a seções existentes', r.quebradas.length === 0, r.quebradas.join(', ') || 'todas');
  ok('links de WhatsApp no formato certo', r.waRuins.length === 0, `${r.wa} links, ${r.msgs} mensagens diferentes` + (r.waRuins.length ? ' — ruins: ' + r.waRuins.join(' ') : ''));
  ok('links de rota e Instagram', r.maps > 0 && r.mapsOk && r.insta > 0 && r.instaOk, `${r.maps} de rota, ${r.insta} de Instagram`);
  ok('links externos com rel=noopener', r.externosSemRel === 0, `${r.externosSemRel}`);
  const msgs = await page.evaluate(() => [...document.querySelectorAll('a[href*="wa.me"]')].map(a => {
    const t = new URL(a.href).searchParams.get('text') || '';
    const cru = a.href.split('text=')[1] || '';
    // codificado: só caracteres seguros na URL, e volta exatamente ao texto
    return { t, ida: /^[A-Za-z0-9%._~!*'()-]+$/.test(cru) && decodeURIComponent(cru) === t };
  }));
  const fora = msgs.filter(m => !m.t.startsWith('Olá! Vim pelo site do Parada do Mano e gostaria de') || !m.ida).map(m => m.t || '(sem texto)');
  const promete = msgs.filter(m => /pedido (feito|confirmado)|compra|reserv/i.test(m.t)).map(m => m.t);
  ok('WhatsApp: toda mensagem começa com "Olá! Vim pelo site do Parada do Mano…" e está codificada', fora.length === 0, fora.join(' | ') || `${msgs.length} links, ${new Set(msgs.map(m => m.t)).size} mensagens`);
  ok('WhatsApp: nenhuma mensagem fala em pedido, compra ou reserva', promete.length === 0, promete.join(' | ') || 'só pedem informação');
  await ctx.close();
}

/* ---------- Jornadas no celular (390x844) ---------- */
{
  const jornadas = [
    { nome: 'A — o que tem para almoçar', passos: ['.hero-cta-main', '#tab-buffet'], alvo: '#cat-buffet a[href*="wa.me"]', msg: 'buffet' },
    { nome: 'B — valor do espeto corrido', passos: ['.hero-cta-main', '#tab-espeto'], alvo: '#cat-espeto a[href*="wa.me"]', msg: 'espeto' },
    { nome: 'C — feijoada', passos: ['.hero-cta-main', '#tab-feijoada'], alvo: '#cat-feijoada a[href*="wa.me"]', msg: 'feijoada' },
    { nome: 'D — rota até o restaurante', passos: [], alvo: '.hero-actions a[href*="google.com/maps"]', msg: 'maps' },
  ];
  for (const j of jornadas) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    for (const sel of j.passos) { await page.locator(sel).first().click(); await page.waitForTimeout(1300); }
    const alvo = page.locator(j.alvo).first();
    await alvo.scrollIntoViewIfNeeded();
    const r = await alvo.evaluate((el, msg) => ({ href: el.href.includes(msg), visivel: el.getBoundingClientRect().top < innerHeight }), j.msg);
    const rolagem = await page.evaluate(() => Math.round(window.scrollY));
    ok(`jornada ${j.nome}: ${j.passos.length + 1} toque(s) até o botão certo`, r.href && r.visivel, `rolagem ${rolagem}px`);
    await ctx.close();
  }
}

/* ---------- Galeria ampliada ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '#galeria', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.locator('.g-b .g-link').click();
  await page.waitForTimeout(600);
  const lb = await page.evaluate(() => ({ open: document.querySelector('[data-lightbox]').open, count: document.querySelector('[data-lightbox-count]').textContent }));
  ok('galeria: abre a foto ampliada', lb.open && lb.count === '2 / 5', JSON.stringify(lb));
  await page.keyboard.press('ArrowRight');
  const count2 = await page.evaluate(() => document.querySelector('[data-lightbox-count]').textContent);
  ok('galeria: seta avança', count2 === '3 / 5', count2);
  await page.screenshot({ path: `${OUT}/1440x900-galeria-ampliada.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({ open: document.querySelector('[data-lightbox]').open, focus: document.activeElement.closest('.g-b') !== null }));
  ok('galeria: Escape fecha e devolve o foco', !after.open && after.focus, JSON.stringify(after));
  await ctx.close();
}

/* ---------- Galeria no celular: faixa de arrastar + foto ampliada ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('galeria').scrollIntoView(); });
  await page.waitForTimeout(1200);
  const faixa = await page.evaluate(() => { const g = document.querySelector('[data-gallery]'); return { rola: g.scrollWidth > g.clientWidth, pagina: document.documentElement.scrollWidth <= innerWidth }; });
  ok('galeria no celular: faixa rola de lado sem rolar a página', faixa.rola && faixa.pagina, JSON.stringify(faixa));
  await page.locator('.g-a .g-link').click();
  await page.waitForTimeout(500);
  await page.locator('[data-lightbox-next]').click();
  const c = await page.evaluate(() => ({ open: document.querySelector('[data-lightbox]').open, count: document.querySelector('[data-lightbox-count]').textContent, img: (() => { const r = document.querySelector('.lightbox-img').getBoundingClientRect(); return r.width <= innerWidth && r.height <= innerHeight; })() }));
  ok('galeria no celular: abre, avança e cabe na tela', c.open && c.count === '2 / 5' && c.img, JSON.stringify(c));
  await page.screenshot({ path: `${OUT}/360x800-galeria-ampliada.png` });
  await page.locator('[data-lightbox-close]').click();
  await page.waitForTimeout(300);
  const f = await page.evaluate(() => !document.querySelector('[data-lightbox]').open && !!document.activeElement.closest('.g-a'));
  ok('galeria no celular: fechar devolve o foco à foto', f);
  await ctx.close();
}

/* ---------- Vídeo da abertura ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4500);
  const v = await page.evaluate(() => {
    const el = document.querySelector('.hero-video');
    return { src: el.currentSrc.split('/').pop(), playing: el.classList.contains('is-playing'), t: Math.round(el.currentTime * 10) / 10, err: el.error && el.error.code };
  });
  ok('vídeo da abertura toca no computador', v.playing && v.t > 0, JSON.stringify(v));
  await page.screenshot({ path: `${OUT}/1440x900-abertura-video.png` });
  await page.evaluate(() => window.scrollTo(0, 3000));
  await page.waitForTimeout(600);
  const paused = await page.evaluate(() => document.querySelector('.hero-video').paused);
  ok('vídeo pausa quando a abertura sai da tela', paused);
  await ctx.close();

  const m = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await m.newPage();
  await mp.goto(BASE, { waitUntil: 'networkidle' });
  await mp.waitForTimeout(2000);
  const mv = await mp.evaluate(() => document.querySelector('.hero-video').getAttribute('src'));
  ok('celular não baixa o vídeo (fica a foto)', mv === null, String(mv));
  await m.close();
}

/* ---------- Movimento reduzido ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const hero = getComputedStyle(document.querySelector('.hero-title .line > span'));
    const ember = getComputedStyle(document.querySelector('.embers')).display;
    const ticker = getComputedStyle(document.querySelector('.ticker-track')).animationName;
    const revealHidden = [...document.querySelectorAll('[data-reveal]')].filter(el => getComputedStyle(el).opacity === '0').length;
    return { heroAnim: hero.animationName, ember, ticker, revealHidden };
  });
  ok('movimento reduzido: sem animação de entrada, brasas e faixa', r.heroAnim === 'none' && r.ember === 'none' && r.ticker === 'none', JSON.stringify(r));
  ok('movimento reduzido: nada escondido esperando rolagem', r.revealHidden === 0, `${r.revealHidden}`);
  await page.screenshot({ path: `${OUT}/390x844-movimento-reduzido.png` });
  await ctx.close();
}

/* ---------- Sem JavaScript ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  // sem JS na página, a rolagem é feita pelo teste, passo a passo
  const alturaTotal = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < alturaTotal; y += 600) { await page.mouse.wheel(0, 600); await page.waitForTimeout(60); }
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => ({
    panels: [...document.querySelectorAll('.menu-panel')].filter(p => getComputedStyle(p).display !== 'none').length,
    hidden: [...document.querySelectorAll('[data-reveal]')].filter(el => getComputedStyle(el).opacity === '0').length,
    semSrc: [...document.images].filter(i => !i.closest('dialog') && i.getClientRects().length && !i.getAttribute('src')).length,
    quebradas: [...document.images].filter(i => !i.closest('dialog') && i.getClientRects().length && i.complete && !i.naturalWidth).length,
    fotosCardapio: [...document.querySelectorAll('.menu-photo img')].filter(i => i.getClientRects().length && i.complete && i.naturalWidth > 0).length,
    actionBar: getComputedStyle(document.querySelector('.action-bar')).transform,
  }));
  ok('sem JS: as 10 categorias do cardápio aparecem', r.panels === 10, `${r.panels}`);
  ok('sem JS: nenhum conteúdo escondido', r.hidden === 0, `${r.hidden}`);
  ok('sem JS: todas as imagens têm endereço e carregam', r.semSrc === 0 && r.quebradas === 0, JSON.stringify({ semSrc: r.semSrc, quebradas: r.quebradas }));
  ok('sem JS: as 7 fotos das categorias aparecem', r.fotosCardapio === 7, `${r.fotosCardapio} de 7`);
  ok('sem JS: barra de atalhos visível', r.actionBar === 'none', r.actionBar);
  const links = await page.evaluate(() => ({
    wa: [...document.querySelectorAll('.menu-panel a[href*="wa.me"][href*="text="]')].length,
    rota: document.querySelectorAll('a[href*="google.com/maps"]').length,
    titulos: [...document.querySelectorAll('.menu-panel .menu-title')].filter(t => t.getBoundingClientRect().height > 0).length,
  }));
  ok('sem JS: cada categoria tem título e WhatsApp; rota disponível', links.wa === 10 && links.titulos === 10 && links.rota > 0, JSON.stringify(links));
  await ctx.close();
}

/* ---------- Menu do computador e espiã de rolagem ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.locator('.nav-desktop a[href="#cardapio"]').click();
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => ({
    top: Math.round(document.getElementById('cardapio').getBoundingClientRect().top),
    header: Math.round(document.querySelector('[data-header]').getBoundingClientRect().height),
    atual: (document.querySelector('.nav-desktop a[aria-current]') || {}).textContent || '',
  }));
  ok('menu do computador: link leva à seção, logo abaixo do cabeçalho', r.top >= 0 && r.top <= r.header + 16, `seção a ${r.top}px; cabeçalho ${r.header}px`);
  ok('menu do computador: item da seção na tela fica marcado (aria-current)', /card/i.test(r.atual), r.atual || 'nenhum');
  await ctx.close();
}

/* ---------- Barra de ações do celular ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const estado = () => page.evaluate(() => {
    const bar = document.querySelector('.action-bar').getBoundingClientRect();
    return { visivel: bar.top < innerHeight - 4, top: Math.round(bar.top) };
  });
  const noTopo = await estado();
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 1400); });
  await page.waitForTimeout(700);
  const rolada = await estado();
  ok('barra de ações: escondida na abertura, aparece depois dela', !noTopo.visivel && rolada.visivel, `topo: ${noTopo.top}px · rolada: ${rolada.top}px`);
  await page.locator('[data-menu-toggle]').click();
  await page.waitForTimeout(700);
  const comMenu = await estado();
  ok('barra de ações: sai da tela com o menu aberto', !comMenu.visivel, `${comMenu.top}px`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(900);
  const fim = await page.evaluate(() => {
    const bar = document.querySelector('.action-bar').getBoundingClientRect();
    const ult = document.querySelector('.footer-bottom').getBoundingClientRect();
    const topo = document.querySelector('.to-top').getBoundingClientRect();
    const hit = document.elementFromPoint(topo.left + topo.width / 2, topo.top + topo.height / 2);
    return { folga: Math.round(bar.top - ult.bottom), voltar: !!hit && !!hit.closest('.to-top') };
  });
  ok('barra de ações: no fim da página não cobre o rodapé', fim.folga >= 0 && fim.voltar, `folga ${fim.folga}px; "Voltar ao topo" ${fim.voltar ? 'livre' : 'coberto'}`);
  const css = await page.evaluate(async () => (await (await fetch(document.querySelector('link[rel=stylesheet]') ? document.querySelector('link[rel=stylesheet]').href : location.href)).text()));
  const meta = await page.evaluate(() => document.querySelector('meta[name=viewport]').content);
  ok('barra de ações: respeita a área segura (viewport-fit=cover + env(safe-area-inset-bottom))', /viewport-fit=cover/.test(meta) && /safe-area-inset-bottom/.test(css), 'inspeção do código: o Chromium não simula o entalhe do iPhone');
  await ctx.close();
}

/* ---------- Tablet girado com o menu aberto ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 1366 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.locator('[data-menu-toggle]').click();
  await page.waitForTimeout(600);
  await page.setViewportSize({ width: 1366, height: 1024 });
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => ({
    rolagem: document.body.style.overflow || 'normal',
    inerte: document.querySelector('main').hasAttribute('inert'),
    expandido: document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded'),
  }));
  ok('tablet girado com o menu aberto: menu fecha e a página volta a rolar', r.rolagem === 'normal' && !r.inerte && r.expandido === 'false', JSON.stringify(r));
  await ctx.close();
}

/* ---------- Celular deitado: menu cabe sem rolar ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.locator('[data-menu-toggle]').click();
  await page.waitForTimeout(700);
  const r = await page.evaluate(() => {
    const nav = document.querySelector('.mobile-menu-nav').getBoundingClientRect();
    const btn = document.querySelector('.mobile-menu-foot .btn').getBoundingClientRect();
    return { navFim: Math.round(nav.bottom), btnFim: Math.round(btn.bottom), tela: innerHeight };
  });
  ok('celular deitado: menu aberto mostra os 7 links sem rolar', r.navFim <= r.tela, `links até ${r.navFim}px; WhatsApp até ${r.btnFim}px; tela ${r.tela}px`);
  await page.screenshot({ path: `${OUT}/844x390-menu-aberto.png` });
  await ctx.close();
}

/* ---------- Títulos em ordem ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const r = await page.evaluate(() => {
    const hs = [...document.querySelectorAll('h1, h2, h3, h4')].map(h => +h.tagName[1]);
    const pulos = [];
    hs.forEach((n, i) => { if (i && n > hs[i - 1] + 1) pulos.push(`h${hs[i - 1]}→h${n}`); });
    return { n: hs.length, pulos, h1: hs[0] === 1 };
  });
  ok('títulos: começam no h1 e não pulam níveis', r.h1 && r.pulos.length === 0, `${r.n} títulos` + (r.pulos.length ? ' — pulos: ' + r.pulos.join(', ') : ''));
  await ctx.close();
}

/* ---------- Foco do teclado: visível e nunca escondido atrás do cabeçalho ou da barra ---------- */
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  const semContorno = []; const escondidos = []; const vistos = new Set();
  for (let i = 0; i < 90; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(220); // o link "Pular para o conteúdo" desce em 160 ms
    const f = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const contorno = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2) || cs.boxShadow !== 'none';
      const x = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), y = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1);
      const hit = document.elementFromPoint(x, y);
      const livre = !!hit && (hit === el || el.contains(hit) || hit.contains(el));
      return { id: (el.id || el.textContent.trim() || el.className).slice(0, 28), contorno, livre: livre || r.width === 0 };
    });
    if (!f) continue;
    if (vistos.has(f.id)) continue;
    vistos.add(f.id);
    if (!f.contorno) semContorno.push(f.id);
    if (!f.livre) escondidos.push(f.id);
  }
  ok(`${w}x${h} foco visível em todo elemento alcançado pelo Tab`, semContorno.length === 0, `${vistos.size} elementos` + (semContorno.length ? ' — sem contorno: ' + semContorno.join(', ') : ''));
  ok(`${w}x${h} foco nunca fica escondido atrás do cabeçalho ou da barra`, escondidos.length === 0, escondidos.join(', ') || 'nenhum');
  await ctx.close();
}

/* ---------- Espaçamento de texto (WCAG 1.4.12) ---------- */
for (const [w, h] of [[320, 568], [390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}' });
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => {
    const cortados = [...document.querySelectorAll('.btn, .menu-tab, .feature-chip, .action-bar a, .step-btn, .menu-facts li')]
      .filter(el => el.getClientRects().length && !el.closest('[hidden]'))
      .filter(el => el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible')
      .map(el => el.textContent.trim().slice(0, 24));
    return { overflow: document.documentElement.scrollWidth > innerWidth, cortados };
  });
  ok(`${w}x${h} espaçamento de texto aumentado: sem rolagem lateral nem texto cortado`, !r.overflow && r.cortados.length === 0, r.cortados.join(', ') || 'ok');
  await ctx.close();
}

/* ---------- Contraste do texto sobre foto (medido nos pixels) ---------- */
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}.hero-video,.embers{display:none!important}' });
  await page.waitForTimeout(500);
  const alvos = ['.hero-title .line:nth-child(1)', '.hero-title .line:nth-child(2)', '.hero-title .line-accent', '.hero-sub', '.hero-facts li:first-child strong', '.hero-facts li:first-child span', '.hero-tag'];
  // 1) cor, tamanho e área das letras de cada texto
  const infos = await page.evaluate((alvos) => alvos.map(sel => {
    const el = document.querySelector(sel);
    if (!el || !el.getClientRects().length) return null;
    const cs = getComputedStyle(el.querySelector('span, strong') || el);
    const rects = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (!walker.currentNode.textContent.trim()) continue;
      const range = document.createRange(); range.selectNodeContents(walker.currentNode);
      rects.push(...range.getClientRects());
    }
    const x = Math.min(...rects.map(q => q.left)), y = Math.min(...rects.map(q => q.top));
    return { sel, color: cs.color, size: parseFloat(cs.fontSize), weight: cs.fontWeight, x, y,
      w: Math.max(...rects.map(q => q.right)) - x, h: Math.max(...rects.map(q => q.bottom)) - y };
  }), alvos);
  // 2) uma captura com todo o texto da abertura transparente: sobra só o fundo real
  await page.addStyleTag({ content: '.hero-content, .hero-content * { color: transparent !important; } .hero-actions { visibility: hidden !important; }' });
  await page.waitForTimeout(150);
  const png = await page.screenshot();
  // 3) para cada texto, o fundo mais claro (95º percentil) da área dele
  const res = await page.evaluate(async ({ b64, infos }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    const L = (r, gg, b) => .2126 * lin(r) + .7152 * lin(gg) + .0722 * lin(b);
    return infos.filter(Boolean).filter(i => i.y < img.height).map(i => {
      const x = Math.max(0, Math.round(i.x)), y = Math.max(0, Math.round(i.y));
      const w = Math.min(Math.round(i.w), img.width - x), h = Math.min(Math.round(i.h), img.height - y);
      const d = g.getImageData(x, y, w, h).data;
      const px = [];
      for (let k = 0; k < d.length; k += 8) px.push([d[k], d[k + 1], d[k + 2], L(d[k], d[k + 1], d[k + 2])]);
      px.sort((p, q) => p[3] - q[3]);
      const fundo = px[Math.floor(px.length * .95)];
      const bg = fundo[3];
      // texto com transparência: a cor que aparece é a mistura com o fundo
      const [r, gg, b, a = 1] = i.color.match(/[\d.]+/g).map(Number);
      const mix = (t, f) => a * t + (1 - a) * f;
      const lt = L(mix(r, fundo[0]), mix(gg, fundo[1]), mix(b, fundo[2]));
      const ratio = (Math.max(lt, bg) + .05) / (Math.min(lt, bg) + .05);
      const grande = i.size >= 24 || (i.size >= 18.66 && +i.weight >= 700);
      return { sel: i.sel, ratio: Math.round(ratio * 10) / 10, min: grande ? 3 : 4.5 };
    });
  }, { b64: png.toString('base64'), infos });
  const ruins = res.filter(r => r.ratio < r.min);
  ok(`${w}x${h} contraste do texto da abertura sobre a foto (pior 5% do fundo)`, ruins.length === 0, res.map(r => `${r.sel.replace('.hero-', '').replace('title .line', 'título')} ${r.ratio}:1`).join(' · '));
  await ctx.close();
}

/* ---------- Vídeo: falha, economia de dados, pôster ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.route(/\.(webm|mp4)$/, r => r.abort());
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(4500);
  const r = await page.evaluate(() => {
    const img = document.querySelector('.hero-img'), v = document.querySelector('.hero-video');
    return { foto: img.complete && img.naturalWidth > 0 && getComputedStyle(img).opacity === '1', tocando: v.classList.contains('is-playing'), opacidadeVideo: getComputedStyle(v).opacity };
  });
  ok('vídeo que não carrega: a abertura fica com a foto, sem quadro preto', r.foto && !r.tocando && r.opacidadeVideo === '0', JSON.stringify(r));
  await ctx.close();

  const sd = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p2 = await sd.newPage();
  await p2.addInitScript(() => Object.defineProperty(navigator, 'connection', { get: () => ({ saveData: true, effectiveType: '4g' }) }));
  await p2.goto(BASE, { waitUntil: 'networkidle' });
  await p2.waitForTimeout(3500);
  ok('economia de dados ligada: o vídeo não é baixado', await p2.evaluate(() => !document.querySelector('.hero-video').getAttribute('src')));
  await sd.close();

  const rm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p3 = await rm.newPage();
  await p3.goto(BASE, { waitUntil: 'networkidle' });
  await p3.waitForTimeout(3500);
  ok('movimento reduzido no computador: o vídeo não é baixado', await p3.evaluate(() => !document.querySelector('.hero-video').getAttribute('src')));
  await rm.close();

  // o pôster é a própria foto da abertura, por baixo do vídeo: até ele tocar, só ela aparece
  const ok4 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p4 = await ok4.newPage();
  await p4.goto(BASE, { waitUntil: 'load' });
  const antes = await p4.evaluate(() => { const v = document.querySelector('.hero-video'), img = document.querySelector('.hero-img');
    return { video: getComputedStyle(v).opacity, src: v.getAttribute('src'), preload: v.getAttribute('preload'), foto: img.complete && img.naturalWidth > 0 }; });
  ok('vídeo: na carga só a foto aparece (pôster); o vídeo começa sem endereço e com preload "none"', antes.video === '0' && !antes.src && antes.preload === 'none' && antes.foto, JSON.stringify(antes));
  await ok4.close();
}

/* ---------- Galeria ampliada em celular pequeno ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 320, height: 568 }, hasTouch: true });
  const page = await ctx.newPage();
  const pedidos = [];
  page.on('request', r => pedidos.push(r.url()));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('galeria').scrollIntoView(); });
  await page.waitForTimeout(1000);
  await page.locator('.g-a .g-link').click();
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const img = document.querySelector('.lightbox-img').getBoundingClientRect();
    const btns = [...document.querySelectorAll('.lb-btn')].map(b => b.getBoundingClientRect());
    const sobre = btns.filter(b => !(b.right <= img.left || b.left >= img.right || b.bottom <= img.top || b.top >= img.bottom)).length;
    const cap = document.querySelector('.lightbox-cap');
    return {
      cabe: img.top >= 0 && img.bottom <= innerHeight && img.left >= 0 && img.right <= innerWidth,
      sobre, menorBotao: Math.round(Math.min(...btns.map(b => Math.min(b.width, b.height)))),
      legenda: cap.textContent.trim(), aoVivo: cap.getAttribute('aria-live'),
      arquivo: document.querySelector('.lightbox-img').currentSrc.split('/').pop(),
    };
  });
  ok('galeria 320x568: foto ampliada inteira na tela e sem botão por cima', r.cabe && r.sobre === 0, JSON.stringify({ cabe: r.cabe, botoesSobreAFoto: r.sobre }));
  ok('galeria 320x568: botões de 44 px ou mais, legenda e contador anunciados', r.menorBotao >= 44 && /1 \/ 5/.test(r.legenda) && r.aoVivo === 'polite', `${r.menorBotao}px · "${r.legenda}"`);
  ok('galeria 320x568: celular recebe a versão de 800 px e a próxima foto já vem carregada', /-800\.webp$/.test(r.arquivo) && pedidos.some(u => /prato-carnes-800\.webp$/.test(u)), r.arquivo);
  await page.screenshot({ path: `${OUT}/320x568-galeria-ampliada.png` });
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  const preso = await page.evaluate(() => !!document.activeElement.closest('dialog'));
  ok('galeria: Tab fica dentro da foto ampliada', preso);
  await ctx.close();
}

/* ---------- Modo cinematográfico (GSAP + ScrollTrigger, V5) ---------- */
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const pedidos = []; const erros = [];
  page.on('request', r => pedidos.push(r.url()));
  page.on('pageerror', e => erros.push(String(e)));
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  const r = await page.evaluate(() => ({
    classes: document.documentElement.className,
    gsap: !!window.gsap, st: window.ScrollTrigger ? window.ScrollTrigger.getAll().length : 0,
    nome: document.querySelector('h1').getAttribute('aria-label') || document.querySelector('h1').textContent.replace(/\s+/g, ' ').trim(),
    linhas: [...document.querySelectorAll('.hero-title .line > span, .hero-title .ch')].every(s => { const t = getComputedStyle(s).transform; return t === 'none' || /matrix\(1, 0, 0, 1, 0, 0\)/.test(t); }),
    textoVisivel: ['.hero-tag', '.hero-sub', '.hero-actions', '.hero-facts'].every(sel => getComputedStyle(document.querySelector(sel)).opacity === '1'),
    three: [...document.scripts].some(sc => /three/i.test(sc.src)),
  }));
  ok(`${w}x${h} cine: GSAP assume a abertura e o ScrollTrigger chega depois da carga`, /cine-ready/.test(r.classes) && r.gsap && r.st > 10, `${r.st} gatilhos de rolagem`);
  ok(`${w}x${h} cine: abertura termina com título e textos no lugar`, r.linhas && r.textoVisivel, JSON.stringify({ linhas: r.linhas, textos: r.textoVisivel }));
  ok(`${w}x${h} cine: o título continua "Do fogo à mesa. Sabor de verdade." para leitor de tela`, r.nome === 'Do fogo à mesa. Sabor de verdade.', r.nome);
  ok(`${w}x${h} cine: Three.js não é carregado (não há modelo 3D)`, !r.three && !pedidos.some(u => /three/i.test(u)), 'nenhum arquivo do Three.js');
  ok(`${w}x${h} cine: sem erro de JavaScript`, erros.length === 0, erros.join(' | ') || 'nenhum');
  // indicador da aba e troca de categoria legível em menos de 0,7 s
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const t = document.querySelector('[data-tablist]'); window.scrollTo(0, t.getBoundingClientRect().top + scrollY - 100); });
  await page.waitForTimeout(500);
  await page.locator('#tab-feijoada').click();
  await page.waitForTimeout(700);
  const m = await page.evaluate(() => {
    if (!document.querySelector('.menu-ink')) return { alinhado: false, legivel: false, semIndicador: true };
    const ink = document.querySelector('.menu-ink').getBoundingClientRect();
    const tab = document.getElementById('tab-feijoada').getBoundingClientRect();
    const partes = [...document.querySelectorAll('#cat-feijoada .menu-body > *')];
    return { alinhado: Math.abs(ink.left - tab.left) < 2 && Math.abs(ink.width - tab.width) < 2,
      legivel: partes.every(p => getComputedStyle(p).opacity === '1' && getComputedStyle(p).visibility === 'visible') };
  });
  ok(`${w}x${h} cine: indicador desliza até a aba escolhida e o texto está legível em 0,7 s`, m.alinhado && m.legivel, JSON.stringify(m));
  await ctx.close();
}
{
  // movimento reduzido e economia de dados: nada de GSAP
  for (const [nome, opts, init] of [
    ['movimento reduzido', { reducedMotion: 'reduce' }, null],
    ['economia de dados', {}, () => Object.defineProperty(navigator, 'connection', { get: () => ({ saveData: true, effectiveType: '4g' }) })],
  ]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ...opts });
    const page = await ctx.newPage();
    if (init) await page.addInitScript(init);
    const pedidos = [];
    page.on('request', r => pedidos.push(r.url()));
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    const cls = await page.evaluate(() => document.documentElement.className);
    ok(`cine: com ${nome} o GSAP não é baixado`, !/\bcine\b/.test(cls) && !pedidos.some(u => /vendor\//.test(u)), cls);
    await ctx.close();
  }
  // GSAP bloqueado (arquivo fora do ar): a reserva em CSS mostra tudo
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.route(/vendor\//, r => r.abort());
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(3200);
  const r = await page.evaluate(() => ({
    cortina: document.querySelector('.hero-curtain') ? getComputedStyle(document.querySelector('.hero-curtain')).transform : 'sem cortina',
    linhas: [...document.querySelectorAll('.hero-title .line > span')].every(s => getComputedStyle(s).transform === 'none' || /matrix\(1, 0, 0, 1, 0, 0\)/.test(getComputedStyle(s).transform)),
    textos: ['.hero-tag', '.hero-sub', '.hero-actions', '.hero-facts'].every(sel => getComputedStyle(document.querySelector(sel)).opacity === '1'),
  }));
  ok('cine: com o GSAP bloqueado, a abertura aparece inteira pela reserva em CSS', /matrix\(0, 0, 0, 1, 0, 0\)/.test(r.cortina) && r.linhas && r.textos, JSON.stringify(r));
  await ctx.close();
}

/* ---------- Conteúdo: index.html em dia com conteudo/*.json ---------- */
{
  const { execFileSync } = require('child_process');
  const path = require('path');
  const raiz = path.dirname(path.dirname(new URL(import.meta.url).pathname));
  let saida = '', passou = true;
  try { saida = execFileSync('python3', [path.join(raiz, 'tools', 'build-content.py'), '--check'], { encoding: 'utf8' }).trim(); }
  catch (e) { passou = false; saida = String(e.stdout || e.message).trim(); }
  ok('conteúdo: cardápio e mensagens do index.html em dia com conteudo/*.json', passou, saida);
}

await browser.close();

let fails = 0;
for (const r of results) {
  if (!r.pass) fails++;
  console.log(`${r.pass ? 'OK  ' : 'FALHA'}  ${r.name}${r.info ? '  —  ' + r.info : ''}`);
}
console.log(`\n${results.length - fails} de ${results.length} verificações passaram.`);
process.exit(fails ? 1 : 0);
