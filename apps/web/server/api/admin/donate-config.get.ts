import { getMySqlPool } from '../../utils/mysql'

export default defineEventHandler(async () => {
  const pool = getMySqlPool()
  if (!pool) {
    throw createError({ statusCode: 500, statusMessage: '数据库未启用' })
  }

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS donate_configs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      alipay_qr_url VARCHAR(500) NOT NULL DEFAULT '',
      wechat_qr_url VARCHAR(500) NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  const [rows] = await pool.execute(
    'SELECT id, alipay_qr_url, wechat_qr_url FROM donate_configs ORDER BY id ASC LIMIT 1'
  )
  const row = (rows as Array<Record<string, unknown>>)[0]
  if (!row) {
    return { id: null, alipayQrUrl: '', wechatQrUrl: '' }
  }

  return {
    id: Number(row.id),
    alipayQrUrl: String(row.alipay_qr_url || ''),
    wechatQrUrl: String(row.wechat_qr_url || ''),
  }
})
