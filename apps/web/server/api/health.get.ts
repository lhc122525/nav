import { mysqlPing } from '../utils/mysql'

export default defineEventHandler(async () => {
  const mysql = await mysqlPing()
  return { ok: true, mysql }
})

