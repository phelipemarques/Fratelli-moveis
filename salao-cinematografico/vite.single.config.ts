import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Versão em arquivo único (HTML com JS, CSS e fontes embutidos) para visualizar
// sem servidor: npm run build:single → dist-single/index.html
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: {
    target: 'es2022',
    outDir: 'dist-single',
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 2000,
  },
});
