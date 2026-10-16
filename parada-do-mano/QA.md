# Parada do Mano — QA da V3

16/10/2026. Tudo o que está marcado como executado foi executado nesta data; o que não foi,
está na seção 5. Comparação com a V2 e o porquê de cada mudança: `RELATORIO-V3.md`.

**Resultado: 125 de 125 verificações automáticas passaram**, tanto na pasta do projeto quanto
no pacote `parada-do-mano-v3-producao.zip` descompactado.

## 1. Ambiente

| Ferramenta | Versão | Uso |
|---|---|---|
| Chromium (headless) | 141, via Playwright 1.56.1 | `tools/qa-browser.mjs`, `tools/medir.mjs` |
| Lighthouse | 12.8.2 | 3 execuções mobile + 3 desktop; vale a mediana |
| axe-core | 4.14.0 | WCAG 2.0/2.1/2.2 A e AA + boas práticas, 390 e 1440 px |
| Servidor | `tools/servidor.mjs` | gzip, cache e Range, como numa hospedagem |

O Chromium do Playwright não decodifica H.264; nele o vídeo da abertura toca em WebM.

## 2. Verificações por tamanho de tela

Em **320×568, 360×800, 375×667, 390×844, 414×896, 430×932, 844×390 (paisagem), 768×1024,
1440×900 e 1920×1080**:

| Verificação | Resultado |
|---|---|
| Sem rolagem horizontal | OK em todos |
| Todas as imagens carregadas depois de rolar a página inteira | OK em todos |
| Console sem erros nem avisos; nenhuma requisição com falha | OK em todos |
| Nenhum conteúdo preso invisível depois da rolagem | OK em todos |
| Um único `h1` | OK |
| Foto da abertura na metade de cima da primeira tela | OK em todos |
| Botão "Explorar o cardápio" inteiro na primeira tela | OK em todos (320×568: 469–519 px; 844×390: 292–342 px) |

## 3. Interações

| Área | Verificação | Resultado |
|---|---|---|
| Menu do celular | abre com `aria-expanded="true"`, foco no primeiro link, resto da página `inert` | OK |
| | Tab não escapa do painel; Escape fecha e devolve o foco ao botão | OK |
| | link leva à seção e fecha o painel | OK |
| Cardápio | 10 categorias; só um painel visível por vez | OK |
| | clique, seta direita, Home, End, Enter, Espaço; Tab vai da aba ao painel | OK |
| | `aria-selected` e `tabindex` coerentes em todas as abas | OK |
| | troca de categoria não move a página (scrollY igual antes e depois) | OK |
| | altura da área igual nas 10 categorias (588 px em 390) | OK |
| | aba escolhida sempre visível na faixa (10 de 10) | OK |
| | botão "Próxima" | OK |
| | foto de cada categoria carrega quando ela é aberta | OK |
| | cada categoria abre sozinha por link (`#cat-...`) e tem WhatsApp com mensagem própria | 10 de 10 |
| | nenhum "ainda vão ser publicadas"; nenhum preço afirmado | OK |
| | "Visto nas fotos da casa" abre ao tocar | OK |
| Links | âncoras internas apontam para seções existentes | OK |
| | WhatsApp no formato `wa.me/5545998258916?text=` | 20 links, 13 mensagens |
| | rota e Instagram | 3 + 3 |
| Jornadas (390×844) | A — o que tem para almoçar → WhatsApp | 3 toques |
| | B — valor do espeto corrido → WhatsApp | 3 toques |
| | C — feijoada → WhatsApp | 3 toques |
| | D — rota até o restaurante | 1 toque, na primeira tela |
| Galeria | abre a foto ampliada, seta avança, Escape fecha e devolve o foco | OK |
| | no celular: faixa rola de lado sem rolar a página; ampliada cabe na tela; foco volta à foto | OK |
| Vídeo | toca no computador (1440×900) | OK |
| | pausa quando a abertura sai da tela | OK |
| | celular não baixa o vídeo | OK |
| Movimento reduzido | sem animação de entrada, brasas e faixa corrida; nada escondido | OK |
| Sem JavaScript | 10 categorias visíveis; nada escondido; todas as imagens com endereço e carregadas; barra de atalhos visível | OK |

## 4. Medições

| | Resultado |
|---|---|
| Lighthouse mobile | Performance **98**, Acessibilidade 100, Boas práticas 100, SEO 66 |
| Lighthouse desktop | Performance **100**, Acessibilidade 100, Boas práticas 100, SEO 66 |
| SEO 66 | única auditoria reprovada: `is-crawlable` — é o `noindex, nofollow` pedido para a prévia |
| LCP mobile / desktop | 2,10 s / 0,52 s (simulados, medianas) |
| CLS mobile / desktop | 0,001 / 0,008 |
| TBT mobile | mediana 0 ms (execuções: 142, 0, 0) |
| *Forced reflow* | nenhum nas 6 execuções |
| INP | **Não medido** (precisa de usuários reais) |
| axe-core | **0 violações** em 390 e 1440 px; `color-contrast` fica "a revisar" (texto sobre foto) |
| Bytes, 1ª visita 390 px | 268 KB em 14 requisições |
| Bytes, página inteira 390 px | 719 KB em 27 requisições |
| Bytes, 1ª visita 1440 px | 1.659 KB (vídeo WebM 1.284 KB) |
| Altura da página 390×844 · início do cardápio | 7.967 px · 1.723 px |

Também conferido: prévia em arquivo único abre sem servidor, com fotos sem JavaScript e
vídeo tocando em 1440 px; `tools/set-domain.py` numa cópia (URLs absolutas gravadas,
`noindex` mantido; com `--publicar`, liberado).

## 5. O que NÃO foi testado

- **Safari** (iPhone, Mac) e **Firefox**: não testados. Recursos usados com suporte amplo
  (`<dialog>`, `inert`, AVIF com WebP de reserva, `content-visibility` com recuo seguro), mas
  sem execução real.
- **Aparelhos reais** e redes reais: não testados. Lighthouse local usa rede e CPU simuladas.
- **Leitor de tela** (NVDA, VoiceOver, TalkBack): não testado; estrutura ARIA verificada por
  script e pelo axe.
- **H.264 no Chrome real**: o teste usa WebM; o MP4 foi gerado e conferido com ffprobe, não
  tocado num Chrome com H.264.
- **INP e Core Web Vitals de campo**: só depois de publicado.

## 6. Como repetir

```bash
node tools/servidor.mjs . 8130 &
NODE_PATH=$(npm root -g) node tools/qa-browser.mjs capturas/
NODE_PATH=$(npm root -g) node tools/medir.mjs http://127.0.0.1:8130/ v3 medidas/
```
