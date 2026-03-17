import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  // OptimizaciÃ³n de dependencias para desarrollo mÃ¡s rÃ¡pido
  // Ref: https://vercel.com/blog/how-we-optimized-package-imports-in-next-js
  optimizeDeps: {
    include: [
      'lucide-react',
      'react-leaflet',
      'leaflet',
      '@tanstack/react-query',
      'zustand',
      'axios',
      'react-router-dom',
      'i18next',
      'react-i18next',
    ],
  },
  // ConfiguraciÃ³n de build para mejor code-splitting
  // Cada app (b2b, marketplace, alquiler) se carga via lazy import en main.tsx,
  // generando chunks separados automÃ¡ticamente. Manual chunks solo para vendor.
  build: {
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        if (warning.message?.includes('contains an annotation that Rollup cannot interpret')) {
          return;
        }

        defaultHandler(warning);
      },
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-state': ['zustand'],
          'vendor-ui': ['lucide-react'],
          'vendor-map': ['leaflet', 'react-leaflet'],
          'vendor-i18n': ['i18next', 'react-i18next'],
          'vendor-http': ['axios'],
          'vendor-signalr': ['@microsoft/signalr'],
          'vendor-stripe': ['@stripe/stripe-js'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'TracAuto',
        short_name: 'TracAuto',
        description: 'Plataforma de gestiÃ³n vehicular, alquiler y telemetrÃ­a',
        theme_color: '#2563eb',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            // SEGURIDAD: Solo cachear endpoints publicos de la API.
            // Cachear endpoints autenticados en el service worker expone
            // datos sensibles a cualquier script con acceso al cache storage.
            urlPattern: /\/api\/public\//i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-public-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            // Cache static assets with cache-first
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false // Disable SW in development
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
