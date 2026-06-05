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
      // Matches <include src="..." /> OR <include src="..."></include>
      return html.replace(/<include src="([^"]+)"\s*(?:\/>|><\/include>)/g, (match, filePath) => {
        // Resolve relative to the project root directory
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
      emptyOutDir: true,
      minify: isDebug ? false : 'esbuild',
      cssMinify: isDebug ? false : 'esbuild',
      // rollupOptions.input defaults to index.html at project root
      // Do not hardcode — allows alternate entry points (e.g., test-vue.html)
    }
  };
});
