#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./release-remote-common.sh
source "$SCRIPT_DIR/release-remote-common.sh"

PROJECT_PATH="${NAV_PROJECT_PATH:-$(resolve_project_path)}"
REQUESTED_VERSION=""
RESTORE_DATABASE=0
BACKUP_OVERRIDE=""
DB_NAME="${NAV_DATABASE_NAME:-${MYSQL_DATABASE:-nav}}"
DB_PASS="${NAV_MYSQL_ROOT_PASSWORD:-${MYSQL_ROOT_PASSWORD:-root_password}}"
COMPOSE_PROJECT_NAME="${NAV_COMPOSE_PROJECT_NAME:-navigationsite}"
HEALTH_ENDPOINT="${NAV_HEALTH_ENDPOINT:-http://127.0.0.1:8991/api/links}"
MANIFEST_FILE="$PROJECT_PATH/.deploy/manifest.json"

while [ $# -gt 0 ]; do
  case "$1" in
    --project-path)
      PROJECT_PATH="$2"
      MANIFEST_FILE="$PROJECT_PATH/.deploy/manifest.json"
      shift 2
      ;;
    --version)
      REQUESTED_VERSION="$2"
      shift 2
      ;;
    --restore-database)
      RESTORE_DATABASE=1
      shift
      ;;
    --database-backup-file)
      BACKUP_OVERRIDE="$2"
      shift 2
      ;;
    --database-name)
      DB_NAME="$2"
      shift 2
      ;;
    --mysql-root-password)
      DB_PASS="$2"
      shift 2
      ;;
    --compose-project-name)
      COMPOSE_PROJECT_NAME="$2"
      shift 2
      ;;
    --health-endpoint)
      HEALTH_ENDPOINT="$2"
      shift 2
      ;;
    *)
      log "[ERROR] Unknown argument: $1"
      exit 1
      ;;
  esac
done

if [ ! -f "$MANIFEST_FILE" ]; then
  log "[ERROR] Release manifest not found: $MANIFEST_FILE"
  exit 1
fi

eval "$(python3 - "$MANIFEST_FILE" "$REQUESTED_VERSION" <<'PY'
import json
import shlex
import sys

manifest_path, requested_version = sys.argv[1:]
with open(manifest_path, "r", encoding="utf-8") as fh:
    data = json.load(fh)

releases = {item.get("version"): item for item in data.get("releases", []) if item.get("version")}
current_version = data.get("current") or ""
target_version = requested_version or (data.get("previous") or "")

if not target_version:
    print("echo '[ERROR] No rollback target version is available'")
    print("exit 1")
    sys.exit(0)

target_release = releases.get(target_version)
current_release = releases.get(current_version)

if not target_release:
    print(f"echo '[ERROR] Target version not found: {target_version}'")
    print("exit 1")
    sys.exit(0)

target_release_dir = target_release.get("releaseDir") or ""
current_backup = (current_release or {}).get("backupFile") or ""

print(f"CURRENT_VERSION={shlex.quote(current_version)}")
print(f"TARGET_VERSION={shlex.quote(target_version)}")
print(f"TARGET_RELEASE_DIR={shlex.quote(target_release_dir)}")
print(f"CURRENT_BACKUP_FILE={shlex.quote(current_backup)}")
PY
)"

if [ -z "$TARGET_RELEASE_DIR" ] || [ ! -d "$TARGET_RELEASE_DIR" ]; then
  log "[ERROR] Target release directory not found: $TARGET_RELEASE_DIR"
  exit 1
fi

if [ "$RESTORE_DATABASE" = "1" ]; then
  RESTORE_FILE="$BACKUP_OVERRIDE"
  if [ -z "$RESTORE_FILE" ]; then
    RESTORE_FILE="$CURRENT_BACKUP_FILE"
  fi

  if [ -z "$RESTORE_FILE" ] || [ ! -f "$RESTORE_FILE" ]; then
    log "[ERROR] Backup file for rollback not found: $RESTORE_FILE"
    exit 1
  fi

  log "[1/4] Stop app container..."
  docker stop navigation_app >/dev/null 2>&1 || true

  log "[2/4] Restore database backup..."
  docker exec -i navigation_mysql mysql -uroot "-p${DB_PASS}" < "$RESTORE_FILE"
else
  log "[1/3] Skip database restore..."
fi

log "[3/4] Start target release..."
cd "$TARGET_RELEASE_DIR"
docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.prod.yml build --no-cache
docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.prod.yml up -d

log "[4/4] Run health checks..."
if ! run_health_checks "$HEALTH_ENDPOINT"; then
  log "[ERROR] Health checks failed after rollback"
  exit 1
fi

python3 - "$MANIFEST_FILE" "$CURRENT_VERSION" "$TARGET_VERSION" "$(date -Iseconds)" <<'PY'
import json
import sys

manifest_path, current_version, target_version, timestamp = sys.argv[1:]
with open(manifest_path, "r", encoding="utf-8") as fh:
    data = json.load(fh)

data["previous"] = current_version or data.get("previous")
data["current"] = target_version

for item in data.get("releases", []):
    if item.get("version") == target_version:
        item["status"] = "success"
        item["recoveredAt"] = timestamp
        item["activatedVia"] = "rollback"

with open(manifest_path, "w", encoding="utf-8") as fh:
    json.dump(data, fh, ensure_ascii=False, indent=2)
PY

log ""
log "[DONE] Rolled back to version: $TARGET_VERSION"
if [ "$RESTORE_DATABASE" = "1" ]; then
  log "Database restore file: ${RESTORE_FILE}"
fi
