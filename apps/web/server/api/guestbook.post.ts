import { getMySqlPool } from '../utils/mysql'
import { getHeader, getRequestIP } from 'h3'

type CreateMessageBody = {
  nickname?: string
  content?: string
}

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const body = (await readBody(event)) as CreateMessageBody
  const nickname = String(body?.nickname || '').trim()
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
    'INSERT INTO guestbook_messages (nickname, content, is_visible, ip, user_agent) VALUES (?, ?, 1, ?, ?)',
    [nickname, content, ip, ua]
  )

  return { ok: true, id: Number((result as { insertId?: number }).insertId) }
})
