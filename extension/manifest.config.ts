import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: '動画より文字派！',
  version: '1.0.0',
  action: {
    default_popup: 'extension/index.html'
  },
  permissions: ['storage', 'activeTab'],
  host_permissions: ['https://www.youtube.com/*']
})
