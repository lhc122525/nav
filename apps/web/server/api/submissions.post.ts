import { getMySqlPool } from '../utils/mysql'

type CreateSubmissionBody = {
  title?: string
  url?: string
  description?: string
  contact?: string
}

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const body = (await readBody(event)) as CreateSubmissionBody
  const title = String(body?.title || '').trim()
  const url = String(body?.url || '').trim()
  const description = String(body?.description || '').trim()
  const contact = String(body?.contact || '').trim()

  if (!title || !url) {
    throw createError({ statusCode: 400, statusMessage: '标题和链接不能为空' })
  }

  const [dupRows] = await pool.execute(
    `SELECT id FROM submissions
     WHERE url = ? AND status = 'pending' AND created_at >= (NOW() - INTERVAL 1 HOUR)
     LIMIT 1`,
    [url]
  )
  if ((dupRows as Array<Record<string, unknown>>).length > 0) {
    throw createError({ statusCode: 409, statusMessage: '请勿重复提交' })
  }

  const [result] = await pool.execute(
    'INSERT INTO submissions (title, url, description, contact, status) VALUES (?, ?, ?, ?, ?)',
    [title, url, description, contact, 'pending']
  )

  return { id: Number((result as { insertId?: number }).insertId), ok: true }
})
