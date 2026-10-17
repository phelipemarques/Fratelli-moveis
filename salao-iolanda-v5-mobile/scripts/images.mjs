// Gera as variantes responsivas das fotos: fotos-originais/*.{jpg,jpeg,png,webp}
// → public/fotos/<nome>-480.webp, -960.webp e -1440.webp (sem ampliar a original).
// uso: npm run images   (precisa do ffmpeg instalado)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const SRC = 'fotos-originais';
const OUT = 'public/fotos';
const WIDTHS = [480, 960, 1440];
if (!existsSync(SRC)) {
  console.log(`Nenhuma pasta ${SRC}/: coloque ali as fotos autorizadas e rode de novo.`);
  process.exit(0);
}
mkdirSync(OUT, { recursive: true });
const files = readdirSync(SRC).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
for (const f of files) {
  const name = basename(f, extname(f)).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  for (const w of WIDTHS) {
    // escala pela largura, sem ampliar, mantendo a proporção (rostos e cabelos não deformam)
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', join(SRC, f), '-vf', `scale='min(${w},iw)':-2`, '-c:v', 'libwebp', '-quality', '80', join(OUT, `${name}-${w}.webp`)]);
  }
  console.log(`${f} → fotos/${name}-{${WIDTHS.join(',')}}.webp`);
}
console.log(files.length ? 'ok' : `Nenhuma foto em ${SRC}/.`);
