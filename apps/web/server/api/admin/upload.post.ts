import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { readMultipartFormData } from 'h3'

// 获取 public/uploads 目录的绝对路径
// 开发环境: apps/web/public/uploads
// 生产环境: nav/public/uploads (与 server 目录同级)
const getUploadBaseDir = (): string => {
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

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  if (!form) {
    throw createError({ statusCode: 400, statusMessage: '请上传文件' })
  }

  const file =
    form.find((p) => p.name === 'file') ||
    form.find((p) => Boolean(p.filename)) ||
    form.find((p) => p.type === 'file')
  if (!file || !file.data) {
    throw createError({ statusCode: 400, statusMessage: '请上传文件' })
  }

  const scopeField = form.find((p) => p.name === 'scope')
  const scope = String(scopeField?.data?.toString() || 'misc').replace(/[^a-z0-9_-]/gi, '').slice(0, 32) || 'misc'

  const originalName = String(file.filename || '')
  const inputExt = extname(originalName).toLowerCase()
  const ext = inputExt && inputExt.length <= 10 ? inputExt : '.png'
  const filename = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`

  const uploadDir = join(getUploadBaseDir(), scope)
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, filename), file.data)

  return { url: `/uploads/${scope}/${filename}` }
})
