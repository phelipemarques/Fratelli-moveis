// Parada do Mano — responsividade em laboratório (não é INP de campo).
//
//   NODE_PATH=$(npm root -g) node tools/inp-lab.mjs <url> [rotulo]
//
// Celular 390x844 com a CPU 4x mais lenta (como o Lighthouse mobile). Faz as
// interações que um cliente faz — abrir o cardápio, trocar de categoria, abrir
// o menu, ampliar uma foto — e lê a duração de cada uma pela Event Timing API,
// a mesma que o Chrome usa para calcular o INP. INP de verdade só existe com
// visitantes reais (Chrome UX Report); isto serve para comparar versões.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [URL, ROTULO = ''] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: false });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__eventos = [];
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) if (e.interactionId) window.__eventos.push({ id: e.interactionId, nome: e.name, dur: e.duration });
  }).observe({ type: 'event', durationThreshold: 16, buffered: true });
});
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const passos = [
  ['abrir o cardápio (botão da abertura)', () => page.click('.hero-cta-main')],
  ['aba Buffet', () => page.click('#tab-buffet')],
  ['abrir "já passou pelo buffet"', () => page.click('#cat-buffet summary')],
  ['aba Feijoada', () => page.click('#tab-feijoada')],
  ['botão Próxima', () => page.click('[data-step="1"]')],
  ['seta para a direita na aba', async () => { await page.focus('[aria-selected="true"]'); await page.keyboard.press('ArrowRight'); }],
  ['abrir o menu', () => page.click('[data-menu-toggle]')],
  ['fechar o menu (Esc)', () => page.keyboard.press('Escape')],
  ['ampliar foto da galeria', async () => { await page.evaluate(() => document.getElementById('galeria').scrollIntoView()); await page.waitForTimeout(800); await page.click('.g-a .g-link'); }],
  ['próxima foto ampliada', () => page.click('[data-lightbox-next]')],
  ['fechar a foto (Esc)', () => page.keyboard.press('Escape')],
];
const res = [];
for (const [nome, fazer] of passos) {
  const antes = await page.evaluate(() => window.__eventos.length);
  await fazer();
  await page.waitForTimeout(900);
  const evs = await page.evaluate(n => window.__eventos.slice(n), antes);
  const dur = evs.length ? Math.max(...evs.map(e => e.dur)) : 0; // 0 = abaixo de 16 ms
  res.push({ nome, ms: Math.round(dur) });
}
await browser.close();

const pior = Math.max(...res.map(r => r.ms));
for (const r of res) console.log(`${ROTULO}  ${String(r.ms || '<16').padStart(4)} ms  ${r.nome}`);
console.log(`${ROTULO}  pior interação: ${pior || '<16'} ms (laboratório, CPU 4x mais lenta; meta de campo do INP: 200 ms)`);
console.log(JSON.stringify({ rotulo: ROTULO, pior, res }));
