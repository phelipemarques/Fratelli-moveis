import { defineConfig } from 'vite';
import { salonContent } from './src/content/plugin';

export default defineConfig({
  base: './',
  plugins: [salonContent()],
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    // three.js sozinho tem ~140 kB gzip; é carregado sob demanda, depois do texto
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/gsap')) return 'gsap';
        },
      },
    },
  },
  server: { port: 5173, strictPort: true },
});
