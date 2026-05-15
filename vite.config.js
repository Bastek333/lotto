import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Backend API endpoints (local Node.js server on port 3001)
      '/api/save-draws': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/api/draws-status': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/api/backups': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/api/health': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      // Lotto.pl API proxy
      '/api': {
        target: 'https://developers.lotto.pl',
        changeOrigin: true,
        rewrite: (path) => {
          // Don't rewrite backend endpoints
          if (path.match(/\/(save-draws|draws-status|backups|health)/)) {
            return path
          }
          return path.replace(/^\/api/, '/api/open/v1')
        },
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Accept', 'application/json')
            // Only add secret header for Lotto.pl API calls
            if (!req.url.match(/\/(save-draws|draws-status|backups|health)/)) {
              proxyReq.setHeader('secret', 'uoMovQFLDrUEI7jsq2t3yg4myNqNgsUI0Cj7UWdnT9I=')
            }
          })
        }
      }
    }
  }
})
