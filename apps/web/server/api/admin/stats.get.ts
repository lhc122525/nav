import { getMySqlPool } from '../../utils/mysql'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  try {
    // 1. 搜索引擎统计排行 (前 10)
    const [engineStats] = await pool.execute(`
      SELECT e.name, SUM(s.count) as total_count, e.icon_url
      FROM search_stats s
      JOIN search_engines e ON e.id = s.engine_id
      GROUP BY s.engine_id
      ORDER BY total_count DESC
      LIMIT 10
    `)

    // 2. 导航链接点击排行 (前 10)
    const [linkStats] = await pool.execute(`
      SELECT l.title, SUM(ls.count) as total_count, l.url, l.icon_url
      FROM link_stats ls
      JOIN links l ON l.id = ls.link_id
      GROUP BY ls.link_id
      ORDER BY total_count DESC
      LIMIT 10
    `)

    // 3. 最近 7 天趋势
    const [dailySearchTrend] = await pool.execute(`
      SELECT date, SUM(count) as count
      FROM search_stats
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY date
      ORDER BY date ASC
    `)

    const [dailyLinkTrend] = await pool.execute(`
      SELECT date, SUM(count) as count
      FROM link_stats
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY date
      ORDER BY date ASC
    `)

    // 4. 用户登录与否统计
    const [searchUserStats] = await pool.execute(`
      SELECT 
        CASE WHEN user_id IS NULL THEN 'guest' ELSE 'user' END as user_type,
        SUM(count) as total_count
      FROM search_stats
      GROUP BY user_type
    `)

    const [linkUserStats] = await pool.execute(`
      SELECT 
        CASE WHEN user_id IS NULL THEN 'guest' ELSE 'user' END as user_type,
        SUM(count) as total_count
      FROM link_stats
      GROUP BY user_type
    `)

    return {
      topEngines: engineStats,
      topLinks: linkStats,
      trends: {
        search: dailySearchTrend,
        link: dailyLinkTrend
      },
      userStats: {
        search: searchUserStats,
        link: linkUserStats
      }
    }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
