export default defineNuxtPlugin(() => {
  const { public: publicConfig } = useRuntimeConfig()
  const siteUrl = (publicConfig.siteUrl || '').replace(/\/+$/, '')
  const siteName = publicConfig.siteName || '非乐鱼导航'

  useHead(() => ({
    titleTemplate: (titleChunk) => (titleChunk ? `${titleChunk} - ${siteName}` : siteName),
    link: siteUrl
      ? [
          {
            rel: 'canonical',
            href: siteUrl + useRoute().path
          }
        ]
      : []
  }))
})

