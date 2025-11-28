import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  server: {
    proxy: {
      '/events': { target: 'http://localhost:8176', changeOrigin: true },
      '/api': { target: 'http://localhost:8176', changeOrigin: true },
      '/cocreation': {
        target: 'http://localhost:8176',
        changeOrigin: true,
        ws: true,
      },
    },
    allowedHosts: ['a6904992be18.ngrok-free.app'],
  },
  define: {
    global: 'window',
  },
})
