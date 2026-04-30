import { getMySqlPool } from '../utils/mysql'
import { getQueryInt } from '../utils/http'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) return { list: [], total: 0 }

  const query = getQuery(event) as Record<string, unknown>
  const page = Math.max(getQueryInt(query, 'page', 1), 1)
  const limit = Math.min(Math.max(getQueryInt(query, 'limit', 20), 1), 100)
  const offset = (page - 1) * limit

  const [countRows] = await pool.execute(
    'SELECT COUNT(*) as total FROM guestbook_messages WHERE is_visible = 1'
  )
  const total = Number((countRows as Array<Record<string, unknown>>)[0]?.total || 0)

  const [rows] = await pool.execute(
    `SELECT m.id, m.nickname, m.content, m.created_at, u.user_alias as current_user_alias
     FROM guestbook_messages m
     LEFT JOIN users u ON u.id = m.user_id
     WHERE m.is_visible = 1
     ORDER BY m.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`
  )

  const list = (rows as Array<Record<string, unknown>>).map((r) => ({
    id: Number(r.id),
    nickname: String(r.current_user_alias || r.nickname || '匿名'),
    content: String(r.content || ''),
    createdAt: new Date(String(r.created_at)).toISOString()
  }))

  return { list, total }
})
