import { getMySqlPool } from '../utils/mysql'
import { getQueryInt } from '../utils/http'
import { useCachedEventHandler } from '../utils/cachedHandler'

type NavLink = {
  id: number
  categoryId: number | null
  title: string
  url: string
  description: string
  iconUrl: string
  isActive: boolean
  isRecommended: boolean
  sort: number
}

const mockLinks: NavLink[] = [
  {
    id: 1,
    categoryId: null,
    title: 'Nuxt',
    url: 'https://nuxt.com',
    description: 'Nuxt 官方文档',
    iconUrl: '',
    isActive: true,
    isRecommended: false,
    sort: 0
  },
  {
    id: 2,
    categoryId: null,
    title: 'Vue',
    url: 'https://vuejs.org',
    description: 'Vue 官方文档',
    iconUrl: '',
    isActive: true,
    isRecommended: false,
    sort: 10
  },
  {
    id: 3,
    categoryId: null,
    title: 'Element Plus',
    url: 'https://element-plus.org',
    description: 'Element Plus UI',
    iconUrl: '',
    isActive: true,
    isRecommended: false,
    sort: 20
  }
]

async function fetchLinks(
  categoryId: number,
  recommended: number,
  limit: number
): Promise<NavLink[]> {
  const pool = getMySqlPool()
  if (!pool) return mockLinks

  const whereParts: string[] = ['is_active = 1']
  const params: (number | string)[] = []
  if (categoryId > 0) {
    whereParts.push('category_id = ?')
    params.push(categoryId)
  }
  if (recommended > 0) {
    whereParts.push('is_recommended = 1')
  }

  try {
    const queryParams = [...params, String(limit)]
    const [rows] = await pool.execute(
      `SELECT id, category_id, title, url, description, icon_url, is_active, is_recommended, sort
       FROM links
       WHERE ${whereParts.join(' AND ')}
       ORDER BY sort ASC, id DESC
       LIMIT ?`,
      queryParams
    )

    return (rows as Array<Record<string, unknown>>).map((r) => ({
      id: Number(r.id),
      categoryId: r.category_id == null ? null : Number(r.category_id),
      title: String(r.title || ''),
      url: String(r.url || ''),
      description: String(r.description || ''),
      iconUrl: String(r.icon_url || ''),
      isActive: Boolean(r.is_active),
      isRecommended: Boolean(r.is_recommended),
      sort: Number(r.sort || 0)
    }))
  } catch (e: unknown) {
    const anyError = e as { code?: unknown; message?: unknown }
    if (anyError?.code !== 'ER_BAD_FIELD_ERROR') throw e
    if (String(anyError?.message || '').includes('is_recommended')) {
      const degradedWhereParts = whereParts.filter((w) => w !== 'is_recommended = 1')
      const queryParams = [...params, String(limit)]
      const [rows] = await pool.execute(
        `SELECT id, category_id, title, url, description, icon_url, is_active, sort
         FROM links
         WHERE ${degradedWhereParts.join(' AND ')}
         ORDER BY sort ASC, id DESC
         LIMIT ?`,
        queryParams
      )

      return (rows as Array<Record<string, unknown>>).map((r) => ({
        id: Number(r.id),
        categoryId: r.category_id == null ? null : Number(r.category_id),
        title: String(r.title || ''),
        url: String(r.url || ''),
        description: String(r.description || ''),
        iconUrl: String(r.icon_url || ''),
        isActive: Boolean(r.is_active),
        isRecommended: false,
        sort: Number(r.sort || 0)
      }))
    }
    throw e
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as Record<string, unknown>
  const categoryId = getQueryInt(query, 'categoryId', 0)
  const recommended = getQueryInt(query, 'recommended', 0)
  const limit = Math.min(Math.max(getQueryInt(query, 'limit', 200), 1), 5000)

  const cacheKey = `links:${categoryId}:${recommended}:${limit}`

  const useCache = query.cache !== '0'

  if (useCache) {
    return useCachedEventHandler(event, cacheKey, () => fetchLinks(categoryId, recommended, limit), {
      maxAge: 300,
      staleMaxAge: 3600,
      etag: true
    })
  }

  return fetchLinks(categoryId, recommended, limit)
})
