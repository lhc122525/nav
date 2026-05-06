# ============================================
# MySQL 数据库恢复脚本 (Windows PowerShell)
# 用法: .\scripts\restore.ps1 -BackupFile <备份文件名>
# ============================================

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

# 配置
$BackupDir = ".\backup"
$ContainerName = "navigation_mysql"
$Database = if ($env:MYSQL_DATABASE) { $env:MYSQL_DATABASE } else { "nav" }
$MysqlRootPassword = if ($env:MYSQL_ROOT_PASSWORD) { $env:MYSQL_ROOT_PASSWORD } else { "root_password" }

$BackupPath = Join-Path $BackupDir $BackupFile

# 检查文件是否存在
if (-not (Test-Path $BackupPath)) {
    Write-Host "错误: 备份文件不存在: $BackupPath" -ForegroundColor Red
    exit 1
}

Write-Host "=== 数据库恢复开始 ===" -ForegroundColor Yellow
Write-Host "数据库: $Database"
Write-Host "备份文件: $BackupPath"

# 检查容器是否运行
$ContainerRunning = docker ps --filter "name=$ContainerName" --format "{{.Names}}"
if (-not $ContainerRunning) {
    Write-Host "错误: MySQL 容器未运行" -ForegroundColor Red
    exit 1
}

# 确认操作
Write-Host "警告: 此操作将覆盖当前数据库数据！" -ForegroundColor Red
$Confirm = Read-Host "确定要继续吗？(y/N)"
if ($Confirm -ne "y" -and $Confirm -ne "Y") {
    Write-Host "操作已取消"
    exit 0
}

# 解压文件（如果是 .gz 文件）
$RestoreFile = $BackupPath
if ($BackupPath -like "*.gz") {
    Write-Host "正在解压备份文件..." -ForegroundColor Yellow
    $TempFile = $BackupPath -replace '\.gz$', ''
    Expand-Archive -Path $BackupPath -DestinationPath (Split-Path $BackupPath) -Force
    # 重命名解压后的文件
    $ExtractedFile = Join-Path (Split-Path $BackupPath) ((Split-Path $BackupPath -Leaf) -replace '\.gz$', '')
    Rename-Item (Join-Path (Split-Path $BackupPath) ((Split-Path $BackupPath -Leaf) -replace '\.sql\.gz$', '.sql')) $TempFile -Force -ErrorAction SilentlyContinue
    $RestoreFile = $TempFile
}

# 执行恢复
Write-Host "正在恢复数据库..." -ForegroundColor Yellow
Get-Content $RestoreFile | docker exec -i $ContainerName mysql `
    -u root `
    -p"$MysqlRootPassword" `
    $Database

# 清理临时文件
if ($RestoreFile -ne $BackupPath) {
    Remove-Item $RestoreFile -Force -ErrorAction SilentlyContinue
}

Write-Host "=== 恢复完成 ===" -ForegroundColor Green
Write-Host "数据库 $Database 已从 $BackupFile 恢复"
