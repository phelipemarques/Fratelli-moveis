/* Varredura responsiva com CONTRASTE REAL.

   A primeira versao deste teste comparava retangulos e acusou 23
   colisoes em 1440 -- todas falsas. O texto da secao de materialidade
   fica MESMO sobre uma fotografia, de proposito, com uma vinheta por
   cima; retangulo que se cruza nao diz nada sobre legibilidade.

   Entao ele faz o que o teste da V8 fazia: fotografa a tela DUAS vezes,
   a segunda com os blocos de texto escondidos, e le o fundo verdadeiro
   que esta atras de cada um. O contraste sai dai, pela formula da WCAG.
*/
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'); const path = require('path');
const S = process.env.S, URL = process.env.URL || 'http://localhost:8092/';
const PARES = process.env.PARES || (S + '/pares');
const TELAS = (process.env.TELAS ? process.env.TELAS.split(',').map(t=>t.split('x').map(Number))
  : [[320,568],[360,800],[375,667],[390,844],[414,896],[430,932],
     [768,1024],[1024,768],[1280,800],[1440,900],[1920,1080]]);
const PARADAS = 8;

(async () => {
  fs.mkdirSync(PARES, { recursive: true });
  const b = await chromium.launch();
  const tudo = [];
  for (const [W,H] of TELAS) {
    const p = await b.newPage({ viewport:{width:W,height:H}, deviceScaleFactor:1,
                                hasTouch:W<900, isMobile:W<900 });
    const erros = []; p.on('pageerror', e => erros.push(e.message));
    await p.goto(URL, { waitUntil:'load' });
    await p.waitForTimeout(2300);
    const alt = await p.evaluate(() => document.documentElement.scrollHeight);
    let tbMax = 0; const amostras = [];
    for (let i = 0; i <= PARADAS; i++) {
      await p.evaluate(y => window.scrollTo({top:y, behavior:'instant'}), (alt-H)*i/PARADAS);
      await p.waitForTimeout(650);
      /* Espera a animacao de entrada PARAR antes de medir. Duas
         leituras iguais da opacidade de tudo que esta na tela. */
      await p.waitForFunction(() => {
        const agora = [...document.querySelectorAll('h1,h2,h3,p,a,li,span')]
          .slice(0, 400).map(e => getComputedStyle(e).opacity).join('|');
        const parado = window.__opAntes === agora;
        window.__opAntes = agora;
        return parado;
      }, { timeout: 6000, polling: 240 }).catch(() => {});
      const blocos = await p.evaluate(() => {
        /* VISIVEL DE VERDADE, e nao so tecnicamente dentro da janela.

           Duas exclusoes, e as duas foram aprendidas errando:

           1. Elementos cortados pela borda. Um botao com 5 px de altura
              aparecendo no topo da janela devolvia 1,47:1 -- a medida
              era de uma tira de borda, nao do botao.
           2. Elementos sob o CABECALHO FIXO. O cabecalho cobre o topo
              da pagina por projeto; contraste debaixo dele nao e
              defeito de pagina, e sim o cabecalho fazendo o trabalho
              dele. 96 px e a altura dele com folga.

           Em ambos o elemento volta a ser medido assim que esta
           inteiro na tela, que e quando a pessoa de fato o le. */
        const CABECALHO = 96;
        const vis = el => {
          const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden') return false;
          /* OPACIDADE EFETIVA, do elemento E de todos os pais.

             0,1 nao bastava. Um botao em 0,3 no meio da animacao de
             entrada passava no filtro e o teste media um elemento que
             ainda nao estava la: 1,47:1 para um botao que, inteiro, da
             13:1. A fotografia do recorte mostra o botao SIMPLESMENTE
             INVISIVEL. E a mesma armadilha que a V8 e a V9 ja tinham
             encontrado, e ela volta toda vez que o teste e reescrito.

             Agora so mede o que ja chegou: 0,9 em cada camada. */
          let op = 1, n = el;
          for (let k = 0; k < 8 && n && n !== document.body; k++, n = n.parentElement) {
            op *= +getComputedStyle(n).opacity;
          }
          if (op < 0.9) return false;
          /* Glifo transparente nao e falha de contraste: e texto
             invisivel, e o filtro de opacidade acima ja cobre o caso
             legitimo. Aqui pega o residuo de transicao. */
          const m = cs.color.match(/[\d.]+/g);
          if (m && m.length === 4 && +m[3] < 0.5) return false;
          if (r.width <= 2 || r.height <= 2) return false;
          const topo = Math.max(CABECALHO, 0), base = innerHeight;
          const vh = Math.min(base, r.bottom) - Math.max(topo, r.top);
          return vh >= Math.min(r.height, 10) && vh >= r.height * 0.7;
        };
        /* so folhas que carregam texto: um involucro tem retangulo maior
           que a letra, e foi esse erro que a V8 teve de corrigir. */
        const folha = el => {
          const direto = [...el.childNodes].some(n => n.nodeType===3 && n.textContent.trim());
          if (direto || !el.children.length) return [el];
          return [...el.children].flatMap(folha);
        };
        /* Só o que REALMENTE carrega letra.

           Sem o filtro de texto, um `<a>` que embrulha apenas uma
           fotografia descia ate o proprio `<img>`, e o teste media a
           "cor do texto" de uma imagem — devolvia 3,8:1 para um
           elemento que nao tem uma letra sequer. */
        const alvos = [...document.querySelectorAll('h1,h2,h3,p,a,li,span.eyebrow')]
          .flatMap(folha)
          .filter(el => el.textContent.trim().length > 0 && el.tagName !== 'IMG')
          .filter(vis);
        window.__alvos = alvos;
        return alvos.map(el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
          const fs = parseFloat(cs.fontSize), fw = parseInt(cs.fontWeight,10)||400;
          return { cls: (el.className||el.tagName).toString().split(' ')[0].slice(0,26),
                   txt: el.textContent.trim().slice(0, 34),
                   x: Math.round(Math.max(0,r.left)), y: Math.round(Math.max(0,r.top)),
                   w: Math.round(Math.min(innerWidth,r.right)-Math.max(0,r.left)),
                   h: Math.round(Math.min(innerHeight,r.bottom)-Math.max(96,r.top)),
                   cor: cs.color, grande: fs>=24 || (fs>=18.66 && fw>=700) };
        }).filter(r => r.w>2 && r.h>2);
      });
      const tb = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      tbMax = Math.max(tbMax, tb);
      const marca = `${W}-${i}`;
      fs.writeFileSync(`${PARES}/${marca}-com.png`, await p.screenshot());
      /* `color: transparent`, e NAO `visibility: hidden`.
         Esconder o elemento esconde tambem o FUNDO dele: um botao com
         preenchimento proprio passava a ler o que esta atras do botao,
         e o teste devolvia 1,00:1 para um botao perfeitamente legivel.
         Tornando so o glifo transparente, o fundo verdadeiro fica. */
      await p.evaluate(() => window.__alvos.forEach(el => {
        el.dataset.corAntes = el.style.color || '';
        /* A TRANSICAO PRECISA MORRER DURANTE A TROCA.

           Sem isto, devolver a cor do glifo dispara a transicao do
           CSS, e a parada seguinte mede o elemento no MEIO dela: o
           teste leu `rgba(0,0,0,0)` num botao e devolveu 1,08:1 para
           um elemento que, com a cor dele, da 12:1. Quinta vez que um
           defeito deste teste se disfarca de defeito da pagina. */
        el.style.setProperty('transition', 'none', 'important');
        el.style.setProperty('color', 'transparent', 'important');
        el.style.setProperty('text-shadow', 'none', 'important');
      }));
      await p.waitForTimeout(110);
      fs.writeFileSync(`${PARES}/${marca}-sem.png`, await p.screenshot());
      await p.evaluate(() => window.__alvos.forEach(el => {
        el.style.removeProperty('color'); el.style.removeProperty('text-shadow');
        if (el.dataset.corAntes) el.style.color = el.dataset.corAntes;
        delete el.dataset.corAntes;
        /* devolve a transicao so depois que a cor ja esta no lugar */
        el.offsetHeight;
        el.style.removeProperty('transition');
      }));
      amostras.push({ marca, blocos });
    }
    tudo.push({ tela: W+'x'+H, transbordo: tbMax, amostras, erros });
    console.log(`${String(W).padStart(4)}x${H} capturado  transbordo=${tbMax}  erros=${erros.length?erros[0]:'nenhum'}`);
    await p.close();
  }
  const entrada = `${PARES}/entrada.json`;
  fs.writeFileSync(entrada, JSON.stringify({ telas: tudo, pares: PARES }));
  await b.close();
  process.stdout.write(execFileSync('python3',['-I',path.join(__dirname,'teste-contraste.py'),entrada],
    { maxBuffer: 64*1024*1024 }));
})();
