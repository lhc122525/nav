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
    host: pickEnv('NUXT_MYSQL_HOST') || '127.0.0.1',
    port: pickEnvNumber(8999, 'NUXT_MYSQL_PORT'),
    user: pickEnv('NUXT_MYSQL_USER') || 'nszm',
    password: pickEnv('NUXT_MYSQL_PASSWORD') || 'nszm123..',
    database: pickEnv('NUXT_MYSQL_DATABASE') || 'nav'
  }
})

