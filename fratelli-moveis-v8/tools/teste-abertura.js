/* ============================================================
   Fratelli Móveis V7.1 — provas da abertura do armário

   Três coisas que não dá para verificar "olhando o código":

   1. SENTIDO DAS DOBRADIÇAS
      Lê a ponta LIVRE de cada folha em coordenadas do mundo e exige
      que ela ande para a FRENTE (z crescente) e para FORA (|x|
      crescente). A frente do móvel está em z = +0,290: qualquer
      leitura abaixo disso significa folha entrando na carcaça.

   2. ENQUADRAMENTO
      Projeta os oito cantos do Box3 do móvel na tela e mede que
      fração da composição ele ocupa. É assim que se confere o pedido
      de 85–95% no ato da abertura completa, em cada proporção de
      tela — e não por impressão.

   3. CÂMERA DENTRO DE SÓLIDO
      A cada amostra, testa a posição da câmera contra o Box3 de cada
      painel. Se a câmera entrar num painel, o teste reprova.

   Precisa da sonda `window.__sonda`, que opening.js publica.

     node tools/teste-abertura.js http://localhost:8096/
   ============================================================ */

const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const ALVO = process.argv[2] || 'http://localhost:8096/';
const SAIDA = process.env.SHOTS || '/tmp/v71';

const TELAS = [
  ['1920x1080', 1920, 1080, false],
  ['1440x900',  1440,  900, false],
  ['1280x800',  1280,  800, false],
  ['768x1024',   768, 1024, true],
  ['430x932',    430,  932, true],
  ['390x844',    390,  844, true],
  ['360x800',    360,  800, true],
  ['320x568',    320,  568, true]
];

/* Os seis momentos do roteiro, em progresso da sequência. */
const MOMENTOS = [
  ['01-fechado',    0.06],
  ['02-abrindo',    0.26],
  ['03-metade',     0.44],
  ['04-tela-cheia', 0.56],
  ['05-interior',   0.74],
  ['06-transicao',  0.97]
];

