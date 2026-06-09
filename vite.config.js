import path from 'path';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const isDebug = mode === 'debug';

  return {
    root: '.',
    plugins: [vue(), viteSingleFile()],
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
    }
  };
});
