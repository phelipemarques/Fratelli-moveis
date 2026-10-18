# Cinematic Final — relatório

Refinamento da versão `fratelli-moveis-3d/`, preservada intacta ao
lado. Não foi reconstrução: o que já funcionava não foi tocado.

O briefing nomeou seis problemas (§3). Este documento responde um a
um, com a medição de cada caso. Onde a medição não foi possível, está
escrito que não foi — e por quê.

---

## O que mudou, em uma linha cada

1. **A cena não tinha parede.** Agora tem, e o móvel está num lugar.
2. **O desvio lateral da câmera não tinha função em retrato** — e
   empurrava a peça para o canto da tela do celular. Some sozinho.
3. **A sequência do perfil C corrigia o enquadramento no lugar
   errado.** A correção foi para a cena, e passou a valer para o
   celular com WebGL também.
4. O cenário "**WebGL indisponível**" passou a ser testado.
5. A prévia de arquivo único passou a **funcionar sem WebGL** — e foi
   testada de `file://`, não declarada.
6. Os testes passaram a **exigir** a pasta de saída, depois de 7 MB de
   captura terem entrado no que vai para produção.

---

## 1. A cena não tinha parede

Era o defeito de fundo, e estava em todos os perfis ao mesmo tempo.

A cena tinha **piso e mais nada**. A borda iluminada do piso contra o
vazio escuro desenhava uma **linha de horizonte dura** atravessando o
quadro. Medida numa coluna sem o móvel e sem interface, em 40% da
linha do tempo:

| | degrau de luminância | onde |
| --- | --- | --- |
| 1440×900 **antes** | **42,2** | y = 236 (21,4 → 63,6) |
| 1440×900 **depois** | **10,6** | y = 616 (40,1 → 50,7) |
| 390×844 **antes** | **45,2** | y = 328 (63,8 → 109,0) |
| 390×844 **depois** | **35,7** | y = 510 (24,6 → 60,2) |

No desktop o degrau caiu **4×** e desceu 380 px — deixou de ser uma
régua no meio da composição e virou o canto piso/parede, que é uma
aresta de ambiente e deve mesmo aparecer. No celular o degrau continua
visível (35,7), e é o mesmo canto: o que mudou é que ele saiu do meio
do quadro (39% da altura) para debaixo da peça (60%), e acima dele
agora há parede em vez de preto chapado.

Uma peça que o próprio código descreve como *"marcenaria de parede, do
piso ao teto"* estava na frente de lugar nenhum. A parede entra no
plano das costas do módulo (`z = -P/2`), que é onde ela estaria numa
obra: o móvel não fica encostado nela, ele **é** ela.

**Tom escuro de propósito.** O véu da coluna de texto foi calibrado
contra fundo escuro, e reboco claro ganharia realismo às custas da
legibilidade do texto branco — que não é negociável. A varredura de
contraste foi refeita depois da parede: **5,41:1**, o mesmo número de
antes.

Comparações em `tools/ref/comparacao/` (`antes`/`depois`, 12% e 40%
da linha do tempo, em 1440×900 e 390×844).

---

## 2. O celular recebia um enquadramento feito para o desktop

`enq.desvio` afasta o alvo da câmera para a esquerda do módulo, para
que a peça não invada a coluna de texto do desktop. Em 40% da linha do
tempo esse afastamento é de **1,16 m** — 34% da largura de um módulo
de 3,36 m.

Em tela estreita essa coluna **não existe**: o capítulo recua o texto
logo no início (`texto-recuado` já é verdadeiro em 0% a 390×844, e
está no `teste-cena`). O desvio não protegia nada e só jogava a peça
para a direita.

Medido no mesmo instante da linha do tempo, antes e depois:

| 390×844 | centro da peça | largura ocupada |
| --- | --- | --- |
| 12% **antes** | 70,0% da tela | 31,3% |
| 12% **depois** | **50,0%** | **70,8%** |
| 40% **antes** | 65,9% da tela | 47,2% |
| 40% **depois** | **49,7%** | **77,9%** |

| 1440×900 | centro da peça | largura ocupada |
| --- | --- | --- |
| 12% antes / depois | 70,7% / 70,8% | 30,0% / 29,9% |
| 40% antes / depois | 65,4% / 65,4% | 45,4% / 45,4% |

**O desktop não mudou um pixel**, e isso é o ponto: a correção é
cirúrgica. `fatorLateral()` devolve 1 acima de 1,30 de proporção de
tela e 0 abaixo de 0,80, com transição linear entre os dois — então um
tablet em retrato (768×1024, proporção 0,75) é tratado como o telefone,
porque o que decide é haver espaço **lateral**, não haver largura.

Fica em `posicionarCamera()` e não na linha do tempo de propósito:
assim uma troca de orientação no meio do capítulo já é respeitada no
quadro seguinte, sem reconstruir nada.

---

## 3. A sequência do perfil C — e o remendo que escondia o defeito

O perfil C (sem WebGL, ou sem folga de núcleo e memória) recebe 16
quadros pré-renderizados da **mesma** linha de tempo que o perfil A
roda: 480 × 760, WebP q72, **134 KB no total**, ~8 KB por quadro.

