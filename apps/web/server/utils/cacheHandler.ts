import type { H3Event } from 'h3'
import { getHeader, setHeader } from 'h3'

export interface CacheConfig {
  maxAge?: number
  staleMaxAge?: number
  varies?: string[]
}

export function setCacheHeaders(event: H3Event, config: CacheConfig) {
  const maxAge = config.maxAge ?? 60
  const staleMaxAge = config.staleMaxAge ?? maxAge

  let cacheControl = `public, max-age=${maxAge}`

  if (config.staleMaxAge !== undefined) {
    cacheControl += `, stale-while-revalidate=${staleMaxAge}`
  }

  setHeader(event, 'Cache-Control', cacheControl)

  if (config.varies) {
    setHeader(event, 'Vary', config.varies.join(', '))
  }
}

export function getRequestETag(event: H3Event): string | null {
  return getHeader(event, 'If-None-Match') || null
}

export function getLastModified(event: H3Event): number | null {
  const header = getHeader(event, 'If-Modified-Since')
  if (header) {
    return new Date(header).getTime()
  }
  return null
}

export function send304Response(event: H3Event, etag: string) {
  setHeader(event, 'ETag', etag)
  event.node.res.statusCode = 304
  event.node.res.end()
  return null
}
