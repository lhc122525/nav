import { getMySqlPool } from '../../../utils/mysql'

type UpdateGuestbookBody = {
  isVisible?: boolean
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

  const body = (await readBody(event)) as UpdateGuestbookBody
  if (body?.isVisible == null) return { ok: true }

  const [result] = await pool.execute('UPDATE guestbook_messages SET is_visible = ? WHERE id = ?', [
    body.isVisible ? 1 : 0,
    id
  ])
  if (Number((result as { affectedRows?: number }).affectedRows) === 0) {
    throw createError({ statusCode: 404, statusMessage: 'not found' })
  }

  return { ok: true }
})

