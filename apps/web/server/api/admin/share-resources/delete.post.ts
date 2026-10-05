import { getMySqlPool } from '../../../utils/mysql'
import { deleteUploadByUrl } from '../../../utils/uploads'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const id = Number(body?.id)
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '缺少 ID' })
  }

  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  try {
    const [rows] = await pool.execute('SELECT type, url FROM share_resources WHERE id = ? LIMIT 1', [id])
    const row = (rows as Array<{ type: string; url: string }>)[0]
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: '资源不存在' })
    }

    // 真实删除：先删记录，再清理物理文件（尽力删除）
    await pool.execute('DELETE FROM share_resources WHERE id = ?', [id])
    if (String(row.type) === 'file') {
      await deleteUploadByUrl(String(row.url || ''))
    }
    return { success: true }
  } catch (error) {
    const err = error as { statusCode?: number; message?: string }
    if (err?.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: err?.message || '删除资源失败' })
  }
})
