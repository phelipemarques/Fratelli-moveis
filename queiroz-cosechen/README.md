# Vitor Queiroz Cosechen — site profissional

Prévia do site de Vitor Queiroz Cosechen, advogado do servidor público e de
sindicatos. A identidade visual vem do perfil
[@vitorqcosechen.adv](https://www.instagram.com/vitorqcosechen.adv/), a partir
do vídeo de referência enviado em 13/10/2026.

> **Status: prévia, não publicar ainda.** Bloqueiam a publicação: inscrição na
> OAB, revisão jurídica e aprovação dos textos, checklist de publicidade,
> domínio e conferência dos links. Ver [`PENDENCIAS.md`](PENDENCIAS.md).

Esta pasta é independente do site da Fratelli Móveis que está na raiz do
repositório: não compartilha arquivos com ele, e o pacote da Fratelli
(`tools/make-zip.py`) não inclui esta pasta. O ideal é mover a pasta para um
repositório próprio antes de publicar.

## Como rodar

Site estático: HTML, CSS e JavaScript, sem etapa de build e sem nenhuma
requisição externa para carregar a página (a fonte está dentro do projeto).

```bash
cd queiroz-cosechen
python3 -m http.server 8130
# abra http://127.0.0.1:8130
```

## Estrutura

```
index.html                 a página inteira
assets/css/main.css        estilos, em blocos: fontes, tokens, base, layout,
                           componentes, seções, movimento, responsivo
assets/js/main.js          menu mobile, trilho de leitura, destaques, formulário
assets/fonts/              Manrope variável (latin + latin-ext) e a licença OFL
assets/images/favicon.svg  ícone da aba (proposta, ver pendências)
assets/images/og-cover.jpg imagem de compartilhamento, 1200×630
tools/og-cover.html        fonte da imagem de compartilhamento
tools/build-single-file.py gera a versão em arquivo único (prévia, noindex)
tools/build-production.py  gera dist/ para publicar (index, follow, canonical…)
queiroz-cosechen-visualizacao.html  o site inteiro em um arquivo só (gerado)
_headers                   cabeçalhos HTTP (segurança e cache) para Netlify / Cloudflare Pages
AUDITORIA.md               problemas encontrados, por categoria, e o que foi feito
QA.md                      o que foi testado e como
PENDENCIAS.md              o que falta pedir ao cliente
```

## Como editar

**Tokens.** Todos no topo de `assets/css/main.css`, no bloco `TOKENS`:
cor (`--bg`, `--bg-deep`, `--surface`, `--text`, `--muted`, `--subtle`,
`--border`, `--accent`…), tipografia (`--fs-*`), espaço (`--s-*`,
`--section-space`, `--container`), forma (`--radius`, `--shadow`) e movimento
(`--ease`, `--t-*`). As cores da marca foram medidas nos quadros do vídeo:

| Token            | Valor     | Origem                                   |
|------------------|-----------|------------------------------------------|
| `--bg`           | `#1c1c1c` | fundo dos carrosséis                     |
| `--accent`       | `#2d0cd5` | bloco de destaque atrás das palavras     |
| `--accent-field` | `#3415d8` | fundo dos carrosséis azuis (PAD)         |
| `--accent-soft`  | `#b6abff` | violeta legível em texto pequeno (8:1)   |

**Tipografia.** Uma família só (Manrope). Não há fonte serifada de propósito:
os carrosséis do perfil são 100% sem serifa, e o tom editorial vem do contraste
de pesos (800 nos títulos, 350 nos textos de apoio).

**Destaque violeta.** Qualquer trecho dentro de
`<mark class="hl" data-hl>…</mark>` vira o bloco de destaque e é “passado”
como marca-texto quando entra na tela. Sem `data-hl` (e com `hl--static`), o
bloco aparece pronto. `hl--ink` troca o violeta por preto, para usar sobre o
campo violeta.

**Publicações em destaque.** Cada uma é um `<article class="post …">` em
`#conteudos`. Para trocar uma publicação, troque título, resumo e o `href`
do link. Os textos são resumos do que está no próprio post; não acrescente
interpretação jurídica que não esteja na publicação.

**WhatsApp.** O número aparece em quatro links no `index.html` e na constante
`WHATSAPP` no início de `assets/js/main.js`. Se mudar, mude nos dois.

**Formulário.** Não envia nada para servidor. Monta o texto e abre
`wa.me/<número>?text=…` em nova aba; a pessoa revisa e envia pelo próprio
WhatsApp. Por isso o site não guarda dado pessoal nenhum.

## Versão em arquivo único

`queiroz-cosechen-visualizacao.html` traz CSS, JavaScript, fontes e ícone
dentro do próprio arquivo: abre com dois cliques, sem servidor, e pode ser
mandado para aprovação. Depois de editar o site, gere de novo:

```bash
python3 tools/build-single-file.py
```

## Imagem de compartilhamento

`assets/images/og-cover.jpg` é uma captura de `tools/og-cover.html` em
1200×630. Para refazer, sirva a pasta e capture a página nesse tamanho
(qualquer navegador headless, ou a ferramenta de captura do Chrome).

## Antes de publicar

1. Resolver os itens 🔴 de `PENDENCIAS.md`.
2. Gerar o pacote de produção com o domínio definitivo:

   ```bash
   python3 tools/build-production.py https://www.dominio-definitivo.com.br
   ```

   O script cria `dist/` com `index, follow`, `canonical`, `og:url`, URLs
   absolutas de imagem, `url` nos dados estruturados, `robots.txt` e
   `sitemap.xml`. **Ele se recusa a rodar** enquanto houver pendência visível na
   página (como `[nº e seccional a confirmar]`) ou sem domínio informado.
3. Publicar o conteúdo de `dist/`. O `index.html` da raiz continua `noindex`,
   como prévia; o arquivo único também é só para aprovação.
