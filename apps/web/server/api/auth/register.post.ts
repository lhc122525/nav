import { getMySqlPool } from '../../utils/mysql'
import { hashUserPassword } from '../../utils/userAuth'

type RegisterBody = {
  username?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: 'MySQL is disabled' })
  }

  const body = (await readBody(event)) as RegisterBody
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '').trim()

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: 'username and password are required' })
  }
  if (username.length < 3 || username.length > 20) {
    throw createError({ statusCode: 400, statusMessage: 'username length must be 3-20' })
  }
  if (password.length < 6 || password.length > 64) {
    throw createError({ statusCode: 400, statusMessage: 'password length must be 6-64' })
  }

  const { saltHex, hashHex } = hashUserPassword(password)

  try {
    const [result] = await pool.execute(
      "INSERT INTO users (username, password_salt, password_hash, role, is_active) VALUES (?, ?, ?, 'user', 1)",
      [username, saltHex, hashHex]
    )

    const userId = Number((result as { insertId?: number }).insertId)

    return { ok: true, id: userId, username }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('Duplicate')) {
      throw createError({ statusCode: 409, statusMessage: 'username already exists' })
    }
    throw createError({ statusCode: 500, statusMessage: 'register failed' })
  }
})
