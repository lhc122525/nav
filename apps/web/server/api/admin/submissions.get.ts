import { getMySqlPool } from '../../utils/mysql'
import { getQueryInt, getQueryString } from '../../utils/http'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const query = getQuery(event) as Record<string, unknown>
  const q = getQueryString(query, 'q')
  const status = getQueryString(query, 'status')
  const limit = Math.min(Math.max(getQueryInt(query, 'limit', 200), 1), 500)

  const whereParts: string[] = ['1=1']
  const params: Array<string | number> = []

  if (status && status !== 'all') {
    whereParts.push('status = ?')
    params.push(status)
  }
  if (q) {
    whereParts.push('(title LIKE ? OR url LIKE ? OR description LIKE ?)')
    params.push(`%${q}%`, `%${q}%`, `%${q}%`)
  }

  const [rows] = await pool.execute(
    `SELECT id, title, url, description, contact, status, is_included, created_at, handled_by, handled_at
     FROM submissions
     WHERE ${whereParts.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT ${limit}`,
    params
  )

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    id: Number(r.id),
    title: String(r.title || ''),
    url: String(r.url || ''),
    description: String(r.description || ''),
    contact: String(r.contact || ''),
    status: String(r.status || ''),
    isIncluded: Boolean(r.is_included),
    handledBy: r.handled_by == null ? null : Number(r.handled_by),
    handledAt: r.handled_at ? new Date(String(r.handled_at)).toISOString() : null,
    createdAt: new Date(String(r.created_at)).toISOString()
  }))
})
