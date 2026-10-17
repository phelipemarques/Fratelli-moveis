// Capturas comparáveis entre versões: mesmos instantes da timeline (em unidades
// da timeline, não em % de rolagem, já que a V4 estende a sequência) e mesmas seções.
// uso: node scripts/shots.mjs <url> <pasta> [larguraxaltura,...] [instantes]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [url = 'http://localhost:5174/', out = 'captures', sizeArg = '390x844,1440x900', only] = process.argv.slice(2);
const sizes = sizeArg.split(',').map((s) => s.split('x').map(Number));
mkdirSync(out, { recursive: true });

// nome → instante (as fases de 0 a 11,8 existem nas duas versões)
const SHOTS = [
  ['01-inicial', 0],
  ['02-flor-parcial', 0.9],
  ['03-flor-aberta', 2.0],
  ['04-esmalte-surgindo', 3.0],
  ['05-esmalte-girando', 4.8],
  ['06-tampa-abrindo', 7.6],
  ['07-pincel-saindo', 8.8],
  ['08-pincel-revelado', 11.0],
  ['09-transicao-marca', 13.4],
  ['10-marca', 15.5],
].filter(([n]) => !only || only.split(',').some((o) => n.startsWith(o)));

const SECTIONS = ['#salao', '#servicos', '#cabelos', '#portfolio', '#agendamento', '#contato', '#conteudo'];

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [w, h] of sizes) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__cinema, null, { timeout: 90000 });
  await page.evaluate(() => window.__cinema.setFloat(false));
  const dur = await page.evaluate(() => window.__cinema.timeline.duration());
  for (const [name, t] of SHOTS) {
    if (t > dur) continue;
    await page.evaluate((t) => { window.__cinema.timeline.seek(t); window.__cinema.render(); }, t);
    await page.screenshot({ timeout: 180000, path: `${out}/${w}x${h}_${name}.png` });
  }
  // seções do site, depois da apresentação
  const seen = new Set();
  for (const sel of SECTIONS) {
    const el = await page.$(sel);
    if (!el || seen.has(sel)) continue;
    seen.add(sel);
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await page.screenshot({ timeout: 180000, path: `${out}/${w}x${h}_s-${sel.slice(1)}.png` });
  }
  if (errors.length) console.log(`${w}x${h} erros:`, errors);
  await page.close();
}
await browser.close();
console.log('ok');
