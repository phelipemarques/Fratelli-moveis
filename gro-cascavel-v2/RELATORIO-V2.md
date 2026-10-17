# Relatório V2 — GRO Cascavel

Data: 17/10/2026. V1 = `gro-cascavel/` (intacta). V2 = `gro-cascavel-v2/`.

Todos os números abaixo foram medidos neste ambiente, com Chromium (Playwright)
e Lighthouse 13, servindo os arquivos de produção por HTTP com gzip (como faria
a hospedagem). Onde algo não pôde ser medido, está escrito **NÃO MEDIDO**.

## 1. Auditoria da V1 (o que foi preservado)

Funcionava e foi mantido: estrutura de 9 seções, textos, dados comerciais,
logotipo reconstruído, verde + lima, Barlow Condensed + Hanken Grotesk, SEO
(title, description, canonical, Open Graph, JSON-LD), CSP com hash, mapa só sob
demanda, acordeão de soluções com uma só marcação, menu móvel com foco preso e
Esc, movimento reduzido, zero rolagem lateral.

Problemas encontrados na V1:

| Problema | Onde | Efeito |
|---|---|---|
| Painel verde do hero só decorativo | Hero | No celular, 292 px de faixa sem função antes do conteúdo |
| Processo com 4 telas de rolagem | Empresas, desktop | 3.248 px de seção para 4 etapas curtas |
| Soluções exigiam rolar e tocar | Soluções | Para chegar a eSocial: 2 toques e 1 rolagem |
| Sem WhatsApp no header do celular | Header | Acesso só pelo CTA do hero ou pelo botão flutuante |
| Página 404 com classes antigas | 404.html | Botões sem estilo |
| Manifesto e contato longos no celular | Manifesto, Contato | 1.551 px só no contato (390 px) |

## 2. O que mudou na V2

| Área | V1 | V2 |
|---|---|---|
| Conceito | Curva lima como assinatura | Curva mantida + **as quatro folhas do símbolo = as quatro soluções**, usado no hero, no palco de Soluções e nos ícones do acordeão |
| Hero (desktop) | Painel verde com curva e endereço | Painel com símbolo grande, eixos técnicos e **atalho para as 4 soluções** |
| Hero (celular) | Painel 4:3 decorativo abaixo dos CTAs | Faixa verde compacta com os 4 atalhos, já visível na primeira tela (390 × 844) |
| Abertura | Título por linha e curva | Painel se revela, eixos se desenham, as 4 folhas se encaixam, título por linha, traço lima sob "GRO", texto, CTAs e atalhos (CSS, começa na primeira pintura) |
| Soluções (desktop) | Lista + texto + bloco com número | Lista com barra ativa + **palco verde** com malha técnica, folha da solução acesa, número que rola e troca coordenada (GSAP) |
| Soluções (celular) | Acordeão claro | Acordeão com item aberto em cartão verde; o cabeçalho tocado **não salta** quando o item de cima fecha |
| Empresas | Seção verde, processo com trilho fixo por 4 telas | Seção clara, título em 3 linhas, benefícios numerados, **processo horizontal**: o símbolo percorre a linha técnica, fixo por só ~0,9 tela |
| Processo (celular) | Lista com bolinhas | Linha do tempo vertical; o símbolo desce pela linha conforme a leitura, sem fixar nada |
| Manifesto | Título + bloco verde | Seção verde inteira, título gigante; as palavras acendem com a rolagem e uma linha lima se desenha |
| Sobre | 539 sobre linhas | Placa verde com malha e o 539 subindo por máscara + ficha (atendimento, onde atende, responsável técnico, Instagram) |
| Temas | Lista simples | Lista por assunto (Gestão de riscos, Comissão interna, Documentação), hover com preenchimento verde, aviso claro de que os links abrem o Instagram |
| Contato | CTA, canais, endereço, mapa | Mensagem → WhatsApp → telefone → e-mail → endereço → rota → mapa sob demanda, com ícones; curva lima desenhada pela rolagem |
| Header | Fixo, some ao descer | + indicador que desliza até a seção atual, header fica verde sobre seções verdes, **ícone de WhatsApp no celular** |
| Menu móvel | Lista no topo | Links na metade de baixo (alcance do polegar), numerados, abertura por cortina |
| Botão flutuante | Após o hero | Após o hero; some quando o contato está na tela e, no celular, sobre o acordeão (que já tem botões próprios) |
| WhatsApp | 5 mensagens | 6 mensagens por contexto, todas com "para minha empresa", codificadas |
| 404 | Quebrada | Refeita no sistema visual |

