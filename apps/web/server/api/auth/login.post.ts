import { getMySqlPool } from '../../utils/mysql'
import { createUserSessionToken, setUserSessionCookie, verifyUserPassword } from '../../utils/userAuth'

type LoginBody = {
  username?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: 'MySQL is disabled' })
  }

  const body = (await readBody(event)) as LoginBody
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '').trim()

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: 'username and password are required' })
  }

  const [rows] = await pool.execute(
    "SELECT id, username, password_salt, password_hash, role, is_active FROM users WHERE username = ? LIMIT 1",
    [username]
  )
  const row = (rows as Array<Record<string, unknown>>)[0]
  if (!row || Number(row.is_active) !== 1) {
    throw createError({ statusCode: 401, statusMessage: 'invalid credentials' })
  }

  const role = String(row.role || 'user')
  if (role !== 'user') {
    throw createError({ statusCode: 403, statusMessage: 'user login only' })
  }

  const ok = verifyUserPassword(password, String(row.password_salt || ''), String(row.password_hash || ''))
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: 'invalid credentials' })
  }

  const token = createUserSessionToken()
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
  await pool.execute('INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)', [
    Number(row.id),
    token,
    expires
  ])
  setUserSessionCookie(event, token, expires)

  return { ok: true, id: Number(row.id), username: String(row.username || '') }
})
