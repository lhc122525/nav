import { getMySqlPool } from '../../../utils/mysql'

// 字段长度限制
const MAX_TITLE_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 765
const MAX_ICON_URL_LENGTH = 500

type UpdateLinkBody = {
  categoryId?: number | null
  title?: string
  url?: string
  description?: string
  iconUrl?: string
  isActive?: boolean
  isRecommended?: boolean
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

  const title = body?.title != null ? String(body.title).trim().slice(0, MAX_TITLE_LENGTH) : undefined
  const url = body?.url != null ? String(body.url).trim() : undefined
  const description = body?.description != null ? String(body.description).trim().slice(0, MAX_DESCRIPTION_LENGTH) : undefined
  const iconUrl = body?.iconUrl != null ? String(body.iconUrl).trim().slice(0, MAX_ICON_URL_LENGTH) : undefined
  const isActive = body?.isActive != null ? Boolean(body.isActive) : undefined
  const isRecommended = body?.isRecommended != null ? Boolean(body.isRecommended) : undefined
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
  if (isRecommended !== undefined) {
    fields.push('is_recommended = ?')
    values.push(isRecommended ? 1 : 0)
  }
  if (sort !== undefined) {
    fields.push('sort = ?')
    values.push(Number.isFinite(sort) ? sort : 0)
  }

  if (fields.length === 0) return { ok: true }

  values.push(id)
  try {
    await pool.execute(`UPDATE links SET ${fields.join(', ')} WHERE id = ?`, values)
  } catch (e: unknown) {
    const anyError = e as { code?: unknown; message?: unknown }
    if (anyError?.code !== 'ER_BAD_FIELD_ERROR') throw e
    if (!String(anyError?.message || '').includes('is_recommended')) throw e

    const degradedFields: string[] = []
    const degradedValues: Array<string | number | null> = []
    for (let i = 0; i < fields.length; i += 1) {
      const f = fields[i]!
      const v = values[i]!
      if (f === 'is_recommended = ?') continue
      degradedFields.push(f)
      degradedValues.push(v)
    }

    if (degradedFields.length === 0) return { ok: true }
    degradedValues.push(id)
    await pool.execute(`UPDATE links SET ${degradedFields.join(', ')} WHERE id = ?`, degradedValues)
  }
  return { ok: true }
})
