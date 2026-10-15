// Testes de navegador do site (Playwright). Uso, na pasta maguilas/:
//   node tools/servidor-local.mjs . 8130 &
//   npm i --no-save playwright && node tools/testar.mjs http://127.0.0.1:8130/
// Sai com código 1 se algum teste falhar.
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:8130/';
const falhas = [];
const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) falhas.push(msg); };
const browser = await chromium.launch();

console.log('1. Tamanhos de tela: rolagem lateral, console, imagens, alvos de toque');
const telas = [[1920,1080],[1440,900],[1366,768],[1280,800],[1024,768],[820,1180],[768,1024],[430,932],[414,896],[393,852],[390,844],[375,667],[360,800],[320,568],[844,390],[667,375]];
for (const [w, h] of telas) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  const erros = [];
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  page.on('pageerror', e => erros.push(e.message));
  await page.goto(URL, { waitUntil: 'networkidle' });
  let largura = 0;
  const altura = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y <= altura; y += Math.floor(h * 0.8)) {
    await page.evaluate(y => window.scrollTo(0, y), y); await page.waitForTimeout(60);
    largura = Math.max(largura, await page.evaluate(() => document.documentElement.scrollWidth));
  }
  await page.waitForTimeout(1200);
  // um bloco revelado no último passo ainda pode estar no meio da transição
  await page.evaluate(() => Promise.all(document.getAnimations().map(a => a.finished.catch(() => {}))));
  const r = await page.evaluate(() => ({
    cw: document.documentElement.clientWidth,
    quebradas: [...document.images].filter(i => i.complete && !i.naturalWidth).length,
    ocultos: [...document.querySelectorAll('[data-reveal]')].filter(e => getComputedStyle(e).opacity !== '1').length,
    pequenos: [...document.querySelectorAll('a, button')].filter(e => { const b = e.getBoundingClientRect(); return b.width && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[aria-hidden="true"], [inert]') && b.height < 24; }).length,
  }));
  ok(largura <= r.cw && !erros.length && !r.quebradas && !r.ocultos && !r.pequenos,
    `${w}×${h}: largura ${largura}/${r.cw}, erros ${erros.length}, imagens quebradas ${r.quebradas}, blocos ocultos ${r.ocultos}, alvos < 24 px ${r.pequenos}`);
  await page.context().close();
}

console.log('2. Menu do celular');
{
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto(URL);
  await page.focus('[data-menu-toggle]'); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  ok(await page.getAttribute('[data-menu-toggle]', 'aria-expanded') === 'true', 'Enter abre o menu');
  ok(await page.evaluate(() => document.activeElement.textContent.trim() === 'Início'), 'foco vai para o primeiro link');
  let escapou = false;
  for (let i = 0; i < 10; i++) { await page.keyboard.press('Tab'); if (await page.evaluate(() => !!document.activeElement.closest('main, footer, [data-dock]'))) escapou = true; }
  ok(!escapou, 'Tab não sai do menu para o conteúdo atrás (inert)');
  await page.keyboard.press('Escape');
  ok(await page.getAttribute('[data-menu-toggle]', 'aria-expanded') === 'false', 'Escape fecha');
  ok(await page.evaluate(() => document.activeElement.matches('[data-menu-toggle]')), 'foco volta ao botão');
  await page.click('[data-menu-toggle]'); await page.click('[data-menu] a[href="#cardapio"]'); await page.waitForTimeout(900);
  ok(await page.getAttribute('[data-menu-toggle]', 'aria-expanded') === 'false', 'escolher um link fecha o menu');
  ok(await page.evaluate(() => !document.querySelector('main').inert), 'conteúdo volta a ser acessível');
}

console.log('3. Cardápio em abas');
{
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await page.goto(URL);
  const sel = () => page.evaluate(() => document.querySelector('[aria-selected="true"]').id);
  await page.focus('#tab-cafe'); await page.keyboard.press('ArrowRight'); ok(await sel() === 'tab-buffet', '→ seleciona a próxima');
  await page.keyboard.press('End'); ok(await sel() === 'tab-bebidas', 'End vai para a última');
  await page.keyboard.press('Home'); ok(await sel() === 'tab-cafe', 'Home vai para a primeira');
  await page.keyboard.press('ArrowLeft'); ok(await sel() === 'tab-bebidas', '← na primeira vai para a última');
  await page.focus('#tab-doces'); await page.keyboard.press('Enter'); ok(await sel() === 'tab-doces', 'Enter seleciona');
  await page.focus('#tab-pratos'); await page.keyboard.press('Space'); ok(await sel() === 'tab-pratos', 'Espaço seleciona');
  const alturas = new Set();
  for (const id of ['tab-cafe', 'tab-buffet', 'tab-pratos', 'tab-lanches', 'tab-porcoes', 'tab-doces', 'tab-bebidas']) {
    await page.click('#' + id); alturas.add(await page.evaluate(() => document.body.scrollHeight));
    ok(await page.evaluate(id => { const t = document.getElementById(id); const p = document.getElementById(t.getAttribute('aria-controls')); return t.getAttribute('aria-selected') === 'true' && !p.hidden && [...document.querySelectorAll('[role=tabpanel]')].filter(x => !x.hidden).length === 1; }, id), `${id}: só o painel certo ativo`);
  }
  ok(alturas.size === 1, 'no desktop, trocar de aba não muda a altura da página');
}

console.log('4. Sem JavaScript, com JS bloqueado e com movimento reduzido');
{
  const semJs = await (await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false })).newPage();
  await semJs.goto(URL);
  ok(await semJs.evaluate(() => [...document.querySelectorAll('[role=tabpanel]')].filter(p => p.offsetParent).length === 7), 'sem JS: as 7 categorias aparecem');
  const bloqueado = await (await browser.newContext()).newPage();
  await bloqueado.route('**/main.js', r => r.abort()); await bloqueado.goto(URL);
  ok(await bloqueado.evaluate(() => [...document.querySelectorAll('[data-reveal]')].every(e => getComputedStyle(e).opacity === '1')), 'main.js bloqueado: nada fica invisível');
  const reduzido = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
  await reduzido.goto(URL);
  ok(await reduzido.evaluate(() => getComputedStyle(document.querySelector('.hero__title .line > span')).animationName === 'none'), 'movimento reduzido: sem animação de entrada');
}

