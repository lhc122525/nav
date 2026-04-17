import { getMySqlPool } from '../../utils/mysql'
import { readBody } from 'h3'

type Body = {
  alipayQrUrl?: string
  wechatQrUrl?: string
}

export default defineEventHandler(async (event) => {
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

  const body = (await readBody(event)) as Body
  const alipayQrUrl = String(body?.alipayQrUrl || '').trim()
  const wechatQrUrl = String(body?.wechatQrUrl || '').trim()

  const [rows] = await pool.execute('SELECT id FROM donate_configs ORDER BY id ASC LIMIT 1')
  const row = (rows as Array<Record<string, unknown>>)[0]
  if (row?.id) {
    await pool.execute(
      'UPDATE donate_configs SET alipay_qr_url = ?, wechat_qr_url = ? WHERE id = ?',
      [alipayQrUrl, wechatQrUrl, Number(row.id)]
    )
    return { ok: true, id: Number(row.id) }
  }

  const [result] = await pool.execute(
    'INSERT INTO donate_configs (alipay_qr_url, wechat_qr_url) VALUES (?, ?)',
    [alipayQrUrl, wechatQrUrl]
  )
  return { ok: true, id: Number((result as { insertId?: number }).insertId) }
})
