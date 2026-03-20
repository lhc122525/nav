import { getMySqlPool } from '../../utils/mysql'

export default defineEventHandler(async (event) => {
  const u = event.context.adminUser as { id: number; role: string } | undefined
  if (!u || u.role !== 'super') {
    throw createError({ statusCode: 403, statusMessage: '无权限' })
  }

  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const [rows] = await pool.execute(
    'SELECT id, username, role, is_active, created_at, updated_at FROM admin_users ORDER BY id DESC'
  )

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    id: Number(r.id),
    username: String(r.username || ''),
    role: String(r.role || 'admin'),
    isActive: Number(r.is_active) === 1,
    createdAt: new Date(String(r.created_at)).toISOString(),
    updatedAt: new Date(String(r.updated_at)).toISOString()
  }))
})
