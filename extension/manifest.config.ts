import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: '動画より文字派！',
  version: '1.0.0',
  icons: {
    '128': 'extension/public/icon_128.png',
  },
  action: {
    default_popup: 'extension/index.html',
  },
  permissions: ['storage', 'activeTab'],
})
