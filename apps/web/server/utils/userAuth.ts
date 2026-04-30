import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { deleteCookie, setCookie } from 'h3'

export const USER_SESSION_COOKIE = 'ns_user_session'

export type UserRole = 'admin' | 'user'

export type User = {
  id: number
  username: string
  userAlias: string
  role: UserRole
}

export function createUserSessionToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashUserPassword(password: string, saltHex?: string): { saltHex: string; hashHex: string } {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : randomBytes(16)
  const hash = scryptSync(password, salt, 64)
  return { saltHex: salt.toString('hex'), hashHex: hash.toString('hex') }
}

export function verifyUserPassword(password: string, saltHex: string, hashHex: string): boolean {
  const { hashHex: computed } = hashUserPassword(password, saltHex)
  const a = Buffer.from(computed, 'hex')
  const b = Buffer.from(hashHex, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function setUserSessionCookie(event: H3Event, token: string, expires: Date) {
  const isProd = process.env.NODE_ENV === 'production'
  const isHttps = process.env.NUXT_PUBLIC_SITE_URL?.startsWith('https://') ?? false
  setCookie(event, USER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd && isHttps,
    path: '/',
    expires
  })
}

export function clearUserSessionCookie(event: H3Event) {
  deleteCookie(event, USER_SESSION_COOKIE, { path: '/' })
}
