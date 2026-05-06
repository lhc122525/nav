# 部署指南

## 环境要求

- Node.js >= 18
- pnpm
- PM2
- MySQL 数据库

## 快速部署

### 1. 首次部署

双击运行 `deploy.bat` 或在项目根目录执行：

```bash
# 安装依赖
pnpm install

# 构建生产版本
pnpm build:prod

# 启动服务
pm2 start ecosystem.config.json
```

### 2. 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建
pnpm build:prod

# 重启服务
pm2 restart navigation-site
```

## PM2 常用命令

```bash
pm2 list                      # 查看进程列表
pm2 logs                      # 查看日志
pm2 logs navigation-site      # 查看指定服务日志
pm2 restart navigation-site   # 重启服务
pm2 stop navigation-site      # 停止服务
pm2 delete navigation-site    # 删除服务
pm2 monit                     # 监控面板
```

## 宝塔反向代理配置

1. 在宝塔中创建网站（纯静态即可）
2. 设置反向代理：
   - 目标URL: `http://127.0.0.1:8991`
   - 发送域名: `$host`

### Nginx 配置示例

```nginx
location / {
    proxy_pass http://127.0.0.1:8991;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

## 环境变量配置

编辑 `ecosystem.config.json` 中的 `env` 部分：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PORT | 服务端口 | 8991 |
| NUXT_MYSQL_HOST | MySQL 主机 | 127.0.0.1 |
| NUXT_MYSQL_PORT | MySQL 端口 | 3306 |
| NUXT_MYSQL_USER | MySQL 用户 | feileyu |
| NUXT_MYSQL_PASSWORD | MySQL 密码 | - |
| NUXT_MYSQL_DATABASE | 数据库名 | feileyu |
| NUXT_PUBLIC_SITE_NAME | 站点名称 | 非乐鱼 |
| NUXT_PUBLIC_SITE_URL | 站点 URL | http://feileyu.cn |

## 开机自启动

```bash
# 保存当前 PM2 进程列表
pm2 save

# 生成开机启动脚本
pm2-startup
```

## 故障排查

### 查看错误日志
```bash
pm2 logs navigation-site --err
```

### 查看输出日志
```bash
pm2 logs navigation-site --out
```

### 检查端口占用
```bash
netstat -ano | findstr :8991
```
