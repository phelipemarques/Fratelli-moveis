/* ============================================================
   Gera a SEQUENCIA PRE-RENDERIZADA do perfil C.

   O briefing pede (secao 12) que o aparelho sem WebGL deixe de ver
   apenas uma fotografia estatica e passe a ver a mesma historia. Os
   quadros saem do MESMO modelo Three.js que o perfil A roda: nao e
   outra animacao, e a mesma, congelada.

   Dirige a timeline real pelo `progresso(p)` e fotografa o canvas.
   Nao usa a camera de desenvolvimento: o enquadramento tem de ser o
   que o visitante de verdade recebe.

   Uso:  node tools/render-sequencia.js [url] [quadros]
   Saida: assets/images/sequencia/q-NN.webp  +  um .json com o indice
   ============================================================ */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const URL = process.argv[2] || 'http://localhost:8090/';
const N = Number(process.argv[3] || 18);
const RAIZ = path.dirname(__dirname);
const SAIDA = path.join(RAIZ, 'assets', 'images', 'sequencia');
/* RETRATO, e nao paisagem.

   O perfil C e sobretudo celular: aparelho sem WebGL ou sem folga de
   nucleo e memoria. Renderizar em 16:9 e depois cortar para a tela do
   telefone joga fora metade dos pixels pagos. 480x760 e a proporcao
   em que a sequencia vai ser vista.

   16 quadros, nao 24: cada um custa banda num aparelho que ja e
   fraco, e a leitura da sequencia (fechado -> abrindo -> aberto ->
   interior) nao precisa de mais que isso. */
const LARG = 480, ALT = 760;

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const b = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  const p = await b.newPage({ viewport: { width: LARG, height: ALT }, deviceScaleFactor: 1 });
  const erros = [];
  p.on('pageerror', e => erros.push(e.message));
  await p.goto(URL, { waitUntil: 'load' });
  await p.waitForTimeout(6000);

  const pronto = await p.evaluate(() => !!(window.__fratelliAbertura && window.__fratelliAbertura.cena));
  if (!pronto) { console.error('cena nao montou — abortado'); await b.close(); process.exit(1); }

  /* Esconde o que fica POR CIMA do canvas: o veu e a coluna de texto
     sao do DOM e continuam existindo no perfil C, desenhados por
     cima da sequencia. */
  await p.evaluate(() => {
    document.querySelectorAll('.abertura__veu, .abertura__conteudo, .site-header, .abertura__foto')
      .forEach(e => { e.style.visibility = 'hidden'; });
  });

  const indice = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    await p.evaluate(x => {
      const c = window.__fratelliAbertura.cena;
      c.progresso(x);

      /* NENHUM REENQUADRAMENTO. E isto mudou.

         A versao anterior corrigia o quadro aqui: reduzia o `desvio`
         a 15% e subia o preenchimento, porque em retrato a peca saia
         empurrada para um canto. Era remendo no lugar errado — o
         mesmo defeito aparecia no perfil B, que roda a cena ao vivo
         num telefone e nao passa por este script.

         A correcao foi para `opening.js` (`fatorLateral`): o desvio
         lateral so existe enquanto ha coluna de texto ao LADO da
         peca, e em proporcao de retrato ele vai a zero sozinho. Com
         isso o quadro que este script fotografa ja e o certo, e a
         sequencia volta a ser o que promete: o que o visitante de
         verdade receberia, congelado.

         `congelado` continua, por outro motivo: sem ele o laco de
         render pode reposicionar a camera entre o `progresso` e a
         foto — foi assim que uma varredura inteira de iluminacao se
         perdeu, medindo o fundo em vez da peca. */
      const s = window.__sonda;
      s.enq.congelado = true;
      s.cena.updateMatrixWorld(true);
      s.posicionarCamera();
      s.renderer.render(s.cena, s.camera);
    }, t);
    await p.waitForTimeout(220);
    /* PNG no disco e conversao para WebP depois, pelo Pillow: o
       Playwright so escreve png e jpeg. A primeira versao salvou PNG
       com extensao .webp e a sequencia inteira pesou 5 MB. */
    const nome = 'q-' + String(i).padStart(2, '0') + '.png';
    const alvo = path.join(SAIDA, nome);
    await (await p.$('[data-abertura-canvas]')).screenshot({ path: alvo, type: 'png' });
    indice.push({ i, t: +t.toFixed(4),
                  arquivo: 'assets/images/sequencia/q-' + String(i).padStart(2, '0') + '.webp' });
    process.stdout.write('.');
  }
  console.log('\n%d quadros em %s', N, SAIDA);
  console.log('erros de pagina:', erros.length ? erros[0] : 'nenhum');
  fs.writeFileSync(path.join(SAIDA, 'indice.json'),
    JSON.stringify({ quadros: N, largura: LARG, altura: ALT, lista: indice }, null, 1));
  await b.close();
})();
