import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
  }
})
