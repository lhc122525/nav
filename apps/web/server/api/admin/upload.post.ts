import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { readMultipartFormData } from 'h3'
import { getUploadBaseDir } from '../../utils/uploads'

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
