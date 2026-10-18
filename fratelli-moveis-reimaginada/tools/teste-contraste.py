"""Le os pares de fotografias e devolve o contraste real de cada bloco."""
import json, sys
from PIL import Image

def canal(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def lum(rgb):
    r, g, b = [canal(v) for v in rgb[:3]]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contraste(a, b):
    la, lb = lum(a), lum(b)
    if la < lb: la, lb = lb, la
    return (la + 0.05) / (lb + 0.05)

def cor_css(txt):
    n = [float(x) for x in txt.replace('rgba', '').replace('rgb', '')
         .strip('() ').split(',')]
    return n[:3]

d = json.load(open(sys.argv[1]))
pares = d['pares']
print('%-11s %5s %6s  %s' % ('tela', 'transb', 'piorC', 'bloco mais fraco'))
reprov = []
for t in d['telas']:
    pior = (999, '', '')
    for am in t['amostras']:
        sem = Image.open('%s/%s-sem.png' % (pares, am['marca'])).convert('RGB')
        for b in am['blocos']:
            cx = sem.crop((b['x'], b['y'], b['x'] + b['w'], b['y'] + b['h']))
            px = list(cx.getdata())
            if not px:
                continue
            # fundo = mediana por luminancia, o pixel tipico atras da letra
            px.sort(key=lum)
            fundo = px[len(px) // 2]
            c = contraste(cor_css(b['cor']), fundo)
            exige = 3.0 if b['grande'] else 4.5
            if c < exige:
                reprov.append((t['tela'], am['marca'], b['cls'], round(c, 2), exige, b.get('txt','')))
            if c < pior[0]:
                pior = (c, b['cls'], am['marca'])
    print('%-11s %5d %6.2f  %s (%s)' % (t['tela'], t['transbordo'], pior[0], pior[1], pior[2]))

print()
if reprov:
    print('REPROVADOS: %d' % len(reprov))
    vistos = set()
    for tela, marca, cls, c, ex, txt in reprov:
        k = (tela, cls, txt)
        if k in vistos: continue
        vistos.add(k)
        print('  %-11s %-20s %.2f (exige %.1f) %-8s "%s"' % (tela, cls, c, ex, marca, txt))
else:
    print('nenhum bloco abaixo do minimo da WCAG AA')
