// Servidor estático local com compressão gzip e cache — imita o que a hospedagem
// (Vercel, Netlify) faz, para medir desempenho em condições próximas às de produção.
//
//   node tools/servidor.mjs [pasta] [porta]      (padrão: pasta atual, 8130)
import http from 'http';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const RAIZ = path.resolve(process.argv[2] || '.');
const PORTA = Number(process.argv[3] || 8130);
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon',
};
const COMPRIME = /^(text\/|application\/(json|xml)|image\/svg)/;

http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url.endsWith('/')) url += 'index.html';
  const arq = path.join(RAIZ, path.normalize(url));
  if (!arq.startsWith(RAIZ) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('404'); return;
  }
  const ext = path.extname(arq).toLowerCase();
  const tipo = TIPOS[ext] || 'application/octet-stream';
  const cab = { 'Content-Type': tipo };
  // HTML sempre revalida; o resto pode ficar em cache (os nomes mudam quando o conteúdo muda)
  cab['Cache-Control'] = ext === '.html' ? 'no-cache' : 'public, max-age=86400';
  const tam = fs.statSync(arq).size;

  // vídeo: suporte a Range, como qualquer hospedagem
  const range = req.headers.range;
  if (range && /^video\//.test(tipo)) {
    const [a, b] = range.replace('bytes=', '').split('-');
    const ini = a === '' ? Math.max(0, tam - Number(b)) : Number(a);
    const f = a === '' || b === '' || b === undefined ? tam - 1 : Math.min(Number(b), tam - 1);
    if (isNaN(ini) || isNaN(f) || ini > f || ini >= tam) {
      res.writeHead(416, { 'Content-Range': `bytes */${tam}` }); res.end(); return;
    }
    res.writeHead(206, { ...cab, 'Content-Range': `bytes ${ini}-${f}/${tam}`, 'Accept-Ranges': 'bytes', 'Content-Length': f - ini + 1 });
    fs.createReadStream(arq, { start: ini, end: f }).pipe(res);
    return;
  }
  if (COMPRIME.test(tipo) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    res.writeHead(200, { ...cab, 'Content-Encoding': 'gzip', 'Vary': 'Accept-Encoding' });
    fs.createReadStream(arq).pipe(zlib.createGzip({ level: 6 })).pipe(res);
    return;
  }
  res.writeHead(200, { ...cab, 'Content-Length': tam, 'Accept-Ranges': 'bytes' });
  fs.createReadStream(arq).pipe(res);
}).listen(PORTA, '127.0.0.1', () => console.log(`servindo ${RAIZ} em http://127.0.0.1:${PORTA}/`));
