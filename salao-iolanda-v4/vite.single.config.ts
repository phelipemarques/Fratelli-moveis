import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { salonContent } from './src/content/plugin';

/** imagens do fallback (public/posters) embutidas, para o arquivo único não depender de pastas */
function inlinePosters(): Plugin {
  return {
    name: 'inline-posters',
    transformIndexHtml(html) {
      return html.replace(/(posters|portfolio)\/([\w-]+)\.(webp|jpg)/g, (_m, dir: string, file: string, ext: string) => {
        const data = readFileSync(new URL(`./public/${dir}/${file}.${ext}`, import.meta.url)).toString('base64');
        return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${data}`;
      });
    },
  };
}

// Versão em arquivo único (HTML com JS, CSS, fontes e imagens embutidos) para visualizar
// sem servidor: npm run build:single → dist-single/index.html
export default defineConfig({
  base: './',
  plugins: [salonContent(), inlinePosters(), viteSingleFile()],
  build: {
    target: 'es2022',
    outDir: 'dist-single',
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 2000,
  },
});
