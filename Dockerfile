# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/tool-ip/package.json ./apps/tool-ip/

RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY apps/web ./apps/web
COPY apps/tool-ip ./apps/tool-ip

WORKDIR /app/apps/web

COPY apps/web/.env.prod .env.prod

# 先构建微应用（产物输出到 apps/web/public/tools-sub，随 Nuxt 一并打包）
RUN pnpm --filter tool-ip build

RUN pnpm build:prod

# ============================================
# Stage 3: Runner
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxt

COPY --from=builder /app/nav ./nav

RUN chown -R nuxt:nodejs /app

USER nuxt

EXPOSE 8991

ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=8991

# 启动应用（正确读取 NUXT_PORT 环境变量）
CMD ["sh", "-c", "PORT=$NUXT_PORT node nav/server/index.mjs"]
