import { getMySqlPool } from '../../../utils/mysql'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  // 1. 获取所有当前启用的链接
  const [rows] = await pool.execute(
    'SELECT id, url, title FROM links WHERE is_active = 1'
  )
  const activeLinks = rows as Array<{ id: number; url: string; title: string }>
  
  const results = {
    total: activeLinks.length,
    failed: 0,
    updatedIds: [] as number[]
  }

  // 2. 逐一检测连通性 (使用较短的超时时间)
  // 为了性能，我们可以分批并行检测，或者简单地串行检测
  // 这里采用每批 5 个并行，避免过载
  const batchSize = 5
  for (let i = 0; i < activeLinks.length; i += batchSize) {
    const batch = activeLinks.slice(i, i + batchSize)
    await Promise.all(batch.map(async (link) => {
      let isReachable = false
      try {
        const response = await fetch(link.url, {
          method: 'HEAD', // 使用 HEAD 请求更快
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          signal: AbortSignal.timeout(5000) // 5s 超时
        })
        
        // 只要返回 2xx 或 3xx 状态码即视为连通
        if (response.ok || (response.status >= 300 && response.status < 400)) {
          isReachable = true
        }
      } catch (err) {
        // 如果 HEAD 不支持，尝试 GET
        try {
          const response = await fetch(link.url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            signal: AbortSignal.timeout(5000)
          })
          if (response.ok || (response.status >= 300 && response.status < 400)) {
            isReachable = true
          }
        } catch (innerErr) {
          isReachable = false
        }
      }

      // 3. 如果不可访问，更新状态为不启用 (is_active = 0)
      if (!isReachable) {
        await pool.execute('UPDATE links SET is_active = 0 WHERE id = ?', [link.id])
        results.failed++
        results.updatedIds.push(link.id)
      }
    }))
  }

  return {
    ok: true,
    ...results
  }
})
