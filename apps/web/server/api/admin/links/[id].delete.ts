import { getMySqlPool } from '../../../utils/mysql'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 400, statusMessage: 'MySQL is disabled' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'invalid id' })
  }

  await pool.execute('DELETE FROM links WHERE id = ?', [id])
  return { ok: true }
})

