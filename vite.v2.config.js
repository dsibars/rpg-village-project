import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import vue from '@vitejs/plugin-vue';

// Simple custom plugin to inject HTML partials natively at build-time
function htmlPartials() {
  return {
    name: 'html-partials',
    enforce: 'pre',
    transformIndexHtml(html) {
      return html.replace(/<include src="([^"]+)"\s*(?:\/>|><\/include>)/g, (match, filePath) => {
        const absolutePath = path.resolve(process.cwd(), filePath);
        if (fs.existsSync(absolutePath)) {
          return fs.readFileSync(absolutePath, 'utf8');
        }
        return `<!-- Missing partial: ${filePath} -->`;
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const isDebug = mode === 'debug';

  return {
    root: '.',
    plugins: [htmlPartials(), vue(), viteSingleFile()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'ux')
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false, // Keep existing dist/index.html intact
      minify: isDebug ? false : 'esbuild',
      cssMinify: isDebug ? false : 'esbuild',
      rollupOptions: {
        input: path.resolve(__dirname, 'index_v2.html')
      }
    }
  };
});
