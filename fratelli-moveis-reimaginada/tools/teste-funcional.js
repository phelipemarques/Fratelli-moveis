/* Testes funcionais: menu, ampliacao, galeria, video, movimento
   reduzido, sem JavaScript, rolagem rapida e redimensionamento. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const S = process.env.S, URL = process.env.URL || 'http://localhost:8092/';
const r = [];
const ok = (n, v, obs) => { r.push([n, v, obs||'']); console.log((v?'  OK  ':'FALHA ') + n + (obs?'   '+obs:'')); };

(async () => {
  const b = await chromium.launch();

  /* ---- 1. MENU EM CELULAR ---- */
  {
    const p = await b.newPage({ viewport:{width:390,height:844}, hasTouch:true, isMobile:true });
    await p.goto(URL, {waitUntil:'load'}); await p.waitForTimeout(1800);
    const bt = await p.$('[data-menu-toggle], .site-header__burger, button[aria-controls]');
    if (!bt) { ok('menu: botao existe', false); }
    else {
      await bt.click(); await p.waitForTimeout(600);
      const aberto = await p.evaluate(() => {
        const m = document.querySelector('#menu-movel');
        return m && getComputedStyle(m).visibility !== 'hidden' && +getComputedStyle(m).opacity > 0.5;
      });
      ok('menu: abre', aberto);
      const travado = await p.evaluate(() => getComputedStyle(document.body).overflow === 'hidden'
        || getComputedStyle(document.documentElement).overflow === 'hidden');
      ok('menu: trava a rolagem do fundo enquanto aberto', travado);
      await p.keyboard.press('Escape'); await p.waitForTimeout(600);
      const fechou = await p.evaluate(() => {
        const m = document.querySelector('#menu-movel');
        return !m || getComputedStyle(m).visibility === 'hidden' || +getComputedStyle(m).opacity < 0.5;
      });
      ok('menu: fecha com Escape', fechou);
      const destravou = await p.evaluate(() => getComputedStyle(document.body).overflow !== 'hidden');
      ok('menu: devolve a rolagem ao fechar', destravou);
    }
    await p.close();
  }

  /* ---- 2. AMPLIACAO DE PROJETO (lightbox) ---- */
  {
    const p = await b.newPage({ viewport:{width:1440,height:900} });
    const erros = []; p.on('pageerror', e => erros.push(e.message));
    await p.goto(URL, {waitUntil:'load'}); await p.waitForTimeout(1800);
    /* O botao de ampliar e INJETADO pelo JS em cada quadro: `.frame__zoom`. */
    const alvo = await p.$('.frame__zoom');
    if (!alvo) { ok('ampliacao: gatilho existe', false); }
    else {
      await alvo.scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
      await alvo.click(); await p.waitForTimeout(900);
      const aberto = await p.evaluate(() => {
        const d = document.querySelector('.lightbox');
        return !!(d && !d.hasAttribute('hidden') && d.classList.contains('is-open'));
      });
      ok('ampliacao: abre', aberto);
      const temSelo = await p.evaluate(() => {
        const d = document.querySelector('.lightbox');
        return !!(d && /projeto em 3d|projeto executado|imagem de refer/i.test(d.textContent));
      });
      ok('ampliacao: mostra a classificacao da imagem', temSelo);
      await p.keyboard.press('Escape'); await p.waitForTimeout(900);
      const fechou = await p.evaluate(() => {
        const d = document.querySelector('.lightbox');
        return !d || d.hasAttribute('hidden') || !d.classList.contains('is-open');
      });
      ok('ampliacao: fecha com Escape', fechou);
      await alvo.click(); await p.waitForTimeout(900);
      const reabriu = await p.evaluate(() => {
        const d = document.querySelector('.lightbox');
        return !!(d && !d.hasAttribute('hidden') && d.classList.contains('is-open'));
      });
      ok('ampliacao: reabre depois de fechada', reabriu);
      await p.keyboard.press('Escape'); await p.waitForTimeout(600);
    }
    ok('ampliacao: sem erro de pagina', erros.length === 0, erros[0]||'');
    await p.close();
  }

  /* ---- 3. GALERIA DE AMBIENTES ---- */
  {
    const p = await b.newPage({ viewport:{width:390,height:844}, hasTouch:true, isMobile:true });
    await p.goto(URL, {waitUntil:'load'}); await p.waitForTimeout(1800);
    const amb = await p.$('#ambientes');
    if (amb) {
      await amb.scrollIntoViewIfNeeded(); await p.waitForTimeout(900);
      const m = await p.evaluate(() => {
        const vp = document.querySelector('[data-rooms-viewport]');
        const t = document.querySelector('[data-rooms-track]');
        if (!t || !vp) return null;
        const cs = getComputedStyle(vp);
        const cartoes = t.querySelectorAll('[data-room]').length;
        const pinada = window.ScrollTrigger
          ? ScrollTrigger.getAll().some(g => g.pin && g.trigger &&
              g.trigger.closest && g.trigger.closest('#ambientes')) : null;
        return { cartoes, overflowX: cs.overflowX,
                 rolaNativo: vp.scrollWidth > vp.clientWidth + 4, pinada };
      });
      ok('galeria: tem cartoes e area rolavel', !!(m && m.cartoes > 1), m?JSON.stringify(m):'');
      ok('galeria: no celular NAO usa pin', !!(m && m.pinada === false), m?('pin='+m.pinada):'');
      const antes = await p.evaluate(() => window.scrollY);
      await p.mouse.wheel(0, 700); await p.waitForTimeout(600);
      const depois = await p.evaluate(() => window.scrollY);
      ok('galeria: nao prende a rolagem vertical', depois > antes + 100, `${antes} -> ${depois}`);
    } else { ok('galeria: secao existe', false); }
    await p.close();
  }

  /* ---- 4. VIDEO ---- */
  {
    const p = await b.newPage({ viewport:{width:1440,height:900} });
    await p.goto(URL, {waitUntil:'load'}); await p.waitForTimeout(1500);
    const m = await p.evaluate(() => {
      const v = document.querySelector('#filme video, .film video');
      if (!v) return null;
      return { temFonte: !!v.querySelector('source') || !!v.src,
               controles: v.hasAttribute('controls') || !!document.querySelector('[data-film-play], .film__play') };
    });
    ok('video: elemento e fonte presentes', !!(m && m.temFonte), m?JSON.stringify(m):'ausente');
    await p.close();
  }

  /* ---- 5. MOVIMENTO REDUZIDO ---- */
  {
    const p = await b.newPage({ viewport:{width:1440,height:900}, reducedMotion:'reduce' });
    const erros = []; p.on('pageerror', e => erros.push(e.message));
    await p.goto(URL, {waitUntil:'load'}); await p.waitForTimeout(2000);
    const m = await p.evaluate(() => {
      const sec = document.querySelector('[data-reveal-secao]');
      const folha = document.querySelector('[data-reveal-folha]');
      const amb = document.querySelector('[data-reveal-ambiente] img');
      const gat = window.ScrollTrigger ? ScrollTrigger.getAll().filter(t => t.trigger === sec).length : -1;
      const cs = folha ? getComputedStyle(folha) : null;
      return { gatilhosNaSecao: gat,
               folhaVisivel: !!(cs && cs.visibility !== 'hidden' && +cs.opacity > 0.5),
               ambienteVisivel: !!amb,
               textoVisivel: !!document.querySelector('.reveal__lead') &&
                 +getComputedStyle(document.querySelector('.reveal__lead')).opacity > 0.9 };
    });
    ok('movimento reduzido: nenhuma cena montada', m.gatilhosNaSecao === 0, 'gatilhos=' + m.gatilhosNaSecao);
    ok('movimento reduzido: folha e ambiente visiveis (diptico)', m.folhaVisivel && m.ambienteVisivel);
    ok('movimento reduzido: texto inteiro visivel', m.textoVisivel);
    ok('movimento reduzido: sem erro', erros.length === 0, erros[0]||'');
    await p.close();
  }

  /* ---- 6. SEM JAVASCRIPT ---- */
  {
    const ctx = await b.newContext({ viewport:{width:1440,height:900}, javaScriptEnabled:false });
    const p = await ctx.newPage();
    await p.goto(URL, {waitUntil:'load'}); await p.waitForTimeout(900);
    const m = await p.evaluate0 ? null : await p.$$eval('.reveal__texto p, .reveal__titulo', els =>
      els.map(e => ({ t: e.textContent.trim().slice(0,20), op: getComputedStyle(e).opacity }))).catch(()=>null);
    const html = await p.content();
    ok('sem JS: a seção e o texto estão no HTML',
       html.includes('Cada ambiente começa por dentro') && html.includes('reveal__quadro'));
    await p.screenshot({ path: `${S}/sem-js.png`, fullPage: false });
    await ctx.close();
  }

  /* ---- 7. ROLAGEM RAPIDA E REDIMENSIONAMENTO ---- */
  {
    const p = await b.newPage({ viewport:{width:390,height:844}, hasTouch:true, isMobile:true });
    const erros = []; p.on('pageerror', e => erros.push(e.message));
    await p.goto(URL, {waitUntil:'load'}); await p.waitForTimeout(1800);
    for (let i = 0; i < 14; i++) { await p.mouse.wheel(0, 1600); await p.waitForTimeout(45); }
    await p.waitForTimeout(900);
    const chegou = await p.evaluate(() => window.scrollY > document.documentElement.scrollHeight * 0.5);
    ok('rolagem rapida: a pagina nao prende', chegou);
    const sumiu = await p.evaluate(() => {
      const els = [...document.querySelectorAll('[data-reveal],[data-split]')];
      return els.filter(e => {
        const r = e.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return false;
        return +getComputedStyle(e).opacity < 0.2;
      }).length;
    });
    ok('rolagem rapida: nenhum bloco visivel fica invisivel', sumiu === 0, 'invisiveis=' + sumiu);
    /* redimensiona de celular para desktop e volta */
    await p.setViewportSize({ width: 1440, height: 900 }); await p.waitForTimeout(1200);
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(1200);
    const tb = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok('redimensionamento: sem transbordo depois de ir e voltar', tb === 0, 'transbordo=' + tb);
    /* Volta ao COMECO da cena antes de conferir. A folha deslocada no
       fim da secao e o estado certo; o que interessa e se ela volta ao
       zero quando a rolagem volta. */
    await p.evaluate(() => {
      const sec = document.querySelector('[data-reveal-secao]');
      const g = ScrollTrigger.getAll().find(t => t.trigger === sec && t.animation);
      window.scrollTo({ top: g ? g.start : 0, behavior: 'instant' });
    });
    await p.waitForTimeout(1100);
    const dx = await p.evaluate(() => {
      const f = document.querySelector('[data-reveal-folha]');
      if (!f) return null;
      const m = new DOMMatrixReadOnly(getComputedStyle(f).transform);
      return Math.round(m.m41);
    });
    ok('redimensionamento: a folha volta ao inicio (x = 0)', dx === 0 || dx === null, 'x=' + dx);
    ok('rolagem/redimensionamento: sem erro', erros.length === 0, erros[0]||'');
    await p.close();
  }

  await b.close();
  const falhas = r.filter(x => !x[1]);
  console.log('\n%d testes, %d falhas', r.length, falhas.length);
  process.exitCode = falhas.length ? 1 : 0;
})();
