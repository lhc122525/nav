import { getMySqlPool } from '../../utils/mysql'
import { createUserSessionToken, setUserSessionCookie, verifyUserPassword } from '../../utils/userAuth'

type LoginBody = {
  username?: string
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
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const body = (await readBody(event)) as LoginBody
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '').trim()

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: '账号和密码不能为空' })
  }

  // 校验账号格式（必须是手机号或邮箱）
  if (!isValidAccount(username)) {
    throw createError({ statusCode: 400, statusMessage: '账号必须是手机号或邮箱格式' })
  }

  const [rows] = await pool.execute(
    'SELECT id, username, user_alias, password_salt, password_hash, role, is_active FROM users WHERE username = ? LIMIT 1',
    [username]
  )
  const row = (rows as Array<Record<string, unknown>>)[0]
  if (!row || Number(row.is_active) !== 1) {
    throw createError({ statusCode: 401, statusMessage: '账号或密码错误' })
  }

  const role = String(row.role || 'user')
  if (role !== 'user') {
    throw createError({ statusCode: 403, statusMessage: '仅允许普通用户登录' })
  }

  const ok = verifyUserPassword(password, String(row.password_salt || ''), String(row.password_hash || ''))
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: '账号或密码错误' })
  }

  const token = createUserSessionToken()
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
  await pool.execute('INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)', [
    Number(row.id),
    token,
    expires
  ])
  console.log('[/api/auth/login] Setting cookie, token:', token, 'expires:', expires)
  setUserSessionCookie(event, token, expires)

  return { ok: true, id: Number(row.id), username: String(row.username || ''), userAlias: String(row.user_alias || '') }
})
