/* ============================================================
   Fratelli Móveis V8 — o texto da abertura está coberto?

   O pedido é explícito: "A ausência de colisão entre retângulos DOM
   não comprova que os pixels visíveis do modelo WebGL não encobrem o
   texto." Concordo, e por isso este teste faz as duas coisas.

   1. GEOMETRIA
      Mede a folga entre o retângulo que a cena ocupa na tela e a
      união dos blocos de texto. Negativa = encostando.

   2. PIXEL
      Fotografa a mesma tela DUAS vezes: uma normal e outra com a cena
      escondida (`visibility: hidden` no canvas e na composição 2.5D).
      Depois compara os pixels DENTRO do retângulo de cada bloco de
      texto visível.

      Se os dois quadros forem iguais ali, nada da cena estava atrás
      daquele texto. Se forem diferentes, estava — e o teste diz
      quanto, em porcentagem de pixels alterados.

      É isto que distingue "os retângulos não se cruzam" de "o texto
      está realmente limpo".

   Blocos que já recuaram (visibility: hidden) são pulados: não há o
   que cobrir. O botão de pular NÃO recua e por isso é sempre testado.

     node tools/teste-sobreposicao.js http://localhost:8095/
   ============================================================ */

const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');

const ALVO = process.argv[2] || 'http://localhost:8095/';
const SAIDA = process.env.SHOTS || '/tmp/v8-sobreposicao';

/* Quanto de pixel alterado dentro de um bloco de texto ainda conta
   como limpo. Não é zero: a sombra do véu e o antialias mudam um
   fiapo de pixels mesmo sem a cena por trás. 0,8% é folgado para
   ruído e apertado para madeira. */
const TOLERANCIA = 0.8;

const SO = process.env.SO ? process.env.SO.split(',') : null;

const TODAS = [
  ['1920x1080', 1920, 1080, false],
  ['1440x900',  1440,  900, false],
  ['1280x800',  1280,  800, false],
  ['768x1024',   768, 1024, true],
  ['430x932',    430,  932, true],
  ['390x844',    390,  844, true],
  ['360x800',    360,  800, true],
  ['320x568',    320,  568, true]
];

/* SO=1920x1080,1440x900 roda só essas telas — útil para conferir uma
   correção sem esperar a varredura inteira. */
const TELAS = SO ? TODAS.filter(t => SO.includes(t[0])) : TODAS;

const ESTADOS = [0, 0.2, 0.4, 0.6, 0.8, 1];

/* O Node desta máquina não tem decodificador de PNG. Em vez de
   escrever um, os dois quadros vão para o disco e quem compara é o
   PIL, em tools/diff-sobreposicao.py — chamado no fim deste script.
   A conta é a mesma; muda só quem a faz. */
const PARES = process.env.PARES || '/tmp/v8-pares';

