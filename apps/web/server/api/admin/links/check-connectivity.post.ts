import { getMySqlPool } from '../../../utils/mysql'

type CheckBody = {
  categoryId?: number | null
  recommended?: boolean
}

/**
 * 带超时的 fetch，确保不会卡住
 */
async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}): Promise<Response> {
  const { timeout = 5000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * 从 HTML 属性中提取值（支持有引号和无引号的属性）
 */
function extractAttr(html: string, attr: string): string | null {
  // 匹配 attr="value" 或 attr='value' 或 attr=value（无引号，到空格或>结束）
  const regex = new RegExp(`${attr}=["']([^"']*)["']`, 'i')
  const match = html.match(regex)
  if (match?.[1]) return match[1]

  // 尝试无引号格式：attr=value
  const noQuoteRegex = new RegExp(`${attr}=([^\\s>]+)`, 'i')
  const noQuoteMatch = html.match(noQuoteRegex)
  return noQuoteMatch?.[1] ?? null
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
    { pattern: /rel=["']shortcut icon["']/i, priority: 1 },
    { pattern: /rel=["']icon["']/i, priority: 2 },
    { pattern: /rel=["']apple-touch-icon["']/i, priority: 3 }
  ]

  for (const { pattern } of iconPriorities) {
    for (const tag of linkTags) {
      if (pattern.test(tag)) {
        const href = extractAttr(tag, 'href')
        if (href) {
          candidates.push(resolveIconUrl(href, baseUrl))
        }
      }
    }
  }

  return candidates
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

/**
 * 检测连通性并获取图标（一次请求完成）
 * 返回 { isReachable, iconUrl }
 * 所有错误都被捕获，不会抛出异常
 */
async function checkAndGetIcon(url: string): Promise<{ isReachable: boolean; iconUrl: string | null }> {
  const result = { isReachable: false, iconUrl: null as string | null }

  // 验证 URL 格式
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return result // 无效 URL，直接返回失败
  }

  const domain = parsedUrl.hostname
  const defaultFavicon = `${parsedUrl.protocol}//${parsedUrl.host}/favicon.ico`

  // 1. 先尝试 Google Favicon API（快速获取图标）
  let googleIconUrl: string | null = null
  if (domain) {
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    try {
      const response = await fetchWithTimeout(googleFaviconUrl, { method: 'HEAD', timeout: 2000 })
      if (response.ok) {
        googleIconUrl = googleFaviconUrl
      }
    } catch {
      // 忽略第三方 API 错误
    }
  }

  // 2. 请求目标网站（同时检测连通性和获取图标）
  let candidateIcons: string[] = []
  try {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 5000
    })

    if (response.ok || (response.status >= 300 && response.status < 400)) {
      result.isReachable = true

      // 从网页解析所有候选图标
      try {
        const html = await response.text()
        candidateIcons = extractCandidateIcons(html, url)
        // 添加默认 favicon 作为兜底
        candidateIcons.push(defaultFavicon)
      } catch {
        candidateIcons = [defaultFavicon]
      }
    }
  } catch {
    // GET 失败，尝试 HEAD 检测连通性
    try {
      const response = await fetchWithTimeout(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 3000
      })
      if (response.ok || (response.status >= 300 && response.status < 400)) {
        result.isReachable = true
        candidateIcons = [defaultFavicon]
      }
    } catch {
      // HEAD 也失败，保持 isReachable = false
    }
  }

  // 3. 验证图标可访问性，选择第一个可用的
  // 优先使用 Google API 图标（如果可用）
  if (googleIconUrl && await validateIconUrl(googleIconUrl)) {
    result.iconUrl = googleIconUrl
  } else {
    // 验证候选图标列表
    for (const iconUrl of candidateIcons) {
      if (await validateIconUrl(iconUrl)) {
        result.iconUrl = iconUrl
        break
      }
    }
  }

  return result
}

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const body = await readBody<CheckBody>(event)
  const categoryId = body?.categoryId ?? null
  const recommended = body?.recommended ?? false

  // 构建查询条件
  let query = 'SELECT id, url, title, icon_url, is_active FROM links'
  const params: (number | boolean)[] = []
  const conditions: string[] = []

  if (recommended) {
    conditions.push('is_recommended = ?')
    params.push(true)
  } else if (categoryId !== null) {
    conditions.push('category_id = ?')
    params.push(categoryId)
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ')
  }

  const [rows] = await pool.execute(query, params)
  const links = rows as Array<{ id: number; url: string; title: string; icon_url: string; is_active: number }>

  const results = {
    total: links.length,
    reachable: 0,
    failed: 0,
    iconsUpdated: 0,
    disabled: 0,
    reEnabled: 0
  }

  // 分批处理，每批 10 个并行（增加并发数）
  const batchSize = 10
  const maxIconUrlLength = 500

  for (let i = 0; i < links.length; i += batchSize) {
    const batch = links.slice(i, i + batchSize)
    await Promise.all(batch.map(async (link) => {
      try {
        const { isReachable, iconUrl } = await checkAndGetIcon(link.url)

        if (isReachable) {
          results.reachable++

          // 检查图标 URL 长度
          const validIconUrl = iconUrl && iconUrl.length <= maxIconUrlLength ? iconUrl : null

          // 更新数据库
          try {
            if (validIconUrl && validIconUrl !== link.icon_url) {
              await pool.execute(
                'UPDATE links SET is_active = 1, icon_url = ? WHERE id = ?',
                [validIconUrl, link.id]
              )
              results.iconsUpdated++
            } else if (link.is_active !== 1) {
              await pool.execute('UPDATE links SET is_active = 1 WHERE id = ?', [link.id])
              results.reEnabled++
            }
          } catch {
            // 数据库写入失败，忽略
          }
        } else {
          results.failed++
          try {
            if (link.is_active === 1) {
              await pool.execute('UPDATE links SET is_active = 0 WHERE id = ?', [link.id])
              results.disabled++
            }
          } catch {
            // 数据库写入失败，忽略
          }
        }
      } catch {
        // 单个任务完全失败，计入 failed
        results.failed++
      }
    }))

    // 每批之间短暂休息
    if (i + batchSize < links.length) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }

  return {
    ok: true,
    ...results
  }
})
