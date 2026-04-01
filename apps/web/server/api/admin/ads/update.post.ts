import { getMySqlPool } from '../../../utils/mysql'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id, title, imageUrl, url, sort, isActive } = body

  if (!id || !title || !imageUrl || !url) {
    throw createError({ statusCode: 400, statusMessage: '缺少必要字段' })
  }

  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  try {
    await pool.execute(
      'UPDATE ads SET title = ?, image_url = ?, url = ?, sort = ?, is_active = ? WHERE id = ?',
      [title, imageUrl, url, sort || 0, isActive === false ? 0 : 1, id]
    )
    return { success: true }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
