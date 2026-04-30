import { getMySqlPool } from '../../utils/mysql'
import { hashUserPassword } from '../../utils/userAuth'

type RegisterBody = {
  username?: string
  userAlias?: string
  password?: string
}

// 手机号校验：1开头，11位数字
const phoneRegex = /^1[3-9]\d{9}$/
// 邮箱校验：标准邮箱格式
const emailRegex = /^[\w.-]+@[\w.-]+\.\w+$/

function isValidAccount(account: string): boolean {
  return phoneRegex.test(account) || emailRegex.test(account)
}

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用', data: { msg: '数据库未启用' } })
  }

  const body = (await readBody(event)) as RegisterBody
  const username = String(body?.username || '').trim()
  const userAlias = String(body?.userAlias || '').trim()
  const password = String(body?.password || '').trim()

  if (!username || !password || !userAlias) {
    throw createError({
      statusCode: 400,
      statusMessage: '账号、昵称和密码不能为空',
      data: { msg: '账号、昵称和密码不能为空' },
    })
  }

  // 校验账号格式（必须是手机号或邮箱）
  if (!isValidAccount(username)) {
    throw createError({
      statusCode: 400,
      statusMessage: '账号必须是手机号或邮箱格式',
      data: { msg: '账号必须是手机号或邮箱格式' },
    })
  }

  // 校验昵称长度
  if (userAlias.length < 2 || userAlias.length > 40) {
    throw createError({
      statusCode: 400,
      statusMessage: '昵称长度需为 2-40 位',
      data: { msg: '昵称长度需为 2-40 位' },
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
      "INSERT INTO users (username, user_alias, password_salt, password_hash, role, is_active) VALUES (?, ?, ?, ?, 'user', 1)",
      [username, userAlias, saltHex, hashHex]
    )

    const userId = Number((result as { insertId?: number }).insertId)

    return { ok: true, id: userId, username, userAlias }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('Duplicate')) {
      throw createError({
        statusCode: 409,
        statusMessage: '账号已存在',
        data: { msg: '账号已存在' },
      })
    }
    throw createError({ statusCode: 500, statusMessage: '注册失败', data: { msg: '注册失败' } })
  }
})
