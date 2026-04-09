interface CacheEntry<T> {
  data: T
  timestamp: number
  maxAge: number
}

const memoryCache = new Map<string, CacheEntry<unknown>>()

export function useCache<T>(
  key: string,
  options: { maxAge?: number; storage?: 'memory' | 'localStorage' } = {}
) {
  const { maxAge = 300, storage = 'memory' } = options
  const cacheKey = `cache:${key}`
  const storageKey = `nav_cache:${key}`

  const get = (): T | null => {
    if (import.meta.server) return null

    if (storage === 'memory' && memoryCache.has(cacheKey)) {
      const entry = memoryCache.get(cacheKey) as CacheEntry<T>
      if (Date.now() - entry.timestamp < entry.maxAge * 1000) {
        return entry.data
      }
      memoryCache.delete(cacheKey)
    }

    if (storage === 'localStorage') {
      try {
        const cached = localStorage.getItem(storageKey)
        if (cached) {
          const entry = JSON.parse(cached) as CacheEntry<T>
          if (Date.now() - entry.timestamp < entry.maxAge * 1000) {
            return entry.data
          }
          localStorage.removeItem(storageKey)
        }
      } catch {
        localStorage.removeItem(storageKey)
      }
    }

    return null
  }

  const set = (data: T): void => {
    if (import.meta.server) return

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      maxAge
    }

    if (storage === 'memory') {
      memoryCache.set(cacheKey, entry as CacheEntry<unknown>)
    }

    if (storage === 'localStorage') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(entry))
      } catch {
        console.warn('Failed to cache to localStorage')
      }
    }
  }

  const invalidate = (): void => {
    if (import.meta.server) return

    if (storage === 'memory') {
      memoryCache.delete(cacheKey)
    }

    if (storage === 'localStorage') {
      localStorage.removeItem(storageKey)
    }
  }

  const isStale = (): boolean => {
    if (storage === 'memory' && memoryCache.has(cacheKey)) {
      const entry = memoryCache.get(cacheKey) as CacheEntry<T>
      return Date.now() - entry.timestamp >= entry.maxAge * 1000
    }

    if (storage === 'localStorage') {
      try {
        const cached = localStorage.getItem(storageKey)
        if (cached) {
          const entry = JSON.parse(cached) as CacheEntry<T>
          return Date.now() - entry.timestamp >= entry.maxAge * 1000
        }
      } catch {
        return true
      }
    }

    return true
  }

  return {
    get,
    set,
    invalidate,
    isStale
  }
}
