import { getMySqlPool } from '../../../utils/mysql'

type UpdateSearchCategoryBody = {
  name?: string
  sort?: number
}

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '缺少 ID' })
  }

  const body = (await readBody(event)) as UpdateSearchCategoryBody
  const name = String(body?.name || '').trim()
  const sort = Number(body?.sort || 0)

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: '名称不能为空' })
  }

  try {
    await pool.execute(
      'UPDATE search_categories SET name = ?, sort = ? WHERE id = ?',
      [name, Number.isFinite(sort) ? sort : 0, id]
    )
    return { success: true }
  } catch (e: unknown) {
    throw createError({ statusCode: 500, statusMessage: '更新失败' })
  }
})
