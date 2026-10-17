// Auditoria axe-core (WCAG 2.2 AA + boas práticas) no build servido em :4173.
// uso: node scripts/axe.mjs <caminho/para/axe.min.js>
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const axeSrc = fs.readFileSync(process.argv[2], 'utf8');
const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
for (const [label, url, rm] of [['sem-webgl', 'http://localhost:4173/?sem-webgl', 'reduce'], ['3d', 'http://localhost:4173/?dpr=0.5', 'no-preference']]) {
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: rm });
    const p = await ctx.newPage();
    await p.goto(url, { waitUntil: 'networkidle' });
    if (label === '3d') {
      await p.waitForFunction(() => window.__cinema, null, { timeout: 90000 });
      await p.evaluate(() => window.__cinema.setFloat(false));
      for (const id of ['salao', 'servicos', 'cabelos', 'portfolio', 'agendamento', 'contato']) {
        await p.locator('#' + id).scrollIntoViewIfNeeded(); await p.waitForTimeout(1800);
      }
      await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(2500);
    }
    await p.addScriptTag({ content: axeSrc });
    const r = await p.evaluate(async () => {
      const res = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
      return { v: res.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, ex: v.nodes.slice(0, 3).map(n => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n')[1]) })), passes: res.passes.length, inc: res.incomplete.map(v => v.id) };
    });
    console.log(label, w, 'violações:', r.v.length, 'regras ok:', r.passes, JSON.stringify(r.v), 'revisar:', r.inc.join(','));
    await ctx.close();
  }
}
await b.close();
