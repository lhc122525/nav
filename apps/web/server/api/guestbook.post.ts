import { getMySqlPool } from '../utils/mysql'
import { getCookie, getHeader, getRequestIP } from 'h3'
import { USER_SESSION_COOKIE } from '../utils/userAuth'

type CreateMessageBody = {
  content?: string
}

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  // Verify login
  const token = getCookie(event, USER_SESSION_COOKIE)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: '请登录后再试' })
  }

  const [sessionRows] = await pool.execute(
    `SELECT s.expires_at, u.id, u.username, u.is_active
     FROM user_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ?
     LIMIT 1`,
    [token]
  )
  const sessionRow = (sessionRows as Array<Record<string, unknown>>)[0]
  if (!sessionRow || Number(sessionRow.is_active) !== 1 || new Date(String(sessionRow.expires_at)).getTime() <= Date.now()) {
    throw createError({ statusCode: 401, statusMessage: '登录已过期，请重新登录' })
  }

  const userId = Number(sessionRow.id)
  const username = String(sessionRow.username)

  const body = (await readBody(event)) as CreateMessageBody
  const content = String(body?.content || '').trim()

  if (!content) {
    throw createError({ statusCode: 400, statusMessage: '内容不能为空' })
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) || ''
  const ua = getHeader(event, 'user-agent') || ''

  const [rows] = await pool.execute(
    'SELECT created_at FROM guestbook_messages WHERE ip = ? ORDER BY created_at DESC LIMIT 1',
    [ip]
  )
  const last = (rows as Array<Record<string, unknown>>)[0]?.created_at
  if (last) {
    const lastTime = new Date(String(last)).getTime()
    if (!Number.isNaN(lastTime) && Date.now() - lastTime < 30_000) {
      throw createError({ statusCode: 429, statusMessage: '请求过于频繁，请稍后再试' })
    }
  }

  const [result] = await pool.execute(
    'INSERT INTO guestbook_messages (user_id, nickname, content, is_visible, ip, user_agent) VALUES (?, ?, ?, 1, ?, ?)',
    [userId, username, content, ip, ua]
  )

  return { ok: true, id: Number((result as { insertId?: number }).insertId) }
})
