// Auditoria mobile: mede a página real servida por HTTP e salva capturas por seção.
// uso: node scripts/audit.mjs <url> <pasta-saida> [rotulo]
// Saída: <pasta>/<rotulo>-metricas.json e capturas <tamanho>_<seção>.png
//
// Mede, em cada tamanho: altura total e de cada seção, posição dos CTAs e do
// portfólio, elementos interativos cobertos (cabeçalho fixo, barra inferior,
// outro elemento) ao percorrer a página, rolagem horizontal, textos que passam
// da tela, alvos de toque menores que 24 e 44 px, bytes transferidos, erros de
// console e requisições que falharam.
import { chromium, devices } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const [url = 'http://localhost:4173/', out = 'auditoria', label = 'site', only] = process.argv.slice(2);
mkdirSync(out, { recursive: true });

const SIZES = [
  [320, 568], [360, 800], [375, 667], [390, 844], [393, 852], [414, 896], [430, 932], [768, 1024],
  [844, 390], [667, 375], // paisagem
  [1440, 900], // regressão do desktop
].filter(([w, h]) => !only || only.split(',').includes(`${w}x${h}`));
const SECTIONS = ['inicio', 'salao', 'servicos', 'cabelos', 'portfolio', 'agendamento', 'contato'];

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const result = {};

