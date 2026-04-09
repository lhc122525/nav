import { invalidateCache, invalidateCacheByPrefix } from '../utils/cachedHandler'

export default defineNitroPlugin((nitroApp) => {
  console.log('[Cache] Cache invalidation plugin initialized')
})

export function useCacheInvalidator() {
  return {
    invalidate: invalidateCache,
    invalidateByPrefix: invalidateCacheByPrefix,
    invalidateLinks: () => invalidateCacheByPrefix('links'),
    invalidateCategories: () => invalidateCacheByPrefix('categories'),
    invalidateAds: () => invalidateCacheByPrefix('ads')
  }
}
