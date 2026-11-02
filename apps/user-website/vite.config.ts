import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // 🚫 CRITICAL: Do NOT let Service Worker intercept /vendor or /admin
        // These are separate apps served by Vercel from dist/vendor/ and dist/admin/
        navigateFallbackDenylist: [/^\/vendor/, /^\/admin/, /^\/api/],
        // Only precache user-website assets (not vendor/admin)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,woff,woff2}'],
        globIgnores: ['vendor/**', 'admin/**'],
      },
      manifest: {
        name: 'Ease2event | Premium Event Planning',
        short_name: 'Ease2event',
        description: 'Discover the world\'s best venues and services for weddings, parties, and corporate events.',
        theme_color: '#ef4444',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../packages/shared'),
      '@ease2event/shared': path.resolve(__dirname, '../../packages/shared'),
      '@ease2event/ui': path.resolve(__dirname, '../../packages/ui'),
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
    port: Number(process.env.VITE_USER_PORT) || 5173,
    strictPort: true,
    host: true,
    hmr: {
      port: Number(process.env.VITE_USER_PORT) || 5173,
    },
    fs: {
      allow: ['../..'],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
