## 1. 数据库与迁移

- [x] 1.1 在 `server/db/schema.ts` 新增 `share_resources` 表（title/type/url/file_name/file_size/description/created_at/updated_at，created_at 索引）
- [x] 1.2 运行 `pnpm db:generate` 生成 drizzle 迁移（0004_curly_firebird.sql）。注：开发库 `__drizzle_migrations` 为空（由 SQL dump 初始化），`pnpm db:migrate` 会从 0000 重放失败，故按项目惯例（scripts/migrate.ps1）将 0004 SQL 直接应用到开发库；生产库后续按同一方式应用

## 2. 服务端接口

- [x] 2.1 抽取 `server/utils/uploads.ts`（getUploadBaseDir + deleteUploadByUrl，含路径穿越防护），重构 `upload.post.ts` 复用（行为不变）
- [x] 2.2 新增 `GET /api/admin/share-resources` 分页列表（标题关键字搜索、创建时间倒序）
- [x] 2.3 新增 `POST /api/admin/share-resources/create`（校验 url/file 类型与地址格式，写入记录）
- [x] 2.4 新增 `POST /api/admin/share-resources/update`（file 类型替换文件时删除旧物理文件）
- [x] 2.5 新增 `POST /api/admin/share-resources/delete` 与 `POST /api/admin/share-resources/batch-delete`（删除记录并清理物理文件）

## 3. 后台前端

- [x] 3.1 新增 `qrcode` 依赖（含 @types/qrcode）并安装
- [x] 3.2 新增后台页面 `/admin/share`：列表（多选、分页、搜索、类型标签、文件大小、地址、创建时间）+ 新增/编辑弹窗（三方链接 | 上传文件，可替换文件）
- [x] 3.3 实现分享弹窗：二维码 + 完整链接 + 复制/打开
- [x] 3.4 实现单个删除二次确认与批量删除二次确认（提示数量与不可恢复）
- [x] 3.5 侧边菜单新增"分享资源"入口并维护 active 高亮（`layouts/admin.vue`）

## 4. 验证与质量

- [x] 4.1 手动联调：新增 url/file 两类资源、编辑、替换文件、单删/批删后确认物理文件已删除、分享二维码外部可访问（E2E 脚本 20/20 通过：未登录 401/302 防护、非法地址 400、上传/新增/编辑/替换文件旧文件清理、单删/批删物理文件真实删除、/uploads/share 无残留、后台页面 SSR 渲染）
- [x] 4.2 运行 lint / typecheck 并修复问题（新增文件 0 error / 0 warning；typecheck 剩余错误均为其他文件既有问题；修复过程中发现 mysql2 execute 不支持 LIMIT ? 占位符，列表查询改用 pool.query）

## 5. 生产部署（2026-10-05）

- [ ] 5.1 `docker-compose.prod.yml`：app 服务设置 `NUXT_UPLOAD_DIR=/app/nav/public/uploads`（修复容器内上传写入路径不可访问）并挂载 `app_uploads` 命名卷持久化上传文件（发版后保留；首次挂载自动从镜像内容初始化）
- [ ] 5.2 提交并推送代码，运行 `deploy.ps1` 版本化发布（含发布前数据库备份与健康检查）
- [ ] 5.3 发布成功后对生产库应用 0004 迁移（`share_resources` 建表 + 索引；生产库 drizzle journal 为空，按项目惯例直接执行 SQL）
- [ ] 5.4 生产验证：健康检查通过、`share_resources` 表存在、`/admin/share` 页面与接口鉴权正常、上传文件外部可访问且持久
