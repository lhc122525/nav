import { getMySqlPool } from '../utils/mysql'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    return { ads: [] }
  }

  try {
    // 1. 获取配置
    const [configRows] = await pool.execute('SELECT display_count as displayCount, is_random as isRandom FROM ad_configs LIMIT 1')
    const config = (configRows as any[])[0] || { displayCount: 2, isRandom: 0 }
    
    // 2. 获取广告列表
    let query = 'SELECT title, image_url as imageUrl, url FROM ads WHERE is_active = 1 '
    if (config.isRandom) {
      query += 'ORDER BY RAND() '
    } else {
      query += 'ORDER BY sort ASC, id DESC '
    }
    query += `LIMIT ${config.displayCount}`
    
    const [rows] = await pool.execute(query)
    return { ads: rows }
  } catch (error: any) {
    console.error('Fetch homepage ads error:', error)
    return { ads: [] }
  }
})
