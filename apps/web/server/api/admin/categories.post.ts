import { getMySqlPool } from '../../utils/mysql'

type CreateCategoryBody = {
  name?: string
  slug?: string
  sort?: number
}

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const body = (await readBody(event)) as CreateCategoryBody
  const name = String(body?.name || '').trim()
  const slug = String(body?.slug || '').trim()
  const sort = Number(body?.sort || 0)

  if (!name || !slug) {
    throw createError({ statusCode: 400, statusMessage: '名称和标识不能为空' })
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO categories (name, slug, sort) VALUES (?, ?, ?)',
      [name, slug, Number.isFinite(sort) ? sort : 0]
    )
    return { id: Number((result as { insertId?: number }).insertId) }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '创建失败'
    if (msg.includes('Duplicate')) {
      throw createError({ statusCode: 409, statusMessage: '标识已存在' })
    }
    throw createError({ statusCode: 500, statusMessage: '创建失败' })
  }
})
