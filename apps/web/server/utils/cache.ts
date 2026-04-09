export interface CacheOptions {
  maxAge: number
  staleMaxAge?: number
  swr?: boolean
}

export const CACHE_DURATIONS = {
  SHORT: 10,
  MEDIUM: 60,
  LONG: 300,
  VERY_LONG: 3600
} as const

export const cacheConfig = {
  links: {
    maxAge: CACHE_DURATIONS.MEDIUM,
    staleMaxAge: CACHE_DURATIONS.LONG,
    swr: true
  },
  categories: {
    maxAge: CACHE_DURATIONS.MEDIUM,
    staleMaxAge: CACHE_DURATIONS.LONG,
    swr: true
  },
  ads: {
    maxAge: CACHE_DURATIONS.SHORT,
    staleMaxAge: CACHE_DURATIONS.MEDIUM,
    swr: true
  },
  searchEngines: {
    maxAge: CACHE_DURATIONS.MEDIUM,
    staleMaxAge: CACHE_DURATIONS.LONG,
    swr: true
  },
  publicStats: {
    maxAge: CACHE_DURATIONS.MEDIUM,
    staleMaxAge: CACHE_DURATIONS.LONG,
    swr: true
  },
  guestbook: {
    maxAge: CACHE_DURATIONS.SHORT,
    staleMaxAge: 30,
    swr: true
  }
} as const

export function getCacheHeaders(options: CacheOptions): Record<string, string> {
  const headers: Record<string, string> = {
    'Cache-Control': `public, max-age=${options.maxAge}`
  }
  
  if (options.swr) {
    headers['Cache-Control'] += `, stale-while-revalidate=${options.staleMaxAge || options.maxAge}`
  }
  
  return headers
}

export function shouldRefreshCache(lastModified: number, maxAge: number): boolean {
  return Date.now() - lastModified > maxAge * 1000
}
