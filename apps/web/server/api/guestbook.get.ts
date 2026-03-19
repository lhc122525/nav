import { getMySqlPool } from '../utils/mysql'
import { getQueryInt } from '../utils/http'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) return []

  const query = getQuery(event) as Record<string, unknown>
  const limit = Math.min(Math.max(getQueryInt(query, 'limit', 50), 1), 200)

  const [rows] = await pool.execute(
    `SELECT id, nickname, content, created_at
     FROM guestbook_messages
     WHERE is_visible = 1
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit]
  )

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    id: Number(r.id),
    nickname: String(r.nickname || ''),
    content: String(r.content || ''),
    createdAt: new Date(String(r.created_at)).toISOString()
  }))
})

