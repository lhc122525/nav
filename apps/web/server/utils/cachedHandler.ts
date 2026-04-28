import type { H3Event } from 'h3'
import { getHeader, setHeader, createError } from 'h3'

export interface CachedHandlerOptions {
  maxAge?: number
  staleMaxAge?: number
  varies?: string[]
  etag?: boolean
  forceRefresh?: boolean
}

const inMemoryCache = new Map<string, { data: unknown; timestamp: number; maxAge: number }>()

export async function useCachedEventHandler(
  event: H3Event,
  cacheKey: string,
  fetchFn: () => Promise<unknown>,
  options: CachedHandlerOptions = {}
) {
  const { maxAge = 300, staleMaxAge = 600, etag = true, forceRefresh = false } = options

  const requestETag = etag ? getHeader(event, 'If-None-Match') : null
  const cached = inMemoryCache.get(cacheKey)

  if (cached && !forceRefresh) {
    const age = (Date.now() - cached.timestamp) / 1000

    if (age < maxAge) {
      if (requestETag) {
        const eTag = `W/"${Buffer.from(JSON.stringify(cached.data)).toString('base64').slice(0, 32)}"`
        if (requestETag === eTag) {
          event.node.res.statusCode = 304
          event.node.res.end()
          return null
        }
        setHeader(event, 'ETag', eTag)
      }

      setHeader(event, 'Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${staleMaxAge}`)
      return cached.data
    }
  }

  const data = await fetchFn()

  if (etag) {
    const eTag = `W/"${Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 32)}"`
    if (requestETag === eTag && !forceRefresh) {
      event.node.res.statusCode = 304
      event.node.res.end()
      return null
    }
    setHeader(event, 'ETag', eTag)
  }

  inMemoryCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    maxAge
  })

  setHeader(event, 'Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${staleMaxAge}`)

  return data
}

export function invalidateCache(cacheKey?: string) {
  if (cacheKey) {
    inMemoryCache.delete(cacheKey)
  } else {
    inMemoryCache.clear()
  }
}

export function invalidateCacheByPrefix(prefix: string) {
  for (const key of inMemoryCache.keys()) {
    if (key.startsWith(prefix)) {
      inMemoryCache.delete(key)
    }
  }
}
