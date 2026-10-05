import { getMySqlPool } from '../../../utils/mysql'
import type { ResultSetHeader } from 'mysql2/promise'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const title = String(body?.title || '').trim().slice(0, 100)
  const type = body?.type === 'file' ? 'file' : 'url'
  const url = String(body?.url || '').trim().slice(0, 500)
  const fileName = String(body?.fileName || '').trim().slice(0, 255)
  const fileSize = Math.max(0, Number(body?.fileSize) || 0)
  const description = String(body?.description || '').trim().slice(0, 500)

  if (!title) {
    throw createError({ statusCode: 400, statusMessage: '请填写资源标题' })
  }
  if (!url) {
    throw createError({ statusCode: 400, statusMessage: type === 'file' ? '请上传文件' : '请填写资源地址' })
  }
  if (type === 'url' && !/^https?:\/\//i.test(url)) {
    throw createError({ statusCode: 400, statusMessage: '资源地址必须以 http:// 或 https:// 开头' })
  }
  if (type === 'file' && !url.startsWith('/uploads/')) {
    throw createError({ statusCode: 400, statusMessage: '文件地址非法' })
  }

  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO share_resources (title, type, url, file_name, file_size, description) VALUES (?, ?, ?, ?, ?, ?)',
      [title, type, url, type === 'file' ? fileName : '', type === 'file' ? fileSize : 0, description]
    )
    return { success: true, id: (result as ResultSetHeader).insertId }
  } catch (error) {
    const err = error as { message?: string }
    throw createError({ statusCode: 500, statusMessage: err?.message || '新增资源失败' })
  }
})
