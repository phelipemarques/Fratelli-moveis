/* ============================================================
   Fratelli Móveis V6 — varredura de QA

   Mede o que dá para medir e imprime em JSON. Nada aqui é estimado:
   todo número que aparece em TESTES-V6.md sai desta execução.

     node tools/qa-v6.js  http://localhost:8099/

   Precisa de um servidor HTTP servindo o pacote (módulos ES não
   carregam de file:// quando estão em arquivos separados).
   ============================================================ */

const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const ALVO = process.argv[2] || 'http://localhost:8099/';
const SAIDA = process.env.SHOTS || '/tmp/qa-v6';

const TELAS = [
  ['320',  320,  568, true],
  ['360',  360,  740, true],
  ['390',  390,  844, true],
  ['430',  430,  932, true],
  ['768',  768, 1024, true],
  ['1440', 1440, 900, false],
  ['1920', 1920, 1080, false]
];

async function medir(navegador, [nome, w, h, toque], opcoes = {}) {
  const pagina = await navegador.newPage({
    viewport: { width: w, height: h },
    hasTouch: toque, isMobile: toque,
    deviceScaleFactor: 1,
    reducedMotion: opcoes.movimentoReduzido ? 'reduce' : 'no-preference'
  });

  const erros = [];
  pagina.on('pageerror', e => erros.push('pageerror: ' + e.message));
  pagina.on('console', m => {
    if (m.type() === 'error' && !m.text().includes('ERR_TUNNEL')) {
      erros.push('console: ' + m.text().slice(0, 120));
    }
  });
  const falhas = [];
  pagina.on('requestfailed', r => {
    const u = r.url();
    // o proxy desta máquina derruba qualquer pedido externo; só
    // interessa o que é do próprio pacote
    if (u.startsWith(ALVO)) { falhas.push(u.replace(ALVO, '')); }
  });

  await pagina.goto(ALVO, { waitUntil: 'load' });
  await pagina.waitForTimeout(4200);

  const r = { tela: nome, largura: w, altura: h };

  r.perfil = await pagina.evaluate(() => {
    const s = document.querySelector('[data-abertura]');
    return s ? s.getAttribute('data-perfil') : null;
  });
  r.materia = await pagina.evaluate(() => !!window.__fratelliMateria);

  // ---- transbordo horizontal, seção por seção ----
  r.transbordo = await pagina.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const pior = { px: Math.max(0, document.documentElement.scrollWidth - vw), quem: 'documento' };
    document.querySelectorAll('section, header, footer, .shell').forEach(el => {
      const b = el.getBoundingClientRect();
      const px = Math.round(Math.max(0, b.right - vw, -b.left));
      if (px > pior.px) {
        pior.px = px;
        pior.quem = el.tagName.toLowerCase() + '.' + (el.className || '').split(' ')[0];
      }
    });
    return pior;
  });

  // ---- imagens realmente quebradas ----
  r.imagens = await pagina.evaluate(() => {
    const imgs = [...document.images];
    return {
      total: imgs.length,
      // a <img> da ampliação nasce sem src de propósito
      quebradas: imgs.filter(i => i.complete && i.naturalWidth === 0 &&
                                  !i.classList.contains('lightbox__img'))
                     .map(i => (i.currentSrc || i.src).split('/').pop())
    };
  });

  // ---- a sequência, para a frente e PARA TRÁS ----
  /* Os limites vêm do PRÓPRIO gatilho, não de uma conta sobre a
     posição da seção. Com dois pins na página (abertura e
     materialidade) e um refresh depois que ambos montam, a conta
     externa erra — e um teste que erra a posição acusa a animação de
     não voltar quando quem não voltou foi o teste. */
  const limites = await pagina.evaluate(() => {
    const a = window.__fratelliAbertura;
    if (a && a.st) { return { ini: Math.round(a.st.start), fim: Math.round(a.st.end) }; }
    const s = document.querySelector('[data-abertura]');
    return s ? { ini: Math.round(s.getBoundingClientRect().top + window.scrollY), fim: null } : null;
  });
  const topo = limites ? limites.ini : null;
  const alturas = r.perfil === 'A' ? 4.0 : (r.perfil === 'B' ? 2.2 : 0);
  r.limites = limites;

  async function amostra(f) {
    const alvo = (limites && limites.fim !== null)
      ? limites.ini + Math.round((limites.fim - limites.ini) * f)
      : topo + Math.round(h * alturas * f);
    /* `behavior: 'instant'` porque a folha de estilo pede
       `scroll-behavior: smooth`: sem isso o teste mede a rolagem
       suave do navegador, não a animação. Foi o que fez a volta
       aparecer atrasada em uma amostra. */
    await pagina.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), alvo);
    /* scrub 0,5 significa que o valor PERSEGUE a rolagem por meio
       segundo. 1,2 s de espera é o dobro disso: o que sobrar de
       diferença é da animação, não da medida. */
    await pagina.waitForTimeout(1200);
    return pagina.evaluate(() => {
      const s = document.querySelector('[data-abertura]');
      return {
        prog: window.__fratelliAbertura && window.__fratelliAbertura.st
          ? +window.__fratelliAbertura.st.progress.toFixed(3) : null,
        passagem: +(getComputedStyle(s).getPropertyValue('--passagem') || 0)
      };
    });
  }

  if (topo !== null && alturas) {
    r.ida = [];
    for (const f of [0, 0.25, 0.5, 0.75, 1]) { r.ida.push(await amostra(f)); }
    r.volta = [];
    for (const f of [0.75, 0.5, 0.25, 0]) { r.volta.push(await amostra(f)); }
  }

  // ---- fotos das seções que importam ----
  if (opcoes.fotos) {
    const fs = require('fs');
    fs.mkdirSync(SAIDA, { recursive: true });
    const marcos = [
      ['hero', 0], ['abertura', topo],
      ['materia', await pagina.evaluate(() => {
        const s = document.querySelector('[data-materia]');
        return s ? Math.round(s.getBoundingClientRect().top + window.scrollY) : 0;
      })],
      ['projetos', await pagina.evaluate(() => {
        const s = document.querySelector('#projetos');
        return s ? Math.round(s.getBoundingClientRect().top + window.scrollY) : 0;
      })],
      ['ambientes', await pagina.evaluate(() => {
        const s = document.querySelector('#ambientes');
        return s ? Math.round(s.getBoundingClientRect().top + window.scrollY) : 0;
      })],
      ['contato', await pagina.evaluate(() => {
        const s = document.querySelector('#contato');
        return s ? Math.round(s.getBoundingClientRect().top + window.scrollY) : 0;
      })]
    ];
    for (const [quem, y] of marcos) {
      await pagina.evaluate(v => window.scrollTo(0, v), y);
      await pagina.waitForTimeout(900);
      await pagina.screenshot({ path: `${SAIDA}/${nome}-${quem}.png` });
    }
  }

  r.erros = erros;
  r.recursosQueFalharam = falhas;
  await pagina.close();
  return r;
}

(async () => {
  const navegador = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });

  const saida = { alvo: ALVO, quando: new Date().toISOString(), telas: [] };

  for (const tela of TELAS) {
    saida.telas.push(await medir(navegador, tela,
      { fotos: ['320', '390', '768', '1440', '1920'].includes(tela[0]) }));
  }

  // movimento reduzido, nas duas pontas
  saida.movimentoReduzido = [];
  for (const tela of [TELAS[2], TELAS[5]]) {
    const r = await medir(navegador, tela, { movimentoReduzido: true });
    saida.movimentoReduzido.push({
      tela: r.tela, perfil: r.perfil, materia: r.materia,
      transbordo: r.transbordo, erros: r.erros
    });
  }

  await navegador.close();
  console.log(JSON.stringify(saida, null, 1));
})();
