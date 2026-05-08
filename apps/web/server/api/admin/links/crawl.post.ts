import { defineEventHandler, readBody, createError } from 'h3'

/**
 * 从 HTML 属性中提取值
 */
function extractAttr(html: string, attr: string): string | null {
  // 匹配 attr="value" 或 attr='value'
  const regex = new RegExp(`${attr}=["']([^"']*)["']`, 'i')
  const match = html.match(regex)
  return match?.[1] ?? null
}

/**
 * 解析图标 URL，处理相对路径
 */
function resolveIconUrl(href: string, baseUrl: string): string {
  if (href.startsWith('http')) {
    return href
  }
  if (href.startsWith('//')) {
    return 'https:' + href
  }
  const urlObj = new URL(baseUrl)
  if (href.startsWith('/')) {
    return `${urlObj.protocol}//${urlObj.host}${href}`
  }
  return `${urlObj.protocol}//${urlObj.host}/${href}`
}

export default defineEventHandler(async (event) => {
  const { url } = await readBody(event)

  if (!url || !url.startsWith('http')) {
    throw createError({ statusCode: 400, statusMessage: '无效的 URL' })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000) // 10s timeout
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

    // 3. 获取 Logo (Favicon) - 优先级从高到低
    let iconUrl = ''

    // 查找所有可能的 icon link 标签
    const linkTags = html.match(/<link[^>]*>/gi) || []

    // 优先级顺序：apple-touch-icon > icon > shortcut icon
    const iconPriorities = [
      /rel=["']apple-touch-icon["']/i,
      /rel=["']icon["']/i,
      /rel=["']shortcut icon["']/i
    ]

    for (const priorityRegex of iconPriorities) {
      for (const tag of linkTags) {
        if (priorityRegex.test(tag)) {
          const href = extractAttr(tag, 'href')
          if (href) {
            iconUrl = resolveIconUrl(href, url)
            break
          }
        }
      }
      if (iconUrl) break
    }

    // 兜底策略：尝试根目录下的 favicon.ico
    if (!iconUrl) {
      const urlObj = new URL(url)
      iconUrl = `${urlObj.protocol}//${urlObj.host}/favicon.ico`
    }

    // 检查 URL 长度限制 (数据库字段 varchar(500))
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
