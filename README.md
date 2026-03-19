# navigationSite

导航网站项目骨架：Turbo + Nuxt3（SSR）+ Vue3 + Element Plus + MySQL，并集成 OpenAPI 文档页。

## 目录结构

- apps/web：Nuxt SSR 应用（导航站）
- dev/db：本地 MySQL 初始化脚本

## 开发环境

1) 安装依赖

```bash
pnpm install
```

2) 启动 MySQL（可选）

```bash
docker compose up -d
```

3) 配置环境变量

复制 [apps/web/.env.example](file:///d:/work/2099/me/navigationSite/apps/web/.env.example) 为 apps/web/.env，然后按需修改。

4) 启动开发服务器

```bash
pnpm dev
```

默认访问：

- 站点：http://localhost:3000
- OpenAPI：http://localhost:3000/openapi
- Adminer（可选）：http://localhost:8080

## 常用命令

```bash
pnpm dev
pnpm build
pnpm lint
pnpm check-types
```
