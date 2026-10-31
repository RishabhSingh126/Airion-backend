import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.NODE_ENV === 'production' ? '/admin/' : './',
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
    port: Number(process.env.VITE_ADMIN_PORT) || 5175,
    strictPort: true,
    host: true,
    hmr: {
      port: Number(process.env.VITE_ADMIN_PORT) || 5175,
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
