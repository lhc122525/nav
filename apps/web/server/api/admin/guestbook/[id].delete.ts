import { getMySqlPool } from '../../../utils/mysql'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: '无效的 ID' })
  }

  const [result] = await pool.execute('DELETE FROM guestbook_messages WHERE id = ?', [id])
  if (Number((result as { affectedRows?: number }).affectedRows) === 0) {
    throw createError({ statusCode: 404, statusMessage: '未找到' })
  }

  return { ok: true }
})
