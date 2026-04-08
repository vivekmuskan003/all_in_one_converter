import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // In dev, proxy /api to the local backend
        // In prod, VITE_API_URL is set so the proxy is not used
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        }
      }
    }
  }
})
