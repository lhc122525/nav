import { getMySqlPool } from '../../utils/mysql'
import { getCookie } from 'h3'
import { USER_SESSION_COOKIE } from '../../utils/userAuth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { type, id } = body
  
  if (!type || !id || !['engine', 'link'].includes(type)) {
    return { success: false, message: '参数错误' }
  }

  const pool = getMySqlPool()
  if (!pool) {
    return { success: false, message: '数据库未启用' }
  }

  // 1. 获取当前用户 ID (如果已登录)
  let userId: number | null = null
  const token = getCookie(event, USER_SESSION_COOKIE)
  if (token) {
    const [rows] = await pool.execute(
      'SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > NOW() LIMIT 1',
      [token]
    )
    const row = (rows as any[])[0]
    if (row) {
      userId = Number(row.user_id)
    }
  }

  // 2. 准备统计数据
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  
  try {
    if (type === 'engine') {
      // 检查搜索引擎是否存在
      const [exists] = await pool.execute('SELECT id FROM search_engines WHERE id = ?', [id])
      if ((exists as any[]).length === 0) return { success: false, message: '搜索引擎不存在' }

      await pool.execute(
        `INSERT INTO search_stats (engine_id, user_id, date, count) 
         VALUES (?, ?, ?, 1) 
         ON DUPLICATE KEY UPDATE count = count + 1, updated_at = NOW()`,
        [id, userId, today]
      )
    } else {
      // 检查链接是否存在
      const [exists] = await pool.execute('SELECT id FROM links WHERE id = ?', [id])
      if ((exists as any[]).length === 0) return { success: false, message: '链接不存在' }

      await pool.execute(
        `INSERT INTO link_stats (link_id, user_id, date, count) 
         VALUES (?, ?, ?, 1) 
         ON DUPLICATE KEY UPDATE count = count + 1, updated_at = NOW()`,
        [id, userId, today]
      )
    }

    return { success: true }
  } catch (error: any) {
    console.error('Stats record error:', error)
    return { success: false, message: error.message }
  }
})
