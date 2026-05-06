#!/bin/bash

# ============================================
# 数据库迁移脚本
# 从本地/其他服务器迁移数据到 Docker 环境
# ============================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== 数据库迁移工具 ===${NC}"
echo ""
echo "此脚本帮助将数据从本地或其他服务器迁移到 Docker MySQL"
echo ""

# 检查参数
if [ -z "$1" ]; then
    echo "用法: ./scripts/migrate.sh <SQL文件路径>"
    echo ""
    echo "示例:"
    echo "  ./scripts/migrate.sh ./backup/old_data.sql"
    echo "  ./scripts/migrate.sh ./backup/old_data.sql.gz"
    exit 1
fi

SQL_FILE="$1"
CONTAINER_NAME="navigation_mysql"
DATABASE="${MYSQL_DATABASE:-nav}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-root_password}"

# 检查文件是否存在
if [ ! -f "${SQL_FILE}" ]; then
    echo -e "${RED}错误: 文件不存在: ${SQL_FILE}${NC}"
    exit 1
fi

# 检查容器是否运行
if ! docker ps | grep -q "${CONTAINER_NAME}"; then
    echo -e "${RED}错误: MySQL 容器未运行${NC}"
    exit 1
fi

# 解压文件（如果是 .gz 文件）
if [[ "${SQL_FILE}" == *.gz ]]; then
    echo -e "${YELLOW}正在解压 SQL 文件...${NC}"
    TEMP_FILE="${SQL_FILE%.gz}"
    gunzip -c "${SQL_FILE}" > "${TEMP_FILE}"
    IMPORT_FILE="${TEMP_FILE}"
else
    IMPORT_FILE="${SQL_FILE}"
fi

echo -e "${YELLOW}正在导入数据到 ${DATABASE}...${NC}"
docker exec -i "${CONTAINER_NAME}" mysql \
    -u root \
    -p"${MYSQL_ROOT_PASSWORD}" \
    "${DATABASE}" < "${IMPORT_FILE}"

# 清理临时文件
if [ "${IMPORT_FILE}" != "${SQL_FILE}" ]; then
    rm -f "${IMPORT_FILE}"
fi

echo -e "${GREEN}=== 迁移完成 ===${NC}"
