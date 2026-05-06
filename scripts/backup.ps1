# ============================================
# MySQL 数据库备份脚本 (Windows PowerShell)
# 用法: .\scripts\backup.ps1 [-BackupName <名称>]
# ============================================

param(
    [string]$BackupName = ""
)

# 配置
$BackupDir = ".\backup"
$ContainerName = "navigation_mysql"
$Database = if ($env:MYSQL_DATABASE) { $env:MYSQL_DATABASE } else { "nav" }
$MysqlRootPassword = if ($env:MYSQL_ROOT_PASSWORD) { $env:MYSQL_ROOT_PASSWORD } else { "root_password" }

# 备份文件名
if ($BackupName) {
    $BackupFileName = "$BackupName.sql"
} else {
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $BackupFileName = "nav_backup_$Timestamp.sql"
}

$BackupFile = Join-Path $BackupDir $BackupFileName

Write-Host "=== 数据库备份开始 ===" -ForegroundColor Yellow
Write-Host "数据库: $Database"
Write-Host "备份文件: $BackupFile"

# 创建备份目录
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# 检查容器是否运行
$ContainerRunning = docker ps --filter "name=$ContainerName" --format "{{.Names}}"
if (-not $ContainerRunning) {
    Write-Host "错误: MySQL 容器未运行" -ForegroundColor Red
    Write-Host "请先启动容器: docker compose -f docker-compose.prod.yml up -d"
    exit 1
}

# 执行备份
Write-Host "正在备份数据库..." -ForegroundColor Yellow
docker exec $ContainerName mysqldump `
    -u root `
    -p"$MysqlRootPassword" `
    --single-transaction `
    --routines `
    --triggers `
    --events `
    $Database | Out-File -FilePath $BackupFile -Encoding UTF8

# 压缩备份文件
Write-Host "正在压缩备份文件..." -ForegroundColor Yellow
$CompressedFile = "$BackupFile.gz"
Compress-Archive -Path $BackupFile -DestinationPath "$BackupFile.zip" -Force
Remove-Item $BackupFile -Force
Rename-Item "$BackupFile.zip" "$BackupFile.gz" -Force

# 显示备份信息
Write-Host "=== 备份完成 ===" -ForegroundColor Green
Write-Host "备份文件: $CompressedFile"
$FileSize = (Get-Item $CompressedFile).Length / 1MB
Write-Host ("文件大小: {0:N2} MB" -f $FileSize)

# 清理旧备份（保留最近 7 个）
Write-Host "清理旧备份文件（保留最近 7 个）..." -ForegroundColor Yellow
$Backups = Get-ChildItem -Path $BackupDir -Filter "nav_backup_*.sql.gz" | Sort-Object LastWriteTime -Descending
if ($Backups.Count -gt 7) {
    $Backups | Select-Object -Skip 7 | Remove-Item -Force
}
$CurrentCount = (Get-ChildItem -Path $BackupDir -Filter "nav_backup_*.sql.gz").Count
Write-Host "当前备份文件数量: $CurrentCount" -ForegroundColor Green
