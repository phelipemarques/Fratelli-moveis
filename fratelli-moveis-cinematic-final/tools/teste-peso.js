/* PESO REAL TRANSFERIDO, e nao soma de arquivos na pasta.

   Conta o que o navegador BAIXA ate a pagina estar utilizavel, por
   perfil, porque os perfis baixam coisas diferentes: A e B puxam o
   Three.js e os modulos da cena; C nao puxa nenhum deles e baixa os
   16 quadros da sequencia.

   Nao mede FPS nem nota de Lighthouse: aqui nao ha GPU de verdade, e
   numero inventado nao vale como medida. */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const URL = process.env.URL || 'http://localhost:8090/';

async function medir(b, titulo, opcoes, semGL) {
  const p = await b.newPage(opcoes);
  if (semGL) {
    await p.addInitScript(() => {
      const o = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (t) {
        if (typeof t === 'string' && t.indexOf('webgl') === 0) { return null; }
        return o.apply(this, arguments); };
    });
  }
  const porTipo = {}; let total = 0;
  p.on('response', async r => {
    try {
      const h = await r.allHeaders();
      const n = Number(h['content-length'] || 0);
      if (!n) { return; }
      const u = r.url();
      let t = 'outros';
      if (/\.(woff2?|ttf)/.test(u)) t = 'fontes';
      else if (/\/sequencia\//.test(u)) t = 'sequencia (perfil C)';
      else if (/three\.module/.test(u)) t = 'three.js';
      else if (/\.(js)(\?|$)/.test(u)) t = 'js';
      else if (/\.css/.test(u)) t = 'css';
      else if (/\.(avif|webp|jpe?g|png|svg)/.test(u)) t = 'imagens';
      else if (/\.mp4/.test(u)) t = 'video';
      else if (/\.html|\/$/.test(u)) t = 'html';
      porTipo[t] = (porTipo[t] || 0) + n; total += n;
    } catch (e) {}
  });
  await p.goto(URL, { waitUntil: 'load' });
  await p.waitForTimeout(5000);
  const perfil = await p.evaluate(() => {
    const s = document.querySelector('[data-abertura]');
    return s && s.getAttribute('data-perfil'); });
  /* `%.0f` nao existe no console do Node — so %s %d %i %f %j %o %O.
     A primeira versao imprimiu o literal "%.0f KB" com o numero cru
     do lado. Arredonda-se aqui, e imprime-se texto. */
  console.log('\n' + titulo + '  (perfil ' + perfil + ')  —  '
              + Math.round(total/1024) + ' KB ate `load` + 5 s');
  for (const k of Object.keys(porTipo).sort((a,b)=>porTipo[b]-porTipo[a])) {
    console.log('   ' + k.padEnd(22) + String(Math.round(porTipo[k]/1024)).padStart(6) + ' KB');
  }
  await p.close();
}

(async () => {
  const b = await chromium.launch({ args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  await medir(b, 'desktop 1440x900', { viewport:{width:1440,height:900} }, false);
  await medir(b, 'celular 390x844', { viewport:{width:390,height:844}, isMobile:true, hasTouch:true }, false);
  await medir(b, 'celular 390x844 SEM WebGL', { viewport:{width:390,height:844}, isMobile:true, hasTouch:true }, true);
  await b.close();
})();
