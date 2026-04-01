import { getMySqlPool } from '../../../utils/mysql'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { title, imageUrl, url, sort, isActive } = body

  if (!title || !imageUrl || !url) {
    throw createError({ statusCode: 400, statusMessage: '缺少必要字段' })
  }

  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO ads (title, image_url, url, sort, is_active) VALUES (?, ?, ?, ?, ?)',
      [title, imageUrl, url, sort || 0, isActive === false ? 0 : 1]
    )
    return { success: true, id: (result as any).insertId }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
