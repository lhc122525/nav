import { getMySqlPool } from '../../utils/mysql'
import { getCookie } from 'h3'
import { USER_SESSION_COOKIE } from '../../utils/userAuth'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  // 1. 获取当前用户 ID
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

  // 如果未登录，返回空列表
  if (!userId) {
    return { engines: [] }
  }

  try {
    // 2. 获取该用户最常用的前 8 个搜索引擎
    const [rows] = await pool.execute(`
      SELECT 
        e.id, 
        e.category_id as categoryId, 
        e.name, 
        e.url, 
        e.icon_url as iconUrl, 
        e.is_default as isDefault,
        SUM(s.count) as total_count
      FROM search_stats s
      JOIN search_engines e ON e.id = s.engine_id
      WHERE s.user_id = ?
      GROUP BY s.engine_id
      ORDER BY total_count DESC
      LIMIT 8
    `, [userId])

    return {
      engines: (rows as any[]).map(r => ({
        id: Number(r.id),
        categoryId: Number(r.categoryId),
        name: String(r.name),
        url: String(r.url),
        iconUrl: String(r.iconUrl || ''),
        isDefault: Boolean(r.isDefault)
      }))
    }
  } catch (error: any) {
    console.error('Fetch common engines error:', error)
    return { engines: [] }
  }
})
