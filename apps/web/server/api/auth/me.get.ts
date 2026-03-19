import { getCookie } from 'h3'
import { getMySqlPool } from '../../utils/mysql'
import { USER_SESSION_COOKIE, type UserRole } from '../../utils/userAuth'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) return { user: null }

  const token = getCookie(event, USER_SESSION_COOKIE)
  if (!token) return { user: null }

  const [rows] = await pool.execute(
    `SELECT s.expires_at, u.id, u.username, u.role, u.is_active
     FROM user_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ?
     LIMIT 1`,
    [token]
  )

  const row = (rows as Array<Record<string, unknown>>)[0]
  if (!row) return { user: null }

  const isActive = Number(row.is_active) === 1
  const expiresAt = new Date(String(row.expires_at))
  if (!isActive || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    await pool.execute('DELETE FROM user_sessions WHERE token = ?', [token])
    return { user: null }
  }

  const role = String(row.role || 'user') as UserRole
  return {
    user: {
      id: Number(row.id),
      username: String(row.username || ''),
      role
    }
  }
})