Nada novo foi inventado: nenhum serviço, número, cliente, depoimento,
certificação ou prazo legal foi acrescentado. A única informação reorganizada é
"Onde atende", tirada do próprio texto da seção Sobre.

## 3. Movimento

| Camada | Tecnologia | Onde |
|---|---|---|
| Abertura do hero | CSS (transform, opacity, stroke-dashoffset) | Todas as telas |
| Entradas por seção | IntersectionObserver + CSS | Todas as telas |
| Processo fixo, troca de soluções, enquadramento do hero, manifesto, curva do contato | GSAP 3.15 + ScrollTrigger (locais) | Desktop ≥ 1024 px |
| Processo, manifesto, curva do contato | Cenas próprias (um listener de rolagem com rAF) | Celular e tablet |

Por que o GSAP só no desktop: na primeira medição, com GSAP carregado em todas
as telas, o Lighthouse do celular caiu para **87** (TBT 480 ms, CPU 4× mais
lenta). Com o GSAP só no desktop e as cenas próprias no celular, voltou a
**100** (TBT 0 ms). O resultado visual no celular é o mesmo, sem fixar seções.

Three.js não foi usado: não há modelo 3D nem material que justifique o custo.

Tokens de movimento: durações 120 / 200 / 360 / 720 / 1100 ms; curvas
`cubic-bezier(.16,1,.3,1)` (entrada), `(.65,0,.35,1)` (troca), `(.7,0,.84,0)`
(saída); distâncias 8 / 16 / 40 px; intervalo 70 ms. Estão no `:root` do CSS e
no objeto `M` do `main.js`.

## 4. Indicadores V1 × V2

| Indicador | V1 | V2 |
|---|---|---|
| Altura total, 390 × 844 | 9.182 px | **7.738 px** (−16%) |
| Altura total, 320 × 568 | 9.693 px | **8.108 px** (−16%) |
| Altura total, 1440 × 900 | 9.325 px | **7.606 px** (−18%, inclui ~810 px do processo fixo) |
| Seção Empresas, 390 | 1.956 px | **1.442 px** |
| Seção Empresas, 1440 | 3.248 px | **1.984 px** (inclui o tempo fixo) |
| Início de Soluções, 390 | 1.333 px | **1.081 px** |
| Seção Contato, 390 | 1.551 px | **1.066 px** |
| HTML de produção (bruto / gzip) | 27,7 KB / 6,8 KB | 35,1 KB / 8,2 KB |
| Dados transferidos, celular 390 (gzip, cache vazio) | 98,7 KB em 6 req. | **107,8 KB** em 6 req. |
| Dados transferidos, desktop 1440 | 98,7 KB em 6 req. | 154,5 KB em 8 req. (+46 KB de GSAP) |
| Erros de console (12 larguras) | 0 | 0 |
| Rolagem lateral (12 larguras, de 320 a 1920 e deitado) | 0 | 0 |
| LCP celular (Lighthouse) | 1,4 s | 1,4 s |
| LCP desktop (Lighthouse) | 0,4 s | 0,4 s |
| CLS | 0 | 0 |
| TBT celular | 0 ms | 10 ms |
| Lighthouse celular (desempenho / acess. / boas práticas / SEO) | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| Lighthouse desktop | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| INP (dados reais, p75) | NÃO MEDIDO (site não publicado) | NÃO MEDIDO |
| Menu móvel (abre, foco, Esc, devolve foco, fecha ao navegar) | OK | OK |
| Soluções desktop (troca, sempre uma aberta, teclado) | OK | OK |
| Soluções celular (abre, fecha, um por vez, teclado) | OK | OK |
| WhatsApp (11 links, número e mensagem codificada) | OK | OK |
| Telefone, e-mail, Instagram, rota | OK | OK |
| Mapa sob demanda (não carrega na entrada, sandbox, fecha e devolve foco) | OK | OK |
| Movimento reduzido: nada escondido | OK | OK |
| Sem JavaScript: nada escondido | OK | OK |

