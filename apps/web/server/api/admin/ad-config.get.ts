import { getMySqlPool } from '../../utils/mysql'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM ad_configs LIMIT 1')
    const config = (rows as any[])[0]
    
    if (!config) {
      // 默认配置
      return { display_count: 2, is_random: 0 }
    }
    
    return config
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
