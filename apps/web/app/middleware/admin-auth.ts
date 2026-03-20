export default defineNuxtRouteMiddleware(async () => {
  try {
    const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
    const { $api } = useNuxtApp()
    await $api('/api/admin/auth/me', { headers })
  } catch {
    return navigateTo('/admin/login')
  }
})
