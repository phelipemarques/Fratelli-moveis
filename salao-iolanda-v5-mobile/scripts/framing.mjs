// Enquadramento da abertura 3D, fase por fase, em vários tamanhos.
// uso: node scripts/framing.mjs <url> <pasta> [rotulo] [capturas: lista de tamanhos]
// Para cada instante mede, a partir dos retângulos dos objetos na tela:
//   corte  — quanto do objeto principal da fase fica fora do canvas (% da área)
//   texto  — quanto do objeto fica sob o bloco de texto visível (% da área)
import { chromium, devices } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const [url = 'http://localhost:5175/', out = 'enquadramento', label = 'v5', shotArg = '320x568,390x844'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const shotSizes = new Set(shotArg.split(','));

const SIZES = [[320, 568], [360, 800], [375, 667], [390, 844], [393, 852], [414, 896], [430, 932], [768, 1024], [844, 390], [1440, 900]];
// instante → objeto protagonista
const PHASES = [
  ['01-botao', 0, 'flor'],
  ['02-flor-parcial', 0.9, 'flor'],
  ['03-flor-aberta', 2.0, 'flor'],
  ['04-esmalte-surgindo', 3.0, 'frasco'],
  ['05-esmalte-girando', 4.8, 'frasco'],
  ['06-tampa-abrindo', 7.6, 'tampa'],
  ['07-pincel-saindo', 8.8, 'tampa'],
  ['08-pincel-revelado', 11.0, 'tampa'],
  ['09-escova-entrando', 13.4, 'escova'],
  ['10-marca', 15.5, 'escova'],
];

const area = (r) => Math.max(0, r.x1 - r.x0) * Math.max(0, r.y1 - r.y0);
const inter = (a, b) => ({ x0: Math.max(a.x0, b.x0), y0: Math.max(a.y0, b.y0), x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1) });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const result = {};
for (const [w, h] of SIZES) {
  const phone = w < 1000;
  const ctx = await browser.newContext({
    viewport: { width: w, height: h }, hasTouch: phone, isMobile: phone && w < 900,
    userAgent: phone ? devices['Pixel 7'].userAgent : undefined,
  });
  const page = await ctx.newPage();
  await page.goto(`${url}?dpr=0.5`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__cinema, null, { timeout: 90000 });
  await page.evaluate(() => window.__cinema.setFloat(false));
  const tag = `${w}x${h}`;
  result[tag] = {};
  for (const [name, t, hero] of PHASES) {
    const r = await page.evaluate(([t, hero]) => {
      const c = window.__cinema;
      c.timeline.seek(t);
      const b = c.bounds();
      const obj = b[hero];
      // bloco de texto visível no momento (capítulo ativo)
      const ch = [...document.querySelectorAll('[data-chapter]')].find((el) => {
        const cs = getComputedStyle(el);
        return cs.visibility !== 'hidden' && Number(cs.opacity) > 0.5;
      });
      let text = null;
      if (ch) {
        // só o conteúdo realmente desenhado (títulos, textos e botões), não a caixa inteira
        const parts = [...ch.querySelectorAll('h1, h2, p, .actions')].map((e) => e.getBoundingClientRect()).filter((q) => q.width > 0);
        if (parts.length) text = { x0: Math.min(...parts.map((q) => q.left)), y0: Math.min(...parts.map((q) => q.top)), x1: Math.max(...parts.map((q) => q.right)), y1: Math.max(...parts.map((q) => q.bottom)) };
      }
      return { b, obj, text, header: document.querySelector('[data-header]').getBoundingClientRect().bottom };
    }, [t, hero]);
    const o = r.obj;
    let corte = null;
    let texto = null;
    if (o) {
      const a = area(o);
      const inside = area(inter(o, { x0: 0, y0: 0, x1: r.b.w, y1: r.b.h }));
      corte = a ? Math.round((1 - inside / a) * 100) : 0;
      texto = r.text && a ? Math.round((area(inter(o, r.text)) / a) * 100) : 0;
    }
    result[tag][name] = { objeto: hero, retangulo: o, texto: r.text, corte, sobTexto: texto };
    if (shotSizes.has(tag)) {
      await page.evaluate(() => window.__cinema.render());
      await page.screenshot({ path: `${out}/${tag}_${name}.png`, timeout: 180000 });
    }
  }
  const worst = Object.entries(result[tag]).map(([n, v]) => `${n.slice(0, 2)}:${v.corte ?? '-'}/${v.sobTexto ?? '-'}`).join(' ');
  console.log(tag, 'corte%/sob-texto%', worst);
  await ctx.close();
}
await browser.close();
writeFileSync(`${out}/${label}-enquadramento.json`, JSON.stringify(result, null, 1));
console.log('ok');
