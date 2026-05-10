import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(async ({ command }) => {
  const plugins = [react()]

  // mkcert generates local TLS certs — only needed for dev, breaks CI/Vercel builds
  if (command === 'serve') {
    const mkcert = (await import('vite-plugin-mkcert')).default
    plugins.unshift(mkcert())
  }

  plugins.push(
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Garud Kavach Guard',
        short_name: 'GK Guard',
        description: 'Guard field app for clock-in, location tracking, and incident reporting',
        theme_color: '#1e293b',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/garud-kavach-server\.onrender\.com\/.*/ ,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache' }
          }
        ]
      }
    })
  )

  return {
    plugins,
    server: {
      port: 5174,
      host: true, // expose to LAN for mobile testing
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          on: {
            error(err, _req, _res) {
              if (!['ECONNRESET', 'ECONNREFUSED'].includes(err.code)) {
                console.error('[api proxy]', err.message)
              }
            }
          }
        },
        '/ws': {
          target: 'ws://localhost:8080',
          ws: true,
          changeOrigin: true,
          rewriteWsOrigin: true,
          on: {
            error(err, _req, _socket) {
              if (!['ECONNRESET', 'ECONNREFUSED'].includes(err.code)) {
                console.error('[ws proxy]', err.message)
              }
            }
          }
        }
      }
    }
  }
})
