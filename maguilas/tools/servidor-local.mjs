// Uso: node tools/servidor-local.mjs . 8130   (na pasta maguilas/)
// Servidor estático que imita a Vercel para testes locais:
// ETag + 304, Cache-Control padrão "public, max-age=0, must-revalidate",
// compressão brotli/gzip para texto e os "headers" do vercel.json, se existir.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
const [root, port] = [path.resolve(process.argv[2]), Number(process.argv[3])];
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon' };
const compressible = /^(text\/|application\/(json|xml)|image\/svg)/;
let rules = [];
try {
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  rules = (cfg.headers || []).map(r => ({ re: new RegExp('^' + r.source.replace(/\(\.\*\)/g, '.*') + '$'), headers: r.headers }));
} catch {}
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    const nf = path.join(root, '404.html');
    res.writeHead(404, { 'content-type': types['.html'] });
    return res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : 'not found');
  }
  const body = fs.readFileSync(file);
  const etag = '"' + crypto.createHash('md5').update(body).digest('hex') + '"';
  const type = types[path.extname(file)] || 'application/octet-stream';
  const headers = { 'content-type': type, 'cache-control': 'public, max-age=0, must-revalidate', etag };
  for (const r of rules) if (r.re.test(p)) for (const h of r.headers) headers[h.key.toLowerCase()] = h.value;
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }
  let out = body;
  const ae = req.headers['accept-encoding'] || '';
  if (compressible.test(type)) {
    if (/\bbr\b/.test(ae)) { out = zlib.brotliCompressSync(body); headers['content-encoding'] = 'br'; }
    else if (/gzip/.test(ae)) { out = zlib.gzipSync(body); headers['content-encoding'] = 'gzip'; }
    headers['vary'] = 'Accept-Encoding';
  }
  headers['content-length'] = out.length;
  res.writeHead(200, headers); res.end(req.method === 'HEAD' ? undefined : out);
}).listen(port, () => console.log('serving', root, 'on', port));
