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
      '/events': { target: 'http://127.0.0.1:8176', changeOrigin: true },
      '/api': { target: 'http://127.0.0.1:8176', changeOrigin: true },
      '/cocreation': {
        target: 'http://127.0.0.1:8176',
        changeOrigin: true,
        ws: true,
      },
    }
  },
  define: {
    global: 'window',
  },
})
