import { getMySqlPool } from '../../../utils/mysql'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '缺少 ID' })
  }

  try {
    await pool.execute('DELETE FROM search_engines WHERE id = ?', [id])
    return { success: true }
  } catch (e: unknown) {
    throw createError({ statusCode: 500, statusMessage: '删除失败' })
  }
})
