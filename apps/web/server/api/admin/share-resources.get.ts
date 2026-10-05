import { getMySqlPool } from '../../utils/mysql'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 10))
  const keyword = String(query.keyword || '').trim().slice(0, 100)
  const offset = (page - 1) * pageSize

  try {
    const like = `%${keyword}%`
    const [countRows] = await pool.execute(
      keyword
        ? 'SELECT COUNT(*) AS total FROM share_resources WHERE title LIKE ?'
        : 'SELECT COUNT(*) AS total FROM share_resources',
      keyword ? [like] : []
    )
    const total = Number((countRows as Array<{ total: number }>)[0]?.total || 0)

    // mysql2 预编译(execute)不支持 LIMIT ? 占位符，列表查询使用 query
    const [rows] = await pool.query(
      keyword
        ? 'SELECT * FROM share_resources WHERE title LIKE ? ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?'
        : 'SELECT * FROM share_resources ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?',
      keyword ? [like, pageSize, offset] : [pageSize, offset]
    )
    return { list: rows, total }
  } catch (error) {
    const err = error as { message?: string }
    throw createError({ statusCode: 500, statusMessage: err?.message || '加载分享资源失败' })
  }
})
