import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const dayjsEsmDir = dirname(require.resolve('dayjs/esm/index.js'))
const normalizePath = (p: string) => p.replace(/\\/g, '/')

export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  devServer: { host: '127.0.0.1', port: 8998 },
  modules: ['@element-plus/nuxt', '@nuxt/eslint'],
  css: ['~/assets/styles/main.css'],
  vite: {
    resolve: {
      alias: [
        { find: /^dayjs$/, replacement: normalizePath(join(dayjsEsmDir, 'index.js')) },
        {
          find: /^dayjs\/plugin\/(.+)\.js$/,
          replacement: normalizePath(join(dayjsEsmDir, 'plugin', '$1', 'index.js')),
        },
        {
          find: /^dayjs\/locale\/(.+)\.js$/,
          replacement: normalizePath(join(dayjsEsmDir, 'locale', '$1.js')),
        },
      ],
    }
  },
  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'robots', content: 'index,follow' }
      ]
    }
  },
  runtimeConfig: {
    mysql: {
      host: '127.0.0.1', 
      port: 8999,
      user: 'nszm',
      password: 'nszm123..',
      database: 'nav'
    },
    public: {
      siteName: '导航站',
      siteUrl: ''
    }
  },
  routeRules: {
    '/admin': { headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/admin/login': { headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/admin/nav': { headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/admin/include': { headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/login': { headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/openapi': { headers: { 'x-robots-tag': 'noindex, nofollow' } }
  },
  typescript: {
    strict: true
  }
})
