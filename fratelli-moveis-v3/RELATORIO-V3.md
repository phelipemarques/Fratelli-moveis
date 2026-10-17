# Fratelli Móveis — Relatório da V3

V2 preservada intacta em `fratelli-moveis-v2/`. Nada foi publicado.

## Os dois bloqueios, e como foram vencidos

O site é todo self-hosted e o proxy deste ambiente **bloqueia CDNs**
(jsdelivr devolveu 403). Sem Three.js, o briefing seria inexecutável.

`registry.npmjs.org` está na lista de bypass do proxy. Baixei o tarball
oficial direto do registry: **three r169, MIT**, 671 KB minificado, com a
licença preservada em `js/3d/THREE-LICENSE.txt`.

Segundo bloqueio: este Chromium headless tem **WebGL 2.0 por SwiftShader**
(renderização por software). Isso permitiu construir e testar a cena de
verdade e capturar os quadros renderizados. **Não permite medir FPS** —
software não diz nada sobre GPU real.

## Como a porta gira

Cada porta vive num `THREE.Group` cujo centro está na **borda externa do
vão**, não no centro da porta. A malha é deslocada meia largura para
dentro desse grupo:

```js
var pivo = new THREE.Group();
pivo.position.set(sinal * (L / 2 - E), 0, zPorta);   // na borda
var folha = painel(larguraPorta, A - 2*E, E, MAT.porta,
                   -sinal * larguraPorta / 2, A / 2, 0);  // meia largura para dentro
pivo.add(folha);
```

Girar `pivo.rotation.y` descreve um arco em torno da borda — é o que uma
dobradiça faz. Girar a malha diretamente a faria rodar em torno do próprio
centro e atravessar a lateral do móvel.

## Como a câmera é animada

Em **dois níveis separados, de propósito**, para que as duas fontes de
movimento nunca disputem a mesma propriedade:

- a **timeline** move `camera.position` e o alvo `mira`;
- o **ponteiro** move o `rig`, que é o *pai* da câmera.

A amplitude do ponteiro é 0,085 e **encolhe** conforme a câmera entra no
detalhe (`1 - foco * 0.85`), senão o tremor apareceria no close.

## Como a timeline responde à rolagem

Uma única `gsap.timeline({ paused: true })`. O ScrollTrigger **não
dispara animações** — ele só escreve o progresso:

```js
onUpdate: function (self) { cena.progresso(self.progress); }
```

Por isso a sequência é **reversível quadro a quadro**. Rolar para cima
desfaz a abertura. Medido: progresso 0 → 0,25 → 0,5 → 0,75 → 1 acompanha
a rolagem exatamente.

Cinco atos, em quatro segundos de timeline:

| ato | o que acontece |
|---|---|
| 01 material | câmera acomoda, módulo em três quartos |
| 02 descoberta | câmera vai à lateral, portas começam a girar |
| 03 interior | portas terminam, **a luz interna acende junto** |
| 04 transformação | câmera entra no detalhe, `foco` 0→1 |
| 05 fotografia | a fotografia real toma a tela |

A luz **participa** da abertura: `dentroA/B.intensity` 0→2,5 e
`emissiveIntensity` das fitas 0→1,25 estão no mesmo ponto da timeline que
a rotação dos pivôs.

## Como a cena se conecta ao DOM

Não há fade para preto. O mesmo progresso que move a câmera escreve uma
variável CSS:

```js
var p = (self.progress - 0.78) / 0.22;
foto.style.setProperty('--passagem', clamp(p));
```

E o CSS revela a fotografia com uma máscara que sobe:

```css
clip-path: inset(calc((1 - var(--passagem)) * 100%) 0 0 0);
```

Reversível, porque é escrita do progresso e não de um gatilho. A
continuidade é honesta: o módulo 3D é um closet, a fotografia é o closet
real do portfólio.

## Como o WebGL é evitado

Três perfis, decididos por **capacidade**, não por largura:

- **A** — contexto WebGL real criado e descartado, ≥4 núcleos, ≥4 GB,
  ponteiro fino, sem `Save-Data`: cena completa.
- **B** — toque, tela estreita, poucos núcleos ou `Save-Data`: fotografia.
- **C** — sem WebGL, sem GSAP ou movimento reduzido: fotografia.

Nos perfis B e C o **Three.js nunca entra na rede** — é `import()`
dinâmico dentro do ramo A. Medido: 390×844 com toque → perfil B, 0 bytes
de Three.js.

## Como a renderização desnecessária é evitada

**Não existe loop permanente.** A cena só desenha quando algo mudou:

- `IntersectionObserver` com margem de 120px: fora da tela, nada desenha;
- `visibilitychange`: aba escondida para o trabalho;
- um sinalizador `precisa` que só liga em progresso, ponteiro ou resize;
- `webglcontextlost` tratado: desmonta e mostra a fotografia.

Materiais e a geometria base (`BoxGeometry` 1×1×1, escalada por peça) são
**compartilhados** por todas as peças. `descartar()` libera geometrias,
materiais, renderer, observadores e ouvintes.

## O que NÃO foi feito

- **A cena não está dentro do Hero.** É um capítulo próprio logo depois.
  O hero foi aprovado contra uma referência há duas rodadas; sobrepor a
  cena nele desfaria aquele trabalho. Posso mover, se você preferir.
- **Sem textura de madeira.** Não há arquivo de textura licenciado no
  projeto. A madeira é cor + rugosidade + espessura real de painel. Com
  um mapa de textura autorizado, melhora bastante.
- **Cena de materialidade (§14) e portfólio espacial (§11) não feitos.**
  Ficaram fora desta rodada.
- **Perfil B não tem sequência 2.5D própria** — recebe a fotografia
  estática. É honesto, mas é menos do que o §20 pede.
- **FPS não medido.** SwiftShader é software. Precisa de máquina com GPU.