O ganho de altura veio de cortar espaço sem função (faixa decorativa do hero,
trilho de 4 telas, espaçamentos do contato), não de tirar conteúdo: todos os
textos da V1 continuam na V2.

## 5. Jornadas de conversão (simuladas no navegador, sem usuários reais)

Toques e rolagens até o botão de destino ficar visível na tela, partindo do
topo da página.

| Jornada | V1 celular | V2 celular | V1 desktop | V2 desktop |
|---|---|---|---|---|
| A. Empresário quer Medicina do Trabalho | 1 toque | **1 toque** | 2 toques + 1 rolagem | **1 clique** |
| B. RH quer eSocial | 2 toques + 1 rolagem | **1 toque** | 2 toques + 1 rolagem | **1 clique** |
| C. SST quer treinamento | 2 toques + 1 rolagem | **1 toque** | 2 toques | **1 clique** |
| D. Onde fica / como chegar | 2 toques + 1 rolagem | **2 toques** | 1 clique | 1 clique |
| E. Só quer o WhatsApp (celular) | 0 (CTA do hero) | 0 (CTA do hero e ícone fixo no header) | 0 | 0 |

Dificuldades que restam: na jornada D, o endereço também aparece logo abaixo do
hero (faixa de confiança), mas o link de rota fica em Sobre e em Contato.

## 6. Acessibilidade (WCAG 2.2 AA, verificado)

- Contraste: Lighthouse 100. As palavras do manifesto começam com opacidade
  0,42 (não menos), para manter 3:1 em texto grande mesmo antes de acenderem.
- Um H1; H2 por seção; H3/H4 em ordem.
- Foco visível em verde ou lima conforme o fundo; skip link; menu com foco
  preso, Esc e devolução de foco; acordeão com `aria-expanded` e
  `aria-controls`; atalhos do hero levam o foco ao botão da solução.
- Alvos de toque ≥ 44 px (header, acordeão, temas, links de texto).
- Links de texto têm sublinhado, não dependem só da cor.
- `prefers-reduced-motion`: sem animação, sem seção fixa, processo completo.
- Sem JavaScript: soluções abertas em lista, processo completo, nada oculto.
- NÃO MEDIDO com leitor de tela real (NVDA/VoiceOver); só a árvore de
  acessibilidade e os atributos ARIA foram conferidos.

## 7. SEO local e segurança

- Mantidos: title, description, canonical, Open Graph (a imagem existe em
  `assets/images/og-gro-cascavel.jpg`), JSON-LD `MedicalBusiness` (acrescentados
  os dois telefones como `contactPoint`), robots, sitemap (data atualizada).
- A visualização em arquivo único tem `noindex, nofollow`. Nada foi publicado.
- CSP sem `unsafe-inline`; o GSAP é carregado do próprio domínio
  (`script-src 'self'`). Nenhum `innerHTML`, `eval` ou estilo inline no HTML;
  20 de 20 links externos com `noopener noreferrer`; iframe do mapa com
  `sandbox`; IDs únicos; referências ARIA válidas.
- Domínio `www.grocascavel.com.br`: **não confirmado** (ver PENDENCIAS).

## 8. Comparação visual

`docs/comparacao/`: 40 imagens (320, 390, 768, 1440 e 1920 px × hero, soluções,
empresas, manifesto, sobre, conteúdos, contato, rodapé), V1 à esquerda e V2 à
direita, mais a página inteira em 390 e 1440. Gravações em
`docs/animacoes-desktop.mp4` e `docs/animacoes-celular.mp4`.

Nenhuma mudança foi revertida por piorar a experiência. Ajustes feitos durante
a comparação: título do hero voltou a 2 linhas no desktop, título de Empresas
de 5 para 3 linhas, palco de soluções que não aparecia (o observador não vê
elementos recortados), item ativo que ficava claro com o mouse em cima, texto
claro aparecendo sobre branco durante a revelação do palco.

## 9. Não verificado

- Safari e Firefox (só Chromium neste ambiente).
- Aparelhos reais; os testes de celular são em viewport emulado.
- O mapa do Google não carrega neste ambiente (rede bloqueada); foi conferido
  que o iframe é criado com o endereço certo.
- INP de campo e Core Web Vitals reais (dependem do site publicado).
