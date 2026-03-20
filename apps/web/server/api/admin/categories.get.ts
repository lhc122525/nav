import { getMySqlPool } from '../../utils/mysql'

export default defineEventHandler(async () => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const [rows] = await pool.execute('SELECT id, name, slug, sort FROM categories ORDER BY sort ASC, id DESC')
  return (rows as Array<Record<string, unknown>>).map((r) => ({
    id: Number(r.id),
    name: String(r.name || ''),
    slug: String(r.slug || ''),
    sort: Number(r.sort || 0)
  }))
})
