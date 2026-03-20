import { getMySqlPool } from '../../../utils/mysql'

type UpdateLinkBody = {
  categoryId?: number | null
  title?: string
  url?: string
  description?: string
  iconUrl?: string
  isActive?: boolean
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

  const body = (await readBody(event)) as UpdateLinkBody

  const title = body?.title != null ? String(body.title).trim() : undefined
  const url = body?.url != null ? String(body.url).trim() : undefined
  const description = body?.description != null ? String(body.description).trim() : undefined
  const iconUrl = body?.iconUrl != null ? String(body.iconUrl).trim() : undefined
  const isActive = body?.isActive != null ? Boolean(body.isActive) : undefined
  const sort = body?.sort != null ? Number(body.sort) : undefined

  const categoryIdRaw = body?.categoryId
  const categoryId =
    categoryIdRaw === undefined
      ? undefined
      : categoryIdRaw == null
        ? null
        : Number.isFinite(Number(categoryIdRaw))
          ? Number(categoryIdRaw)
          : null

  if (title !== undefined && title.length === 0) {
    throw createError({ statusCode: 400, statusMessage: '标题不能为空' })
  }
  if (url !== undefined && url.length === 0) {
    throw createError({ statusCode: 400, statusMessage: '链接不能为空' })
  }

  const fields: string[] = []
  const values: Array<string | number | null> = []

  if (categoryId !== undefined) {
    fields.push('category_id = ?')
    values.push(categoryId)
  }
  if (title !== undefined) {
    fields.push('title = ?')
    values.push(title)
  }
  if (url !== undefined) {
    fields.push('url = ?')
    values.push(url)
  }
  if (description !== undefined) {
    fields.push('description = ?')
    values.push(description)
  }
  if (iconUrl !== undefined) {
    fields.push('icon_url = ?')
    values.push(iconUrl)
  }
  if (isActive !== undefined) {
    fields.push('is_active = ?')
    values.push(isActive ? 1 : 0)
  }
  if (sort !== undefined) {
    fields.push('sort = ?')
    values.push(Number.isFinite(sort) ? sort : 0)
  }

  if (fields.length === 0) return { ok: true }

  values.push(id)
  await pool.execute(`UPDATE links SET ${fields.join(', ')} WHERE id = ?`, values)
  return { ok: true }
})
