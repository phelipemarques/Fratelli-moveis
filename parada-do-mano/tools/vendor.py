#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parada do Mano — copia as bibliotecas de node_modules para assets/js/vendor/.

O site é HTML, CSS e JavaScript sem etapa de build: o navegador carrega os
arquivos .min.js prontos que o próprio GSAP publica. Não há empacotador porque
não traria ganho real aqui (dois arquivos, já minificados, carregados sob demanda).

    npm install                 (dentro de parada-do-mano/)
    python3 tools/vendor.py

Three.js NÃO é copiado: o site não tem modelo 3D (ver tools/3d/LEIA-ME.md).
"""
import json
import os
import shutil

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO = os.path.join(RAIZ, 'assets', 'js', 'vendor')
ARQUIVOS = [('gsap', 'dist/gsap.min.js'), ('gsap', 'dist/ScrollTrigger.min.js')]


def main():
    os.makedirs(DESTINO, exist_ok=True)
    versoes = {}
    for pacote, rel in ARQUIVOS:
        origem = os.path.join(RAIZ, 'node_modules', pacote, rel)
        if not os.path.exists(origem):
            raise SystemExit('não achei %s — rode "npm install" dentro de parada-do-mano/' % origem)
        shutil.copyfile(origem, os.path.join(DESTINO, os.path.basename(rel)))
        info = json.load(open(os.path.join(RAIZ, 'node_modules', pacote, 'package.json'), encoding='utf-8'))
        versoes[pacote] = (info['version'], info.get('license', ''))
        print('%-22s %6.1f KB' % (os.path.basename(rel), os.path.getsize(origem) / 1024))
    with open(os.path.join(DESTINO, 'LICENCAS.txt'), 'w', encoding='utf-8') as f:
        for pacote, (versao, licenca) in versoes.items():
            f.write('%s %s — %s\n' % (pacote, versao, licenca))
        f.write('Arquivos copiados sem alteração de node_modules/ por tools/vendor.py.\n')


if __name__ == '__main__':
    main()
