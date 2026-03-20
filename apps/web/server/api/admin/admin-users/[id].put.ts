import { getMySqlPool } from '../../../utils/mysql'
import { hashPassword } from '../../../utils/adminAuth'

type UpdateAdminUserBody = {
  isActive?: boolean
  role?: 'super' | 'admin'
  password?: string
}

export default defineEventHandler(async (event) => {
  const u = event.context.adminUser as { id: number; role: string } | undefined
  if (!u || u.role !== 'super') {
    throw createError({ statusCode: 403, statusMessage: '无权限' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: '无效的 ID' })
  }

  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const body = (await readBody(event)) as UpdateAdminUserBody

  const fields: string[] = []
  const values: Array<string | number> = []

  if (body?.isActive != null) {
    fields.push('is_active = ?')
    values.push(body.isActive ? 1 : 0)
  }
  if (body?.role != null) {
    fields.push('role = ?')
    values.push(body.role === 'super' ? 'super' : 'admin')
  }
  if (body?.password != null) {
    const password = String(body.password || '')
    if (!password) {
      throw createError({ statusCode: 400, statusMessage: '密码不能为空' })
    }
    const { saltHex, hashHex } = hashPassword(password)
    fields.push('password_salt = ?', 'password_hash = ?')
    values.push(saltHex, hashHex)
  }

  if (fields.length === 0) return { ok: true }

  values.push(id)
  await pool.execute(`UPDATE admin_users SET ${fields.join(', ')} WHERE id = ?`, values)

  if (body?.isActive === false) {
    await pool.execute('DELETE FROM admin_sessions WHERE admin_user_id = ?', [id])
  }

  return { ok: true }
})
