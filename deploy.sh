#!/bin/bash
set -e

# ============================================
# Ubuntu Server Docker 部署脚本
# 用法: bash deploy.sh [action]
#   action: deploy (默认) | build | start | stop | restart | logs | status | db-backup | db-restore
# ============================================

COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backup"
ACTION="${1:-deploy}"

cd "$(dirname "$0")"

# 检查 Docker
if ! docker info > /dev/null 2>&1; then
    echo "[错误] Docker 未运行，请确保 Docker 已安装并启动"
    exit 1
fi

# 初始化备份目录
init_backup_dir() {
    mkdir -p "$BACKUP_DIR"
}

# 数据库配置
DB_HOST="mysql"
DB_PORT="3306"
DB_USER="nszm"
DB_PASS="nszm123.."
DB_NAME="nav"

# 执行操作
case "$ACTION" in
    deploy)
        echo "====================================="
        echo "      开始完整部署流程"
        echo "====================================="
        echo ""

        echo "[1/3] 拉取最新代码..."
        if git rev-parse --git-dir > /dev/null 2>&1; then
            git pull
        else
            echo "[跳过] 非 Git 仓库，跳过拉取"
        fi

        echo ""
        echo "[2/3] 构建 Docker 镜像..."
        docker compose -f "$COMPOSE_FILE" build --no-cache

        echo ""
        echo "[3/3] 启动服务..."
        docker compose -f "$COMPOSE_FILE" up -d

        echo ""
        echo "====================================="
        echo "      部署完成！"
        echo "====================================="
        echo ""
        echo "访问地址:"
        echo "  应用: http://119.91.40.143:8991"
        echo "  MySQL: 119.91.40.143:8999"
        echo ""
        ;;
    build)
        echo "构建 Docker 镜像..."
        docker compose -f "$COMPOSE_FILE" build --no-cache
        ;;
    start)
        echo "启动服务..."
        docker compose -f "$COMPOSE_FILE" up -d
        docker compose -f "$COMPOSE_FILE" ps
        ;;
    stop)
        echo "停止服务..."
        docker compose -f "$COMPOSE_FILE" down
        ;;
    restart)
        echo "重启服务..."
        docker compose -f "$COMPOSE_FILE" restart
        docker compose -f "$COMPOSE_FILE" ps
        ;;
    logs)
        docker compose -f "$COMPOSE_FILE" logs -f --tail 100
        ;;
    status)
        echo "=== 服务状态 ==="
        docker compose -f "$COMPOSE_FILE" ps
        echo ""
        echo "=== 容器资源使用 ==="
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || true
        ;;
    db-backup)
        init_backup_dir
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_FILE="$BACKUP_DIR/nav_${TIMESTAMP}.sql"
        echo "正在备份数据库到: $BACKUP_FILE"
        docker compose -f "$COMPOSE_FILE" exec -T mysql mysqldump \
            -u"$DB_USER" -p"$DB_PASS" \
            --hex-blob --single-transaction nav > "$BACKUP_FILE"
        echo "[完成] 数据库已备份: $BACKUP_FILE"
        echo "文件大小: $(du -h "$BACKUP_FILE" | cut -f1)"
        ;;
    db-restore)
        if [ -z "$2" ]; then
            echo "[错误] 请指定备份文件路径"
            echo "用法: bash deploy.sh db-restore backup/nav_20240101_120000.sql"
            exit 1
        fi
        BACKUP_FILE="$2"
        if [ ! -f "$BACKUP_FILE" ]; then
            echo "[错误] 文件不存在: $BACKUP_FILE"
            exit 1
        fi
        echo "正在恢复数据库 from: $BACKUP_FILE"
        docker compose -f "$COMPOSE_FILE" exec -T mysql mysql \
            -u"$DB_USER" -p"$DB_PASS" --binary-mode=1 -f nav < "$BACKUP_FILE"
        echo "[完成] 数据库已恢复"
        ;;
    *)
        echo "[错误] 未知操作: $ACTION"
        echo "用法: bash deploy.sh [deploy|build|start|stop|restart|logs|status|db-backup|db-restore]"
        exit 1
        ;;
esac