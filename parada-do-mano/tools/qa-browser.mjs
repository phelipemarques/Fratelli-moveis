// Parada do Mano — verificação no navegador (Chromium via Playwright).
//
//   python3 -m http.server 8130 --bind 127.0.0.1      (na pasta parada-do-mano)
//   NODE_PATH=$(npm root -g) node tools/qa-browser.mjs [saida-das-capturas]
//
// Testa cada tamanho de tela pedido no briefing, o menu do celular, o
// cardápio por teclado, a galeria ampliada, movimento reduzido e a página
// sem JavaScript. Imprime um relatório e grava capturas de tela.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.QA_URL || 'http://127.0.0.1:8130/';
const OUT = process.argv[2] || 'qa-shots';
const fs = require('fs');
fs.mkdirSync(OUT, { recursive: true });

const SIZES = [
  [320, 568], [360, 800], [375, 667], [390, 844], [430, 932],
  [768, 1024], [1440, 900], [1920, 1080],
];

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
    const hidden = [...document.querySelectorAll('[data-reveal]')].filter(el => getComputedStyle(el).opacity === '0').length;
    const h1 = document.querySelectorAll('h1').length;
    const heroImg = document.querySelector('.hero-img').getBoundingClientRect();
    return {
      scrollW: doc.scrollWidth, innerW: window.innerWidth,
      broken, notLoaded, wide: wide.slice(0, 8), hidden, h1,
      heroImgTop: Math.round(heroImg.top), heroImgBottom: Math.round(heroImg.bottom),
    };
  });

  const tag = `${w}x${h}`;
  ok(`${tag} sem rolagem horizontal`, m.scrollW <= m.innerW, `scrollWidth ${m.scrollW} / viewport ${m.innerW}` + (m.wide.length ? ' — passam da borda: ' + m.wide.join(', ') : ''));
  ok(`${tag} imagens carregadas`, m.broken.length === 0 && m.notLoaded.length === 0, m.broken.concat(m.notLoaded).join(' ') || 'todas');
  ok(`${tag} console limpo`, errors.length === 0, errors.join(' | ') || 'sem erros nem avisos');
  ok(`${tag} requisições`, failed.length === 0, failed.join(' ') || 'nenhuma falha');
  ok(`${tag} conteúdo revelado após rolar`, m.hidden === 0, `${m.hidden} elementos ainda ocultos`);
  ok(`${tag} um único h1`, m.h1 === 1, `${m.h1}`);
  ok(`${tag} foto na primeira tela`, m.heroImgTop < h * 0.5, `foto da abertura de ${m.heroImgTop}px a ${m.heroImgBottom}px`);

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
  const r = await page.evaluate(() => ({
    panels: [...document.querySelectorAll('.menu-panel')].filter(p => getComputedStyle(p).display !== 'none').length,
    hidden: [...document.querySelectorAll('[data-reveal]')].filter(el => getComputedStyle(el).opacity === '0').length,
    actionBar: getComputedStyle(document.querySelector('.action-bar')).transform,
  }));
  ok('sem JS: as 10 categorias do cardápio aparecem', r.panels === 10, `${r.panels}`);
  ok('sem JS: nenhum conteúdo escondido', r.hidden === 0, `${r.hidden}`);
  await ctx.close();
}

await browser.close();

let fails = 0;
for (const r of results) {
  if (!r.pass) fails++;
  console.log(`${r.pass ? 'OK  ' : 'FALHA'}  ${r.name}${r.info ? '  —  ' + r.info : ''}`);
}
console.log(`\n${results.length - fails} de ${results.length} verificações passaram.`);
process.exit(fails ? 1 : 0);
