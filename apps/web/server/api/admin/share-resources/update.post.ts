import { getMySqlPool } from '../../../utils/mysql'
import { deleteUploadByUrl } from '../../../utils/uploads'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const id = Number(body?.id)
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '缺少 ID' })
  }

  const title = String(body?.title || '').trim().slice(0, 100)
  const url = String(body?.url || '').trim().slice(0, 500)
  const fileName = String(body?.fileName || '').trim().slice(0, 255)
  const fileSize = Math.max(0, Number(body?.fileSize) || 0)
  const description = String(body?.description || '').trim().slice(0, 500)

  if (!title) {
    throw createError({ statusCode: 400, statusMessage: '请填写资源标题' })
  }
  if (!url) {
    throw createError({ statusCode: 400, statusMessage: '请填写资源地址' })
  }

  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  try {
    const [rows] = await pool.execute('SELECT type, url FROM share_resources WHERE id = ? LIMIT 1', [id])
    const old = (rows as Array<{ type: string; url: string }>)[0]
    if (!old) {
      throw createError({ statusCode: 404, statusMessage: '资源不存在' })
    }

    const oldType = String(old.type)
    const oldUrl = String(old.url || '')

    if (oldType === 'url' && !/^https?:\/\//i.test(url)) {
      throw createError({ statusCode: 400, statusMessage: '资源地址必须以 http:// 或 https:// 开头' })
    }
    if (oldType === 'file' && !url.startsWith('/uploads/')) {
      throw createError({ statusCode: 400, statusMessage: '文件地址非法' })
    }

    // 文件类型：地址变化意味着替换了文件，删除旧物理文件
    if (oldType === 'file' && oldUrl && oldUrl !== url) {
      await deleteUploadByUrl(oldUrl)
    }

    await pool.execute(
      oldType === 'file'
        ? 'UPDATE share_resources SET title = ?, url = ?, file_name = ?, file_size = ?, description = ? WHERE id = ?'
        : 'UPDATE share_resources SET title = ?, url = ?, description = ? WHERE id = ?',
      oldType === 'file'
        ? [title, url, fileName, fileSize, description, id]
        : [title, url, description, id]
    )
    return { success: true }
  } catch (error) {
    const err = error as { statusCode?: number; message?: string }
    if (err?.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: err?.message || '保存资源失败' })
  }
})
