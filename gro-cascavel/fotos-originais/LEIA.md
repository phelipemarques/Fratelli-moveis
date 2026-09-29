# Fotos originais

Só **fotos reais da GRO**: equipe, estrutura, treinamentos, atendimento. Nada de
banco de imagens nem imagem gerada por IA representando a empresa.

| Nome do arquivo | Onde entra | O que fotografar |
|---|---|---|
| `hero` | Topo do site (tela cheia) | Equipe da GRO em treinamento ou avaliação em campo, horizontal, com espaço livre à esquerda. Mín. 2400 px de largura |
| `fachada` | Sobre, no painel "Onde estamos" | Fachada com o totem, luz da manhã. Mín. 1600 px |
| `medicina` | Soluções: Medicina do Trabalho | Consultório ou exame, sem rosto de paciente, sem ficha legível |
| `seguranca` | Soluções: Segurança do Trabalho | Técnico da GRO avaliando riscos numa empresa cliente (com autorização) |
| `treinamentos` | Soluções: Treinamentos | Curso de CIPA ou NR em andamento, prática com extintor |
| `assessoria` | Soluções: Assessoria e eSocial | Equipe da GRO atendendo, reunião |
| `empresas` | Para empresas | Equipe da GRO dentro de uma empresa cliente |

Depois rode, na pasta `gro-cascavel`:

```bash
python3 tools/importar-fotos.py
```

E insira a foto no ponto indicado pelo comentário no `index.html` (cada seção
tem um). Os originais não vão para o Git.
