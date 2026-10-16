// Parada do Mano — medição comparável entre versões (V3 x V4).
//
//   NODE_PATH=$(npm root -g) node tools/medir.mjs <url> <rotulo> <pasta-de-saida>
//
// Mede, nas mesmas condições para qualquer versão:
//  - altura da página e posição do início de cada seção (390, 320 e 1440 px);
//  - bytes da primeira visita sem rolar (390 px e 1440 px) e da página inteira rolada;
//  - tamanho do HTML; erros e avisos de console; arquivos com falha;
// e grava capturas por seção e de página inteira em 1440x900, 768x1024, 390x844
// e 320x568, com todas as animações já concluídas (estado equivalente).
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [BASE, ROTULO, OUT] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const SECOES = ['inicio', 'sobre', 'cardapio', 'buffet', 'churrasco', 'feijoada', 'galeria', 'contato'];
const res = { rotulo: ROTULO, url: BASE, medidas: {}, bytes: {}, console: [], falhas: [] };

const browser = await chromium.launch();

async function revelarTudo(page) {
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    for (let y = 0; y < document.body.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1800);
  // estado equivalente: tudo revelado e sem animação em curso
  // content-visibility: as capturas de página inteira precisam de todas as seções desenhadas
  await page.addStyleTag({ content: '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}[data-reveal]{opacity:1!important;transform:none!important}*{content-visibility:visible!important}' });
  await page.evaluate(() => document.querySelectorAll('[data-reveal],[data-day]').forEach(e => e.classList.add('is-visible')));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
}

async function bytesDaVisita(w, h, rolar) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  let total = 0, n = 0, html = 0;
  const tipos = {};
  const porId = {};
  cdp.on('Network.responseReceived', e => { porId[e.requestId] = e.response.mimeType; });
  cdp.on('Network.loadingFinished', e => {
    total += e.encodedDataLength; n++;
    const t = (porId[e.requestId] || 'outro').split('/')[0];
    tipos[t] = (tipos[t] || 0) + e.encodedDataLength;
  });
  const resp = await page.goto(BASE, { waitUntil: 'networkidle' });
  html = (await resp.body()).length;
  await page.waitForTimeout(rolar ? 0 : 3000);
  if (rolar) {
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      for (let y = 0; y < document.body.scrollHeight; y += 300) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); }
    });
    await page.waitForTimeout(2500);
  }
  await ctx.close();
  return { total, requisicoes: n, html, porTipo: tipos };
}

// três visitas de cada; vale a mediana (as fotos "lazy" perto da dobra variam de uma para outra)
async function mediana(w, h, rolar) {
  const v = [];
  for (let i = 0; i < 3; i++) v.push(await bytesDaVisita(w, h, rolar));
  v.sort((a, b) => a.total - b.total);
  return { ...v[1], execucoes: v.map(x => Math.round(x.total / 1024)) };
}
res.bytes['390-primeira-tela'] = await mediana(390, 844, false);
res.bytes['390-pagina-inteira'] = await mediana(390, 844, true);
res.bytes['1440-primeira-tela'] = await mediana(1440, 900, false);

for (const [w, h] of [[1440, 900], [768, 1024], [390, 844], [320, 568]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) res.console.push(`${w}: ${m.text()}`); });
  page.on('pageerror', e => res.console.push(`${w}: ${e}`));
  page.on('response', r => { if (r.status() >= 400) res.falhas.push(`${r.status()} ${r.url()}`); });
  page.on('requestfailed', r => res.falhas.push(`falhou ${r.url()}`));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await revelarTudo(page);
  const m = await page.evaluate((ids) => {
    const tops = {};
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) tops[id] = Math.round(el.getBoundingClientRect().top + window.scrollY);
    }
    return { altura: document.documentElement.scrollHeight, tops, overflowX: document.documentElement.scrollWidth > window.innerWidth };
  }, SECOES);
  res.medidas[`${w}x${h}`] = m;
  await page.screenshot({ path: `${OUT}/${ROTULO}-${w}-0-primeira-tela.png` });
  // seções: cabeçalho e barra fixa escondidos, para não aparecerem no meio da captura
  await page.addStyleTag({ content: '.site-header,.skip-link,.action-bar{visibility:hidden!important}' });
  for (const [i, id] of SECOES.entries()) {
    const el = page.locator('#' + id);
    if (await el.count()) await el.screenshot({ path: `${OUT}/${ROTULO}-${w}-${i + 1}-${id}.png` });
  }
  await page.screenshot({ path: `${OUT}/${ROTULO}-${w}-9-pagina.png`, fullPage: true });
  await ctx.close();
}

await browser.close();
fs.writeFileSync(`${OUT}/${ROTULO}-medidas.json`, JSON.stringify(res, null, 2));
const m390 = res.medidas['390x844'];
console.log(`${ROTULO}: cardápio a ${m390.tops.cardapio}px de ${m390.altura}px (390) · ` +
  `primeira visita 390: ${(res.bytes['390-primeira-tela'].total / 1024).toFixed(0)} KB em ${res.bytes['390-primeira-tela'].requisicoes} req (${res.bytes['390-primeira-tela'].execucoes.join(' · ')}) · ` +
  `HTML ${(res.bytes['390-primeira-tela'].html / 1024).toFixed(1)} KB · console ${res.console.length} · falhas ${res.falhas.length}`);
