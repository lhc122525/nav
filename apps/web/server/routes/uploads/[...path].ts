import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { getUploadBaseDir } from '../../utils/uploads'

// 生产环境 Nitro 仅按构建期清单服务 public 静态资源，
// 运行期上传写入的文件（/uploads/share/** 等）需要显式路由按磁盘实时读取。
// 该路由匹配 /uploads/**，优先于内置静态资源处理器。

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.zip': 'application/zip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',
  '.gz': 'application/gzip',
  '.tar': 'application/x-tar',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.json': 'application/json'
}

export default defineEventHandler(async (event) => {
  const rel = decodeURIComponent(String(getRouterParam(event, 'path') || ''))
  if (!rel || rel.includes('..') || rel.includes('\\')) {
    throw createError({ statusCode: 400, statusMessage: '非法路径' })
  }

  const filePath = join(getUploadBaseDir(), rel)
  const stats = await stat(filePath).catch(() => null)
  if (!stats || !stats.isFile()) {
    throw createError({ statusCode: 404, statusMessage: '文件不存在' })
  }

  const contentType = MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream'
  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Accept-Ranges', 'bytes')

  const rangeHeader = getRequestHeader(event, 'range')
  const rangeMatch = rangeHeader ? /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim()) : null

  if (rangeMatch) {
    const [, rawStart, rawEnd] = rangeMatch
    let start = rawStart ? Number(rawStart) : 0
    let end = rawEnd ? Number(rawEnd) : stats.size - 1

    if (!rawStart && rawEnd) {
      start = Math.max(0, stats.size - Number(rawEnd))
      end = stats.size - 1
    }

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= stats.size) {
      setHeader(event, 'Content-Range', `bytes */${stats.size}`)
      throw createError({ statusCode: 416, statusMessage: 'Range Not Satisfiable' })
    }

    end = Math.min(end, stats.size - 1)
    setHeader(event, 'Content-Range', `bytes ${start}-${end}/${stats.size}`)
    setHeader(event, 'Content-Length', end - start + 1)

    if (getMethod(event) === 'HEAD') {
      setResponseStatus(event, 206)
      return ''
    }

    setResponseStatus(event, 206)
    return sendStream(event, createReadStream(filePath, { start, end }))
  }

  setHeader(event, 'Content-Length', stats.size)
  if (getMethod(event) === 'HEAD') {
    return ''
  }

  return sendStream(event, createReadStream(filePath))
})
