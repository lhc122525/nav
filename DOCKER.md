# Docker 部署指南

## 快速开始

### 一键部署（推荐）

在服务器项目目录下运行：

```powershell
# PowerShell
.\deploy.ps1

# 或 CMD
deploy.bat
```

### 其他操作

```powershell
# 查看服务状态
.\deploy.ps1 -Action status

# 查看日志
.\deploy.ps1 -Action logs

# 重启服务
.\deploy.ps1 -Action restart

# 停止服务
.\deploy.ps1 -Action stop

# 仅构建镜像
.\deploy.ps1 -Action build
```

---

## 手动操作

### 1. 构建并启动服务

```bash
# 使用默认配置启动
docker compose -f docker-compose.prod.yml up -d

# 或者使用自定义环境变量
cp .env.docker .env
# 编辑 .env 文件修改配置
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

### 2. 查看服务状态

```bash
docker compose -f docker-compose.prod.yml ps
```

### 3. 查看日志

```bash
# 查看所有服务日志
docker compose -f docker-compose.prod.yml logs -f

# 仅查看应用日志
docker compose -f docker-compose.prod.yml logs -f app
```

### 4. 停止服务

```bash
docker compose -f docker-compose.prod.yml down
```

---

## 服务说明

| 服务 | 端口 | 说明 |
|------|------|------|
| app | 8991 | Nuxt 应用 |
| mysql | 8999 | MySQL 数据库 |
| adminer | 8080 | 数据库管理工具（可选） |

---

## 数据库管理

### 启用 Adminer 管理工具

```bash
docker compose -f docker-compose.prod.yml --profile admin up -d
```

访问 `http://服务器IP:8080` 进行数据库管理。

---

## 数据备份与恢复

### Windows (PowerShell)

#### 备份数据库

```powershell
# 使用默认文件名
.\scripts\backup.ps1

# 指定备份名称
.\scripts\backup.ps1 -BackupName "my_backup"
```

#### 恢复数据库

```powershell
# 恢复指定备份
.\scripts\restore.ps1 -BackupFile "nav_backup_20260506_120000.sql.gz"
```

#### 从其他服务器迁移

```powershell
# 导入 SQL 文件
.\scripts\migrate.ps1 -SqlFile ".\old_database.sql"
```

### Linux/macOS (Bash)

#### 备份数据库

```bash
# 使用默认文件名
./scripts/backup.sh

# 指定备份名称
./scripts/backup.sh my_backup
```

#### 恢复数据库

```bash
./scripts/restore.sh nav_backup_20260506_120000.sql.gz
```

---

## 常见问题

### Q: 如何修改端口？

编辑 `.env.docker` 文件或直接修改 `docker-compose.prod.yml` 中的端口映射。

### Q: 数据存储在哪里？

MySQL 数据存储在 Docker Volume `mysql_data` 中，可通过以下命令查看：

```bash
docker volume inspect navigation_mysql_data
```

### Q: 如何查看容器资源使用？

```bash
docker stats navigation_app navigation_mysql
```

### Q: 如何进入 MySQL 容器执行 SQL？

```bash
docker exec -it navigation_mysql mysql -u root -p
```

### Q: 备份文件存储在哪里？

备份文件存储在项目根目录的 `./backup/` 文件夹中，默认保留最近 7 个备份。

---

## 目录结构

```text
.
├── Dockerfile                 # 应用镜像构建文件
├── docker-compose.prod.yml    # 生产环境编排文件
├── .dockerignore              # Docker 构建忽略文件
├── .env.docker                # 环境变量模板
├── deploy.ps1                 # 部署脚本 (PowerShell)
├── deploy.bat                 # 部署脚本 (CMD)
├── backup/                    # 数据库备份目录
│   └── nav_backup_*.sql.gz
└── scripts/                   # 运维脚本
    ├── backup.ps1             # 备份脚本 (Windows)
    ├── restore.ps1            # 恢复脚本 (Windows)
    └── migrate.ps1            # 迁移脚本 (Windows)
```
