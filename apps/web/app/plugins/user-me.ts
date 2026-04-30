export default defineNuxtPlugin(async () => {
  // 只在客户端执行，SSR 时由 layout 处理
  if (import.meta.server) return

  const { initUserMe } = useUserMe()
  await initUserMe()
})
