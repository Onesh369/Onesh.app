import { spawn, type ChildProcess } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const root = dirname(fileURLToPath(import.meta.url))

function oneshApi(): Plugin {
  let child: ChildProcess | undefined
  return {
    name: 'onesh-api',
    configureServer() {
      if (child || process.env.ONESH_NO_API) return
      child = spawn(process.execPath, ['--watch', join(root, 'server/index.mjs')], {
        stdio: 'inherit',
        env: {
          ...process.env,
          PORT: '8787',
          DATA_DIR: join(root, 'data'),
        },
      })
      child.on('exit', () => {
        child = undefined
      })
    },
  }
}

export default defineConfig({
  server: {
    host: true,
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
  plugins: [
    oneshApi(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'favicon-light.svg',
        'favicon-dark.svg',
        'favicon.ico',
        'apple-touch-icon-180x180.png',
      ],
      manifest: {
        name: 'Onesh',
        short_name: 'Onesh',
        description: 'Habits, daily plan, and a reading shelf. Sign in to sync across devices.',
        theme_color: '#f6f7f9',
        background_color: '#f6f7f9',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'en',
        categories: ['lifestyle', 'productivity'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
})
