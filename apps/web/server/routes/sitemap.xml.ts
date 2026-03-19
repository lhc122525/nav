import { getMySqlPool } from '../utils/mysql'

function escapeXml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')

  const { public: publicConfig } = useRuntimeConfig()
  const siteUrl = (publicConfig.siteUrl || 'http://localhost:3000').replace(/\/+$/, '')

  const urls: Array<{ loc: string; lastmod?: string }> = [
    { loc: `${siteUrl}/` },
    { loc: `${siteUrl}/submit` },
    { loc: `${siteUrl}/guestbook` }
  ]

  const pool = getMySqlPool()
  if (pool) {
    const [rows] = await pool.execute('SELECT url, updated_at FROM links WHERE is_active = 1 ORDER BY id DESC LIMIT 2000')
    for (const r of rows as Array<Record<string, unknown>>) {
      const url = String(r.url || '')
      if (!url) continue
      const updatedAt = String(r.updated_at || '')
      urls.push({
        loc: url,
        lastmod: updatedAt ? new Date(updatedAt).toISOString().slice(0, 10) : undefined
      })
    }
  }

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    urls
      .map((u) => {
        const loc = `<loc>${escapeXml(u.loc)}</loc>`
        const lastmod = u.lastmod ? `<lastmod>${escapeXml(u.lastmod)}</lastmod>` : ''
        return `<url>${loc}${lastmod}</url>`
      })
      .join('') +
    '</urlset>'

  return body
})
