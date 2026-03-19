import { getMySqlPool } from '../../utils/mysql'
import { getQueryInt, getQueryString } from '../../utils/http'

type AdminLink = {
  id: number
  categoryId: number | null
  title: string
  url: string
  description: string
  iconUrl: string
  isActive: boolean
  sort: number
  createdAt: string
  updatedAt: string
}

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 400, statusMessage: 'MySQL is disabled' })
  }

  const query = getQuery(event) as Record<string, unknown>
  const q = getQueryString(query, 'q')
  const categoryId = getQueryInt(query, 'categoryId', 0)
  const limit = Math.min(Math.max(getQueryInt(query, 'limit', 200), 1), 500)

  const whereParts: string[] = ['1=1']
  const params: Array<string | number> = []
  if (categoryId > 0) {
    whereParts.push('category_id = ?')
    params.push(categoryId)
  }
  if (q) {
    whereParts.push('(title LIKE ? OR url LIKE ? OR description LIKE ?)')
    params.push(`%${q}%`, `%${q}%`, `%${q}%`)
  }

  const [rows] = await pool.execute(
    `SELECT id, category_id, title, url, description, icon_url, is_active, sort, created_at, updated_at
     FROM links
     WHERE ${whereParts.join(' AND ')}
     ORDER BY sort ASC, id DESC
     LIMIT ?`,
    [...params, limit]
  )

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    id: Number(r.id),
    categoryId: r.category_id == null ? null : Number(r.category_id),
    title: String(r.title || ''),
    url: String(r.url || ''),
    description: String(r.description || ''),
    iconUrl: String(r.icon_url || ''),
    isActive: Boolean(r.is_active),
    sort: Number(r.sort || 0),
    createdAt: new Date(String(r.created_at)).toISOString(),
    updatedAt: new Date(String(r.updated_at)).toISOString()
  })) as AdminLink[]
})
