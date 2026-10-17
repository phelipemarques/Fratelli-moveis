// Gera as imagens do fallback sem WebGL a partir da própria cena 3D.
// Captura só o canvas (sem o texto da página) no instante STILL_TIME da timeline.
// uso: node scripts/posters.mjs [url]   (com o servidor de desenvolvimento rodando)
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:5173/';
const out = 'public/posters';
mkdirSync(out, { recursive: true });

const targets = [
  { name: 'sequencia-desktop', width: 1600, height: 1000, scale: 1 },
  { name: 'sequencia-mobile', width: 420, height: 860, scale: 2 },
];

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: t.width, height: t.height }, deviceScaleFactor: t.scale });
  await page.goto(`${url}?q=high`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__cinema, null, { timeout: 60000 });
  await page.evaluate(() => {
    const c = window.__cinema;
    c.setFloat(false);
    c.timeline.seek(c.stillTime);
    c.render();
  });
  // só a cena: esconde cabeçalho e textos que ficam sobre o canvas
  await page.addStyleTag({ content: '.site-header,.cinema__chapters,.cinema__progress,.cinema__skip{visibility:hidden!important}' });
  const png = `${out}/${t.name}.png`;
  await page.locator('.cinema__canvas').screenshot({ path: png, timeout: 180000 });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-c:v', 'libwebp', '-quality', '82', `${out}/${t.name}.webp`]);
  rmSync(png);
  await page.close();
}
await browser.close();
console.log('posters ok');

// imagem de compartilhamento (Open Graph): o momento da marca, com o nome em texto
{
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(`${url}?q=high`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__cinema, null, { timeout: 60000 });
  await page.addStyleTag({ content: '.site-header,.cinema__progress,.cinema__skip,.chapter--brand .actions,.chapter--brand .lede{visibility:hidden!important}' });
  await page.evaluate(() => {
    const c = window.__cinema;
    c.setFloat(false);
    c.timeline.seek(c.marks.end);
    c.render();
  });
  await page.screenshot({ path: 'public/og.jpg', type: 'jpeg', quality: 86, timeout: 180000 });
  await b.close();
  console.log('og ok');
}
