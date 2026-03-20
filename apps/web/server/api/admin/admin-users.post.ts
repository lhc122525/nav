import { getMySqlPool } from '../../utils/mysql'
import { hashPassword } from '../../utils/adminAuth'

type CreateAdminUserBody = {
  username?: string
  password?: string
  role?: 'super' | 'admin'
}

export default defineEventHandler(async (event) => {
  const u = event.context.adminUser as { id: number; role: string } | undefined
  if (!u || u.role !== 'super') {
    throw createError({ statusCode: 403, statusMessage: '无权限' })
  }

  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const body = (await readBody(event)) as CreateAdminUserBody
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '')
  const role = body?.role === 'super' ? 'super' : 'admin'

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: '用户名和密码不能为空' })
  }

  const { saltHex, hashHex } = hashPassword(password)

  try {
    const [result] = await pool.execute(
      'INSERT INTO admin_users (username, password_salt, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)',
      [username, saltHex, hashHex, role]
    )
    return { id: Number((result as { insertId?: number }).insertId) }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '创建失败'
    if (msg.includes('Duplicate')) {
      throw createError({ statusCode: 409, statusMessage: '用户名已存在' })
    }
    throw createError({ statusCode: 500, statusMessage: '创建失败' })
  }
})
