// Parada do Mano — fluidez da rolagem em laboratório.
//
//   NODE_PATH=$(npm root -g) node tools/fluidez.mjs <url> <rotulo> [largura altura cpu]
//
// Rola a página inteira com a rodinha do mouse (passos de 100 px a cada 50 ms, como uma
// pessoa), com a CPU N vezes mais lenta (padrão 4x, como o Lighthouse mobile), e mede:
//  - quadros por segundo e quadros acima de 33 ms (abaixo de 30 fps) via requestAnimationFrame;
//  - tarefas longas (> 50 ms) na thread principal durante a rolagem.
// É laboratório: compara versões nas mesmas condições, não substitui aparelho real.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [URL, ROTULO = '', W = '390', H = '844', CPU = '4'] = process.argv.slice(2);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: +W, height: +H } });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await p.goto(URL, { waitUntil: 'load' });
await p.waitForTimeout(3000);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: +CPU });
await p.evaluate(() => {
  window.__q = []; window.__longas = [];
  new PerformanceObserver(l => { for (const e of l.getEntries()) window.__longas.push(e.duration); }).observe({ type: 'longtask' });
  let ult = performance.now();
  const laco = (t) => { window.__q.push(t - ult); ult = t; if (!window.__parar) requestAnimationFrame(laco); };
  requestAnimationFrame(laco);
});
const total = await p.evaluate(() => document.body.scrollHeight - innerHeight);
for (let y = 0; y < total; y += 100) { await p.mouse.wheel(0, 100); await p.waitForTimeout(50); }
await p.waitForTimeout(500);
const r = await p.evaluate(() => {
  window.__parar = true;
  const q = window.__q.slice(5);
  const soma = q.reduce((a, b) => a + b, 0);
  q.sort((a, b) => a - b);
  return {
    fps: Math.round(q.length / (soma / 1000) * 10) / 10,
    lentos: q.filter(d => d > 34).length, quadros: q.length,
    p95: Math.round(q[Math.floor(q.length * 0.95)]),
    longas: window.__longas.length, maiorLonga: Math.round(Math.max(0, ...window.__longas)),
  };
});
await b.close();
console.log(JSON.stringify({ rotulo: ROTULO, largura: +W, cpu: +CPU, ...r }));
