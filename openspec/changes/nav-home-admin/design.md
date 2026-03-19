## Context

项目已具备 Nuxt3 SSR + Element Plus + MySQL（连接池）与 OpenAPI 展示页。当前首页仅展示简单链接卡片；后台管理页已存在雏形（/admin，links CRUD），但缺少管理员认证、分类/链接的完整运营模型、申请收录与留言承接页，以及系统化的 SEO 输出（sitemap/robots/canonical 已有初版）。

本变更将把“导航列表”产品化：围绕首页的信息架构与后台数据维护形成闭环，并补齐增长入口（申请收录、留言板）。

约束：
- 以现有 Turbo + Nuxt3 SSR + Element Plus + MySQL 架构为基础，不引入必须的复杂外部服务。
- Admin 鉴权不依赖第三方 SaaS；优先使用 Node 原生 crypto + MySQL 实现会话。
- API 与 OpenAPI 文档保持同步，接口可用于前端 SSR 数据获取与后台操作。

## Goals / Non-Goals

**Goals:**
- 首页：顶部导航栏（首页/申请收录/留言板/登录），左侧分类，右侧链接列表按分类联动展示，支持 PC/H5 适配。
- 申请收录：可提交网址（标题、URL、描述、联系方式可选），保存为待处理记录。
- 留言板：可提交留言并展示（默认展示公开留言，后台可隐藏）。
- 管理后台：超级管理员登录后进入后台；支持创建/禁用管理员账号；初始化账号在 dev 初始化脚本中提供。
- 后台导航管理：分类与链接可列表查看、筛选、排序；支持弹窗增删改。
- 安全基线：管理接口强制鉴权；密码不明文存储；会话使用 HttpOnly cookie。

**Non-Goals:**
- 不实现复杂 RBAC（仅区分 super/admin 两级满足需求）。
- 不实现自动化审核流（申请收录仅入库，后续由管理员处理）。
- 不实现第三方 OAuth 登录（当前仅后台管理员登录）。
- 不实现全文检索与推荐算法（列表筛选使用 SQL LIKE/分类过滤即可）。

## Decisions

1) 会话鉴权方案：MySQL Session + HttpOnly Cookie
- 方案：登录成功后生成随机 token（crypto.randomBytes），写入 sessions 表（含过期时间），返回 `Set-Cookie`（HttpOnly、SameSite=Lax、Secure(生产)）。
- 理由：无外部依赖，易于撤销与过期控制；适配 SSR 与 server routes。
- 备选：JWT（需要额外库或自行实现签名/刷新策略），短期复杂度更高。

2) API 分层：public 与 admin 前缀隔离
- public：`/api/categories`、`/api/links`、`/api/submissions`（提交）、`/api/guestbook`（查询/提交）。
- admin：`/api/admin/*`（强制鉴权），例如 `admin/categories`、`admin/links`、`admin/admin-users`、`admin/submissions`、`admin/guestbook`.
- 理由：清晰的安全边界；OpenAPI 分组更直观；便于在中间件中统一拦截 `/api/admin/**`。

3) 数据模型：以“可运营”为目标的最小字段集
- categories：`name`、`slug`、`sort`、`created_at`、`updated_at`（slug 唯一）。
- links：`category_id`、`title`、`url`、`description`、`icon_url`、`is_active`、`sort`、`created_at`、`updated_at`（title+url 唯一或 url 唯一由产品决策）。
- admin_users：`username`、`password_hash`、`role`、`is_active`、`created_at`、`updated_at`（username 唯一）。
- admin_sessions：`token`、`admin_user_id`、`expires_at`、`created_at`（token 唯一）。
- submissions：`title`、`url`、`description`、`contact`、`status`、`created_at`、`handled_by`、`handled_at`。
- guestbook_messages：`nickname`、`content`、`is_visible`、`ip`、`user_agent`、`created_at`。

4) 前端页面组织：SSR 优先 + 组件化复用
- 首页：SSR 获取 categories + 当前分类 links（默认全部或第一个分类），左侧选择更新 query 参数（例如 `?category=<slug|id>`），右侧列表响应式更新。
- 申请收录/留言板：SSR 渲染列表；提交走 client-side POST，成功后刷新局部数据。
- 后台：页面层复用同一套 CRUD Dialog（分类与链接分别一套），由 admin API 提供数据。

## Risks / Trade-offs

- [管理接口暴露风险] → 强制 `/api/admin/**` 鉴权；默认禁用跨站请求；cookie 使用 HttpOnly + SameSite；生产启用 Secure。
- [初始密码泄露] → 初始化账号仅用于 dev；生产环境通过环境变量或一次性初始化流程创建；密码必须可修改。
- [SEO 误收录后台与 OpenAPI] → `/admin`、`/openapi` 通过 `x-robots-tag` 明确 noindex；robots.txt 仅允许公开页面。
- [数据一致性/外键约束] → links.category_id 使用外键或应用层校验；删除分类前校验是否存在链接或提供级联策略。

