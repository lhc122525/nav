#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./release-remote-common.sh
source "$SCRIPT_DIR/release-remote-common.sh"

PROJECT_PATH="${NAV_PROJECT_PATH:-$(resolve_project_path)}"
VERSION="${NAV_RELEASE_VERSION:-$(date +%Y%m%d-%H%M%S)}"
DB_NAME="${NAV_DATABASE_NAME:-${MYSQL_DATABASE:-nav}}"
DB_PASS="${NAV_MYSQL_ROOT_PASSWORD:-${MYSQL_ROOT_PASSWORD:-root_password}}"
COMPOSE_PROJECT_NAME="${NAV_COMPOSE_PROJECT_NAME:-navigationsite}"
HEALTH_ENDPOINT="${NAV_HEALTH_ENDPOINT:-http://127.0.0.1:8991/api/links}"
KEEP_RELEASES="${NAV_KEEP_RELEASES:-5}"
KEEP_BACKUPS="${NAV_KEEP_BACKUPS:-10}"
SKIP_GIT_PULL=0

while [ $# -gt 0 ]; do
  case "$1" in
    --project-path)
      PROJECT_PATH="$2"
      shift 2
      ;;
    --version)
      VERSION="$2"
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
    --keep-releases)
      KEEP_RELEASES="$2"
      shift 2
      ;;
    --keep-backups)
      KEEP_BACKUPS="$2"
      shift 2
      ;;
    --skip-git-pull)
      SKIP_GIT_PULL=1
      shift
      ;;
    *)
      log "[ERROR] Unknown argument: $1"
      exit 1
      ;;
  esac
done

DEPLOY_ROOT="$PROJECT_PATH/.deploy"
RELEASES_DIR="$DEPLOY_ROOT/releases"
BACKUPS_DIR="$DEPLOY_ROOT/backups/db"
MANIFEST_FILE="$DEPLOY_ROOT/manifest.json"
RELEASE_DIR="$RELEASES_DIR/$VERSION"
RELEASE_STARTED=0
GIT_COMMIT=""
BACKUP_FILE=""

handle_error() {
  if [ "$RELEASE_STARTED" = "1" ]; then
    record_release "$MANIFEST_FILE" "$VERSION" "$GIT_COMMIT" "$BACKUP_FILE" "$RELEASE_DIR" "failed"
  fi
}
trap handle_error ERR

require_command git
require_command docker
require_command python3
require_command curl

mkdir -p "$RELEASES_DIR" "$BACKUPS_DIR"
cd "$PROJECT_PATH"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  log "[ERROR] Remote project path is not a Git repo: $PROJECT_PATH"
  exit 1
fi

if [ "$SKIP_GIT_PULL" != "1" ]; then
  log "[1/6] Pull latest code on server..."
  git pull --ff-only
else
  log "[1/6] Skip git pull and use current server checkout..."
fi

GIT_COMMIT="$(git rev-parse HEAD)"

if [ -d "$RELEASE_DIR" ]; then
  log "[ERROR] Release directory already exists: $RELEASE_DIR"
  exit 1
fi

log "[2/6] Create release snapshot..."
mkdir -p "$RELEASE_DIR"
git archive --format=tar HEAD | tar -xf - -C "$RELEASE_DIR"
copy_release_support_files "$PROJECT_PATH" "$RELEASE_DIR"

log "[3/6] Backup production database..."
BACKUP_FILE="$BACKUPS_DIR/nav_before_${VERSION}.sql"
docker exec navigation_mysql mysqldump \
  -uroot \
  "-p${DB_PASS}" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --set-gtid-purged=OFF \
  --databases "$DB_NAME" \
  --add-drop-database > "$BACKUP_FILE"

record_release "$MANIFEST_FILE" "$VERSION" "$GIT_COMMIT" "$BACKUP_FILE" "$RELEASE_DIR" "started"
RELEASE_STARTED=1

log "[4/6] Build and start release..."
cd "$RELEASE_DIR"
docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.prod.yml build --no-cache
docker compose -p "$COMPOSE_PROJECT_NAME" -f docker-compose.prod.yml up -d

log "[5/6] Run health checks..."
if ! run_health_checks "$HEALTH_ENDPOINT"; then
  log "[ERROR] Health checks failed after deployment."
  log "[HINT] Run rollback-remote.sh or rollback.ps1 to revert."
  exit 1
fi

log "[6/6] Write release manifest..."
record_release "$MANIFEST_FILE" "$VERSION" "$GIT_COMMIT" "$BACKUP_FILE" "$RELEASE_DIR" "success"
RELEASE_STARTED=0
prune_old_data "$MANIFEST_FILE" "$KEEP_RELEASES" "$KEEP_BACKUPS"

log ""
log "[DONE] Deployment completed"
log "Version: $VERSION"
log "Commit: $GIT_COMMIT"
log "Release dir: $RELEASE_DIR"
log "Database backup: $BACKUP_FILE"
