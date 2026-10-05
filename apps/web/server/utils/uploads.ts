import { existsSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'

// 获取 public/uploads 目录的绝对路径
// 开发环境: apps/web/public/uploads
// 生产环境: nav/public/uploads (与 server 目录同级)
export const getUploadBaseDir = (): string => {
  // 优先使用环境变量
  if (process.env.NUXT_UPLOAD_DIR) {
    return process.env.NUXT_UPLOAD_DIR
  }

  // 尝试相对于当前工作目录
  const cwdUploads = join(process.cwd(), 'public', 'uploads')
  if (existsSync(join(process.cwd(), 'public'))) {
    return cwdUploads
  }

  // 生产环境: server 和 public 是同级目录
  // 从 server 目录向上一级，然后进入 public/uploads
  const siblingUploads = join(process.cwd(), '..', 'public', 'uploads')
  if (existsSync(join(process.cwd(), '..', 'public'))) {
    return siblingUploads
  }

  // 兜底: 创建相对于 cwd 的路径
  return cwdUploads
}

/**
 * 根据站点上传地址（/uploads/<scope>/<file>）删除对应物理文件。
 * 仅处理本站 /uploads/ 开头的地址；含路径穿越（..）的地址直接忽略。
 * 文件不存在或删除失败不抛错（尽力清理）。
 */
export const deleteUploadByUrl = async (url: string): Promise<void> => {
  if (!url || typeof url !== 'string') return
  if (!url.startsWith('/uploads/')) return

  const relative = url.slice('/uploads/'.length)
  if (!relative || relative.includes('..')) return

  const filePath = join(getUploadBaseDir(), relative)
  try {
    await unlink(filePath)
  } catch {
    // 文件不存在或删除失败时静默忽略
  }
}
