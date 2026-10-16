// Parada do Mano — verificação da prévia em arquivo único.
//
//   NODE_PATH=$(npm root -g) node tools/qa-preview.mjs parada-do-mano-v4-visualizacao.html
//
// Abre o arquivo direto do disco (file://), como o cliente vai abrir, e confere:
// nada é buscado fora do arquivo, fotos aparecem com e sem JavaScript, cardápio,
// galeria e vídeo funcionam, robots continua noindex.
import { createRequire } from 'module';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const arquivo = 'file://' + path.resolve(process.argv[2]);
const results = [];
const ok = (name, pass, info = '') => results.push({ name, pass, info });
const browser = await chromium.launch();

for (const [w, h, js] of [[390, 844, true], [1440, 900, true], [390, 844, false]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: js });
  const page = await ctx.newPage();
  const fora = []; const erros = [];
  page.on('request', r => { if (!/^(data|file|blob):/.test(r.url())) fora.push(r.url()); });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') erros.push(m.text()); });
  page.on('pageerror', e => erros.push(String(e)));
  await page.goto(arquivo, { waitUntil: 'load' });
  const altura = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < altura; y += 500) { await page.mouse.wheel(0, 500); await page.waitForTimeout(40); }
  await page.waitForTimeout(1500);
  const tag = `${w}x${h}${js ? '' : ' sem JS'}`;
  const r = await page.evaluate(() => ({
    quebradas: [...document.images].filter(i => !i.closest('dialog, [hidden]') && i.getAttribute('src') && i.complete && !i.naturalWidth).length,
    semSrc: [...document.images].filter(i => !i.closest('dialog, [hidden]') && !i.getAttribute('src')).length,
    robots: document.querySelector('meta[name=robots]').content,
    externos: [...document.querySelectorAll('link[href], script[src]')].map(e => e.href || e.src).filter(u => !/^(data|file):/.test(u) && !/^https:\/\//.test(u)),
  }));
  ok(`prévia ${tag}: tudo vem de dentro do arquivo`, fora.length === 0 && r.externos.length === 0, fora.slice(0, 3).join(' ') || 'nenhuma requisição externa');
  ok(`prévia ${tag}: fotos aparecem`, r.quebradas === 0 && r.semSrc === 0, JSON.stringify({ quebradas: r.quebradas, semSrc: r.semSrc }));
  ok(`prévia ${tag}: console limpo`, erros.length === 0, erros.join(' | ') || 'sem erros');
  ok(`prévia ${tag}: continua noindex`, /noindex/.test(r.robots), r.robots);
  if (js && w === 390) {
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('cardapio').scrollIntoView(); });
    await page.locator('#tab-feijoada').click();
    await page.waitForTimeout(400);
    const aba = await page.evaluate(() => { const p = document.getElementById('cat-feijoada'); const img = p.querySelector('img'); return !p.hidden && img.complete && img.naturalWidth > 0; });
    ok('prévia: cardápio troca de categoria e mostra a foto', aba);
    await page.evaluate(() => document.getElementById('galeria').scrollIntoView());
    await page.waitForTimeout(500);
    await page.locator('.g-b .g-link').click();
    await page.waitForTimeout(600);
    const lb = await page.evaluate(() => { const i = document.querySelector('.lightbox-img'); return document.querySelector('[data-lightbox]').open && i.complete && i.naturalWidth > 0; });
    ok('prévia: galeria abre a foto ampliada', lb);
  }
  if (js && w === 1440) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(4000);
    const v = await page.evaluate(() => { const el = document.querySelector('.hero-video'); return { playing: el.classList.contains('is-playing'), t: el.currentTime }; });
    ok('prévia 1440: vídeo da abertura toca', v.playing && v.t > 0, JSON.stringify(v));
  }
  await ctx.close();
}
await browser.close();
let fails = 0;
for (const r of results) { if (!r.pass) fails++; console.log(`${r.pass ? 'OK  ' : 'FALHA'}  ${r.name}${r.info ? '  —  ' + r.info : ''}`); }
console.log(`\n${results.length - fails} de ${results.length} verificações passaram.`);
process.exit(fails ? 1 : 0);
