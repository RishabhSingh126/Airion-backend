import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.NODE_ENV === 'production' ? '/vendor/' : './',
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
  },
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
    port: Number(process.env.VITE_VENDOR_PORT) || 5174,
    strictPort: true,
    host: true,
    hmr: {
      port: Number(process.env.VITE_VENDOR_PORT) || 5174,
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
      '/socket.io': {
        target: 'ws://127.0.0.1:3000',
        ws: true,
      },
    },
  },
})

