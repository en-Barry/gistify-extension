import path from 'path';

import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import manifest from './extension/manifest.config.ts';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    target: 'esnext', // Bun + Viteで最新JSを出力
    outDir: 'dist', // 拡張機能読み込み用ディレクトリ
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
