import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8989,
    strictPort: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  base: '/tools-sub/ip/',
  build: {
    outDir: '../../web/public/tools-sub/ip',
    emptyOutDir: true
  }
})