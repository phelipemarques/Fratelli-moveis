/* Testes funcionais: menu, ampliacao, galeria, video, movimento
   reduzido, sem JavaScript, rolagem rapida e redimensionamento. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
/* S e obrigatorio: sem ele `${S}/foo.png` virava a pasta
   `undefined/` DENTRO do site, e 7 MB de captura entraram num
   commit do que vai para producao. Falha na hora, e com o motivo. */
if (!process.env.S) {
  console.error('defina S= com a pasta de saida das capturas (fora do site)');
  process.exit(2);
}
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
      const sec = document.querySelector('[data-abertura]');
      const foto = document.querySelector('[data-abertura-foto] img');
      const lead = document.querySelector('.abertura__lead');
      const gat = window.ScrollTrigger ? ScrollTrigger.getAll().filter(t => t.trigger === sec).length : -1;
      return { perfil: sec && sec.getAttribute('data-perfil'),
               gatilhosNaSecao: gat,
               temCena: !!window.__sonda,
               fotoVisivel: !!(foto && foto.complete !== false),
               textoVisivel: !!lead && +getComputedStyle(lead).opacity > 0.9,
               recuado: sec && sec.classList.contains('texto-recuado') };
    });
    ok('movimento reduzido: cai no perfil C', m.perfil === 'C', 'perfil=' + m.perfil);
    ok('movimento reduzido: nenhuma cena 3D montada', m.gatilhosNaSecao === 0 && !m.temCena);
    ok('movimento reduzido: a fotografia fica no lugar', m.fotoVisivel);
    ok('movimento reduzido: texto inteiro visivel e sem recuo', m.textoVisivel && !m.recuado);
    ok('movimento reduzido: sem erro', erros.length === 0, erros[0]||'');
    await p.close();
  }

  /* ---- 5b. WEBGL INDISPONIVEL ----

     O cenario do §17 que esta fase mudou. Antes daqui a resposta era a
     mesma do movimento reduzido: a fotografia parada. Agora o perfil C
     recebe a SEQUENCIA pre-renderizada (16 quadros, 127 KB), tirada da
     mesma linha de tempo dos perfis A e B.

     WebGL sai pelo unico caminho que boot.js consulta: getContext.
     Nao e flag de navegador nem user-agent; e o mesmo contexto que a
     pagina tenta criar, devolvendo null como devolveria num aparelho
     sem GPU utilizavel.

     DUAS CORRECOES DE INSTRUMENTO, as duas erradas na primeira volta:

     1. `.abertura__seq` e a CAIXA, nao o quadro. Os quadros sao
        `.abertura__seq img`. Medindo a caixa o teste leu 1 elemento,
        `complete` indefinido num <div> (0/1 carregados) e nenhum
        `is-ativo` -- tres falhas que descreviam o seletor, nao a
        pagina.
     2. Os quadros 1..15 sao `loading="lazy"` de proposito. Exigir que
        estejam carregados com a pagina no topo e cobrar o contrario do
        que o codigo pede; a conta de carregados e o centro do palco
        so valem com a secao na tela. */
  {
    const p = await b.newPage({ viewport:{width:1440,height:900} });
    const erros = []; p.on('pageerror', e => erros.push(e.message));
    await p.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (tipo) {
        if (typeof tipo === 'string' && tipo.indexOf('webgl') === 0) { return null; }
        return orig.apply(this, arguments);
      };
    });
    await p.goto(URL, {waitUntil:'load'}); await p.waitForTimeout(2600);

    const montagem = await p.evaluate(() => {
      const sec = document.querySelector('[data-abertura]');
      const q = sec ? sec.querySelectorAll('.abertura__seq img') : [];
      return { perfil: sec && sec.getAttribute('data-perfil'),
               temSeq: !!(sec && sec.classList.contains('tem-seq')),
               tem3d:  !!(sec && sec.classList.contains('tem-3d')),
               quadros: q.length,
               temCena: !!window.__sonda };
    });
    ok('sem WebGL: cai no perfil C', montagem.perfil === 'C', 'perfil=' + montagem.perfil);
    ok('sem WebGL: nenhuma cena WebGL montada', !montagem.temCena && !montagem.tem3d);
    ok('sem WebGL: monta a sequencia pre-renderizada',
       montagem.temSeq && montagem.quadros > 1,
       `temSeq=${montagem.temSeq} quadros=${montagem.quadros}`);

    /* A rolagem precisa MOVER a sequencia, e nao so montar o primeiro
       quadro. Tres paradas, quadros diferentes e crescentes. */
    /* TERCEIRA CORRECAO DE INSTRUMENTO. A primeira versao rolava por
       `boundingBox()` da secao: 0 %, 50 % e 100 % da altura DELA. Mas a
       secao esta PINADA -- a caixa tem uma altura de tela e o curso de
       rolagem continua 2,2 telas depois dela. As tres paradas caiam no
       mesmo pixel e os tres quadros vinham 0. Quem sabe o curso e o
       proprio ScrollTrigger, e ele esta publicado em
       `window.__fratelliAbertura.st`. */
    const curso = await p.evaluate(() => {
      const a = window.__fratelliAbertura;
      if (a && a.st) { return { ini: a.st.start, fim: a.st.end }; }
      return null;
    });
    ok('sem WebGL: o gatilho de rolagem existe', !!curso, curso?`${Math.round(curso.ini)}..${Math.round(curso.fim)}`:'ausente');
    const visita = [];
    let centro = null, carregados = 0, palco = null;
    for (const f of [0, 0.5, 1]) {
      await p.evaluate(y => window.scrollTo({top:y, behavior:'instant'}),
                       curso ? curso.ini + (curso.fim - curso.ini) * f : 0);
      await p.waitForTimeout(520);
      const m = await p.evaluate(() => {
        const q = [...document.querySelectorAll('.abertura__seq img')];
        const pl = document.querySelector('.abertura__palco');
        const r = pl ? pl.getBoundingClientRect() : null;
        /* "Nao deixar areas vazias" (§21): o que de fato cobre o palco.
           O elemento no centro geometrico do palco, com a secao na
           tela -- fora da tela elementFromPoint devolve null e a
           medida nao diria nada. */
        let noCentro = null;
        if (r && r.width > 0 && r.top < innerHeight && r.bottom > 0) {
          const el = document.elementFromPoint(r.left + r.width/2,
                       Math.min(innerHeight - 2, Math.max(2, r.top + r.height/2)));
          noCentro = el ? (el.getAttribute('class') || el.tagName) : null;
        }
        return { ativo: q.findIndex(i => i.classList.contains('is-ativo')),
                 carregados: q.filter(i => i.complete && i.naturalWidth > 0).length,
                 total: q.length,
                 palco: r ? Math.round(r.width) + 'x' + Math.round(r.height) : '0x0',
                 noCentro: noCentro };
      });
      visita.push(m.ativo);
      carregados = Math.max(carregados, m.carregados);
      if (m.noCentro) { centro = m.noCentro; palco = m.palco; }
    }
    ok('sem WebGL: a rolagem avanca os quadros',
       visita[0] === 0 && visita[1] > visita[0] && visita[2] > visita[1],
       'quadros=' + visita.join(' -> '));
    ok('sem WebGL: os quadros carregam com a secao na tela',
       montagem.quadros > 0 && carregados === montagem.quadros,
       `${carregados}/${montagem.quadros}`);
    ok('sem WebGL: o palco nao fica vazio', !!centro, `${palco} centro=${centro}`);
    ok('sem WebGL: sem erro de pagina', erros.length === 0, erros[0]||'');
    await p.screenshot({ path: `${S}/sem-webgl.png`, fullPage: false });
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
    ok('sem JS: a seção, a fotografia e o texto estão no HTML',
       html.includes('Cada ambiente começa por dentro')
       && html.includes('abertura__palco')
       && html.includes('reveal-closet'));
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
    /* Na cena 3D o equivalente e a ROTACAO das folhas: depois de ir ao
       desktop e voltar, elas precisam estar fechadas de novo. */
    const rot = await p.evaluate(() => {
      if (!window.__sonda) return null;
      return [ +window.__sonda.pivoEsq.rotation.y.toFixed(4),
               +window.__sonda.pivoDir.rotation.y.toFixed(4) ];
    });
    ok('redimensionamento: as folhas voltam a fechar',
       rot === null || (Math.abs(rot[0]) < 0.01 && Math.abs(rot[1]) < 0.01), 'rot=' + rot);
    ok('rolagem/redimensionamento: sem erro', erros.length === 0, erros[0]||'');
    await p.close();
  }

  await b.close();
  const falhas = r.filter(x => !x[1]);
  console.log('\n%d testes, %d falhas', r.length, falhas.length);
  process.exitCode = falhas.length ? 1 : 0;
})();
