import { getMySqlPool } from '../utils/mysql'

export default defineEventHandler(async () => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  // Fetch categories
  const [categoriesRows] = await pool.execute('SELECT id, name FROM search_categories ORDER BY sort ASC, id ASC')
  const categories = (categoriesRows as any[]).map(r => ({
    id: Number(r.id),
    name: String(r.name)
  }))

  // Fetch engines
  const [enginesRows] = await pool.execute('SELECT id, category_id, name, url, icon_url, is_default FROM search_engines ORDER BY sort ASC, id ASC')
  const engines = (enginesRows as any[]).map(r => ({
    id: Number(r.id),
    categoryId: Number(r.category_id),
    name: String(r.name),
    url: String(r.url),
    iconUrl: String(r.icon_url),
    isDefault: Boolean(r.is_default)
  }))

  // Map engines to categories
  return categories.map(cat => ({
    ...cat,
    engines: engines.filter(eng => eng.categoryId === cat.id)
  }))
})
