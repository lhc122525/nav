import { getMySqlPool } from '../../utils/mysql'

type CreateLinkBody = {
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
    throw createError({ statusCode: 400, statusMessage: 'MySQL is disabled' })
  }

  const body = (await readBody(event)) as CreateLinkBody
  const title = String(body?.title || '').trim()
  const url = String(body?.url || '').trim()
  const description = String(body?.description || '').trim()
  const iconUrl = String(body?.iconUrl || '').trim()
  const isActive = body?.isActive == null ? true : Boolean(body.isActive)
  const sort = Number(body?.sort || 0)

  const categoryIdRaw = body?.categoryId
  const categoryId =
    categoryIdRaw == null ? null : Number.isFinite(Number(categoryIdRaw)) ? Number(categoryIdRaw) : null

  if (!title || !url) {
    throw createError({ statusCode: 400, statusMessage: 'title and url are required' })
  }

  const [result] = await pool.execute(
    'INSERT INTO links (category_id, title, url, description, icon_url, is_active, sort) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      categoryId,
      title,
      url,
      description,
      iconUrl,
      isActive ? 1 : 0,
      Number.isFinite(sort) ? sort : 0
    ]
  )

  return { id: Number((result as { insertId?: number }).insertId) }
})

