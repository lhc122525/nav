import { getMySqlPool } from '../../utils/mysql'

type DonateConfig = { alipayQrUrl: string; wechatQrUrl: string }

export default defineEventHandler(async () => {
  const pool = getMySqlPool()
  if (!pool) return { alipayQrUrl: '', wechatQrUrl: '' } satisfies DonateConfig

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
    'SELECT alipay_qr_url, wechat_qr_url FROM donate_configs ORDER BY id ASC LIMIT 1'
  )
  const row = (rows as Array<Record<string, unknown>>)[0]
  if (!row) return { alipayQrUrl: '', wechatQrUrl: '' } satisfies DonateConfig

  return {
    alipayQrUrl: String(row.alipay_qr_url || ''),
    wechatQrUrl: String(row.wechat_qr_url || ''),
  } satisfies DonateConfig
})
