# 部署指南

## 当前方案

当前项目已切换为 `Docker Compose + 版本化发布 + 快速回滚`，不再使用 PM2。

现在有两种发布方式：

- 本地触发：在自己电脑上运行 `deploy.ps1` / `rollback.ps1`，通过 SSH 到服务器执行
- 服务器直发版：登录服务器后直接运行 `scripts/deploy-remote.sh` / `scripts/rollback-remote.sh`

两种方式共用同一套发布逻辑，都会写入：

- `.deploy/manifest.json`
- `.deploy/releases/<version>/`
- `.deploy/backups/db/nav_before_<version>.sql`

## 环境要求

### 本地触发模式

- Windows PowerShell
- `ssh`
- `scp`
- 可访问服务器的 SSH 私钥

### 服务器直发版模式

- Ubuntu / Linux
- Docker 与 Docker Compose
- Git
- Python 3
- curl

## 本地触发发布

### 1. 准备本地配置

复制 `release.config.example.ps1` 为 `release.config.local.ps1`，填写服务器参数。

示例：

```powershell
$ReleaseLocalSettings = @{
    ServerHost         = "119.91.40.143"
    ServerUser         = "ubuntu"
    SshKeyPath         = "C:\Users\69464\.ssh\server_key"
    RemoteProjectPath  = "/home/ubuntu/navigationSite"
    ComposeProjectName = "navigationsite"
    HealthEndpoint     = "http://127.0.0.1:8991/api/links"
    DatabaseName       = "nav"
    MysqlRootPassword  = "root_password"
    KeepReleases       = 5
    KeepBackups        = 10
}
```

### 2. 发版

```powershell
.\deploy.ps1
```

### 3. 查看状态

```powershell
.\deploy.ps1 -Action status
```

### 4. 查看日志

```powershell
.\deploy.ps1 -Action logs
```

### 5. 回滚

默认回滚到 `previous`：

```powershell
.\rollback.ps1
```

指定版本回滚：

```powershell
.\rollback.ps1 -Version "20260509-103922"
```

带数据库恢复回滚：

```powershell
.\rollback.ps1 -RestoreDatabase
```

## 服务器直发版

### 1. 登录服务器

```bash
ssh -i ~/.ssh/server_key ubuntu@119.91.40.143
cd /home/ubuntu/navigationSite
```

### 2. 发版

```bash
bash scripts/deploy-remote.sh
```

跳过拉代码：

```bash
bash scripts/deploy-remote.sh --skip-git-pull
```

指定版本号：

```bash
bash scripts/deploy-remote.sh --version 20260509-120000
```

### 3. 回滚

默认回滚：

```bash
bash scripts/rollback-remote.sh
```

指定版本回滚：

```bash
bash scripts/rollback-remote.sh --version 20260509-103922
```

带数据库恢复回滚：

```bash
bash scripts/rollback-remote.sh --restore-database
```

指定数据库备份文件：

```bash
bash scripts/rollback-remote.sh \
  --version 20260509-103922 \
  --restore-database \
  --database-backup-file /home/ubuntu/navigationSite/.deploy/backups/db/nav_before_20260509-103922.sql
```

### 4. 服务器本地查看状态

```bash
cd /home/ubuntu/navigationSite
bash -lc 'source scripts/release-remote-common.sh && print_release_status .deploy/manifest.json'
```

## 反向代理

如果你使用宝塔或 Nginx，继续反代到应用容器暴露的端口即可：

- 目标地址：`http://127.0.0.1:8991`

示例：

```nginx
# 上传文件（分享资源等）需要放宽请求体上限，Nginx 默认 1m 会导致 /api/admin/upload 返回 413
client_max_body_size 200m;

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

## 目录说明

```text
.deploy/
├── manifest.json
├── backups/
│   └── db/
│       └── nav_before_<version>.sql
└── releases/
    └── <version>/
```

`manifest.json` 关键字段：

- `current`: 当前线上版本
- `previous`: 上一个版本
- `releases`: 发布历史、备份文件、状态、时间

## 故障排查

### 查看容器状态

```bash
docker ps
```

### 查看应用日志

```bash
docker logs -f navigation_app
```

### 进入 MySQL 容器

```bash
docker exec -it navigation_mysql mysql -uroot -p
```

### 查看当前发布状态

```powershell
.\deploy.ps1 -Action status
```

或在服务器：

```bash
bash -lc 'source scripts/release-remote-common.sh && print_release_status .deploy/manifest.json'
```
