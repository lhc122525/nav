import { getMySqlPool } from '../../../utils/mysql'
import { ADMIN_SESSION_COOKIE, clearAdminSessionCookie } from '../../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, ADMIN_SESSION_COOKIE)
  clearAdminSessionCookie(event)

  const pool = getMySqlPool()
  if (pool && token) {
    await pool.execute('DELETE FROM admin_sessions WHERE token = ?', [token])
  }

  return { ok: true }
})

