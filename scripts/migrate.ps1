# ============================================
# 数据库迁移脚本 (Windows PowerShell)
# 从本地/其他服务器迁移数据到 Docker 环境
# ============================================

param(
    [Parameter(Mandatory=$true)]
    [string]$SqlFile
)

# 配置
$ContainerName = "navigation_mysql"
$Database = if ($env:MYSQL_DATABASE) { $env:MYSQL_DATABASE } else { "nav" }
$MysqlRootPassword = if ($env:MYSQL_ROOT_PASSWORD) { $env:MYSQL_ROOT_PASSWORD } else { "root_password" }

Write-Host "=== 数据库迁移工具 ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "此脚本帮助将数据从本地或其他服务器迁移到 Docker MySQL"
Write-Host ""

# 检查文件是否存在
if (-not (Test-Path $SqlFile)) {
    Write-Host "错误: 文件不存在: $SqlFile" -ForegroundColor Red
    exit 1
}

# 检查容器是否运行
$ContainerRunning = docker ps --filter "name=$ContainerName" --format "{{.Names}}"
if (-not $ContainerRunning) {
    Write-Host "错误: MySQL 容器未运行" -ForegroundColor Red
    exit 1
}

# 解压文件（如果是 .gz 文件）
$ImportFile = $SqlFile
if ($SqlFile -like "*.gz") {
    Write-Host "正在解压 SQL 文件..." -ForegroundColor Yellow
    $TempFile = $SqlFile -replace '\.gz$', ''
    Expand-Archive -Path $SqlFile -DestinationPath (Split-Path $SqlFile) -Force
    $ImportFile = $TempFile
}

Write-Host "正在导入数据到 $Database..." -ForegroundColor Yellow
Get-Content $ImportFile | docker exec -i $ContainerName mysql `
    -u root `
    -p"$MysqlRootPassword" `
    $Database

# 清理临时文件
if ($ImportFile -ne $SqlFile) {
    Remove-Item $ImportFile -Force -ErrorAction SilentlyContinue
}

Write-Host "=== 迁移完成 ===" -ForegroundColor Green
