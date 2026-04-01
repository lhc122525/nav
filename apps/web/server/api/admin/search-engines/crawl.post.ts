import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const { url } = await readBody(event)

  if (!url || !url.startsWith('http')) {
    throw createError({ statusCode: 400, statusMessage: '无效的 URL' })
  }

  // Handle search URL like "https://www.google.com/search?q=%s"
  // We should crawl the base URL for name and icon
  let crawlUrl = url
  if (url.includes('%s')) {
    try {
      const urlObj = new URL(url.replace('%s', 'test'))
      crawlUrl = `${urlObj.protocol}//${urlObj.host}`
    } catch (e) {
      // If URL is invalid, just use it as is (might fail later)
    }
  }

  try {
    const response = await fetch(crawlUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000) // 10s timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    // 1. Get title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ''

    // 2. Get Logo (Favicon)
    let iconUrl = ''
    const iconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([\s\S]*?)["'][^>]*>/i) ||
                     html.match(/<link[^>]*href=["']([\s\S]*?)["'][^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i)
    
    if (iconMatch) {
      const href = iconMatch[1]
      if (href.startsWith('http')) {
        iconUrl = href
      } else if (href.startsWith('//')) {
        iconUrl = 'https:' + href
      } else if (href.startsWith('/')) {
        const urlObj = new URL(crawlUrl)
        iconUrl = `${urlObj.protocol}//${urlObj.host}${href}`
      } else {
        const urlObj = new URL(crawlUrl)
        iconUrl = `${urlObj.protocol}//${urlObj.host}/${href}`
      }
    } else {
      // Default to /favicon.ico
      const urlObj = new URL(crawlUrl)
      iconUrl = `${urlObj.protocol}//${urlObj.host}/favicon.ico`
    }

    return {
      name: title,
      iconUrl
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `爬取失败: ${error.message}`
    })
  }
})
