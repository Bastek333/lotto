import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://developers.lotto.pl',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api/open/v1'),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Accept', 'application/json')
            proxyReq.setHeader('secret', 'uoMovQFLDrUEI7jsq2t3yg4myNqNgsUI0Cj7UWdnT9I=')
          })
        }
      }
    }
  }
})
