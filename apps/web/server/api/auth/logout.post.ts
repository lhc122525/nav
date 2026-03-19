import { getCookie } from 'h3'
import { getMySqlPool } from '../../utils/mysql'
import { clearUserSessionCookie, USER_SESSION_COOKIE } from '../../utils/userAuth'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  const token = getCookie(event, USER_SESSION_COOKIE)

  if (pool && token) {
    await pool.execute('DELETE FROM user_sessions WHERE token = ?', [token])
  }

  clearUserSessionCookie(event)
  return { ok: true }
})

