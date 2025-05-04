import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
// @ts-expect-error 型解決を無視
import manifest from './extension/manifest.config.ts'
import path from 'path'

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    target: 'esnext',           // Bun + Viteで最新JSを出力
    outDir: 'dist',             // 拡張機能読み込み用ディレクトリ
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './shared')
    }
  }
})
