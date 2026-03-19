import { getMySqlPool } from '../utils/mysql'

type Category = {
  id: number
  name: string
  slug: string
  sort: number
}

export default defineEventHandler(async () => {
  const pool = getMySqlPool()
  if (!pool) return []

  const [rows] = await pool.query(
    'SELECT id, name, slug, sort FROM categories ORDER BY sort ASC, id DESC'
  )

  return (rows as Array<Record<string, unknown>>).map((r) => ({
    id: Number(r.id),
    name: String(r.name || ''),
    slug: String(r.slug || ''),
    sort: Number(r.sort || 0)
  })) as Category[]
})