async function medir(navegador, [nome, w, h, toque], semWebGL) {
  const pagina = await navegador.newPage({
    viewport: { width: w, height: h }, hasTouch: toque, isMobile: toque,
    deviceScaleFactor: 1
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
    return a && a.st ? { ini: a.st.start, fim: a.st.end } : null;
  });
  if (!limites) {
    await pagina.close();
    return { tela: nome, perfil, semWebGL, nota: 'sem sequência neste perfil', erros };
  }

  const amostras = [];
  for (const f of ESTADOS) {
    await pagina.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }),
      limites.ini + (limites.fim - limites.ini) * f);
    await pagina.waitForTimeout(1150);

    /* --- 1. geometria + quais blocos estão visíveis --- */
    const estado = await pagina.evaluate(() => {
      const secao = document.querySelector('[data-abertura]');
      /* Mede os elementos que REALMENTE carregam texto.

         Um invólucro como `.abertura__acoes` tem retângulo maior que o
         botão dentro dele, e a sobra cai sobre a fotografia nua. Medir
         o invólucro dava 4,5:1 num botão que, no seu próprio
         retângulo, está em 12:1 — reprovando pela área onde não há
         letra nenhuma. Então: se o elemento não tem texto direto e tem
         filhos, desce para os filhos. */
      function folhasDeTexto(el) {
        const direto = [...el.childNodes]
          .some(n => n.nodeType === 3 && n.textContent.trim());
        if (direto || !el.children.length) { return [el]; }
        return [...el.children].flatMap(folhasDeTexto);
      }

      const blocos = [...secao.querySelectorAll('.abertura__texto > *')]
        .flatMap(folhasDeTexto)
        .filter(el => {
          const cs = getComputedStyle(el);
          return cs.visibility !== 'hidden' && +cs.opacity > 0.08;
        })
        .map(el => {
          const r = el.getBoundingClientRect();
          const cs2 = getComputedStyle(el);
          return { classe: el.className.split(' ')[0] || el.tagName.toLowerCase(),
                   left: r.left, top: r.top, right: r.right, bottom: r.bottom,
                   cor: cs2.color,
                   // texto grande (>= 24px, ou >= 18.66px em negrito) tem
                   // exigência de contraste menor na WCAG
                   grande: parseFloat(cs2.fontSize) >= 24
                           || (parseFloat(cs2.fontSize) >= 18.66
                               && parseInt(cs2.fontWeight, 10) >= 700) };
        })
        .filter(r => r.right > r.left && r.bottom > r.top);

      const a = window.__fratelliAbertura;
      const cena = a && a.cena && a.cena.retanguloNaTela
        ? a.cena.retanguloNaTela() : null;

      let folga = null;
      if (cena && blocos.length) {
        const u = blocos.reduce((acc, b) => ({
          left: Math.min(acc.left, b.left), top: Math.min(acc.top, b.top),
          right: Math.max(acc.right, b.right), bottom: Math.max(acc.bottom, b.bottom)
        }), { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
        folga = Math.round(Math.max(
          Math.max(u.left - cena.right, cena.left - u.right),
          Math.max(u.top - cena.bottom, cena.top - u.bottom)));
      }
      return { recuado: secao.classList.contains('texto-recuado'), blocos, folga };
    });

    /* --- 2. pixel: com a cena e sem a cena --- */
    const comCena = await pagina.screenshot();
    await pagina.evaluate(() => {
      document.querySelectorAll('[data-abertura-canvas], .m25')
        .forEach(el => { el.style.visibility = 'hidden'; });
    });
    await pagina.waitForTimeout(120);
    const semCena = await pagina.screenshot();
    await pagina.evaluate(() => {
      document.querySelectorAll('[data-abertura-canvas], .m25')
        .forEach(el => { el.style.removeProperty('visibility'); });
    });

    const marca = `${nome}${semWebGL ? '-sem-webgl' : ''}-${Math.round(f * 100)}`;
    fs.mkdirSync(PARES, { recursive: true });
    fs.writeFileSync(`${PARES}/${marca}-com.png`, comCena);
    fs.writeFileSync(`${PARES}/${marca}-sem.png`, semCena);

    amostras.push({
      progresso: f, marca, recuado: estado.recuado, folga: estado.folga,
      blocosVisiveis: estado.blocos.length, blocos: estado.blocos
    });

    if (process.env.SHOTS) {
      fs.mkdirSync(SAIDA, { recursive: true });
      fs.writeFileSync(`${SAIDA}/${marca}.png`, comCena);
    }
  }

  const transbordo = await pagina.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);

  await pagina.close();
  return { tela: nome, perfil, semWebGL, amostras, transbordo, erros };
}

(async () => {
  const saida = { alvo: ALVO, quando: new Date().toISOString(), telas: [] };

  /* Com WebGL (perfil A no desktop, B no toque) */
  let nav = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  for (const t of TELAS) { saida.telas.push(await medir(nav, t, false)); }
  await nav.close();

  /* SEM WebGL — o caso que estava quebrado: desktop largo caindo no
     2.5D, onde a composição nasce no meio da coluna de texto. */
  nav = await chromium.launch({ args: ['--disable-webgl', '--disable-webgl2'] });
  /* Só as telas largas e o tablet: é onde o 2.5D tem de dividir o
     espaço com o texto. Filtrado por NOME para continuar válido
     quando SO= reduz a lista. */
  const SEM_GL = ['1920x1080', '1440x900', '1280x800', '768x1024'];
  for (const t of TELAS.filter(t => SEM_GL.includes(t[0]))) {
    saida.telas.push(await medir(nav, t, true));
  }
  await nav.close();

  /* O PIL faz a comparação e devolve o relatório final. */
  saida.tolerancia = TOLERANCIA;
  saida.pares = PARES;
  const tmp = `${PARES}/entrada.json`;
  fs.writeFileSync(tmp, JSON.stringify(saida));
  const { execFileSync } = require('child_process');
  const caminho = require('path').join(__dirname, 'diff-sobreposicao.py');
  process.stdout.write(execFileSync('python3', ['-I', caminho, tmp], {
    maxBuffer: 64 * 1024 * 1024
  }));
})();
