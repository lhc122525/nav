import { JSDOM } from 'jsdom'
import axios from 'axios'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from '../server/db/schema.ts'
import { eq, and } from 'drizzle-orm'

// 数据库配置
const dbConfig = {
  host: '127.0.0.1',
  port: 8999,
  user: 'nszm',
  password: 'nszm123..',
  database: 'nav'
}

async function checkUrl(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url, { 
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      validateStatus: (status) => status >= 200 && status < 400
    })
    return true
  } catch (error) {
    try {
      await axios.get(url, { 
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        maxContentLength: 1024 * 1024,
        validateStatus: (status) => status >= 200 && status < 400
      })
      return true
    } catch (e) {
      return false
    }
  }
}

function generateSlug(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  if (!slug) {
    return 'c-' + Math.random().toString(36).substring(2, 7)
  }
  return slug
}

async function getUniqueSlug(db: any, name: string): Promise<string> {
  const baseSlug = generateSlug(name)
  let slug = baseSlug
  let counter = 1
  
  while (true) {
    const existing = await db.select().from(schema.categories).where(eq(schema.categories.slug, slug)).limit(1)
    if (existing.length === 0) {
      return slug
    }
    slug = `${baseSlug}-${counter}`
    counter++
  }
}

async function main() {
  const connection = await mysql.createConnection(dbConfig)
  const db = drizzle(connection, { schema, mode: 'default' })

  console.log('开始分析 https://www.kulayu.com/ ...')
  
  try {
    const { data: html } = await axios.get('https://www.kulayu.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    const dom = new JSDOM(html)
    const document = dom.window.document

    // 酷啦鱼的结构：
    // 顶级分类容器: .collect-card
    // 顶级分类标题: h3.term-title
    // 子分类 Tab: .term-tab-item a (data-id)
    // 内容区域: .collect-card-tab (id 匹配 data-id)
    
    const collectCards = document.querySelectorAll('.collect-card')
    console.log(`页面上一共找到 ${collectCards.length} 个顶级分类区块`)

    for (const card of Array.from(collectCards)) {
      const h3 = card.querySelector('h3.term-title')
      if (!h3) continue

      const parentName = h3.textContent?.trim() || ''
      if (!parentName || parentName === '小伙伴们' || parentName === '首页') continue

      console.log(`\n处理顶级分类: ${parentName}`)
      
      let parentCategory = (await db.select().from(schema.categories).where(eq(schema.categories.name, parentName)).limit(1))[0]
      if (!parentCategory) {
        const slug = await getUniqueSlug(db, parentName)
        const [result] = await db.insert(schema.categories).values({
          name: parentName,
          slug,
          sort: 100
        })
        parentCategory = (await db.select().from(schema.categories).where(eq(schema.categories.id, Number(result.insertId))).limit(1))[0]
        console.log(`  + 创建顶级分类: ${parentName} (slug: ${slug})`)
      }

      // 获取子分类 Tab
      const tabLinks = card.querySelectorAll('.term-tab-item a')
      for (const tabLink of Array.from(tabLinks)) {
        const subName = tabLink.textContent?.trim() || ''
        const tabId = tabLink.getAttribute('data-id') || ''
        if (!subName || !tabId) continue

        console.log(`  处理二级分类: ${subName}`)
        
        let subCategory = (await db.select().from(schema.categories).where(
          and(
            eq(schema.categories.name, subName),
            eq(schema.categories.parentId, parentCategory.id)
          )
        ).limit(1))[0]
        
        if (!subCategory) {
          const slug = await getUniqueSlug(db, subName)
          const [result] = await db.insert(schema.categories).values({
            name: subName,
            slug,
            parentId: parentCategory.id,
            sort: 50
          })
          subCategory = (await db.select().from(schema.categories).where(eq(schema.categories.id, Number(result.insertId))).limit(1))[0]
          console.log(`    + 创建二级分类: ${subName} (slug: ${slug})`)
        }

        // 查找对应的内容区域
        const contentArea = card.querySelector(`#${tabId}`)
        if (!contentArea) {
          console.log(`    ! 未找到内容区域: ${tabId}`)
          continue
        }

        const linkCards = contentArea.querySelectorAll('.site-def-card-item')
        console.log(`    找到 ${linkCards.length} 个链接卡片`)

        for (const linkCard of Array.from(linkCards)) {
          const titleElement = linkCard.querySelector('.site-def-url-title')
          const descElement = linkCard.querySelector('.site-def-url-desc')
          const urlElement = linkCard.querySelector('a.site-def-url-card')
          const imgElement = linkCard.querySelector('.site-def-url-img img')

          const title = titleElement?.textContent?.trim() || ''
          const url = urlElement?.getAttribute('href') || ''
          const desc = descElement?.textContent?.trim() || ''
          const iconUrl = imgElement?.getAttribute('data-lazy') || imgElement?.getAttribute('src') || ''

          if (!title || !url) continue

          // 绝对化 URL (如果它是相对的，虽然酷啦鱼上通常是绝对的)
          let finalUrl = url
          if (url.startsWith('/')) {
            finalUrl = `https://www.kulayu.com${url}`
          }

          console.log(`      - 正在校验链接: ${title} (${finalUrl})`)
          const isValid = await checkUrl(finalUrl)
          if (!isValid) {
            console.log(`        x 无法访问，跳过`)
            continue
          }

          try {
            await db.insert(schema.links).values({
              categoryId: subCategory.id,
              title,
              url: finalUrl,
              description: desc.substring(0, 255),
              iconUrl,
              isActive: true
            }).onDuplicateKeyUpdate({
              set: { title, description: desc.substring(0, 255), iconUrl }
            })
            console.log(`        √ 已写入`)
          } catch (err) {
            console.error(`        ! 写入失败: ${err}`)
          }
        }
      }
    }

    console.log('\n抓取任务完成！')
  } catch (error) {
    console.error('抓取过程中出错:', error)
  } finally {
    await connection.end()
  }
}

main()