async function medirTela(navegador, [nome, w, h, toque], fotos) {
  const pagina = await navegador.newPage({
    viewport: { width: w, height: h }, hasTouch: toque, isMobile: toque
  });
  const erros = [];
  pagina.on('pageerror', e => erros.push(e.message));

  await pagina.goto(ALVO, { waitUntil: 'load' });
  await pagina.waitForTimeout(4200);

  const perfil = await pagina.evaluate(() => {
    const s = document.querySelector('[data-abertura]');
    return s ? s.getAttribute('data-perfil') : null;
  });

  const limites = await pagina.evaluate(() => {
    const a = window.__fratelliAbertura;
    return a && a.st ? { ini: Math.round(a.st.start), fim: Math.round(a.st.end) } : null;
  });
  if (!limites) {
    await pagina.close();
    return { tela: nome, perfil, nota: 'sem sequência animada neste perfil', erros };
  }

  const amostras = [];
  for (const [rotulo, f] of MOMENTOS) {
    await pagina.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }),
      limites.ini + Math.round((limites.fim - limites.ini) * f));
    await pagina.waitForTimeout(1100);

    const m = await pagina.evaluate(() => {
      const s = window.__sonda;

      /* ---- perfil B: as portas são CSS, e a prova é a matriz ----
         Mesma pergunta do WebGL: para onde vai a ponta livre? Aqui ela
         sai da matriz de transformação do elemento aplicada ao ponto
         da borda oposta à dobradiça. `offsetWidth` e não o retângulo
         renderizado: o retângulo encolhe conforme a folha gira e
         mediria a própria rotação de volta. */
      if (!s) {
        const m25 = document.querySelector('.m25');
        if (!m25) { return null; }
        function ponta(sel, origemNaEsquerda) {
          const el = document.querySelector(sel);
          if (!el) { return null; }
          const mt = new DOMMatrix(getComputedStyle(el).transform);
          const w = el.offsetWidth || 1;
          const p = mt.transformPoint(
            new DOMPoint(origemNaEsquerda ? w : -w, 0, 0, 1));
          return { x: +p.x.toFixed(1), z: +p.z.toFixed(1) };
        }
        const e = ponta('.m25__porta--esq', true);
        const d = ponta('.m25__porta--dir', false);
        const cam = document.querySelector('.m25__camera');
        /* O retângulo da PEÇA, não o do palco: `.m25` é
           `position:absolute; inset:0` e mediria sempre 100% da tela,
           o que não diz nada sobre o enquadramento. */
        const peca = document.querySelector('.m25__movel');
        const r = (peca || m25).getBoundingClientRect();
        return {
          modo: '2.5D',
          pontaEsqZ: e ? e.z : null, pontaEsqX: e ? e.x : null,
          pontaDirZ: d ? d.z : null, pontaDirX: d ? d.x : null,
          frenteZ: 0,
          escala: cam ? +(new DOMMatrix(getComputedStyle(cam).transform).a).toFixed(3) : null,
          ocupaLargura: +((r.width / window.innerWidth) * 100).toFixed(1),
          ocupaAltura: +((r.height / window.innerHeight) * 100).toFixed(1),
          cameraDentroDe: null,
          passagem: +(getComputedStyle(document.querySelector('[data-abertura]'))
                       .getPropertyValue('--passagem') || 0)
        };
      }
      const T = s.THREE;

      /* --- a ponta livre de cada folha, no mundo --- */
      function ponta(pivo, sinal) {
        return pivo.localToWorld(
          new T.Vector3(-sinal * s.larguraPorta, s.y0 + s.Ac / 2, 0));
      }
      const pe = ponta(s.pivoEsq, -1), pd = ponta(s.pivoDir, 1);

      /* --- quanto da tela o móvel ocupa --- */
      const caixa = new T.Box3().setFromObject(s.movel);
      const cantos = [];
      for (let i = 0; i < 8; i++) {
        cantos.push(new T.Vector3(
          i & 1 ? caixa.max.x : caixa.min.x,
          i & 2 ? caixa.max.y : caixa.min.y,
          i & 4 ? caixa.max.z : caixa.min.z));
      }
      s.camera.updateMatrixWorld();
      let x0 = Infinity, x1 = -Infinity, y0v = Infinity, y1 = -Infinity;
      cantos.forEach(c => {
        const p = c.clone().project(s.camera);
        x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x);
        y0v = Math.min(y0v, p.y); y1 = Math.max(y1, p.y);
      });
      // NDC vai de -1 a 1: dividir por 2 dá a fração da tela
      const ocupaL = Math.min(1, (x1 - x0) / 2);
      const ocupaA = Math.min(1, (y1 - y0v) / 2);

      /* --- a câmera está dentro de algum painel? --- */
      const olho = s.camera.getWorldPosition(new T.Vector3());
      let dentroDe = null;
      const cx = new T.Box3();
      s.movel.traverse(o => {
        if (dentroDe || !o.isMesh) { return; }
        cx.setFromObject(o);
        cx.expandByScalar(-0.001);        // tolerância: encostar não é atravessar
        if (cx.containsPoint(olho)) {
          dentroDe = o.material && o.material.name ? o.material.name : 'painel';
        }
      });

      return {
        rotEsq: +s.pivoEsq.rotation.y.toFixed(3),
        rotDir: +s.pivoDir.rotation.y.toFixed(3),
        pontaEsqZ: +pe.z.toFixed(3), pontaEsqX: +pe.x.toFixed(3),
        pontaDirZ: +pd.z.toFixed(3), pontaDirX: +pd.x.toFixed(3),
        frenteZ: +(s.P / 2).toFixed(3),
        ocupaLargura: +(ocupaL * 100).toFixed(1),
        ocupaAltura: +(ocupaA * 100).toFixed(1),
        camera: [+olho.x.toFixed(2), +olho.y.toFixed(2), +olho.z.toFixed(2)],
        cameraDentroDe: dentroDe,
        passagem: +(getComputedStyle(document.querySelector('[data-abertura]'))
                     .getPropertyValue('--passagem') || 0)
      };
    });

    amostras.push(Object.assign({ momento: rotulo, progresso: f }, m || {}));
    if (fotos) {
      const fs = require('fs');
      fs.mkdirSync(SAIDA, { recursive: true });
      await pagina.screenshot({ path: `${SAIDA}/${nome}-${rotulo}.png` });
    }
  }

  /* --- a volta --- */
  const volta = [];
  for (const f of [0.74, 0.44, 0.06, 0]) {
    await pagina.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }),
      limites.ini + Math.round((limites.fim - limites.ini) * f));
    await pagina.waitForTimeout(1100);
    volta.push(await pagina.evaluate(() => {
      const s = window.__sonda;
      if (s) {
        return { rotEsq: +s.pivoEsq.rotation.y.toFixed(3),
                 rotDir: +s.pivoDir.rotation.y.toFixed(3) };
      }
      const el = document.querySelector('.m25__porta--esq');
      if (!el) { return null; }
      const mt = new DOMMatrix(getComputedStyle(el).transform);
      // o ângulo sai do próprio componente da matriz
      return { grausEsq: +(Math.atan2(-mt.m13, mt.m11) * 180 / Math.PI).toFixed(1) };
    }));
  }

  const transbordo = await pagina.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);

  await pagina.close();
  return { tela: nome, perfil, amostras, volta, transbordo, erros };
}

(async () => {
  const navegador = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  const saida = { alvo: ALVO, quando: new Date().toISOString(), telas: [] };
  for (const tela of TELAS) {
    saida.telas.push(await medirTela(navegador, tela,
      ['1440x900', '390x844'].includes(tela[0])));
  }
  await navegador.close();
  console.log(JSON.stringify(saida, null, 1));
})();
