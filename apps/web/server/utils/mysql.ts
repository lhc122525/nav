import mysql from 'mysql2/promise'

type MySqlPool = mysql.Pool

type MySqlConfig = {
  host?: string
  port?: number
  user?: string
  password?: string
  database?: string
}

function getMySqlConfig(): MySqlConfig {
  const config = useRuntimeConfig()
  const runtime = (config.mysql || {}) as MySqlConfig

  const env = process.env as Record<string, string | undefined>

  const host = (runtime.host || '').trim() || env.NUXT_MYSQL_HOST || env.MYSQL_HOST || env.DB_HOST
  const user = (runtime.user || '').trim() || env.NUXT_MYSQL_USER || env.MYSQL_USER || env.DB_USER
  const password = (runtime.password || '').trim() || env.NUXT_MYSQL_PASSWORD || env.MYSQL_PASSWORD || env.DB_PASSWORD
  const database =
    (runtime.database || '').trim() || env.NUXT_MYSQL_DATABASE || env.MYSQL_DATABASE || env.DB_NAME

  const portRaw =
    runtime.port ||
    (env.NUXT_MYSQL_PORT ? Number(env.NUXT_MYSQL_PORT) : undefined) ||
    (env.MYSQL_PORT ? Number(env.MYSQL_PORT) : undefined) ||
    (env.DB_PORT ? Number(env.DB_PORT) : undefined)
  const port = Number.isFinite(Number(portRaw)) ? Number(portRaw) : undefined

  const isDev = process.env.NODE_ENV !== 'production'
  if (!host && isDev) {
    return {
      host: '127.0.0.1',
      port: 3306,
      user: user || 'navigation',
      password: password || 'navigation_password',
      database: database || 'navigation'
    }
  }

  return { host, port, user, password, database }
}

export function getMySqlPool(): MySqlPool | null {
  const { host, port, user, password, database } = getMySqlConfig()

  if (!host || !user || !database) return null

  const g = globalThis as unknown as {
    __navigation_mysqlPool?: MySqlPool
  }

  if (!g.__navigation_mysqlPool) {
    g.__navigation_mysqlPool = mysql.createPool({
      host,
      port: port || 3306,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    })
  }

  return g.__navigation_mysqlPool
}

export async function mysqlPing(): Promise<'connected' | 'disabled' | 'error'> {
  const pool = getMySqlPool()
  if (!pool) return 'disabled'
  try {
    await pool.query('SELECT 1')
    return 'connected'
  } catch {
    return 'error'
  }
}
