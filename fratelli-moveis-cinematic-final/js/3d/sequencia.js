/* ============================================================
   Fratelli Móveis — sequência pré-renderizada (perfil C)

   O briefing pediu isto na seção 12: o aparelho sem WebGL deixava de
   ver a história e ficava só com uma fotografia parada.

   Os quadros saem do MESMO modelo Three.js que o perfil A roda — são
   capturas da timeline real, geradas por `tools/render-sequencia.js`.
   Não é outra animação: é a mesma, congelada em 16 posições.

   CUSTO MEDIDO: 16 quadros, 480 × 760, WebP q72 — **127 KB no
   total**, 8 KB por quadro. Menos que a maioria das fotografias da
   página. É por isso que isto cabe num aparelho fraco: ele não
   renderiza nada, só troca qual `<img>` está visível.

   Nenhum `src` é trocado em tempo de rolagem. As dezesseis imagens
   ficam no DOM e o que muda é a opacidade — trocar `src` num celular
   lento pisca, porque o navegador descarta e rebusca o decodificado.

   O contrato é o mesmo das outras cenas (`progresso`, `desmontar`,
   `retanguloNaTela`), então o `boot.js` dirige as três do mesmo jeito.
   ============================================================ */

export function criarSequencia(opcoes) {
  var palco = opcoes.palco;
  var indice = opcoes.indice;
  if (!palco || !indice || !indice.lista || !indice.lista.length) { return null; }

  var caixa = document.createElement('div');
  caixa.className = 'abertura__seq';
  caixa.setAttribute('aria-hidden', 'true');

  var quadros = indice.lista.map(function (q, i) {
    var img = document.createElement('img');
    img.src = q.arquivo;
    img.alt = '';
    img.decoding = 'async';
    /* O primeiro entra junto com a página; os outros só quando a
       seção se aproxima — é o navegador que decide, e `lazy` é o
       pedido certo num aparelho que já está no limite. */
    img.loading = i === 0 ? 'eager' : 'lazy';
    img.width = indice.largura;
    img.height = indice.altura;
    caixa.appendChild(img);
    return img;
  });

  palco.appendChild(caixa);
  var atual = -1;

  function mostrar(i) {
    if (i === atual) { return; }
    if (atual >= 0) { quadros[atual].classList.remove('is-ativo'); }
    quadros[i].classList.add('is-ativo');
    atual = i;
  }
  mostrar(0);

  return {
    progresso: function (p) {
      var n = quadros.length;
      var i = Math.round(Math.min(1, Math.max(0, p)) * (n - 1));
      mostrar(i);
    },

    /* O último quarto da sequência é a passagem para a fotografia,
       igual ao que a cena 3D faz. */
    foco: function () {
      var p = atual / (quadros.length - 1);
      return Math.min(1, Math.max(0, (p - 0.80) / 0.20));
    },

    /* O retângulo é o do próprio elemento: aqui não há projeção de
       câmera que possa falhar, então a medida é direta. */
    retanguloNaTela: function () {
      var r = caixa.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    },

    /* `descartar` e nao `desmontar`: é o nome que o `boot.js` chama
       ao desfazer a montagem. As outras cenas usam esse, e um contrato
       com dois nomes é um erro esperando a primeira troca de perfil. */
    descartar: function () {
      if (caixa.parentNode) { caixa.parentNode.removeChild(caixa); }
      quadros.length = 0;
    }
  };
}
