import { getMySqlPool } from '../../utils/mysql'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const query = getQuery(event)
  const categoryId = query.categoryId ? Number(query.categoryId) : undefined

  let sql = 'SELECT id, category_id, name, url, icon_url, sort, is_default FROM search_engines'
  const params: any[] = []

  if (categoryId) {
    sql += ' WHERE category_id = ?'
    params.push(categoryId)
  }

  sql += ' ORDER BY sort ASC, id ASC'

  const [rows] = await pool.execute(sql, params)
  return (rows as Array<Record<string, unknown>>).map((r) => ({
    id: Number(r.id),
    categoryId: Number(r.category_id),
    name: String(r.name || ''),
    url: String(r.url || ''),
    iconUrl: String(r.icon_url || ''),
    sort: Number(r.sort || 0),
    isDefault: Boolean(r.is_default)
  }))
})
