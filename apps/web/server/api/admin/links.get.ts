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
  isRecommended: boolean
  sort: number
  createdAt: string
  updatedAt: string
}

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const query = getQuery(event) as Record<string, unknown>
  const q = getQueryString(query, 'q')
  const categoryId = getQueryInt(query, 'categoryId', 0)
  const page = Math.max(getQueryInt(query, 'page', 1), 1)
  const limit = Math.min(Math.max(getQueryInt(query, 'limit', 20), 1), 500)
  const offset = (page - 1) * limit

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

  try {
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM links WHERE ${whereParts.join(' AND ')}`,
      params
    ) as any

    const [rows] = await pool.execute(
      `SELECT id, category_id, title, url, description, icon_url, is_active, is_recommended, sort, created_at, updated_at
       FROM links
       WHERE ${whereParts.join(' AND ')}
       ORDER BY sort ASC, id DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    )

    const list = (rows as Array<Record<string, unknown>>).map((r) => ({
      id: Number(r.id),
      categoryId: r.category_id == null ? null : Number(r.category_id),
      title: String(r.title || ''),
      url: String(r.url || ''),
      description: String(r.description || ''),
      iconUrl: String(r.icon_url || ''),
      isActive: Boolean(r.is_active),
      isRecommended: Boolean(r.is_recommended),
      sort: Number(r.sort || 0),
      createdAt: new Date(String(r.created_at)).toISOString(),
      updatedAt: new Date(String(r.updated_at)).toISOString()
    })) as AdminLink[]

    return { total: Number(total), list }
  } catch (e: unknown) {
    const anyError = e as { code?: unknown; message?: unknown }
    if (anyError?.code !== 'ER_BAD_FIELD_ERROR') throw e
    if (String(anyError?.message || '').includes('is_recommended')) {
      const [[{ total }]] = await pool.execute(
        `SELECT COUNT(*) as total FROM links WHERE ${whereParts.join(' AND ')}`,
        params
      ) as any

      const [rows] = await pool.execute(
        `SELECT id, category_id, title, url, description, icon_url, is_active, sort, created_at, updated_at
         FROM links
         WHERE ${whereParts.join(' AND ')}
         ORDER BY sort ASC, id DESC
         LIMIT ${limit} OFFSET ${offset}`,
        params
      )

      const list = (rows as Array<Record<string, unknown>>).map((r) => ({
        id: Number(r.id),
        categoryId: r.category_id == null ? null : Number(r.category_id),
        title: String(r.title || ''),
        url: String(r.url || ''),
        description: String(r.description || ''),
        iconUrl: String(r.icon_url || ''),
        isActive: Boolean(r.is_active),
        isRecommended: false,
        sort: Number(r.sort || 0),
        createdAt: new Date(String(r.created_at)).toISOString(),
        updatedAt: new Date(String(r.updated_at)).toISOString()
      })) as AdminLink[]

      return { total: Number(total), list }
    }
    throw e
  }
})
