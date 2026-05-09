# Docker Deployment Guide

## Overview

Production deployment now supports two entry modes:

- local trigger: run `deploy.ps1` / `rollback.ps1` on your own machine, then execute on the server by SSH
- server direct trigger: log in to the server and run `scripts/deploy-remote.sh` / `scripts/rollback-remote.sh`

Both entry modes share the same release logic and produce the same release manifest, backups, and rollback behavior.

The deployment flow is versioned and includes:

- release version generation
- database backup before deployment
- release manifest persistence
- health checks after deployment
- rollback to `previous` or a named release

## Local Config Template

Recommended setup:

1. Copy `release.config.example.ps1`
2. Save it as `release.config.local.ps1`
3. Fill in your own server and SSH values

`release.config.local.ps1` is ignored by Git and will be auto-loaded by both `deploy.ps1` and `rollback.ps1`.

Example:

```powershell
$ReleaseLocalSettings = @{
    ServerHost        = "119.91.40.143"
    ServerUser        = "ubuntu"
    SshKeyPath        = "C:\Users\69464\.ssh\server_key"
    RemoteProjectPath = "/home/ubuntu/navigationSite"
    ComposeProjectName = "navigationsite"
    HealthEndpoint    = "http://127.0.0.1:8991/api/links"
    DatabaseName      = "nav"
    MysqlRootPassword = "root_password"
    KeepReleases      = 5
    KeepBackups       = 10
}
```

You can still override any value by passing explicit parameters on the command line.

## Deploy

### Run A Release

```powershell
.\deploy.ps1
```

This command will:

- connect to the server by SSH
- optionally run `git pull --ff-only`
- create a new release version such as `20260508-173500`
- back up MySQL before switching
- snapshot the code into a release directory
- build and start containers from that release
- verify container health and HTTP health endpoint
- write `.deploy/manifest.json`

### Run A Release Directly On The Server

```bash
cd /home/ubuntu/navigationSite
bash scripts/deploy-remote.sh
```

Optional flags:

```bash
bash scripts/deploy-remote.sh --skip-git-pull
bash scripts/deploy-remote.sh --version 20260509-120000
```

### Skip Git Pull

```powershell
.\deploy.ps1 -SkipGitPull
```

### View Status

```powershell
.\deploy.ps1 -Action status
```

### View Logs

```powershell
.\deploy.ps1 -Action logs
```

### View Status Directly On The Server

```bash
cd /home/ubuntu/navigationSite
bash -lc 'source scripts/release-remote-common.sh && print_release_status .deploy/manifest.json'
```

## Rollback

### Roll Back To Previous Release

```powershell
.\rollback.ps1
```

### Roll Back Directly On The Server

```bash
cd /home/ubuntu/navigationSite
bash scripts/rollback-remote.sh
```

### Roll Back To A Named Release

```powershell
.\rollback.ps1 -Version "20260508-173500"
```

Server-side:

```bash
bash scripts/rollback-remote.sh --version 20260508-173500
```

### Roll Back And Restore Database

By default, database restore uses the backup recorded for the currently active release being rolled back from.

```powershell
.\rollback.ps1 -RestoreDatabase
```

Server-side:

```bash
bash scripts/rollback-remote.sh --restore-database
```

### Roll Back With A Specific Backup File

```powershell
.\rollback.ps1 `
  -Version "20260508-173500" `
  -RestoreDatabase `
  -DatabaseBackupFile "/home/ubuntu/navigationSite/.deploy/backups/db/nav_before_20260508-173500.sql"
```

Server-side:

```bash
bash scripts/rollback-remote.sh \
  --version 20260508-173500 \
  --restore-database \
  --database-backup-file /home/ubuntu/navigationSite/.deploy/backups/db/nav_before_20260508-173500.sql
```

## Server Layout

After the first successful release, the server creates these paths under the remote project directory:

```text
.deploy/
├── manifest.json
├── backups/
│   └── db/
│       └── nav_before_<version>.sql
└── releases/
    └── <version>/
```

`manifest.json` stores:

- `current`: current active release version
- `previous`: previous active release version
- `releases`: release history, commit, backup file, release dir, status

## Manual Docker Operations

If you need to inspect containers directly on the server:

```bash
docker ps
docker logs -f navigation_app
docker exec -it navigation_mysql mysql -uroot -p
```

## Local Database Utilities

These scripts are still available for direct database maintenance when you are already operating against a local or directly connected Docker environment:

```powershell
.\scripts\backup.ps1
.\scripts\restore.ps1 -BackupFile "nav_backup_20260506_120000.sql.gz"
.\scripts\migrate.ps1 -SqlFile ".\old_database.sql"
```

## Notes

- `deploy.ps1 -Action status` will show `No release manifest yet` before the first versioned deployment.
- `deploy-remote.sh` and `rollback-remote.sh` are the server-native entrypoints. They use the same manifest and release directories as the PowerShell wrappers.
- Rollback without `-RestoreDatabase` only switches the application version and keeps current database contents.
- Rollback with `-RestoreDatabase` is the safer choice when a failed deployment also changed data or schema.
