export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')

  const { public: publicConfig } = useRuntimeConfig()
  const siteUrl = (publicConfig.siteUrl || 'http://localhost:3000').replace(/\/+$/, '')

  return `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`
})

