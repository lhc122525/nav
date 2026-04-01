import { getMySqlPool } from '../../utils/mysql'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM ads ORDER BY sort ASC, id DESC')
    return rows
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
