export default defineEventHandler((event) => {
  const u = event.context.adminUser as { id: number; username: string; role: string } | undefined
  if (!u) {
    throw createError({ statusCode: 401, statusMessage: '未登录' })
  }

  return { ok: true, user: u }
})
