import { getMySqlPool } from '../../../utils/mysql'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: 'MySQL is disabled' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'invalid id' })
  }

  const [rows] = await pool.execute('SELECT COUNT(1) AS cnt FROM links WHERE category_id = ?', [id])
  const cnt = Number((rows as Array<Record<string, unknown>>)[0]?.cnt || 0)
  if (cnt > 0) {
    throw createError({ statusCode: 409, statusMessage: 'category has links' })
  }

  const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [id])
  if (Number((result as { affectedRows?: number }).affectedRows) === 0) {
    throw createError({ statusCode: 404, statusMessage: 'not found' })
  }

  return { ok: true }
})

