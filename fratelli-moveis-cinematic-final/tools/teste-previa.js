/* A PREVIA TEM DE SER TESTADA, e nao declarada autossuficiente.

   Ela e um arquivo so, aberto de `file://` — origem em que o
   navegador recusa BAIXAR modulo ES e recusa `fetch`. As duas coisas
   que o capitulo 3D faz no site. Por isso tudo e achatado num modulo
   escrito na pagina e o indice da sequencia vai embutido.

   Este teste abre o arquivo como uma pessoa abriria: dois cliques,
   sem servidor. E abre DUAS vezes, porque os dois caminhos que
   dependem de `file://` sao diferentes: com WebGL (modulo achatado) e
   sem WebGL (indice embutido). */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');
const ARQ = process.argv[2] || path.join(path.dirname(__dirname),
  'fratelli-moveis-cinematic-final-visualizacao.html');
const URL = 'file://' + ARQ;
const r = [];
const ok = (n, v, obs) => { r.push([n,v]); console.log((v?'  OK  ':'FALHA ')+n+(obs?'   '+obs:'')); };

(async () => {
  ok('o arquivo existe', fs.existsSync(ARQ),
     fs.existsSync(ARQ) ? (fs.statSync(ARQ).size/1e6).toFixed(1)+' MB' : ARQ);
  const b = await chromium.launch({
    args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']
  });

  /* ---- 1. com WebGL: o modulo achatado roda de file:// ---- */
  {
    const p = await b.newPage({ viewport:{width:1440,height:900} });
    const erros = []; p.on('pageerror', e => erros.push(e.message));
    const console_ = []; p.on('console', m => { if (m.type()==='error') console_.push(m.text()); });
    await p.goto(URL, { waitUntil:'load' }); await p.waitForTimeout(7000);
    const m = await p.evaluate(() => {
      const sec = document.querySelector('[data-abertura]');
      return { perfil: sec && sec.getAttribute('data-perfil'),
               classe: sec ? sec.className : null,
               temCena: !!window.__sonda,
               pedacos: document.querySelectorAll('img[src^="data:"]').length,
               externos: [...document.querySelectorAll('[src],[href]')]
                 .map(e => e.getAttribute('src') || e.getAttribute('href'))
                 .filter(u => u && !/^(data:|#|https?:|mailto:|tel:)/.test(u)) };
    });
    ok('previa: monta a cena de file://', m.temCena && /tem-3d/.test(m.classe||''),
       `perfil=${m.perfil} classe=${m.classe}`);
    ok('previa: nenhuma referencia a arquivo externo', m.externos.length === 0,
       m.externos.slice(0,3).join(' '));
    ok('previa: as imagens estao embutidas', m.pedacos > 5, 'img data: ' + m.pedacos);
    ok('previa: sem erro de pagina', erros.length === 0, erros[0]||'');
    /* A SONDA DO MAPA NAO E DEFEITO, e o mapa funcionando.

       main.js nunca injeta o iframe do Google Maps direto: ele pede
       antes um favicon de maps.gstatic.com e so monta o mapa se a
       resposta vier. Aberta de `file://`, sem rede ou atras de uma
       rede que bloqueia terceiros, essa sonda falha DE PROPOSITO e o
       bloco de endereco fica no lugar do retangulo de erro do
       navegador. O console registra a falha da sonda; cobrar zero
       erro de console aqui seria cobrar que o mapa nao se protegesse.

       Entao a excecao e nominal — qualquer outro erro continua
       derrubando o teste. */
    const alheios = console_.filter(t => !/maps\.gstatic\.com|ERR_TUNNEL_CONNECTION_FAILED|ERR_(NAME_NOT_RESOLVED|INTERNET_DISCONNECTED|CONNECTION_)/.test(t));
    ok('previa: sem erro de console alem da sonda do mapa',
       alheios.length === 0, alheios[0] || ('sonda: ' + (console_.length) + ' linha(s)'));

    /* E o resultado DELA: o mapa nao entrou, e o lugar nao ficou vazio. */
    const mapa = await p.evaluate(() => {
      const h = document.querySelector('[data-map]');
      const t = h && h.querySelector('.map-frame__place');
      return { iframes: h ? h.querySelectorAll('iframe').length : -1,
               reserva: !!(t && t.getBoundingClientRect().height > 0) };
    });
    ok('previa: sem rede, o mapa cede o lugar ao endereco',
       mapa.iframes === 0 && mapa.reserva, JSON.stringify(mapa));
    await p.close();
  }

  /* ---- 2. sem WebGL: o indice embutido substitui o fetch ---- */
  {
    const p = await b.newPage({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
    const erros = []; p.on('pageerror', e => erros.push(e.message));
    await p.addInitScript(() => {
      const o = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (t) {
        if (typeof t === 'string' && t.indexOf('webgl') === 0) { return null; }
        return o.apply(this, arguments); };
    });
    await p.goto(URL, { waitUntil:'load' }); await p.waitForTimeout(5000);
    const m = await p.evaluate(() => {
      const sec = document.querySelector('[data-abertura]');
      const q = [...document.querySelectorAll('.abertura__seq img')];
      return { perfil: sec && sec.getAttribute('data-perfil'),
               temSeq: !!(sec && sec.classList.contains('tem-seq')),
               quadros: q.length,
               emDados: q.filter(i => /^data:/.test(i.getAttribute('src')||'')).length,
               carregados: q.filter(i => i.complete && i.naturalWidth > 0).length,
               curso: window.__fratelliAbertura && window.__fratelliAbertura.st
                 ? [window.__fratelliAbertura.st.start, window.__fratelliAbertura.st.end] : null };
    });
    ok('previa sem WebGL: cai no perfil C e monta a sequencia',
       m.perfil === 'C' && m.temSeq && m.quadros === 16,
       `perfil=${m.perfil} quadros=${m.quadros}`);
    ok('previa sem WebGL: os quadros vieram embutidos (sem fetch)',
       m.quadros > 0 && m.emDados === m.quadros, `${m.emDados}/${m.quadros} em data:`);
    const visita = [];
    for (const f of [0, 0.5, 1]) {
      await p.evaluate(y => scrollTo({top:y, behavior:'instant'}),
                       m.curso ? m.curso[0] + (m.curso[1]-m.curso[0])*f : 0);
      await p.waitForTimeout(520);
      visita.push(await p.evaluate(() => [...document.querySelectorAll('.abertura__seq img')]
        .findIndex(i => i.classList.contains('is-ativo'))));
    }
    ok('previa sem WebGL: a rolagem avanca os quadros',
       visita[0] === 0 && visita[1] > visita[0] && visita[2] > visita[1], visita.join(' -> '));
    ok('previa sem WebGL: sem erro de pagina', erros.length === 0, erros[0]||'');
    await p.close();
  }

  await b.close();
  const f = r.filter(x => !x[1]);
  console.log('\n%d testes, %d falhas', r.length, f.length);
  process.exitCode = f.length ? 1 : 0;
})();
