import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: '動画より文字派！',
  version: '1.0.0',
  action: {
    default_popup: 'extension/index.html',
    default_icon: {
      '32': 'icons/icon32.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png',
    }
  },
  icons: {
    '32': 'icons/icon32.png',
    '48': 'icons/icon48.png',
    '128': 'icons/icon128.png',
  },
  permissions: ['storage', 'activeTab'],
  host_permissions: ['https://www.youtube.com/*']
})
