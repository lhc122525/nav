#!/usr/bin/env bash

log() {
  printf '%s\n' "$1"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "[ERROR] Missing command: $1"
    exit 1
  fi
}

resolve_project_path() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  (cd "$script_dir/.." && pwd)
}

record_release() {
  local manifest_file="$1"
  local version="$2"
  local git_commit="$3"
  local backup_file="$4"
  local release_dir="$5"
  local status="$6"

  python3 - "$manifest_file" "$version" "$git_commit" "$backup_file" "$release_dir" "$status" "$(date -Iseconds)" <<'PY'
import json
import os
import sys

manifest_path, version, commit, backup_file, release_dir, status, timestamp = sys.argv[1:]

if os.path.exists(manifest_path):
    with open(manifest_path, "r", encoding="utf-8") as fh:
        data = json.load(fh)
else:
    data = {"current": None, "previous": None, "releases": []}

entry = None
for item in data["releases"]:
    if item.get("version") == version:
        entry = item
        break

if entry is None:
    entry = {"version": version}
    data["releases"].append(entry)

entry.update({
    "version": version,
    "commit": commit,
    "backupFile": backup_file,
    "releaseDir": release_dir,
    "status": status,
})

if status == "started":
    entry["startedAt"] = timestamp
elif status == "failed":
    entry["failedAt"] = timestamp
elif status == "success":
    previous_current = data.get("current")
    data["previous"] = previous_current
    data["current"] = version
    entry["deployedAt"] = timestamp

os.makedirs(os.path.dirname(manifest_path), exist_ok=True)
with open(manifest_path, "w", encoding="utf-8") as fh:
    json.dump(data, fh, ensure_ascii=False, indent=2)
PY
}

prune_old_data() {
  local manifest_file="$1"
  local keep_releases="$2"
  local keep_backups="$3"

  python3 - "$manifest_file" "$keep_releases" "$keep_backups" <<'PY'
import json
import os
import shutil
import sys

manifest_path = sys.argv[1]
keep_releases = int(sys.argv[2])
keep_backups = int(sys.argv[3])

if not os.path.exists(manifest_path):
    sys.exit(0)

with open(manifest_path, "r", encoding="utf-8") as fh:
    data = json.load(fh)

releases = data.get("releases", [])
successful = [item for item in releases if item.get("status") == "success" and item.get("version")]
successful.sort(key=lambda item: item.get("deployedAt") or item.get("startedAt") or "", reverse=True)
protected = {data.get("current"), data.get("previous")}
keep_versions = set(filter(None, protected))
keep_versions.update(item["version"] for item in successful[:keep_releases])

for item in releases:
    version = item.get("version")
    release_dir = item.get("releaseDir")
    if version and release_dir and version not in keep_versions and os.path.isdir(release_dir):
        shutil.rmtree(release_dir, ignore_errors=True)

backups = []
for item in releases:
    backup_file = item.get("backupFile")
    deployed_at = item.get("deployedAt") or item.get("startedAt") or ""
    if backup_file:
        backups.append((backup_file, deployed_at))
backups.sort(key=lambda item: item[1], reverse=True)

keep_backup_paths = {path for path, _ in backups[:keep_backups]}
for path, _ in backups[keep_backups:]:
    if path not in keep_backup_paths and os.path.exists(path):
        os.remove(path)
PY
}

copy_release_support_files() {
  local project_path="$1"
  local release_dir="$2"

  local env_file
  for env_file in .env .env.prod .env.docker apps/web/.env apps/web/.env.prod; do
    if [ -f "$project_path/$env_file" ]; then
      mkdir -p "$(dirname "$release_dir/$env_file")"
      cp "$project_path/$env_file" "$release_dir/$env_file"
    fi
  done
}

run_health_checks() {
  local health_endpoint="$1"
  local app_container="${2:-navigation_app}"
  local mysql_container="${3:-navigation_mysql}"

  local healthy=0
  local _
  for _ in $(seq 1 30); do
    local app_status
    local mysql_status
    app_status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$app_container" 2>/dev/null || echo missing)"
    mysql_status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$mysql_container" 2>/dev/null || echo missing)"

    if [ "$app_status" = "healthy" ] && { [ "$mysql_status" = "healthy" ] || [ "$mysql_status" = "running" ]; } && curl -fsS "$health_endpoint" >/dev/null; then
      healthy=1
      break
    fi

    sleep 5
  done

  if [ "$healthy" != "1" ]; then
    return 1
  fi

  return 0
}

print_release_status() {
  local manifest_file="$1"

  echo "=== Release Status ==="
  if [ -f "$manifest_file" ]; then
    python3 - "$manifest_file" <<'PY'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as fh:
    data = json.load(fh)

print(f"current: {data.get('current') or '(none)'}")
print(f"previous: {data.get('previous') or '(none)'}")
print("")
print("recent releases:")
for item in sorted(data.get("releases", []), key=lambda x: x.get("deployedAt") or x.get("startedAt") or "", reverse=True)[:5]:
    print(f"- {item.get('version')} [{item.get('status')}] commit={item.get('commit')} backup={item.get('backupFile')}")
PY
  else
    echo "No release manifest yet"
  fi

  echo ""
  echo "=== Container Status ==="
  docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -E '(^NAMES|navigation_)' || true
}
