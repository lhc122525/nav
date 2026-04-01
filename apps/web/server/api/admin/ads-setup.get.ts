import { getMySqlPool } from '../../utils/mysql'

export default defineEventHandler(async (event) => {
  const pool = getMySqlPool()
  if (!pool) {
    return { success: false, message: '数据库未启用' }
  }

  try {
    // 创建 ads 表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ads (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        url VARCHAR(500) NOT NULL,
        sort INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ads_sort (sort),
        INDEX idx_ads_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    // 创建 ad_configs 表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ad_configs (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        display_count INT NOT NULL DEFAULT 2,
        is_random BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    // 初始化配置 (如果不存在)
    const [rows]: any = await pool.execute('SELECT COUNT(*) as count FROM ad_configs')
    if (rows[0].count === 0) {
      await pool.execute('INSERT INTO ad_configs (display_count, is_random) VALUES (2, FALSE)')
    }

    return { success: true, message: '广告模块表已就绪' }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
})
