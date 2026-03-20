import { defineConfig } from 'drizzle-kit'

function pickEnv(...keys: string[]) {
  for (const key of keys) {
    const v = (process.env[key] || '').trim()
    if (v) return v
  }
  return ''
}

function pickEnvNumber(defaultValue: number, ...keys: string[]) {
  const raw = pickEnv(...keys)
  const n = Number(raw)
  return Number.isFinite(n) ? n : defaultValue
}

export default defineConfig({
  dialect: 'mysql',
  schema: './server/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    host: pickEnv('NUXT_MYSQL_HOST', 'MYSQL_HOST', 'DB_HOST') || '127.0.0.1',
    port: pickEnvNumber(8999, 'NUXT_MYSQL_PORT', 'MYSQL_PORT', 'DB_PORT'),
    user: pickEnv('NUXT_MYSQL_USER', 'MYSQL_USER', 'DB_USER') || 'root',
    password: pickEnv('NUXT_MYSQL_PASSWORD', 'MYSQL_PASSWORD', 'DB_PASSWORD'),
    database: pickEnv('NUXT_MYSQL_DATABASE', 'MYSQL_DATABASE', 'DB_NAME') || 'nav'
  }
})