O script que os gera (`tools/render-sequencia.js`) corrigia o
enquadramento na hora de fotografar: reduzia o `desvio` a 15% e subia
o preenchimento. Funcionava — e era remendo no lugar errado. **O
perfil B roda a cena ao vivo no telefone e não passa por esse
script**: carregava o defeito inteiro, como as capturas de antes
mostram.

Com a correção dentro de `opening.js`, o script não reenquadra mais
nada. Ele voltou a ser o que promete: o que o visitante de verdade
receberia, congelado.

`enq.congelado` continua, por outro motivo — sem ele o laço de render
pode reposicionar a câmera entre o `progresso()` e a foto. Foi assim
que uma varredura inteira de iluminação se perdeu numa fase anterior,
medindo o fundo em vez da peça.

---

## 4. O cenário "WebGL indisponível" passou a ser testado

Era o caso do §17 que esta fase mudou — de fotografia parada para
sequência — e o único que nenhum teste exercia.

WebGL sai pelo caminho que o `boot.js` consulta: `getContext`
devolvendo `null`. Verificado: perfil C, 16 quadros no DOM, 16
carregados, rolagem avançando **0 → 8 → 15** ao longo do curso do
ScrollTrigger, palco sem área vazia, nenhum erro de página.

A primeira execução acusou 4 falhas e **nenhuma era da página**: o
seletor media a caixa em vez dos quadros, `elementFromPoint` foi
chamado com a seção fora da tela, e a rolagem foi calculada pela
altura da seção — que está **pinada**, então o curso é o do
ScrollTrigger (900..2880), não os 900 px da caixa. As três correções
estão comentadas dentro do teste, com o que cada uma media de errado.

---

## 5. A prévia de arquivo único voltou a ser autossuficiente

`fratelli-moveis-cinematic-final-visualizacao.html` — 7,6 MB, abre com
dois cliques, sem servidor e sem as pastas ao lado.

De `file://` o navegador recusa **baixar módulo ES** e recusa
**`fetch`**. A primeira já estava resolvida (os arquivos de `js/3d/`
são achatados num módulo escrito na página). A segunda não: o índice
da sequência era buscado por `fetch`, e a sequência sumiria justamente
na cópia que alguém sem WebGL tem mais chance de receber.

Agora o índice vai embutido em `window.__fratelliSeq`, com os quadros
em *data URI*. O `boot.js` o prefere quando existe; no pacote de
publicação ele não existe, e o caminho continua sendo o arquivo
servido pelo site.

**Testado, não declarado:** 11 testes, 0 falhas, incluindo o caminho
sem WebGL (`16/16 em data:`, rolagem `0 -> 8 -> 15`). Ver
`TESTES-CINEMATIC.md`.

---

## 6. Sete megabytes de captura entraram no que vai para produção

Os testes gravavam em `${S}/...`. Sem `S` definido, isso virava a
pasta literal `undefined/` **dentro do site** — e 16 capturas, 7 MB,
entraram num commit do pacote de publicação.

Os três testes agora **falham na hora** se `S` não vier, com o motivo
escrito. Não é higiene: é que o erro era silencioso e o resultado ia
para o pacote.

---

## Peso, por perfil

| | perfil | baixado até `load` + 5 s |
| --- | --- | --- |
| desktop 1440×900 | A | 1524 KB |
| celular 390×844 | B | 1395 KB |
| celular 390×844 sem WebGL | C | **791 KB** |

O perfil C não baixa os 671 KB do Three.js; os 16 quadros custam
136 KB no lugar. É o que os `import()` dinâmicos sustentam — e a razão
de o pacote de publicação continuar com os arquivos separados, ao
contrário da prévia.

---

## O que NÃO foi feito, e está dito

- **Nada foi validado em GPU real.** Este ambiente roda WebGL por
  software. As comparações entre versões valem; o que um aparelho
  mostra, não. **Primeiro item antes de publicar.**
- **Nenhum número de FPS ou de Lighthouse** aparece neste documento,
  porque nenhum foi medido.
- **O espectro do grão continua mais pontudo que o da referência**
  (572× contra 125× em 3 ciclos). Ver `PENDENCIAS.md`.
- **O painel ripado chega a ~78–81% da amplitude da referência de
  perto, e ~50% no enquadramento aberto.** Causa medida: 16 px por
  ripa não bastam para preservar o contraste. Ver `PENDENCIAS.md`.
- **A fotografia de cozinha continua em 336 × 420**, porque o original
  disponível tem 368 × 420. Nada foi ampliado.
- **A procedência da fotografia de nogueira continua não confirmada**
  — bloqueio 🔴 em `PENDENCIAS.md`.
- **Nenhum endereço foi inventado.** `canonical`, `og:url` e
  `og:image` continuam comentados no `index.html`, o `sitemap.xml`
  continua com o marcador, e a página continua `noindex, nofollow`.
  A ordem para publicar está escrita no próprio `<head>`.
- **Nada foi publicado.** Nenhum deploy, nenhuma alteração em
  produção.

---

## O que foi entregue

```
fratelli-moveis-cinematic-final/                 o site
fratelli-moveis-cinematic-final-visualizacao.html  prévia de 1 arquivo
fratelli-moveis-cinematic-final-producao.zip       242 arquivos, 11,1 MB
```

A versão anterior (`fratelli-moveis-3d/`) ficou **intacta**.
