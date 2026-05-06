@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================
:: Windows Server Docker 部署脚本
:: 用法: deploy.bat [action]
::   action: deploy (默认) | build | start | stop | restart | logs | status
:: ============================================

set COMPOSE_FILE=docker-compose.prod.yml
set ACTION=%1

if "%ACTION%"=="" set ACTION=deploy

:: 检查 Docker
docker info >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker 未运行，请先启动 Docker Desktop
    exit /b 1
)

:: 执行操作
if "%ACTION%"=="deploy" goto :deploy
if "%ACTION%"=="build" goto :build
if "%ACTION%"=="start" goto :start
if "%ACTION%"=="stop" goto :stop
if "%ACTION%"=="restart" goto :restart
if "%ACTION%"=="logs" goto :logs
if "%ACTION%"=="status" goto :status

echo [错误] 未知操作: %ACTION%
echo 用法: deploy.bat [deploy^|build^|start^|stop^|restart^|logs^|status]
exit /b 1

:deploy
echo =====================================
echo      开始完整部署流程
echo =====================================
echo.

echo [1/3] 拉取最新代码...
git pull
if errorlevel 1 (
    echo [错误] Git pull 失败
    exit /b 1
)

echo.
echo [2/3] 构建 Docker 镜像...
docker compose -f %COMPOSE_FILE% build --no-cache
if errorlevel 1 (
    echo [错误] 构建失败
    exit /b 1
)

echo.
echo [3/3] 启动服务...
docker compose -f %COMPOSE_FILE% up -d
if errorlevel 1 (
    echo [错误] 启动失败
    exit /b 1
)

echo.
echo =====================================
echo      部署完成！
echo =====================================
echo.
echo 访问地址:
echo   应用: http://localhost:8991
echo   MySQL: localhost:8999
echo.
goto :end

:build
echo 构建 Docker 镜像...
docker compose -f %COMPOSE_FILE% build --no-cache
goto :end

:start
echo 启动服务...
docker compose -f %COMPOSE_FILE% up -d
docker compose -f %COMPOSE_FILE% ps
goto :end

:stop
echo 停止服务...
docker compose -f %COMPOSE_FILE% down
goto :end

:restart
echo 重启服务...
docker compose -f %COMPOSE_FILE% restart
docker compose -f %COMPOSE_FILE% ps
goto :end

:logs
docker compose -f %COMPOSE_FILE% logs -f --tail 100
goto :end

:status
echo === 服务状态 ===
docker compose -f %COMPOSE_FILE% ps
echo.
echo === 容器资源使用 ===
docker stats --no-stream navigation_app navigation_mysql 2>nul
goto :end

:end
endlocal
