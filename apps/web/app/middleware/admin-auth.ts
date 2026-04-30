export default defineNuxtRouteMiddleware(async () => {
  // 服务端已经有 server middleware 处理，这里只需要处理客户端导航
  if (import.meta.server) return

  try {
    const { $api } = useNuxtApp()
    await $api('/api/admin/auth/me')
  } catch {
    return navigateTo('/admin/login')
  }
})
