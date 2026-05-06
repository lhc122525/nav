# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

WORKDIR /app

# 复制依赖描述文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY apps/web/package.json ./apps/web/

# 安装依赖
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# 复制源代码
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY apps/web ./apps/web

WORKDIR /app/apps/web

# 复制生产环境配置
COPY apps/web/.env.prod .env.prod

# 构建应用
RUN pnpm build:prod

# ============================================
# Stage 3: Runner
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxt

# 复制构建产物
COPY --from=builder /app/nav ./nav

# 设置正确的文件所有权
RUN chown -R nuxt:nodejs /app

# 切换到非 root 用户
USER nuxt

# 暴露端口
EXPOSE 8991

# 设置环境变量
ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=8991

# 启动应用
CMD ["node", "nav/server/index.mjs"]
