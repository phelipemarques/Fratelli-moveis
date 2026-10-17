// Captura quadros da sequência posicionando a timeline diretamente (sem esperar o scrub).
// uso: node scripts/frames.mjs <url> <pasta> [progressos] [larguraxaltura,...]
// Serve para revisar a cena quadro a quadro; o teste com rolagem real fica em tests/.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [url = 'http://localhost:5173/', out = 'captures', progArg = '0,0.1,0.2,0.3,0.42,0.55,0.62,0.7,0.78,0.88,1', sizeArg = '1440x900'] = process.argv.slice(2);
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
  await page.waitForFunction(() => window.__cinema, null, { timeout: 60000 });
  await page.evaluate(() => window.__cinema.setFloat(false));
  for (const p of progresses) {
    // rola até o ponto (texto e barra acompanham) e fixa a timeline nele
    await page.evaluate((p) => {
      const el = document.querySelector('.cinema');
      window.scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * p);
      const st = window.ScrollTrigger || null;
      window.__cinema.timeline.progress(p);
      window.__cinema.render();
    }, p);
    await page.waitForTimeout(400);
    await page.evaluate((p) => { window.__cinema.timeline.progress(p); window.__cinema.render(); }, p);
    await page.screenshot({ path: `${out}/${w}x${h}_${String(Math.round(p * 100)).padStart(3, '0')}.png` });
  }
  if (errors.length) console.log(`${w}x${h} erros:`, errors);
  await page.close();
}
await browser.close();
console.log('ok');
