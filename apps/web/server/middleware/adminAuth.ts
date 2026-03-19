import { getMySqlPool } from '../utils/mysql'
import { ADMIN_SESSION_COOKIE, type AdminRole } from '../utils/adminAuth'
import { getCookie, sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  const path = event.path || ''
  const isAdminApi = path.startsWith('/api/admin')
  const isAdminPage = path === '/admin' || path.startsWith('/admin/')
  if (!isAdminApi && !isAdminPage) return

  if (isAdminApi) {
    if (path === '/api/admin/auth/login' || path === '/api/admin/auth/logout') return
  }
  if (isAdminPage) {
    if (path === '/admin/login') return
  }

  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: 'MySQL is disabled' })
  }

  const token = getCookie(event, ADMIN_SESSION_COOKIE)
  if (!token) {
    if (isAdminPage) {
      return sendRedirect(event, '/admin/login', 302)
    }
    throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  }

  const [rows] = await pool.execute(
    `SELECT s.expires_at, u.id, u.username, u.role, u.is_active
     FROM admin_sessions s
     JOIN admin_users u ON u.id = s.admin_user_id
     WHERE s.token = ?
     LIMIT 1`,
    [token]
  )

  const row = (rows as Array<Record<string, unknown>>)[0]
  if (!row) {
    if (isAdminPage) {
      return sendRedirect(event, '/admin/login', 302)
    }
    throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  }

  const isActive = Number(row.is_active) === 1
  const expiresAt = new Date(String(row.expires_at))
  if (!isActive || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    await pool.execute('DELETE FROM admin_sessions WHERE token = ?', [token])
    if (isAdminPage) {
      return sendRedirect(event, '/admin/login', 302)
    }
    throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  }

  event.context.adminUser = {
    id: Number(row.id),
    username: String(row.username || ''),
    role: String(row.role || 'admin') as AdminRole
  }

  if (isAdminPage && path === '/admin') {
    return sendRedirect(event, '/admin/nav', 302)
  }
})
