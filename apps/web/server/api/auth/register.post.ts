import { getMySqlPool } from '../../utils/mysql'
import { hashUserPassword } from '../../utils/userAuth'

type RegisterBody = {
  username?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用', data: { msg: '数据库未启用' } })
  }

  const body = (await readBody(event)) as RegisterBody
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '').trim()

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: '用户名和密码不能为空',
      data: { msg: '用户名和密码不能为空' },
    })
  }
  if (username.length < 3 || username.length > 20) {
    throw createError({
      statusCode: 400,
      statusMessage: '用户名长度需为 3-20 位',
      data: { msg: '用户名长度需为 3-20 位' },
    })
  }
  if (password.length < 6 || password.length > 64) {
    throw createError({
      statusCode: 400,
      statusMessage: '密码长度需为 6-64 位',
      data: { msg: '密码长度需为 6-64 位' },
    })
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
      throw createError({
        statusCode: 409,
        statusMessage: '用户名已存在',
        data: { msg: '用户名已存在' },
      })
    }
    throw createError({ statusCode: 500, statusMessage: '注册失败', data: { msg: '注册失败' } })
  }
})
