import { getMySqlPool } from '../../../utils/mysql'

type HandleSubmissionBody = {
  action?: 'approve' | 'reject'
  categoryId?: number | null
  title?: string
  description?: string
  iconUrl?: string
  sort?: number
}

export default defineEventHandler(async (event) => {
  const u = event.context.adminUser as { id: number } | undefined
  if (!u) {
    throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'invalid id' })
  }

  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: 'MySQL is disabled' })
  }

  const body = (await readBody(event)) as HandleSubmissionBody
  const action = body?.action
  if (action !== 'approve' && action !== 'reject') {
    throw createError({ statusCode: 400, statusMessage: 'invalid action' })
  }

  const [rows] = await pool.execute(
    'SELECT id, title, url, description, status FROM submissions WHERE id = ? LIMIT 1',
    [id]
  )
  const row = (rows as Array<Record<string, unknown>>)[0]
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'not found' })
  }

  const currentStatus = String(row.status || '')
  if (currentStatus !== 'pending') {
    throw createError({ statusCode: 409, statusMessage: 'already handled' })
  }

  if (action === 'reject') {
    await pool.execute(
      "UPDATE submissions SET status = 'rejected', handled_by = ?, handled_at = NOW() WHERE id = ?",
      [u.id, id]
    )
    return { ok: true }
  }

  const title = body?.title != null ? String(body.title).trim() : String(row.title || '').trim()
  const description =
    body?.description != null ? String(body.description).trim() : String(row.description || '').trim()
  const iconUrl = String(body?.iconUrl || '').trim()
  const sort = Number(body?.sort || 0)

  const categoryIdRaw = body?.categoryId
  const categoryId =
    categoryIdRaw == null ? null : Number.isFinite(Number(categoryIdRaw)) ? Number(categoryIdRaw) : null

  try {
    await pool.execute(
      'INSERT INTO links (category_id, title, url, description, icon_url, is_active, sort) VALUES (?, ?, ?, ?, ?, 1, ?)',
      [
        categoryId,
        title,
        String(row.url || ''),
        description,
        iconUrl,
        Number.isFinite(sort) ? sort : 0
      ]
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('Duplicate')) {
      throw createError({ statusCode: 409, statusMessage: 'link already exists' })
    }
    throw createError({ statusCode: 500, statusMessage: 'approve failed' })
  }

  await pool.execute(
    "UPDATE submissions SET status = 'approved', handled_by = ?, handled_at = NOW() WHERE id = ?",
    [u.id, id]
  )

  return { ok: true }
})

