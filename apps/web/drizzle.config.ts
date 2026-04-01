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
    host: '127.0.0.1',
    port: 8999,
    user: 'nszm',
    password: 'nszm123..',
    database: 'nav'
  }
})

