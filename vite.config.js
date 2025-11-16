import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192x192.svg', 'pwa-512x512.svg', '蝴蝶结.svg', 'favicon.ico'],
      manifest: {
        name: '服装出入库管理系统',
        short_name: '服装管理',
        description: '服装店出入库管理系统 - 平板优化版本',
        theme_color: '#2196F3',
        background_color: '#2196F3',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 一年
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 一年
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fuzhuang-705a0-default-rtdb\.asia-southeast1\.firebasedatabase\.app\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-database-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 一天
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Firebase认证请求，总是走网络
            urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'firebase-auth-cache',
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Firebase API请求，总是走网络
            urlPattern: /^https:\/\/www\.googleapis\.com\/identitytoolkit\/.*\/verifyPassword/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'firebase-auth-verify-cache',
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // 所有Firebase相关请求，总是走网络
            urlPattern: /^https:\/\/(.*\.googleapis\.com|firebasestorage\.googleapis\.com)\/.*/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'firebase-all-requests-cache',
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Firebase令牌刷新请求，总是走网络
            urlPattern: /^https:\/\/securetoken\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'firebase-token-cache',
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 3000
  },
  build: {
    outDir: 'dist'
  }
})