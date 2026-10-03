import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8979,
    strictPort: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  base: '/tools-sub/ip/',
  build: {
    // 输出到 apps/web/public，Nitro 构建时会随 Nuxt 一并打进生产包（nav/public）
    outDir: '../web/public/tools-sub/ip',
    emptyOutDir: true
  }
})