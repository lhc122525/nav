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
  console.log('[common-links] token:', token)
  if (token) {
    const [rows] = await pool.execute(
      'SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > NOW() LIMIT 1',
      [token]
    )
    const row = (rows as any[])[0]
    console.log('[common-links] session row:', row)
    if (row) {
      userId = Number(row.user_id)
    }
  }

  console.log('[common-links] userId:', userId)

  // 如果未登录，返回空列表
  if (!userId) {
    return { links: [] }
  }

  try {
    // 2. 获取该用户最常用的前 8 个导航链接
    const [rows] = await pool.execute(`
      SELECT
        l.id,
        l.category_id as categoryId,
        l.title,
        l.url,
        l.description,
        l.icon_url as iconUrl,
        SUM(ls.count) as total_count
      FROM link_stats ls
      JOIN links l ON l.id = ls.link_id
      WHERE ls.user_id = ? AND l.is_active = 1
      GROUP BY ls.link_id
      ORDER BY total_count DESC
      LIMIT 8
    `, [userId])
    console.log('[common-links] query rows:', rows)

    return {
      links: (rows as any[]).map(r => ({
        id: Number(r.id),
        categoryId: Number(r.categoryId),
        title: String(r.title),
        url: String(r.url),
        description: String(r.description || ''),
        iconUrl: String(r.iconUrl || '')
      }))
    }
  } catch (error: any) {
    console.error('Fetch common links error:', error)
    return { links: [] }
  }
})