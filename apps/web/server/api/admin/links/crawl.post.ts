import { defineEventHandler, readBody, createError } from 'h3'

/**
 * 带超时的 fetch
 */
async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}): Promise<Response> {
  const { timeout = 5000, ...fetchOptions } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { ...fetchOptions, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * 从 HTML 属性中提取值（支持有引号和无引号的属性）
 */
function extractAttr(html: string, attr: string): string | null {
  const regex = new RegExp(`${attr}=["']([^"']*)["']`, 'i')
  const match = html.match(regex)
  if (match?.[1]) return match[1]

  const noQuoteRegex = new RegExp(`${attr}=([^\\s>]+)`, 'i')
  const noQuoteMatch = html.match(noQuoteRegex)
  return noQuoteMatch?.[1] ?? null
}

/**
 * 解析图标 URL，处理相对路径
 */
function resolveIconUrl(href: string, baseUrl: string): string {
  if (href.startsWith('http')) return href
  if (href.startsWith('//')) return 'https:' + href
  const urlObj = new URL(baseUrl)
  if (href.startsWith('/')) return `${urlObj.protocol}//${urlObj.host}${href}`
  return `${urlObj.protocol}//${urlObj.host}/${href}`
}

/**
 * 从网页中提取所有候选图标 URL
 */
function extractCandidateIcons(html: string, baseUrl: string): string[] {
  const candidates: string[] = []
  const linkTags = html.match(/<link[^>]*>/gi) || []

  // 优先级顺序：shortcut icon > icon > apple-touch-icon
  // shortcut icon 是真正的 favicon，最稳定
  // apple-touch-icon 是大图，可能有防盗链问题
  const iconPriorities = [
    /rel=["']shortcut icon["']/i,
    /rel=["']icon["']/i,
    /rel=["']apple-touch-icon["']/i
  ]

  for (const pattern of iconPriorities) {
    for (const tag of linkTags) {
      if (pattern.test(tag)) {
        const href = extractAttr(tag, 'href')
        if (href) candidates.push(resolveIconUrl(href, baseUrl))
      }
    }
  }

  return candidates
}

/**
 * 验证图标 URL 是否可访问
 */
async function validateIconUrl(url: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(url, { method: 'HEAD', timeout: 2000 })
    return response.ok
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const { url } = await readBody(event)

  if (!url || !url.startsWith('http')) {
    throw createError({ statusCode: 400, statusMessage: '无效的 URL' })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    throw createError({ statusCode: 400, statusMessage: '无效的 URL 格式' })
  }

  const defaultFavicon = `${parsedUrl.protocol}//${parsedUrl.host}/favicon.ico`

  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 8000
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    // 1. 获取标题
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const title = titleMatch?.[1]?.replace(/<[^>]+>/g, '').trim() ?? ''

    // 2. 获取描述
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*>/i)
    const description = descMatch ? (extractAttr(descMatch[0], 'content') ?? '') : ''

    // 3. 获取所有候选图标并验证可访问性
    const candidateIcons = extractCandidateIcons(html, url)
    candidateIcons.push(defaultFavicon) // 添加默认 favicon 作为兜底

    let iconUrl = ''
    for (const candidate of candidateIcons) {
      if (await validateIconUrl(candidate)) {
        iconUrl = candidate
        break
      }
    }

    // 检查 URL 长度限制
    const maxIconUrlLength = 500
    if (iconUrl.length > maxIconUrlLength) {
      iconUrl = ''
    }

    return {
      title,
      description,
      iconUrl,
      url: response.url || url
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `爬取失败: ${error.message}`
    })
  }
})
