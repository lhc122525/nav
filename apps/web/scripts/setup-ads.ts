import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 8999,
    user: 'nszm',
    password: 'nszm123..',
    database: 'nav',
  })

  try {
    const [rows] = await connection.execute('SHOW TABLES LIKE "ads"')
    console.log('ads table exists:', (rows as any[]).length > 0)
    
    const [rows2] = await connection.execute('SHOW TABLES LIKE "ad_configs"')
    console.log('ad_configs table exists:', (rows2 as any[]).length > 0)
    
    if ((rows as any[]).length === 0) {
      console.log('Creating ads table...')
      await connection.execute(`
        CREATE TABLE ads (
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
    }
    
    if ((rows2 as any[]).length === 0) {
      console.log('Creating ad_configs table...')
      await connection.execute(`
        CREATE TABLE ad_configs (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          display_count INT NOT NULL DEFAULT 2,
          is_random BOOLEAN NOT NULL DEFAULT FALSE,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `)
      await connection.execute('INSERT INTO ad_configs (display_count, is_random) VALUES (2, FALSE)')
    }
    
    console.log('Database setup complete.')
  } catch (err: any) {
    console.error('Error:', err.message)
  } finally {
    await connection.end()
  }
}

main()
