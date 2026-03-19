import { getMySqlPool } from '../../../utils/mysql'

type UpdateCategoryBody = {
  name?: string
  slug?: string
  sort?: number
}

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: 'MySQL is disabled' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'invalid id' })
  }

  const body = (await readBody(event)) as UpdateCategoryBody
  const name = body?.name != null ? String(body.name).trim() : undefined
  const slug = body?.slug != null ? String(body.slug).trim() : undefined
  const sort = body?.sort != null ? Number(body.sort) : undefined

  if (name !== undefined && name.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'name cannot be empty' })
  }
  if (slug !== undefined && slug.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'slug cannot be empty' })
  }

  const fields: string[] = []
  const values: Array<string | number> = []

  if (name !== undefined) {
    fields.push('name = ?')
    values.push(name)
  }
  if (slug !== undefined) {
    fields.push('slug = ?')
    values.push(slug)
  }
  if (sort !== undefined) {
    fields.push('sort = ?')
    values.push(Number.isFinite(sort) ? sort : 0)
  }

  if (fields.length === 0) return { ok: true }

  values.push(id)
  try {
    const [result] = await pool.execute(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values)
    if (Number((result as { affectedRows?: number }).affectedRows) === 0) {
      throw createError({ statusCode: 404, statusMessage: 'not found' })
    }
    return { ok: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('Duplicate')) {
      throw createError({ statusCode: 409, statusMessage: 'slug already exists' })
    }
    throw e
  }
})

