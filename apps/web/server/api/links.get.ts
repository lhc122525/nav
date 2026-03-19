import { getMySqlPool } from '../utils/mysql'
import { getQueryInt } from '../utils/http'

type NavLink = {
  id: number
  categoryId: number | null
  title: string
  url: string
  description: string
  iconUrl: string
  isActive: boolean
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
    sort: 20
  }
]

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) return mockLinks

  const query = getQuery(event) as Record<string, unknown>
  const categoryId = getQueryInt(query, 'categoryId', 0)
  const limit = Math.min(Math.max(getQueryInt(query, 'limit', 200), 1), 500)

  const whereParts: string[] = ['is_active = 1']
  const params: number[] = []
  if (categoryId > 0) {
    whereParts.push('category_id = ?')
    params.push(categoryId)
  }

  const [rows] = await pool.execute(
    `SELECT id, category_id, title, url, description, icon_url, is_active, sort
     FROM links
     WHERE ${whereParts.join(' AND ')}
     ORDER BY sort ASC, id DESC
     LIMIT ?`,
    [...params, limit]
  )

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    id: Number(r.id),
    categoryId: r.category_id == null ? null : Number(r.category_id),
    title: String(r.title || ''),
    url: String(r.url || ''),
    description: String(r.description || ''),
    iconUrl: String(r.icon_url || ''),
    isActive: Boolean(r.is_active),
    sort: Number(r.sort || 0)
  }))
})
