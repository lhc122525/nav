## Context

后台已有模块（导航/搜索/统计/收录/广告）均遵循统一模式：`/api/admin/**` 接口用 mysql2 连接池直写 SQL（见 `apps/web/server/api/admin/ads*`），鉴权由 `server/middleware/adminAuth.ts` 统一处理；后台页面使用 Element Plus（如 `app/pages/admin/ads.vue`），通过 `definePageMeta({ middleware: ['admin-auth'], layout: 'admin' })` 挂载。文件上传已有现成接口 `POST /api/admin/upload`（scope 参数控制子目录，写入 `public/uploads/<scope>/`，返回 `/uploads/<scope>/<file>`），打赏二维码即通过该接口上传且公网可访问。

本次新增"分享资源"模块完全沿用上述模式，不引入新的运行时形态。

## Goals / Non-Goals

**Goals:**
- 一条资源记录对应一个三方 URL 或一个服务器文件。
- 列表支持分页、标题关键字搜索、多选批量删除、单个删除、编辑、分享。
- 删除为真实删除：记录与对应物理文件一起删除。
- 点击"分享"生成外部可访问二维码（扫码即可访问链接/下载文件）。
- 上传文件生成站点地址（`/uploads/share/...`），公网可直接访问。

**Non-Goals:**
- 不做前台资源展示页/资源广场（仅管理端）。
- 不做下载量统计、有效期、提取码等扩展能力。
- 不做分片上传/断点续传（沿用现有一次性上传）。
- 不新增公开（未鉴权）接口；二维码直接指向资源地址本身。
- 不更新 OpenAPI 文档（后续新增模块如广告亦未登记，保持一致）。

## Decisions

### 1. 数据模型：单表 `share_resources`，type 区分来源
字段：`id`、`title`、`type`('url'|'file')、`url`、`file_name`（原始文件名）、`file_size`（字节）、`description`、`created_at`、`updated_at`；`created_at` 建索引。
- url 类型：`url` 存三方完整地址（http/https）。
- file 类型：`url` 存站点相对地址（`/uploads/share/<file>`），`file_name`/`file_size` 记录原文件信息。

备选：拆 `share_links` / `share_files` 两表 —— 两种来源共享同一套展示、编辑与分享逻辑，单表更简单直接。

### 2. 上传复用现有 upload 接口（scope=share）
前端上传直接调用 `POST /api/admin/upload`（FormData: file + scope='share'），文件落到 `public/uploads/share/`，返回 `/uploads/share/<file>`，随 create 接口写入记录。不新增上传接口。

备选：新增独立上传接口 —— 与现有能力完全重复。

### 3. 真实删除：DB 行先删，物理文件尽力删
- 将 `upload.post.ts` 中的目录解析逻辑抽取为 `server/utils/uploads.ts`（`getUploadBaseDir`），新增 `deleteUploadByUrl(url)`：仅处理以 `/uploads/` 开头的站内地址，拒绝包含 `..` 的路径（防目录穿越），删除存在的文件；文件不存在或删除失败不阻断删除流程。
- 单删/批删/更新替换文件时调用；先删 DB 记录（记录为准），再清理文件（best-effort）。
- 三方 URL 类型仅删记录，无文件操作。

备选：文件删除失败则回滚记录 —— 文件系统异常不应阻断"真实删除"诉求；以记录为准，残余文件可人工清理。

### 4. 二维码：前端生成，直指资源地址
新增 `qrcode` 依赖，分享弹窗内用 `QRCode.toDataURL(link)` 生成二维码：
- url 类型：二维码内容为三方地址本身。
- file 类型：内容为 `siteUrl + url`（siteUrl 取 `runtimeConfig.public.siteUrl`，兜底 `window.location.origin`）。
- 弹窗同时展示完整链接、复制、新窗口打开。`/uploads/**` 由 Nitro 静态服务公网可访问，扫码即可访问/下载。

备选：搭建 `/s/:token` 分享落地页 —— 用户诉求是"外部可访问二维码"，直链已满足；落地页（可带统计/提取码）留作后续扩展。

### 5. 接口风格与校验沿用现有约定
- `GET /api/admin/share-resources?page&pageSize&keyword` → `{ list, total }`（标题 LIKE 搜索，`created_at DESC, id DESC`）。
- `POST /api/admin/share-resources/create|update|delete|batch-delete`，均位于 `/api/admin` 鉴权域内，自动受 adminAuth 保护。
- create 校验：url 类型必须 http(s):// 开头；file 类型 url 必须 `/uploads/` 开头（防止伪造记录）。
- update：file 类型若 url 发生变化，先删旧物理文件再更新记录。

## Risks / Trade-offs

- [大文件上传占用磁盘且无配额] → 沿用现有上传通道，不做额外限制；列表展示文件大小便于人工管控，后续可加限额。
- [删除记录后文件清理失败产生孤儿文件] → 接受 best-effort，接口不因此失败；路径解析带穿越校验，不会误删站外文件。
- [qrcode 为前端新增依赖] → 仅后台页面使用、体量小（约 30KB），换取零外部服务的二维码生成（不依赖第三方 QR API，内网可用）。
- [批量删除为物理操作不可恢复] → 前端二次确认，明确提示删除数量与不可恢复性。

## Migration Plan

1. `server/db/schema.ts` 增加 `share_resources` 表，`pnpm db:generate` 生成 drizzle 迁移，`pnpm db:migrate` 应用到数据库。
2. 抽取 `server/utils/uploads.ts`，重构 `upload.post.ts` 复用（行为不变）。
3. 新增 share-resources 接口（list/create/update/delete/batch-delete）。
4. 新增后台页面 `/admin/share` 与菜单入口，新增 `qrcode` 依赖并安装。
5. 联调验证：新增（url/file）、编辑（含替换文件）、单删/批删（物理文件真实删除）、分享二维码外部可访问。

## Open Questions

- 无（二维码采用直链方案；如后续需要带统计/落地页/提取码的分享，再扩展 `/s/:token` 机制）。
