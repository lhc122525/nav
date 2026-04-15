import { getMySqlPool } from '../../utils/mysql'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  try {
    // 获取标记为推荐的导航（仅返回仍处于推荐状态的数据）
    const [recommendedRows] = await pool.execute(`
      SELECT id, category_id as categoryId, title, url, description, icon_url as iconUrl
      FROM links
      WHERE is_recommended = 1 AND is_active = 1
      ORDER BY updated_at DESC, id DESC
      LIMIT 8
    `)

    const results = (recommendedRows as any[]).map(r => ({
      id: Number(r.id),
      categoryId: Number(r.categoryId),
      title: String(r.title),
      url: String(r.url),
      description: String(r.description || ''),
      iconUrl: String(r.iconUrl || '')
    }))

    return { links: results }
  } catch (error: any) {
    console.error('Fetch recommended links error:', error)
    return { links: [] }
  }
})
