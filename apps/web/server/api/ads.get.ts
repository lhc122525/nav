import { getMySqlPool } from '../utils/mysql'

export default defineEventHandler(async () => {
  const pool = getMySqlPool()
  if (!pool) {
    return { ads: [], enabled: false }
  }

  const toNumber = (value: unknown, fallback: number) => {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
  }

  const isUnknownColumn = (error: unknown, column: string) => {
    const e = error as { code?: unknown; message?: unknown; sqlMessage?: unknown }
    if (e?.code === 'ER_BAD_FIELD_ERROR') {
      const msg = String(e.sqlMessage || e.message || '')
      return msg.includes(`Unknown column '${column}'`)
    }
    return false
  }

  try {
    // 1. 获取配置
    let config: { enabled: number; displayCount: number; isRandom: number } = { enabled: 1, displayCount: 2, isRandom: 0 }
    try {
      const [configRows] = await pool.execute(
        'SELECT enabled, display_count as displayCount, is_random as isRandom FROM ad_configs LIMIT 1'
      )
      const row = (configRows as Array<Record<string, unknown>>)[0]
      if (row) {
        config = {
          enabled: toNumber(row.enabled, 1),
          displayCount: toNumber(row.displayCount, 2),
          isRandom: toNumber(row.isRandom, 0)
        }
      }
    } catch (e: unknown) {
      if (!isUnknownColumn(e, 'enabled')) throw e

      const [configRows] = await pool.execute(
        'SELECT display_count as displayCount, is_random as isRandom FROM ad_configs LIMIT 1'
      )
      const row = (configRows as Array<Record<string, unknown>>)[0]
      if (row) {
        config = {
          enabled: 1,
          displayCount: toNumber(row.displayCount, 2),
          isRandom: toNumber(row.isRandom, 0)
        }
      }
    }

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
