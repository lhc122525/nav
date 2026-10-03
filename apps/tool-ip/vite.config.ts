import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import qiankun from 'vite-plugin-qiankun'

export default defineConfig({
  plugins: [
    vue(),
    // qiankun 无法执行 ES Module（Unexpected token 'export'），
    // 该插件把构建产物改写为经典脚本 + window['tool-ip'] 生命周期，开发模式同理
    qiankun('tool-ip', { useDevMode: true })
  ],
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
