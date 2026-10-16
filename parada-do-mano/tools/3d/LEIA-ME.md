# Cena 3D — preparada, não ativa

**Situação em 16/10/2026:** o projeto não tem nenhum modelo 3D (`.glb`, `.gltf`, `.obj`,
`.fbx`, `.usdz`). Por isso o Three.js **não é carregado no site**: ele está instalado em
`node_modules/` (para desenvolvimento), mas não está em `assets/js/vendor/` nem no ZIP.

As fotos do restaurante não foram transformadas em "3D": uma foto plana não gira de verdade, e
fingir isso (girar um recorte, deformar uma imagem) ficaria falso ao lado de fotos reais.
No lugar, a V5 usa profundidade com GSAP: cortina e recuo de zoom na abertura, fotos que
deslizam dentro da moldura em velocidades diferentes, câmera que avança sobre a brasa no
churrasco, calor e brasas, tipografia em camadas.

## O modelo que seria necessário

O vídeo de referência usa um **produto embalado** (um pote) que gira entre as seções. O
equivalente aqui seria uma peça que represente a casa. Opções, da mais simples à mais cara:

| Modelo | Uso no site | Como obter |
|---|---|---|
| **Placa "BR-277 · km 594"** em 3D (a mesma do canto da abertura) | gira levemente com a rolagem na abertura e reaparece no contato | modelagem simples (1–2 h) a partir da arte em CSS; nenhuma foto envolvida |
| **Espeto com carnes** | atravessa o churrasco girando, na frente do título | modelagem + textura, ou fotogrametria de um espeto real (60–100 fotos em volta) |
| **Logo do Parada do Mano** extrudada | abertura | precisa da logo em vetor (SVG/AI/PDF) — pendência já listada |

Requisitos técnicos do arquivo:

- formato **glTF binário (`.glb`)**, com licença de uso em site;
- até **1,5 MB** (geometria com compressão Meshopt ou Draco, texturas 1024 px em KTX2/WebP);
- materiais PBR (metal/rugosidade), origem no centro da peça, escala em metros;
- uma versão de pré-visualização em imagem (`.webp`) para celular e para quem não tem WebGL.

## Como ligar quando o modelo existir

1. Salvar o modelo em `assets/models/` (ex.: `assets/models/placa-br277.glb`).
2. `python3 tools/vendor.py` copia hoje só o GSAP; acrescentar `three/build/three.module.min.js`
   e `three/examples/jsm/loaders/GLTFLoader.js` à lista `ARQUIVOS`.
3. Copiar `cena-3d.exemplo.js` para `assets/js/cena-3d.js` e ajustar caminho e câmera.
4. No HTML, um contêiner com o atributo que o script procura, por exemplo na abertura:
   `<div class="cena-3d" data-cena-3d="assets/models/placa-br277.glb" aria-hidden="true"></div>`.
5. Em `cinema.js`, depois do ScrollTrigger: se existir `[data-cena-3d]`, a tela for de
   computador e houver WebGL, importar o módulo sob demanda (`import('./cena-3d.js')`).

O exemplo já segue as regras da V5: só no computador, só com movimento permitido, carga sob
demanda quando a seção se aproxima, um único laço de desenho (o `gsap.ticker`), pausa fora da
tela e com a aba em segundo plano, DPR limitado a 1,5, e limpeza dos recursos ao sair.
