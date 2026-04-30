import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '.env') })

function pickEnv(...keys: string[]) {
  for (const key of keys) {
    const v = (process.env[key] || '').trim()
    if (v) return v
  }
  return ''
}

function pickEnvNumber(...keys: string[]) {
  const raw = pickEnv(...keys)
  const n = Number(raw)
  return n
}

export default defineConfig({
  dialect: 'mysql',
  schema: './server/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    host: pickEnv('NUXT_MYSQL_HOST'),
    port: pickEnvNumber('NUXT_MYSQL_PORT'),
    user: pickEnv('NUXT_MYSQL_USER'),
    password: pickEnv('NUXT_MYSQL_PASSWORD'),
    database: pickEnv('NUXT_MYSQL_DATABASE')
  }
})
