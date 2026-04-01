import { getMySqlPool } from '../../utils/mysql'

export default defineEventHandler(async () => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const [rows] = await pool.execute('SELECT id, name, sort FROM search_categories ORDER BY sort ASC, id ASC')
  return (rows as Array<Record<string, unknown>>).map((r) => ({
    id: Number(r.id),
    name: String(r.name || ''),
    sort: Number(r.sort || 0)
  }))
})
