# ============================================
# Windows Server 部署脚本
# 用法: .\deploy.ps1 [-Action <操作>]
#   -Action: deploy (默认) | build | start | stop | restart | logs | status
# ============================================

param(
    [ValidateSet("deploy", "build", "start", "stop", "restart", "logs", "status")]
    [string]$Action = "deploy"
)

# 颜色函数
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

# 配置
$ComposeFile = "docker-compose.prod.yml"
$ProjectName = "navigation"

# 检查 Docker 是否运行
function Test-Docker {
    try {
        docker info | Out-Null
        return $true
    } catch {
        return $false
    }
}

# 拉取最新代码
function Update-Code {
    Write-ColorOutput "=== 拉取最新代码 ===" "Yellow"

    # 检查是否有未提交的更改
    $status = git status --porcelain
    if ($status) {
        Write-ColorOutput "警告: 存在未提交的更改" "Red"
        git status --short
        $confirm = Read-Host "是否继续？(y/N)"
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-ColorOutput "操作已取消" "Red"
            exit 1
        }
    }

    git pull
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "错误: Git pull 失败" "Red"
        exit 1
    }

    Write-ColorOutput "代码更新完成" "Green"
}

# 构建镜像
function Build-Image {
    Write-ColorOutput "=== 构建 Docker 镜像 ===" "Yellow"

    docker compose -f $ComposeFile build --no-cache
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "错误: 构建失败" "Red"
        exit 1
    }

    Write-ColorOutput "镜像构建完成" "Green"
}

# 启动服务
function Start-Services {
    Write-ColorOutput "=== 启动服务 ===" "Yellow"

    docker compose -f $ComposeFile up -d
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "错误: 启动失败" "Red"
        exit 1
    }

    Write-ColorOutput "服务启动完成" "Green"
    Show-Status
}

# 停止服务
function Stop-Services {
    Write-ColorOutput "=== 停止服务 ===" "Yellow"

    docker compose -f $ComposeFile down
    Write-ColorOutput "服务已停止" "Green"
}

# 重启服务
function Restart-Services {
    Write-ColorOutput "=== 重启服务 ===" "Yellow"

    docker compose -f $ComposeFile restart
    Write-ColorOutput "服务已重启" "Green"
    Show-Status
}

# 查看日志
function Show-Logs {
    docker compose -f $ComposeFile logs -f --tail 100
}

# 查看状态
function Show-Status {
    Write-ColorOutput "`n=== 服务状态 ===" "Yellow"
    docker compose -f $ComposeFile ps

    Write-ColorOutput "`n=== 容器资源使用 ===" "Yellow"
    docker stats --no-stream navigation_app navigation_mysql 2>$null
}

# 完整部署流程
function Deploy-Full {
    Write-ColorOutput "=====================================" "Cyan"
    Write-ColorOutput "     开始完整部署流程" "Cyan"
    Write-ColorOutput "=====================================`n" "Cyan"

    # 检查 Docker
    if (-not (Test-Docker)) {
        Write-ColorOutput "错误: Docker 未运行，请先启动 Docker Desktop" "Red"
        exit 1
    }

    # 1. 拉取代码
    Update-Code

    # 2. 构建镜像
    Build-Image

    # 3. 启动服务
    Start-Services

    Write-ColorOutput "`n=====================================" "Green"
    Write-ColorOutput "     部署完成！" "Green"
    Write-ColorOutput "=====================================" "Green"
    Write-ColorOutput "`n访问地址:" "Cyan"
    Write-ColorOutput "  应用: http://localhost:8991" "White"
    Write-ColorOutput "  MySQL: localhost:8999" "White"
    Write-ColorOutput "  Adminer: http://localhost:8080 (需启用 admin profile)`n" "White"
}

# 主逻辑
switch ($Action) {
    "deploy" { Deploy-Full }
    "build" {
        if (-not (Test-Docker)) { Write-ColorOutput "错误: Docker 未运行" "Red"; exit 1 }
        Build-Image
    }
    "start" {
        if (-not (Test-Docker)) { Write-ColorOutput "错误: Docker 未运行" "Red"; exit 1 }
        Start-Services
    }
    "stop" { Stop-Services }
    "restart" {
        if (-not (Test-Docker)) { Write-ColorOutput "错误: Docker 未运行" "Red"; exit 1 }
        Restart-Services
    }
    "logs" { Show-Logs }
    "status" { Show-Status }
}
