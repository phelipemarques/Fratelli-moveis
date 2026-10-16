# Parada do Mano — site

Site do **Parada do Mano Restaurante e Lanchonete**, BR-277, km 594, Cascavel/PR.

> **Status: prévia de aprovação.** Layout, animações, cardápio e contato funcionando.
> As 22 fotografias ainda são quadros provisórios marcados "FOTO REAL A INSERIR",
> e os dados de contato vieram das divulgações do restaurante e precisam ser
> confirmados. A página está com `noindex` e o `robots.txt` bloqueia buscadores.
> Ver [`PENDENCIAS.md`](PENDENCIAS.md) antes de publicar.

## Abrir

Sem servidor: dê dois cliques em **`parada-do-mano-visualizacao.html`** (tudo embutido num arquivo só).

Com servidor (o jeito certo de testar o site de publicação):

```bash
cd parada-do-mano
python3 -m http.server 8130
# abra http://127.0.0.1:8130
```

## Estrutura

```
index.html                     a página (HTML semântico, um único h1)
robots.txt                     bloqueia indexação enquanto for prévia
assets/css/style.css           tokens, base, componentes, seções, movimento
assets/js/main.js              menu, revelação na rolagem, cardápio, galeria (sem bibliotecas)
assets/fonts/                  Anton, Barlow, Barlow Condensed — SIL OFL 1.1 (licenças ao lado)
assets/images/                 imagens geradas pelo script (WebP em várias larguras)

tools/prepare-images.py        corta e otimiza as fotos; desenha os quadros provisórios
tools/source/                  onde entram as fotos originais do restaurante
tools/fotos-pendentes.txt      lista dos espaços que ainda não têm foto real
tools/build-preview.py         gera parada-do-mano-visualizacao.html
tools/make-zip.py              gera parada-do-mano-site.zip (só o que vai para o ar)
tools/qa-browser.mjs           bateria de testes no Chromium (8 tamanhos de tela + interações)
tools/fonts-ttf/               cópias TTF das fontes, usadas só pelo script de imagens

parada-do-mano-visualizacao.html   prévia em arquivo único
parada-do-mano-site.zip            pacote de produção
QA.md                          o que foi testado, como e o que não foi
PENDENCIAS.md                  o que falta confirmar com o restaurante
```

## Trocar as fotos

O HTML já aponta para os arquivos finais. Para colocar uma foto real:

1. Salve a original em `tools/source/` com o nome do espaço — por exemplo
   `tools/source/buffet-saladas.jpg`. A lista completa de nomes está em
   `tools/fotos-pendentes.txt` e no topo de `tools/prepare-images.py`.
2. Rode `python3 tools/prepare-images.py` (precisa de Pillow: `pip install pillow`).
3. Se o corte não ficou bom, ajuste o ponto de foco em `FOCO`, no mesmo script.
4. Revise o texto alternativo (`alt`) da imagem no `index.html` para descrever a foto de verdade.
5. Gere de novo a prévia e o ZIP: `python3 tools/build-preview.py && python3 tools/make-zip.py`.

A foto `hero` também vira a imagem de compartilhamento (`og-cover.jpg`).

## Atualizar o cardápio

Cada categoria é um `<section class="menu-panel">` no `index.html`. Para listar pratos,
copie o modelo que está no comentário logo acima da seção do cardápio para dentro do
`<ul class="menu-items">` da categoria. Assim que a lista tiver um item, o aviso
"sob consulta" daquela categoria some sozinho. **Preço só depois de confirmado.**

O preço do espeto corrido tem um lugar reservado, comentado, dentro do bloco `#espeto`.

## Trocar a marca

O cabeçalho e o rodapé usam o nome em texto (`.brand`) como marca provisória.
Quando a logo oficial chegar (SVG de preferência, ou PNG com fundo transparente),
ela entra no lugar do `<span class="brand-name">` — sem redesenhar a marca.

## Publicar

Só com autorização do restaurante. Antes:

1. Resolver os itens 🔴 de `PENDENCIAS.md`.
2. No `index.html`, trocar `noindex, nofollow` por `index, follow` e completar
   `og:image` com a URL absoluta do domínio.
3. No `robots.txt`, liberar a indexação.
4. Gerar o pacote (`python3 tools/make-zip.py`) e enviar o conteúdo da pasta
   `parada-do-mano/` do ZIP para qualquer hospedagem estática.

## Testar

```bash
python3 -m http.server 8130 --bind 127.0.0.1 &
NODE_PATH=$(npm root -g) node tools/qa-browser.mjs capturas/
```

Precisa do Playwright com Chromium. Resultado detalhado da última rodada em `QA.md`.
