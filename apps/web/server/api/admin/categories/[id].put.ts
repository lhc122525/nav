import { getMySqlPool } from '../../../utils/mysql'

type UpdateCategoryBody = {
  parentId?: number | null
  name?: string
  slug?: string
  sort?: number
}

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: '无效的 ID' })
  }

  const body = (await readBody(event)) as UpdateCategoryBody
  const parentId = body?.parentId !== undefined ? (body.parentId != null ? Number(body.parentId) : null) : undefined
  const name = body?.name != null ? String(body.name).trim() : undefined
  const slug = body?.slug != null ? String(body.slug).trim() : undefined
  const sort = body?.sort != null ? Number(body.sort) : undefined

  if (name !== undefined && name.length === 0) {
    throw createError({ statusCode: 400, statusMessage: '名称不能为空' })
  }
  if (slug !== undefined && slug.length === 0) {
    throw createError({ statusCode: 400, statusMessage: '标识不能为空' })
  }

  const fields: string[] = []
  const values: Array<string | number | null> = []

  if (parentId !== undefined) {
    fields.push('parent_id = ?')
    values.push(parentId)
  }
  if (name !== undefined) {
    fields.push('name = ?')
    values.push(name)
  }
  if (slug !== undefined) {
    fields.push('slug = ?')
    values.push(slug)
  }
  if (sort !== undefined) {
    fields.push('sort = ?')
    values.push(Number.isFinite(sort) ? sort : 0)
  }

  if (fields.length === 0) return { ok: true }

  values.push(id)
  try {
    const [result] = await pool.execute(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values)
    if (Number((result as { affectedRows?: number }).affectedRows) === 0) {
      throw createError({ statusCode: 404, statusMessage: '未找到' })
    }
    return { ok: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('Duplicate')) {
      throw createError({ statusCode: 409, statusMessage: '标识已存在' })
    }
    throw e
  }
})
