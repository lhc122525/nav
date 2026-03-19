export default defineEventHandler((event) => {
  const u = event.context.adminUser as { id: number; username: string; role: string } | undefined
  if (!u) {
    throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  }

  return { ok: true, user: u }
})

