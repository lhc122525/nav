import { getMySqlPool } from '../../../utils/mysql'

type HandleSubmissionBody = {
  action?: 'approve' | 'reject'
  status?: 'approved' | 'rejected'
  isIncluded?: boolean
  categoryId?: number | null
  title?: string
  description?: string
  iconUrl?: string
  sort?: number
}

export default defineEventHandler(async (event) => {
  const u = event.context.adminUser as { id: number } | undefined
  if (!u) {
    throw createError({ statusCode: 401, statusMessage: '未登录' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: '无效的 ID' })
  }

  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const body = (await readBody(event)) as HandleSubmissionBody

  // 简单更新状态或收录状态
  if (body.status !== undefined || body.isIncluded !== undefined) {
    const setParts: string[] = []
    const params: (string | number)[] = []

    if (body.status !== undefined) {
      setParts.push('status = ?')
      params.push(body.status)
    }
    if (body.isIncluded !== undefined) {
      setParts.push('is_included = ?')
      params.push(body.isIncluded ? 1 : 0)
    }
    if (setParts.length === 0) {
      throw createError({ statusCode: 400, statusMessage: '无更新内容' })
    }

    setParts.push('handled_by = ?', 'handled_at = NOW()')
    params.push(u.id, id)

    await pool.execute(
      `UPDATE submissions SET ${setParts.join(', ')} WHERE id = ?`,
      params
    )
    return { ok: true }
  }

  // 原有的 action 逻辑
  const action = body?.action
  if (action !== 'approve' && action !== 'reject') {
    throw createError({ statusCode: 400, statusMessage: '无效的操作' })
  }

  const [rows] = await pool.execute(
    'SELECT id, title, url, description, status FROM submissions WHERE id = ? LIMIT 1',
    [id]
  )
  const row = (rows as Array<Record<string, unknown>>)[0]
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: '未找到' })
  }

  const currentStatus = String(row.status || '')
  if (currentStatus !== 'pending') {
    throw createError({ statusCode: 409, statusMessage: '已处理' })
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
      throw createError({ statusCode: 409, statusMessage: '链接已存在' })
    }
    throw createError({ statusCode: 500, statusMessage: '审核通过失败' })
  }

  await pool.execute(
    "UPDATE submissions SET status = 'approved', is_included = 1, handled_by = ?, handled_at = NOW() WHERE id = ?",
    [u.id, id]
  )

  return { ok: true }
})