for (const [w, h] of SIZES) {
  const phone = w < 1000;
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: phone ? 2 : 1,
    isMobile: phone && w < 900,
    hasTouch: phone,
    userAgent: phone ? devices['Pixel 7'].userAgent : undefined,
  });
  const page = await ctx.newPage();
  const errors = [];
  const failed = [];
  let bytes = 0;
  let jsBytes = 0;
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 160)));
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
  page.on('requestfailed', (r) => failed.push(r.url().slice(0, 120)));
  page.on('response', async (r) => {
    try {
      const len = Number(r.headers()['content-length']) || (await r.body()).length;
      bytes += len;
      if (r.request().resourceType() === 'script') jsBytes += len;
    } catch {}
  });

  // ?dpr reduz só a resolução do canvas: no WebGL por CPU cada quadro é caro
  await page.goto(`${url}?dpr=0.5`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__cinema || document.documentElement.classList.contains('no-webgl'), null, { timeout: 90000 });
  await page.evaluate(() => window.__cinema?.setFloat(false));
  await page.waitForTimeout(800);
  const tag = `${w}x${h}`;
  await page.screenshot({ path: `${out}/${tag}_01-primeira-dobra.png`, timeout: 180000 });

  const m = await page.evaluate((ids) => {
    const top = (el) => el.getBoundingClientRect().top + scrollY;
    const sec = {};
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) sec[id] = Math.round(el.getBoundingClientRect().height);
    }
    const footer = document.querySelector('.site-footer');
    if (footer) sec.rodape = Math.round(footer.getBoundingClientRect().height);
    // primeiro CTA de agendamento visível na primeira dobra
    const firstWa = [...document.querySelectorAll('a[href*="wa.me"]')].find((a) => {
      const r = a.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(a).visibility !== 'hidden';
    });
    const svc = document.getElementById('servicos');
    return {
      alturaTotal: document.documentElement.scrollHeight,
      secoes: sec,
      posicaoPortfolio: Math.round(top(document.getElementById('portfolio'))),
      posicaoServicos: Math.round(top(svc)),
      primeiroWhatsApp: firstWa ? { y: Math.round(firstWa.getBoundingClientRect().top), texto: firstWa.textContent.trim().slice(0, 40) } : null,
      header: Math.round(document.querySelector('[data-header]').getBoundingClientRect().height),
    };
  }, SECTIONS);

  // percorre a página depois da abertura, em passos de meia tela, procurando
  // elementos interativos ou títulos cobertos e conteúdo passando da largura
  // compara com a largura configurada (no celular emulado o navegador alarga o
  // viewport de layout para caber o conteúdo, e innerWidth esconderia o problema)
  const scan = await page.evaluate(async (vw) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const cinema = document.querySelector('.cinema');
    const start = cinema.offsetTop + cinema.offsetHeight;
    const end = document.documentElement.scrollHeight - innerHeight;
    const covered = new Map(); // sobreposição real: um elemento da página sobre outro
    const passing = new Map(); // passagem sob cabeçalho/barra fixos durante a rolagem
    const wide = new Set();
    let overflowMax = 0;
    for (let y = start; y <= end + 1; y += innerHeight / 2) {
      window.scrollTo(0, Math.min(y, end));
      // espera as revelações das seções terminarem antes de medir
      await sleep(1100);
      overflowMax = Math.max(overflowMax, document.documentElement.scrollWidth - vw, innerWidth - vw);
      const els = document.querySelectorAll('main a, main button, main h2, main h3, main p, main li, main dd, footer a, footer p');
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || r.bottom <= 0 || r.top >= innerHeight) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || Number(cs.opacity) < 0.5) continue;
        if (r.right > vw + 1 || r.left < -1) wide.add(`${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 30)}"`);
        // pontos: centro e cantos internos; o elemento do topo precisa ser ele ou parte dele
        const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 4, r.top + 4], [r.right - 4, r.bottom - 4]];
        for (const [x, yy] of pts) {
          if (x < 0 || yy < 0 || x >= innerWidth || yy >= innerHeight) continue;
          const hit = document.elementFromPoint(x, yy);
          if (!hit || el.contains(hit) || hit.contains(el)) continue;
          const fixed = hit.closest('.mbar') ? 'barra inferior' : hit.closest('[data-header]') ? 'cabeçalho' : null;
          const by = fixed ?? `${hit.tagName.toLowerCase()}.${String(hit.getAttribute('class') || '').split(' ')[0]}`;
          const key = `${el.tagName.toLowerCase()} "${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30)}" ← ${by}`;
          const map = fixed ? passing : covered;
          map.set(key, (map.get(key) || 0) + 1);
          break;
        }
      }
    }
    // alvos de toque (controles principais) depois de percorrer tudo
    const small24 = [];
    const small44 = [];
    for (const el of document.querySelectorAll('a, button')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (getComputedStyle(el).visibility === 'hidden') continue;
      // links dentro de parágrafos são exceção do critério (texto corrido)
      if (el.closest('p') && el.tagName === 'A' && !el.className) continue;
      if (el.classList.contains('skip-link')) continue;
      const d = `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${el.textContent.trim().slice(0, 24)}" ${Math.round(r.width)}×${Math.round(r.height)}`;
      if (r.width < 24 || r.height < 24) small24.push(d);
      else if (r.width < 44 || r.height < 44) small44.push(d);
    }
    // no fim da página nada mais rola: o que estiver sob a barra ou o cabeçalho fica escondido de vez
    window.scrollTo(0, document.documentElement.scrollHeight);
    await sleep(1100);
    const hiddenAtEnd = [];
    for (const el of document.querySelectorAll('footer a, footer p, main a, main p')) {
      const r = el.getBoundingClientRect();
      if (r.height < 2 || r.bottom <= 0 || r.top >= innerHeight) continue;
      const hit = document.elementFromPoint(r.left + r.width / 2, Math.min(innerHeight - 1, r.top + r.height / 2));
      if (hit && !el.contains(hit) && (hit.closest('.mbar') || hit.closest('[data-header]'))) hiddenAtEnd.push(el.textContent.trim().slice(0, 30));
    }
    return {
      sobreposicoes: [...covered.entries()].map(([k, n]) => `${k} (${n}×)`),
      passagemSobFixos: [...passing.entries()].map(([k, n]) => `${k} (${n}×)`),
      escondidosNoFim: hiddenAtEnd,
      passandoDaTela: [...wide], overflowMax, alvosMenores24: small24, alvosMenores44: small44,
    };
  }, w);

  // capturas por seção (topo da seção logo abaixo do cabeçalho)
  for (const id of SECTIONS.slice(1)) {
    await page.evaluate((id) => {
      const el = document.getElementById(id);
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 0);
    }, id);
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `${out}/${tag}_s-${id}.png`, timeout: 180000 });
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${tag}_s-rodape.png`, timeout: 180000 });

  result[tag] = { ...m, ...scan, kbTransferidos: Math.round(bytes / 1024), kbJs: Math.round(jsBytes / 1024), erros: errors, falhas: failed };
  console.log(tag, 'altura', m.alturaTotal, 'serviços', m.secoes.servicos, 'sobrepostos', scan.sobreposicoes.length, 'escondidos-no-fim', scan.escondidosNoFim.length, 'overflow', scan.overflowMax, '<24', scan.alvosMenores24.length, '<44', scan.alvosMenores44.length, 'erros', errors.length);
  await ctx.close();
}
await browser.close();
writeFileSync(`${out}/${label}-metricas.json`, JSON.stringify(result, null, 1));
console.log('ok');
