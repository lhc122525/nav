import { getMySqlPool } from '../../utils/mysql'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { enabled, displayCount, isRandom } = body

  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  // 正确处理布尔值转换
  const enabledValue = enabled === true || enabled === 1 || enabled === 'true' ? 1 : 0
  const isRandomValue = isRandom === true || isRandom === 1 || isRandom === 'true' ? 1 : 0
  const displayCountValue = Number(displayCount) || 2

  const isUnknownColumn = (error: unknown, column: string) => {
    const e = error as { code?: unknown; message?: unknown; sqlMessage?: unknown }
    if (e?.code === 'ER_BAD_FIELD_ERROR') {
      const msg = String(e.sqlMessage || e.message || '')
      return msg.includes(`Unknown column '${column}'`)
    }
    return false
  }

  try {
    const [rows] = await pool.execute('SELECT id FROM ad_configs LIMIT 1')
    const config = (rows as any[])[0]

    if (config) {
      try {
        await pool.execute(
          'UPDATE ad_configs SET enabled = ?, display_count = ?, is_random = ? WHERE id = ?',
          [enabledValue, displayCountValue, isRandomValue, config.id]
        )
      } catch (e: unknown) {
        if (!isUnknownColumn(e, 'enabled')) throw e
        await pool.execute('UPDATE ad_configs SET display_count = ?, is_random = ? WHERE id = ?', [
          displayCountValue,
          isRandomValue,
          config.id
        ])
      }
    } else {
      try {
        await pool.execute(
          'INSERT INTO ad_configs (enabled, display_count, is_random) VALUES (?, ?, ?)',
          [enabledValue, displayCountValue, isRandomValue]
        )
      } catch (e: unknown) {
        if (!isUnknownColumn(e, 'enabled')) throw e
        await pool.execute('INSERT INTO ad_configs (display_count, is_random) VALUES (?, ?)', [
          displayCountValue,
          isRandomValue
        ])
      }
    }

    return { success: true }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
