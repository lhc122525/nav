import { getMySqlPool } from '../../../utils/mysql'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id } = body

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '缺少 ID' })
  }

  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  try {
    await pool.execute('DELETE FROM ads WHERE id = ?', [id])
    return { success: true }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
