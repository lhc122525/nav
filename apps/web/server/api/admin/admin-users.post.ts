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
    throw createError({ statusCode: 403, statusMessage: 'forbidden' })
  }

  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: 'MySQL is disabled' })
  }

  const body = (await readBody(event)) as CreateAdminUserBody
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '')
  const role = body?.role === 'super' ? 'super' : 'admin'

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: 'username and password are required' })
  }

  const { saltHex, hashHex } = hashPassword(password)

  try {
    const [result] = await pool.execute(
      'INSERT INTO admin_users (username, password_salt, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)',
      [username, saltHex, hashHex, role]
    )
    return { id: Number((result as { insertId?: number }).insertId) }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'create failed'
    if (msg.includes('Duplicate')) {
      throw createError({ statusCode: 409, statusMessage: 'username already exists' })
    }
    throw createError({ statusCode: 500, statusMessage: 'create failed' })
  }
})

