// Captura quadros da timeline em vários tamanhos de tela.
// uso: node scripts/capture.mjs <url> <pasta-saida> [progressos separados por vírgula] [larguraxaltura,...]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [url = 'http://localhost:5173/', out = 'captures', progArg = '0,0.12,0.22,0.32,0.45,0.55,0.66,0.76,0.86,1', sizeArg = '1440x900'] = process.argv.slice(2);
const progresses = progArg.split(',').map(Number);
const sizes = sizeArg.split(',').map((s) => s.split('x').map(Number));
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [w, h] of sizes) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__cinema, null, { timeout: 30000 });
  await page.evaluate(() => window.__cinema.setFloat(false));
  for (const p of progresses) {
    await page.evaluate((p) => {
      window.__cinema.timeline.progress(p);
      window.__cinema.render();
    }, p);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${out}/${w}x${h}_${String(Math.round(p * 100)).padStart(3, '0')}.png` });
  }
  if (errors.length) console.log(`${w}x${h} erros:`, errors);
  await page.close();
}
await browser.close();
console.log('ok');
