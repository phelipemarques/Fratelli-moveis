import { chromium, devices } from '@playwright/test';
const out = process.argv[2];
const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const mk = async (w, h, mob) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, userAgent: mob ? devices['Pixel 7'].userAgent : undefined });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5175/?dpr=0.6');
  await p.waitForFunction(() => window.__cinema, null, { timeout: 90000 });
  await p.evaluate(() => window.__cinema.setFloat(false));
  return p;
};
// celular: menu aberto e lightbox
let p = await mk(390, 844, true);
await p.locator('[data-menu-open]').tap(); await p.waitForTimeout(800);
await p.screenshot({ path: `${out}/390-menu.png`, timeout: 120000 });
await p.keyboard.press('Escape');
await p.locator('#portfolio').scrollIntoViewIfNeeded(); await p.waitForTimeout(1200);
await p.screenshot({ path: `${out}/390-portfolio.png`, timeout: 120000 });
await p.locator('.pf__item').first().tap(); await p.waitForTimeout(800);
await p.screenshot({ path: `${out}/390-lightbox.png`, timeout: 120000 });
await p.context().close();
// tablet em pé, celular deitado e desktop: primeira dobra e marca
for (const [w, h, mob] of [[768, 1024, true], [844, 390, true], [1440, 900, false]]) {
  p = await mk(w, h, mob);
  await p.screenshot({ path: `${out}/${w}x${h}-a-hero.png`, timeout: 120000 });
  for (const [n, t] of [['b-flor', 2.0], ['c-pincel', 11.0], ['d-marca', 15.5]]) {
    await p.evaluate((t) => { window.__cinema.timeline.seek(t); window.__cinema.render(); }, t);
    await p.screenshot({ path: `${out}/${w}x${h}-${n}.png`, timeout: 120000 });
  }
  await p.locator('#servicos').scrollIntoViewIfNeeded(); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/${w}x${h}-e-servicos.png`, timeout: 120000 });
  await p.context().close();
}
await b.close();
console.log('ok');
