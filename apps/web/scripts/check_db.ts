import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from '../server/db/schema.ts'
import { sql } from 'drizzle-orm'

// 数据库配置
const dbConfig = {
  host: process.env.NUXT_MYSQL_HOST,
  port: Number(process.env.NUXT_MYSQL_PORT),
  user: process.env.NUXT_MYSQL_USER,
  password: process.env.NUXT_MYSQL_PASSWORD,
  database: process.env.NUXT_MYSQL_DATABASE
}

async function main() {
  const connection = await mysql.createConnection(dbConfig)
  const db = drizzle(connection, { schema, mode: 'default' })

  const categoryCount = await db.select({ count: sql`count(*)` }).from(schema.categories)
  const linkCount = await db.select({ count: sql`count(*)` }).from(schema.links)

  console.log(`分类总数: ${categoryCount[0].count}`)
  console.log(`链接总数: ${linkCount[0].count}`)

  await connection.end()
}

main()
