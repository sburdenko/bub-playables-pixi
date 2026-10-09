import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ command }) => ({
  base: './',
  plugins: command === 'build' ? [viteSingleFile({ removeViteModuleLoader: true })] : [],
  build: {
    target: 'es2020',
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
  server: {
    host: true,
  },
}));
