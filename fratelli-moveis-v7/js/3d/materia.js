/* ============================================================
   Fratelli Móveis — o capítulo de materialidade

   Uma peça só, de perto, girando pouco. A encenação inteira cabe em
   quatro variáveis CSS e duas transformações:

     --giro / --incl   o ângulo da peça (a "câmera" em volta dela)
     --aprox           a aproximação
     --varre           onde está a luz rasante
     --brilho          quanto a frente recebe

   Três trechos, presos ao mesmo scrub:

     0,00 – 0,34  VEIO       quase de frente, a fibra é lida
     0,34 – 0,68  LUZ        a rasante atravessa e mostra o poro
     0,68 – 1,00  ESPESSURA  a peça gira e o canto entra em quadro

   O texto NÃO é decoração sincronizada por acaso: cada passo acende
   no trecho que ele descreve. Quem lê "espessura" está vendo o canto.

   Por que não um segundo renderizador WebGL: ele custaria outro
   contexto, outro render loop e outro megabyte para mostrar uma peça
   de frente com um giro de 30 graus. O CSS 3D faz isso com o
   compositor, sem tirar um quadro da cena que realmente precisa dele.
   ============================================================ */

import { gerarCanvasMadeira } from './grao.js';

function ip(a, b, t) { return a + (b - a) * t; }
function faixa(p, a, b) { return Math.min(1, Math.max(0, (p - a) / (b - a))); }
function suave(t) { return t * t * (3 - 2 * t); }

export function criarMateria(opcoes) {
  var secao = opcoes.secao;
  var gsap = opcoes.gsap;
  var ST = opcoes.ScrollTrigger;
  if (!secao || !gsap || !ST) { return null; }

  var peca = secao.querySelector('[data-materia-peca]');
  var passos = Array.prototype.slice.call(
    secao.querySelectorAll('[data-materia-passo]'));
  if (!peca || !passos.length) { return null; }

  /* O mesmo veio da cena grande, com a semente trocada: é outra peça
     da mesma madeira, não a mesma tábua de novo. Em 384px porque aqui
     a superfície ocupa meia tela e o olho chega perto dela. */
  var canvas;
  try {
    canvas = gerarCanvasMadeira({
      tamanho: 384,
      semente: 777119,
      claro: [158, 133, 108],
      escuro: [99, 79, 62],
      rugosidade: 0.58,
      rugosidadePoro: 0.80,
      relevo: 1.0
    });
  } catch (e) {
    return null;
  }
  var url = canvas.cor.toDataURL('image/webp', 0.88);
  if (url.indexOf('data:image/webp') !== 0) {
    url = canvas.cor.toDataURL('image/png');
  }
  secao.style.setProperty('--veio-materia', 'url(' + url + ')');
  secao.classList.add('tem-materia');

  var ativo = -1;

  function escrever(p) {
    var a = suave(faixa(p, 0.00, 0.34));   // veio
    var b = suave(faixa(p, 0.34, 0.68));   // luz
    var c = suave(faixa(p, 0.68, 1.00));   // espessura

    /* O giro guarda-se para o fim. Nos dois primeiros trechos a peça
       fica quase de frente, que é como se lê veio e poro; é só no
       terceiro que ela abre o ângulo e mostra o canto. */
    secao.style.setProperty('--giro',  (ip(5, 8, a) + b * 2.5 + c * 15).toFixed(2));
    secao.style.setProperty('--incl',  (ip(2, 0.4, a) - c * 5.5).toFixed(2));
    secao.style.setProperty('--aprox', (ip(0.90, 1.00, a) + b * 0.04 - c * 0.10).toFixed(4));
    /* A rasante só atravessa no trecho dela. Antes fica fora do quadro,
       depois sai pelo outro lado e não volta. */
    secao.style.setProperty('--varre', (-30 + b * 150).toFixed(1) + '%');
    secao.style.setProperty('--brilho', (0.72 + a * 0.16 + b * 0.12 - c * 0.06).toFixed(3));

    var qual = p < 0.34 ? 0 : (p < 0.68 ? 1 : 2);
    if (qual !== ativo) {
      ativo = qual;
      passos.forEach(function (el, i) { el.classList.toggle('is-ativo', i === qual); });
    }
  }

  escrever(0);

  var st = ST.create({
    trigger: secao,
    start: 'top top',
    end: '+=' + Math.round(window.innerHeight * 2.4),
    pin: true,
    pinSpacing: true,
    anticipatePin: 1,
    scrub: 0.5,
    invalidateOnRefresh: true,
    onUpdate: function (self) { escrever(self.progress); }
  });

  /* Os dois capítulos presos (abertura e materialidade) chegam por
     import dinâmico e não há ordem garantida entre eles. Quem chegar
     primeiro mede um documento que ainda não tem o espaçador do pin do
     outro, e calcula um start errado — foi o que pôs esta seção
     rodando em cima da abertura na primeira montagem.

     `sort()` recoloca os gatilhos na ordem do documento e `refresh()`
     remede todos. Quem montar por último conserta os dois. */
  if (ST.sort) { ST.sort(); }
  ST.refresh();

  return {
    st: st,
    descartar: function () {
      if (st) { st.kill(); }
      secao.classList.remove('tem-materia');
      passos.forEach(function (el) { el.classList.remove('is-ativo'); });
    }
  };
}
