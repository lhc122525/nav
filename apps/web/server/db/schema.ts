import {
  bigint,
  boolean,
  foreignKey,
  index,
  int,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar
} from 'drizzle-orm/mysql-core'

export const categories = mysqlTable(
  'categories',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().notNull().primaryKey(),
    parentId: bigint('parent_id', { mode: 'number', unsigned: true }),
    name: varchar('name', { length: 50 }).notNull(),
    slug: varchar('slug', { length: 80 }).notNull(),
    sort: int('sort').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
  },
  (table) => ({
    fkCategoriesParent: foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id]
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    ukCategoriesSlug: uniqueIndex('uk_categories_slug').on(table.slug)
  })
)

export const links = mysqlTable(
  'links',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().notNull().primaryKey(),
    categoryId: bigint('category_id', { mode: 'number', unsigned: true })
      .references(() => categories.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    title: varchar('title', { length: 100 }).notNull(),
    url: varchar('url', { length: 500 }).notNull(),
    description: varchar('description', { length: 255 }).notNull().default(''),
    iconUrl: varchar('icon_url', { length: 500 }).notNull().default(''),
    isActive: boolean('is_active').notNull().default(true),
    isRecommended: boolean('is_recommended').notNull().default(false),
    sort: int('sort').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
  },
  (table) => ({
    ukLinksUrl: uniqueIndex('uk_links_url').on(table.url),
    idxLinksCategory: index('idx_links_category').on(table.categoryId)
  })
)

export const adminUsers = mysqlTable(
  'admin_users',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().notNull().primaryKey(),
    username: varchar('username', { length: 50 }).notNull(),
    passwordSalt: varchar('password_salt', { length: 64 }).notNull(),
    passwordHash: varchar('password_hash', { length: 128 }).notNull(),
    role: varchar('role', { length: 20 }).notNull().default('admin'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
  },
  (table) => ({
    ukAdminUsersUsername: uniqueIndex('uk_admin_users_username').on(table.username)
  })
)

export const adminSessions = mysqlTable(
  'admin_sessions',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().notNull().primaryKey(),
    adminUserId: bigint('admin_user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    token: varchar('token', { length: 128 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  (table) => ({
    ukAdminSessionsToken: uniqueIndex('uk_admin_sessions_token').on(table.token),
    idxAdminSessionsUser: index('idx_admin_sessions_user').on(table.adminUserId),
    idxAdminSessionsExpires: index('idx_admin_sessions_expires').on(table.expiresAt)
  })
)

export const users = mysqlTable(
  'users',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().notNull().primaryKey(),
    username: varchar('username', { length: 50 }).notNull(),
    userAlias: varchar('user_alias', { length: 40 }).notNull(),
    passwordSalt: varchar('password_salt', { length: 64 }).notNull(),
    passwordHash: varchar('password_hash', { length: 128 }).notNull(),
    role: varchar('role', { length: 20 }).notNull().default('user'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
  },
  (table) => ({
    ukUsersUsername: uniqueIndex('uk_users_username').on(table.username)
  })
)

export const userSessions = mysqlTable(
  'user_sessions',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().notNull().primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    token: varchar('token', { length: 128 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  (table) => ({
    ukUserSessionsToken: uniqueIndex('uk_user_sessions_token').on(table.token),
    idxUserSessionsUser: index('idx_user_sessions_user').on(table.userId),
    idxUserSessionsExpires: index('idx_user_sessions_expires').on(table.expiresAt)
  })
)

export const submissions = mysqlTable(
  'submissions',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().notNull().primaryKey(),
    title: varchar('title', { length: 120 }).notNull(),
    url: varchar('url', { length: 500 }).notNull(),
    description: varchar('description', { length: 255 }).notNull().default(''),
    contact: varchar('contact', { length: 120 }).notNull().default(''),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    isIncluded: boolean('is_included').notNull().default(false),
    handledBy: bigint('handled_by', { mode: 'number', unsigned: true })
      .references(() => adminUsers.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    handledAt: timestamp('handled_at'),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  (table) => ({
    idxSubmissionsUrl: index('idx_submissions_url').on(table.url),
    idxSubmissionsStatus: index('idx_submissions_status').on(table.status),
    idxSubmissionsIncluded: index('idx_submissions_included').on(table.isIncluded),
    idxSubmissionsCreated: index('idx_submissions_created').on(table.createdAt)
  })
)

export const guestbookMessages = mysqlTable(
  'guestbook_messages',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().notNull().primaryKey(),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    nickname: varchar('nickname', { length: 50 }).notNull().default(''),
    content: varchar('content', { length: 500 }).notNull(),
    isVisible: boolean('is_visible').notNull().default(true),
    ip: varchar('ip', { length: 64 }).notNull().default(''),
    userAgent: varchar('user_agent', { length: 255 }).notNull().default(''),
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  (table) => ({
    idxGuestbookVisible: index('idx_guestbook_visible').on(table.isVisible),
    idxGuestbookCreated: index('idx_guestbook_created').on(table.createdAt),
    idxGuestbookUser: index('idx_guestbook_user').on(table.userId)
  })
)

export const searchCategories = mysqlTable(
  'search_categories',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().notNull().primaryKey(),
    name: varchar('name', { length: 50 }).notNull(),
    sort: int('sort').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
  }
)

export const searchEngines = mysqlTable(
  'search_engines',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().notNull().primaryKey(),
    categoryId: bigint('category_id', { mode: 'number', unsigned: true })
      .references(() => searchCategories.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    name: varchar('name', { length: 50 }).notNull(),
    url: varchar('url', { length: 500 }).notNull(),
    iconUrl: varchar('icon_url', { length: 500 }).notNull().default(''),
    sort: int('sort').notNull().default(0),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
  },
  (table) => ({
    idxSearchEnginesCategory: index('idx_search_engines_category').on(table.categoryId)
  })
)

export const searchStats = mysqlTable(
  'search_stats',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().notNull().primaryKey(),
    engineId: bigint('engine_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => searchEngines.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
    count: int('count').notNull().default(1),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
  },
  (table) => ({
    ukSearchStats: uniqueIndex('uk_search_stats').on(table.engineId, table.userId, table.date),
    idxSearchStatsDate: index('idx_search_stats_date').on(table.date)
  })
)

export const linkStats = mysqlTable(
  'link_stats',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().notNull().primaryKey(),
    linkId: bigint('link_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => links.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    userId: bigint('user_id', { mode: 'number', unsigned: true })
      .references(() => users.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
    count: int('count').notNull().default(1),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
  },
  (table) => ({
    ukLinkStats: uniqueIndex('uk_link_stats').on(table.linkId, table.userId, table.date),
    idxLinkStatsDate: index('idx_link_stats_date').on(table.date)
  })
)

export const ads = mysqlTable(
  'ads',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().notNull().primaryKey(),
    title: varchar('title', { length: 100 }).notNull(),
    imageUrl: varchar('image_url', { length: 500 }).notNull(),
    url: varchar('url', { length: 500 }).notNull(),
    sort: int('sort').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
  },
  (table) => ({
    idxAdsSort: index('idx_ads_sort').on(table.sort),
    idxAdsActive: index('idx_ads_active').on(table.isActive)
  })
)

export const adConfigs = mysqlTable(
  'ad_configs',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).autoincrement().notNull().primaryKey(),
    displayCount: int('display_count').notNull().default(2),
    isRandom: boolean('is_random').notNull().default(false),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
  }
)
