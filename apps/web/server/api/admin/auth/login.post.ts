import { getMySqlPool } from '../../../utils/mysql'
import { createSessionToken, setAdminSessionCookie, verifyPassword } from '../../../utils/adminAuth'

type LoginBody = {
  username?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const body = (await readBody(event)) as LoginBody
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '')

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: '用户名和密码不能为空' })
  }

  const [rows] = await pool.execute(
    'SELECT id, username, password_salt, password_hash, role, is_active FROM admin_users WHERE username = ? LIMIT 1',
    [username]
  )
  const row = (rows as Array<Record<string, unknown>>)[0]
  if (!row || Number(row.is_active) !== 1) {
    throw createError({ statusCode: 401, statusMessage: '用户名或密码错误' })
  }

  const ok = verifyPassword(
    password,
    String(row.password_salt || ''),
    String(row.password_hash || '')
  )
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: '用户名或密码错误' })
  }

  const token = createSessionToken()
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await pool.execute(
    'INSERT INTO admin_sessions (admin_user_id, token, expires_at) VALUES (?, ?, ?)',
    [Number(row.id), token, expires]
  )

  setAdminSessionCookie(event, token, expires)

  return {
    ok: true,
    user: {
      id: Number(row.id),
      username: String(row.username || ''),
      role: String(row.role || 'admin')
    }
  }
})