console.log('5. Links');
{
  const page = await (await browser.newContext()).newPage();
  await page.goto(URL);
  const r = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a[href]')];
    const ancoras = links.filter(a => a.getAttribute('href').startsWith('#'));
    const externos = links.filter(a => /^https?:/.test(a.getAttribute('href')));
    return {
      quebradas: ancoras.filter(a => a.getAttribute('href').length > 1 && !document.getElementById(a.getAttribute('href').slice(1))).length,
      semRel: externos.filter(a => a.target !== '_blank' || !/noopener/.test(a.rel) || !/noreferrer/.test(a.rel)).length,
      numeros: [...new Set(links.filter(a => a.href.includes('wa.me/')).map(a => new URL(a.href).pathname))],
    };
  });
  ok(!r.quebradas, `âncoras quebradas: ${r.quebradas}`);
  ok(!r.semRel, `links externos sem target/rel corretos: ${r.semRel}`);
  ok(r.numeros.length === 1, `WhatsApp aponta para um número só: ${r.numeros.join(', ')}`);
  ok(await page.evaluate(() => document.querySelector('meta[name="robots"]')?.content.includes('noindex')), 'prévia continua com noindex');
}

console.log('6. Leitura e área segura');
for (const [w, h] of [[320, 568], [390, 844], [1440, 900]]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' })).newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  const menor = await page.evaluate(() => {
    let min = 99, onde = '';
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) {
      const el = tw.currentNode.parentElement;
      if (!tw.currentNode.textContent.trim() || !el.getClientRects().length || el.closest('.sr-only, svg')) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < min) { min = fs; onde = tw.currentNode.textContent.trim().slice(0, 24); }
    }
    return { min, onde };
  });
  ok(menor.min >= 10.5, `${w}×${h}: menor texto ${menor.min.toFixed(1)} px ("${menor.onde}")`);
  await page.context().close();
}
{
  // iPhone deitado: entalhe de 47 px nas laterais (env(safe-area-inset-*))
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await (await ctx.newCDPSession(page)).send('Emulation.setSafeAreaInsetsOverride', { insets: { left: 47, right: 47, top: 0, bottom: 21 } });
  await page.goto(URL, { waitUntil: 'networkidle' });
  const sob = await page.evaluate(() => [...document.querySelectorAll('.brand, .menu-toggle, .hero__title, .hero__actions .btn, .eyebrow, .visit__street, .footer__grid > *')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.left < 46 || r.right > innerWidth - 46); }).length);
  ok(!sob, `iPhone deitado: elementos sob o entalhe: ${sob}`);
  await ctx.close();
}

await browser.close();
console.log(falhas.length ? `\n${falhas.length} falha(s).` : '\nTudo passou.');
process.exit(falhas.length ? 1 : 0);
