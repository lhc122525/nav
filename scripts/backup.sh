#!/bin/bash

# ============================================
# MySQL 数据库备份脚本
# 用法: ./scripts/backup.sh [备份名称]
# ============================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
BACKUP_DIR="./backup"
CONTAINER_NAME="navigation_mysql"
DATABASE="${MYSQL_DATABASE:-nav}"
MYSQL_USER="${MYSQL_USER:-nszm}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root_password}"

# 备份文件名
if [ -n "$1" ]; then
    BACKUP_NAME="$1"
else
    BACKUP_NAME="nav_backup_$(date +%Y%m%d_%H%M%S)"
fi

BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql"

echo -e "${YELLOW}=== 数据库备份开始 ===${NC}"
echo "数据库: ${DATABASE}"
echo "备份文件: ${BACKUP_FILE}"

# 创建备份目录
mkdir -p "${BACKUP_DIR}"

# 检查容器是否运行
if ! docker ps | grep -q "${CONTAINER_NAME}"; then
    echo -e "${RED}错误: MySQL 容器未运行${NC}"
    echo "请先启动容器: docker compose -f docker-compose.prod.yml up -d"
    exit 1
fi

# 执行备份
echo -e "${YELLOW}正在备份数据库...${NC}"
docker exec "${CONTAINER_NAME}" mysqldump \
    -u root \
    -p"${MYSQL_ROOT_PASSWORD}" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    "${DATABASE}" > "${BACKUP_FILE}"

# 压缩备份文件
echo -e "${YELLOW}正在压缩备份文件...${NC}"
gzip "${BACKUP_FILE}"
BACKUP_FILE="${BACKUP_FILE}.gz"

# 显示备份信息
echo -e "${GREEN}=== 备份完成 ===${NC}"
echo "备份文件: ${BACKUP_FILE}"
echo "文件大小: $(ls -lh "${BACKUP_FILE}" | awk '{print $5}')"

# 清理旧备份（保留最近 7 个）
echo -e "${YELLOW}清理旧备份文件（保留最近 7 个）...${NC}"
ls -t "${BACKUP_DIR}"/nav_backup_*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm -f
echo -e "${GREEN}当前备份文件数量: $(ls -1 "${BACKUP_DIR}"/nav_backup_*.sql.gz 2>/dev/null | wc -l)${NC}"
