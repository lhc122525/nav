export default defineNuxtRouteMiddleware(async () => {
  try {
    const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
    await $fetch('/api/admin/auth/me', { headers })
  } catch {
    return navigateTo('/admin/login')
  }
})
