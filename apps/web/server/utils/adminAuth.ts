import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { deleteCookie, setCookie } from 'h3'

export const ADMIN_SESSION_COOKIE = 'ns_admin_session'

export type AdminRole = 'super' | 'admin'

export type AdminUser = {
  id: number
  username: string
  role: AdminRole
}

export function createSessionToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashPassword(password: string, saltHex?: string): { saltHex: string; hashHex: string } {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : randomBytes(16)
  const hash = scryptSync(password, salt, 64)
  return { saltHex: salt.toString('hex'), hashHex: hash.toString('hex') }
}

export function verifyPassword(password: string, saltHex: string, hashHex: string): boolean {
  const { hashHex: computed } = hashPassword(password, saltHex)
  const a = Buffer.from(computed, 'hex')
  const b = Buffer.from(hashHex, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function setAdminSessionCookie(event: H3Event, token: string, expires: Date) {
  const isProd = process.env.NODE_ENV === 'production'
  const isHttps = process.env.NUXT_PUBLIC_SITE_URL?.startsWith('https://') ?? false
  setCookie(event, ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd && isHttps,
    path: '/',
    expires
  })
}

export function clearAdminSessionCookie(event: H3Event) {
  deleteCookie(event, ADMIN_SESSION_COOKIE, { path: '/' })
}
