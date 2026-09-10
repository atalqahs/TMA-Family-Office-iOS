import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages (and any other sub-path host) serves the app from
// "/<repo-name>/" instead of the domain root. Setting VITE_BASE_PATH at
// build time (e.g. `VITE_BASE_PATH=/TMA-Family-Office-iOS/ npm run build`)
// keeps every asset, the manifest, and the service worker scope correct
// under that sub-path; it defaults to "/" for local dev and root hosting.
const base = process.env.VITE_BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'TMA Family Office',
        short_name: 'TMA',
        description: 'TMA Family Office — experimental iPhone prototype',
        lang: 'ar',
        dir: 'rtl',
        // start_url/scope are left unset so vite-plugin-pwa derives them
        // from `base` above, instead of hardcoding the domain root.
        display: 'standalone',
        background_color: '#0b0c0f',
        theme_color: '#0b0c0f',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
