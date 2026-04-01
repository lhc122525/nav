import { getMySqlPool } from '../../utils/mysql'

type CreateSearchCategoryBody = {
  name?: string
  sort?: number
}

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const body = (await readBody(event)) as CreateSearchCategoryBody
  const name = String(body?.name || '').trim()
  const sort = Number(body?.sort || 0)

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: '名称不能为空' })
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO search_categories (name, sort) VALUES (?, ?)',
      [name, Number.isFinite(sort) ? sort : 0]
    )
    return { id: Number((result as { insertId?: number }).insertId) }
  } catch (e: unknown) {
    throw createError({ statusCode: 500, statusMessage: '创建失败' })
  }
})
