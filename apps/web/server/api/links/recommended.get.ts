import { getMySqlPool } from '../../utils/mysql'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  try {
    // 1. 获取标记为推荐的 8 个导航
    const [recommendedRows] = await pool.execute(`
      SELECT id, category_id as categoryId, title, url, description, icon_url as iconUrl
      FROM links
      WHERE is_recommended = 1 AND is_active = 1
      ORDER BY sort ASC, id DESC
      LIMIT 8
    `)

    let results = (recommendedRows as any[]).map(r => ({
      id: Number(r.id),
      categoryId: Number(r.categoryId),
      title: String(r.title),
      url: String(r.url),
      description: String(r.description || ''),
      iconUrl: String(r.iconUrl || '')
    }))

    // 2. 如果不足 8 个，从全站统计排行中截取填充
    if (results.length < 8) {
      const excludeIds = results.length > 0 ? results.map(r => r.id) : [0]
      const limit = 8 - results.length
      
      const [popularRows] = await pool.execute(`
        SELECT l.id, l.category_id as categoryId, l.title, l.url, l.description, l.icon_url as iconUrl, SUM(ls.count) as total_count
        FROM link_stats ls
        JOIN links l ON l.id = ls.link_id
        WHERE l.is_active = 1 AND l.id NOT IN (${excludeIds.join(',')})
        GROUP BY ls.link_id
        ORDER BY total_count DESC
        LIMIT ${limit}
      `)

      const populars = (popularRows as any[]).map(r => ({
        id: Number(r.id),
        categoryId: Number(r.categoryId),
        title: String(r.title),
        url: String(r.url),
        description: String(r.description || ''),
        iconUrl: String(r.iconUrl || '')
      }))
      
      results = [...results, ...populars]
    }

    return { links: results }
  } catch (error: any) {
    console.error('Fetch recommended links error:', error)
    return { links: [] }
  }
})
