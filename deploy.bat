@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ========================================
echo    Navigation Site 部署脚本
echo ========================================
echo.

:: 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

:: 检查 pnpm
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 pnpm，请先安装 pnpm
    echo 运行: npm install -g pnpm
    pause
    exit /b 1
)

:: 检查 PM2
where pm2 >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 PM2，请先安装 PM2
    echo 运行: npm install -g pm2
    pause
    exit /b 1
)

echo [1/5] 安装依赖...
call pnpm install

echo.
echo [2/5] 构建生产版本...
call pnpm build:prod

echo.
echo [3/5] 创建日志目录...
if not exist "logs" mkdir logs

echo.
echo [4/5] 停止旧进程（如果存在）...
call pm2 delete navigation-site 2>nul

echo.
echo [5/5] 启动服务...
call pm2 start ecosystem.config.json

echo.
echo ========================================
echo    部署完成！
echo ========================================
echo.
echo 常用命令:
echo   pm2 list              - 查看进程列表
echo   pm2 logs              - 查看日志
echo   pm2 restart navigation-site - 重启服务
echo   pm2 stop navigation-site     - 停止服务
echo   pm2 delete navigation-site   - 删除服务
echo.
echo 请在宝塔中配置反向代理，将请求转发到 http://127.0.0.1:8991
echo.

pause