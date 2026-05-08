import { getMySqlPool } from '../../../utils/mysql'

type CheckBody = {
  categoryId?: number | null
  recommended?: boolean
}

/**
 * 从 URL 中提取域名
 */
function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url)
    return parsed.hostname
  } catch {
    return null
  }
}

/**
 * 从 HTML 属性中提取值
 */
function extractAttr(html: string, attr: string): string | null {
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

/**
 * 方案1: 使用第三方服务获取 logo
 * - Google Favicon API (免费，无需 key)
 * - Clearbit Logo API (免费，有配额)
 */
async function fetchLogoFromThirdParty(domain: string): Promise<string | null> {
  // Google Favicon API - 高质量且稳定
  const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`

  // 验证是否可用
  try {
    const response = await fetch(googleFaviconUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    })
    if (response.ok) {
      return googleFaviconUrl
    }
  } catch {
    // 忽略错误，继续尝试下一个
  }

  // Clearbit Logo API 作为备选
  const clearbitUrl = `https://logo.clearbit.com/${domain}?size=128`
  try {
    const response = await fetch(clearbitUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    })
    if (response.ok) {
      return clearbitUrl
    }
  } catch {
    // 忽略错误
  }

  return null
}

/**
 * 方案2: 从网站爬取 favicon
 */
async function fetchFaviconFromSite(url: string): Promise<string | null> {
  try {
    const parsed = new URL(url)
    const baseUrl = `${parsed.protocol}//${parsed.hostname}`

    // 尝试获取 HTML 页面
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(5000)
    })

    if (!response.ok) return null

    const html = await response.text()

    // 查找所有 link 标签
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
            return resolveIconUrl(href, url)
          }
        }
      }
    }

    // 默认 favicon.ico
    return `${baseUrl}/favicon.ico`
  } catch {
    return null
  }
}

/**
 * 获取网站 logo (混合方案)
 */
async function fetchWebsiteLogo(url: string): Promise<string | null> {
  const domain = extractDomain(url)
  if (!domain) return null

  // 优先使用第三方服务
  const thirdPartyLogo = await fetchLogoFromThirdParty(domain)
  if (thirdPartyLogo) {
    return thirdPartyLogo
  }

  // 回退到爬取网站 favicon
  const favicon = await fetchFaviconFromSite(url)
  return favicon
}

/**
 * 检测网站连通性
 */
async function checkConnectivity(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(5000)
    })

    if (response.ok || (response.status >= 300 && response.status < 400)) {
      return true
    }
  } catch {
    // HEAD 失败，尝试 GET
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(5000)
      })
      if (response.ok || (response.status >= 300 && response.status < 400)) {
        return true
      }
    } catch {
      return false
    }
  }
  return false
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
    reEnabled: 0,
    progress: 0 // 当前进度
  }

  // 分批处理，每批 5 个并行
  const batchSize = 5
  const maxIconUrlLength = 500 // 数据库字段限制

  for (let i = 0; i < links.length; i += batchSize) {
    const batch = links.slice(i, i + batchSize)
    await Promise.all(batch.map(async (link) => {
      const isReachable = await checkConnectivity(link.url)

      if (isReachable) {
        results.reachable++

        // 获取新 logo
        let newIconUrl = await fetchWebsiteLogo(link.url)

        // 检查 URL 长度限制
        if (newIconUrl && newIconUrl.length > maxIconUrlLength) {
          newIconUrl = null // 超长则不更新图标
        }

        // 更新数据库：启用状态 + 新图标
        if (newIconUrl && newIconUrl !== link.icon_url) {
          await pool.execute(
            'UPDATE links SET is_active = 1, icon_url = ? WHERE id = ?',
            [newIconUrl, link.id]
          )
          results.iconsUpdated++
        } else {
          // 仅更新启用状态
          if (link.is_active !== 1) {
            await pool.execute('UPDATE links SET is_active = 1 WHERE id = ?', [link.id])
            results.reEnabled++
          }
        }
      } else {
        results.failed++

        // 禁用不可访问的链接
        if (link.is_active === 1) {
          await pool.execute('UPDATE links SET is_active = 0 WHERE id = ?', [link.id])
          results.disabled++
        }
      }
    }))

    // 更新进度
    results.progress = Math.min(i + batchSize, links.length)

    // 每批之间短暂休息，避免请求过于频繁
    if (i + batchSize < links.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return {
    ok: true,
    ...results
  }
})
