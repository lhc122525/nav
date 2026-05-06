#!/bin/bash

# ============================================
# MySQL 数据库恢复脚本
# 用法: ./scripts/restore.sh <备份文件名>
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
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root_password}"

# 检查参数
if [ -z "$1" ]; then
    echo -e "${RED}错误: 请指定备份文件${NC}"
    echo "用法: ./scripts/restore.sh <备份文件名>"
    echo ""
    echo "可用的备份文件:"
    ls -lh "${BACKUP_DIR}"/nav_backup_*.sql.gz 2>/dev/null || echo "  (无备份文件)"
    exit 1
fi

BACKUP_FILE="${BACKUP_DIR}/$1"

# 检查文件是否存在
if [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}错误: 备份文件不存在: ${BACKUP_FILE}${NC}"
    exit 1
fi

echo -e "${YELLOW}=== 数据库恢复开始 ===${NC}"
echo "数据库: ${DATABASE}"
echo "备份文件: ${BACKUP_FILE}"

# 检查容器是否运行
if ! docker ps | grep -q "${CONTAINER_NAME}"; then
    echo -e "${RED}错误: MySQL 容器未运行${NC}"
    echo "请先启动容器: docker compose -f docker-compose.prod.yml up -d"
    exit 1
fi

# 确认操作
echo -e "${RED}警告: 此操作将覆盖当前数据库数据！${NC}"
read -p "确定要继续吗？(y/N): " confirm
if [ "${confirm}" != "y" ] && [ "${confirm}" != "Y" ]; then
    echo "操作已取消"
    exit 0
fi

# 解压文件（如果是 .gz 文件）
if [[ "${BACKUP_FILE}" == *.gz ]]; then
    echo -e "${YELLOW}正在解压备份文件...${NC}"
    TEMP_FILE="${BACKUP_FILE%.gz}"
    gunzip -c "${BACKUP_FILE}" > "${TEMP_FILE}"
    RESTORE_FILE="${TEMP_FILE}"
else
    RESTORE_FILE="${BACKUP_FILE}"
fi

# 执行恢复
echo -e "${YELLOW}正在恢复数据库...${NC}"
docker exec -i "${CONTAINER_NAME}" mysql \
    -u root \
    -p"${MYSQL_ROOT_PASSWORD}" \
    "${DATABASE}" < "${RESTORE_FILE}"

# 清理临时文件
if [ "${RESTORE_FILE}" != "${BACKUP_FILE}" ]; then
    rm -f "${RESTORE_FILE}"
fi

echo -e "${GREEN}=== 恢复完成 ===${NC}"
echo "数据库 ${DATABASE} 已从 ${BACKUP_FILE} 恢复"
