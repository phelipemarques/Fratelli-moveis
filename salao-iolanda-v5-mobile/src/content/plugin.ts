import type { Plugin } from 'vite';
import { mapsLink, salon, telLink, whatsappLink, messages, type MessageKey } from '../config/salon';
import { blocks, diamond, jsonLd, waIcon } from './sections';

/**
 * Monta o index.html a partir dos dados do salão e cuida do SEO de publicação.
 *
 * Variáveis de ambiente no build:
 *   SITE_URL=https://dominio/   → canonical, og:url, og:image absoluta, url no JSON-LD e sitemap.xml
 *   PUBLICAR=1                  → libera a indexação (sem isso: noindex + robots.txt bloqueando)
 * A prévia é gerada sem nenhuma das duas.
 */
export function salonContent(): Plugin {
  // roda no Node (build); o projeto não depende de @types/node só por isso
  const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
  const siteUrl = env.SITE_URL ? new URL(env.SITE_URL).href : null;
  const publish = env.PUBLICAR === '1';
  return {
    name: 'salao-iolanda-content',
    transformIndexHtml(html) {
      let out = html
        .replace(/<!--@(\w+)-->/g, (m, name: string) => {
          if (name === 'jsonld') return jsonLd(siteUrl);
          if (name === 'diamond') return diamond();
          if (name === 'waicon') return waIcon;
          const fn = blocks[name];
          return fn ? fn() : m;
        })
        .replace(/%WA_(\w+)%/g, (m, key: string) => {
          const k = key.toLowerCase() as MessageKey;
          return k in messages ? whatsappLink(k) : m;
        })
        .replace(/%MAPS%/g, mapsLink().replace(/&/g, '&amp;'))
        .replace(/%TEL%/g, telLink())
        .replace(/%IG%/g, salon.instagram.url)
        .replace(/%PHONE%/g, salon.phone.display);
      // os links de WhatsApp levam & na query: escapar dentro de atributos
      out = out.replace(/href="(https:\/\/wa\.me\/[^"]+)"/g, (_m, u: string) => `href="${u.replace(/&(?!amp;)/g, '&amp;')}"`);

      const head: string[] = [];
      head.push(`<meta name="robots" content="${publish ? 'index, follow' : 'noindex, nofollow'}" />`);
      if (siteUrl) {
        head.push(`<link rel="canonical" href="${siteUrl}" />`);
        head.push(`<meta property="og:url" content="${siteUrl}" />`);
        head.push(`<meta property="og:image" content="${new URL('og.jpg', siteUrl).href}" />`);
        head.push('<meta property="og:image:width" content="1200" />', '<meta property="og:image:height" content="630" />');
        head.push(`<meta name="twitter:image" content="${new URL('og.jpg', siteUrl).href}" />`);
      }
      return out.replace('<!--@seo-->', head.join('\n    '));
    },
    generateBundle() {
      const robots = publish
        ? `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${new URL('sitemap.xml', siteUrl).href}\n` : ''}`
        : 'User-agent: *\nDisallow: /\n';
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots });
      if (siteUrl) {
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}</loc></url>\n</urlset>\n`,
        });
      }
    },
  };
}
