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

  const [result] = await pool.execute('DELETE FROM guestbook_messages WHERE id = ?', [id])
  if (Number((result as { affectedRows?: number }).affectedRows) === 0) {
    throw createError({ statusCode: 404, statusMessage: 'not found' })
  }

  return { ok: true }
})

