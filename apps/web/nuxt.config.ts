import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const dayjsEsmDir = dirname(require.resolve('dayjs/esm/index.js'))
const normalizePath = (p: string) => p.replace(/\\/g, '/')

export default defineNuxtConfig({
  compatibilityDate: '2026-04-01',
  ssr: true,
  nitro: {
    compressPublicAssets: true,
    output: {
      dir: '../../nav',
      serverDir: '../../nav/server',
      publicDir: '../../nav/public'
    }
  },
  devtools: { enabled: true },
  devServer: {
    host: process.env.NUXT_DEV_HOST,
    port: Number(process.env.NUXT_DEV_PORT)
  },
  modules: ['@element-plus/nuxt', '@nuxt/eslint'],
  css: ['~/assets/styles/main.css'],
  vite: {
    optimizeDeps: {
      include: ['dayjs', 'dayjs/plugin/*.js']
    },
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
      host: process.env.NUXT_MYSQL_HOST,
      port: process.env.NUXT_MYSQL_PORT ? parseInt(process.env.NUXT_MYSQL_PORT, 10) : 3306,
      user: process.env.NUXT_MYSQL_USER,
      password: process.env.NUXT_MYSQL_PASSWORD,
      database: process.env.NUXT_MYSQL_DATABASE
    },
    public: {
      siteName: process.env.NUXT_PUBLIC_SITE_NAME || '非乐鱼导航',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || '',
      icp: process.env.NUXT_PUBLIC_ICP || '闽ICP备2026014482号'
    }
  },

  routeRules: {
    '/admin': { headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/admin/login': { headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/admin/nav': { headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/admin/include': { headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/login': { headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/openapi': { headers: { 'x-robots-tag': 'noindex, nofollow' } },
    '/api/links': { cache: { maxAge: 60 * 5, staleMaxAge: 60 * 60, swr: true } },
    '/api/categories': { cache: { maxAge: 60 * 5, staleMaxAge: 60 * 60, swr: true } },
    '/api/ads': { cache: { maxAge: 60, staleMaxAge: 60 * 10, swr: true } },
    '/api/search-categories': { cache: { maxAge: 60 * 5, staleMaxAge: 60 * 60, swr: true } },
    '/api/links/recommended': { cache: { maxAge: 60 * 5, staleMaxAge: 60 * 60, swr: true } },
    // 用户特定数据不缓存
    '/guestbook': { cache: { maxAge: 10, staleMaxAge: 30, swr: true } }
  },
  typescript: {
    strict: true
  }
})
