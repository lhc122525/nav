import { defineEventHandler, readBody, createError } from 'h3'

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
    const title = titleMatch?.[1]?.trim() ?? ''

    // 2. 获取描述
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i) ||
                     html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*>/i)
    const description = descMatch?.[1]?.trim() ?? ''

    // 3. 获取 Logo (Favicon)
    let iconUrl = ''
    const iconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([\s\S]*?)["'][^>]*>/i) ||
                     html.match(/<link[^>]*href=["']([\s\S]*?)["'][^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i)
    
    const href = iconMatch?.[1]
    if (href) {
      if (href.startsWith('http')) {
        iconUrl = href
      } else if (href.startsWith('//')) {
        iconUrl = 'https:' + href
      } else if (href.startsWith('/')) {
        const urlObj = new URL(url)
        iconUrl = `${urlObj.protocol}//${urlObj.host}${href}`
      } else {
        const urlObj = new URL(url)
        iconUrl = `${urlObj.protocol}//${urlObj.host}/${href}`
      }
    } else {
      // 兜底策略：尝试根目录下的 favicon.ico
      const urlObj = new URL(url)
      iconUrl = `${urlObj.protocol}//${urlObj.host}/favicon.ico`
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
