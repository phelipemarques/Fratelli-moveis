/* Percorre a cena Architectural Reveal pelo caminho real da rolagem e
   fotografa os estados. Tambem volta, para provar reversibilidade. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const S = process.env.S;
const URL = process.env.URL || 'http://localhost:8092/';
const TELAS = (process.env.TELAS || '1440x900,390x844').split(',').map(t => t.split('x').map(Number));
const FRACOES = [0, 0.25, 0.5, 0.75, 1];

(async () => {
  const b = await chromium.launch();
  const saida = [];
  for (const [W, H] of TELAS) {
    const p = await b.newPage({ viewport: { width: W, height: H },
      deviceScaleFactor: 1, hasTouch: W < 900, isMobile: W < 900 });
    const erros = [];
    p.on('pageerror', e => erros.push(e.message));
    await p.goto(URL, { waitUntil: 'load' });
    await p.waitForTimeout(2200);

    const lim = await p.evaluate(() => {
      const sec = document.querySelector('[data-reveal-secao]');
      /* O gatilho da cena e o unico que tem animacao propria na secao. */
      const st = ScrollTrigger.getAll().find(t => t.trigger === sec && t.animation);
      return st ? { ini: st.start, fim: st.end, pin: !!st.pin } : null;
    });
    if (!lim) { console.log(W + ': sem gatilho'); await p.close(); continue; }

    const medir = async (f, marca) => {
      await p.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }),
        lim.ini + (lim.fim - lim.ini) * f);
      await p.waitForTimeout(950);
      const m = await p.evaluate(() => {
        const r = el => { if (!el) return null; const b = el.getBoundingClientRect();
          return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
        const sec = document.querySelector('[data-reveal-secao]');
        const folha = document.querySelector('[data-reveal-folha]');
        const quadro = document.querySelector('[data-reveal-quadro]');
        const txt = document.querySelector('.reveal__texto');
        const cs = folha ? getComputedStyle(folha) : null;
        // sobreposicao entre a coluna de texto e o quadro
        const a = r(txt), c = r(quadro);
        let cruza = null;
        if (a && c) {
          cruza = !(a.x + a.w <= c.x || c.x + c.w <= a.x || a.y + a.h <= c.y || c.y + c.h <= a.y);
        }
        return { folha: r(folha), quadro: r(quadro), texto: a, cruza,
                 transformFolha: cs ? cs.transform : null,
                 clip: quadro ? getComputedStyle(quadro).clipPath : null,
                 transbordo: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      });
      await p.screenshot({ path: `${S}/est-${W}-${marca}.png` });
      return m;
    };

    const ida = [];
    for (const f of FRACOES) { ida.push({ f, ...(await medir(f, Math.round(f * 100))) }); }
    // volta
    const volta = [];
    for (const f of [0.5, 0]) { volta.push({ f, ...(await medir(f, 'volta' + Math.round(f * 100))) }); }

    saida.push({ tela: W + 'x' + H, pin: lim.pin, ida, volta, erros });
    console.log(`${W}x${H}  pin=${lim.pin}  erros=${erros.length ? erros.join('|') : 'nenhum'}`);
    for (const s of ida) {
      console.log(`   ${String(Math.round(s.f*100)).padStart(3)}%  folha x=${String(s.folha.x).padStart(5)} w=${s.folha.w}  quadro x=${String(s.quadro.x).padStart(5)} w=${s.quadro.w}  cruza-texto=${s.cruza}  transbordo=${s.transbordo}`);
    }
    console.log(`   volta 50% folha x=${volta[0].folha.x} · volta 0% folha x=${volta[1].folha.x} (ida 0% foi ${ida[0].folha.x})`);
    await p.close();
  }
  fs.writeFileSync(`${S}/estados.json`, JSON.stringify(saida, null, 1));
  await b.close();
})();
