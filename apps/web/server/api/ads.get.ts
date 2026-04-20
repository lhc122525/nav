import { getMySqlPool } from '../utils/mysql'

export default defineEventHandler(async () => {
  const pool = getMySqlPool()
  if (!pool) {
    return { ads: [], enabled: false }
  }

  try {
    // 1. 获取配置
    const [configRows] = await pool.execute('SELECT enabled, display_count as displayCount, is_random as isRandom FROM ad_configs LIMIT 1')
    const config = (configRows as Record<string, number>[])[0] || { enabled: 1, displayCount: 2, isRandom: 0 }

    // 如果广告位未开启，返回空数组和 enabled 状态
    if (!config.enabled) {
      return { ads: [], enabled: false }
    }

    // 2. 获取广告列表
    let query = 'SELECT title, image_url as imageUrl, url FROM ads WHERE is_active = 1 '
    if (config.isRandom) {
      query += 'ORDER BY RAND() '
    } else {
      query += 'ORDER BY sort ASC, id DESC '
    }
    query += `LIMIT ${config.displayCount}`

    const [rows] = await pool.execute(query)
    return { ads: rows, enabled: true }
  } catch (error: unknown) {
    console.error('Fetch homepage ads error:', error)
    return { ads: [], enabled: false }
  }
})
