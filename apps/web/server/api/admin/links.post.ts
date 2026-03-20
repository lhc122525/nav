import { getMySqlPool } from '../../utils/mysql'

type CreateLinkBody = {
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

  const body = (await readBody(event)) as CreateLinkBody
  const title = String(body?.title || '').trim()
  const url = String(body?.url || '').trim()
  const description = String(body?.description || '').trim()
  const iconUrl = String(body?.iconUrl || '').trim()
  const isActive = body?.isActive == null ? true : Boolean(body.isActive)
  const isRecommended = body?.isRecommended == null ? false : Boolean(body.isRecommended)
  const sort = Number(body?.sort || 0)

  const categoryIdRaw = body?.categoryId
  const categoryId =
    categoryIdRaw == null ? null : Number.isFinite(Number(categoryIdRaw)) ? Number(categoryIdRaw) : null

  if (!title || !url) {
    throw createError({ statusCode: 400, statusMessage: '标题和链接不能为空' })
  }

  let result: unknown
  try {
    ;[result] = await pool.execute(
      'INSERT INTO links (category_id, title, url, description, icon_url, is_active, is_recommended, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        categoryId,
        title,
        url,
        description,
        iconUrl,
        isActive ? 1 : 0,
        isRecommended ? 1 : 0,
        Number.isFinite(sort) ? sort : 0
      ]
    )
  } catch (e: unknown) {
    const anyError = e as { code?: unknown; message?: unknown }
    if (anyError?.code !== 'ER_BAD_FIELD_ERROR') throw e
    if (String(anyError?.message || '').includes('is_recommended')) {
      ;[result] = await pool.execute(
        'INSERT INTO links (category_id, title, url, description, icon_url, is_active, sort) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [categoryId, title, url, description, iconUrl, isActive ? 1 : 0, Number.isFinite(sort) ? sort : 0]
      )
    } else {
      throw e
    }
  }

  return { id: Number((result as { insertId?: number }).insertId) }
})
