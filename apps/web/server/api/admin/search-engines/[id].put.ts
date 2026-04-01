import { getMySqlPool } from '../../../utils/mysql'

type UpdateSearchEngineBody = {
  categoryId?: number
  name?: string
  url?: string
  iconUrl?: string
  sort?: number
  isDefault?: boolean
}

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '缺少 ID' })
  }

  const body = (await readBody(event)) as UpdateSearchEngineBody
  const categoryId = Number(body?.categoryId)
  const name = String(body?.name || '').trim()
  const url = String(body?.url || '').trim()
  const iconUrl = String(body?.iconUrl || '').trim()
  const sort = Number(body?.sort || 0)
  const isDefault = Boolean(body?.isDefault)

  if (!categoryId || !name || !url) {
    throw createError({ statusCode: 400, statusMessage: '分类、名称和 URL 不能为空' })
  }

  try {
    await pool.execute(
      'UPDATE search_engines SET category_id = ?, name = ?, url = ?, icon_url = ?, sort = ?, is_default = ? WHERE id = ?',
      [categoryId, name, url, iconUrl, Number.isFinite(sort) ? sort : 0, isDefault, id]
    )
    return { success: true }
  } catch (e: unknown) {
    throw createError({ statusCode: 500, statusMessage: '更新失败' })
  }
})
