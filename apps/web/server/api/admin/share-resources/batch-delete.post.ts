import { getMySqlPool } from '../../../utils/mysql'
import { deleteUploadByUrl } from '../../../utils/uploads'
import type { ResultSetHeader } from 'mysql2/promise'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const ids = Array.isArray(body?.ids)
    ? body.ids.map(Number).filter((n: number) => Number.isInteger(n) && n > 0)
    : []
  if (!ids.length) {
    throw createError({ statusCode: 400, statusMessage: '请选择要删除的资源' })
  }

  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  try {
    const placeholders = ids.map(() => '?').join(',')
    const [rows] = await pool.execute(
      `SELECT type, url FROM share_resources WHERE id IN (${placeholders})`,
      ids
    )

    // 真实删除：先删记录，再清理物理文件（尽力删除）
    const [result] = await pool.execute(
      `DELETE FROM share_resources WHERE id IN (${placeholders})`,
      ids
    )
    const deleted = Number((result as ResultSetHeader).affectedRows || 0)

    const fileRows = rows as Array<{ type: string; url: string }>
    for (const row of fileRows) {
      if (String(row.type) === 'file') {
        await deleteUploadByUrl(String(row.url || ''))
      }
    }
    return { success: true, deleted }
  } catch (error) {
    const err = error as { statusCode?: number; message?: string }
    if (err?.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: err?.message || '批量删除失败' })
  }
})
