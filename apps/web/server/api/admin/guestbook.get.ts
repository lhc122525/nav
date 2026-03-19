import { getMySqlPool } from '../../utils/mysql'
import { getQueryInt, getQueryString } from '../../utils/http'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: 'MySQL is disabled' })
  }

  const query = getQuery(event) as Record<string, unknown>
  const visible = getQueryString(query, 'visible')
  const limit = Math.min(Math.max(getQueryInt(query, 'limit', 200), 1), 500)

  const whereParts: string[] = ['1=1']
  const params: Array<string | number> = []

  if (visible === 'true') {
    whereParts.push('is_visible = 1')
  } else if (visible === 'false') {
    whereParts.push('is_visible = 0')
  }

  const [rows] = await pool.execute(
    `SELECT id, nickname, content, is_visible, ip, user_agent, created_at
     FROM guestbook_messages
     WHERE ${whereParts.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT ${limit}`,
    params
  )

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    id: Number(r.id),
    nickname: String(r.nickname || ''),
    content: String(r.content || ''),
    isVisible: Number(r.is_visible) === 1,
    ip: String(r.ip || ''),
    userAgent: String(r.user_agent || ''),
    createdAt: new Date(String(r.created_at)).toISOString()
  }))
})
