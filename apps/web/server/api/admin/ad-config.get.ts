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
      return { enabled: true, displayCount: 2, isRandom: false }
    }

    return {
      enabled: config.enabled == null ? true : Boolean(config.enabled),
      displayCount: config.display_count == null ? 2 : Number(config.display_count),
      isRandom: config.is_random == null ? false : Boolean(config.is_random)
    }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
