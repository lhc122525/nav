# ============================================
# Rollback script
# Usage: .\rollback.ps1 [-Version <version>] [-RestoreDatabase] [-DatabaseBackupFile <path>]
# ============================================

param(
    [string]$Version = "",
    [switch]$RestoreDatabase,
    [string]$DatabaseBackupFile = "",
    [string]$ServerHost = "",
    [string]$ServerUser = "",
    [string]$SshKeyPath = "",
    [string]$RemoteProjectPath = "",
    [string]$ComposeProjectName = "",
    [string]$HealthEndpoint = "",
    [string]$DatabaseName = "",
    [string]$MysqlRootPassword = ""
)

. (Join-Path $PSScriptRoot "scripts\release-common.ps1")

$LocalSettings = Import-ReleaseLocalSettings -ProjectRoot $PSScriptRoot

$ServerHost = Resolve-ReleaseSetting -ExplicitValue $ServerHost -LocalValue $LocalSettings.ServerHost -EnvValue $env:NAV_SERVER_HOST -FallbackValue ""
$ServerUser = Resolve-ReleaseSetting -ExplicitValue $ServerUser -LocalValue $LocalSettings.ServerUser -EnvValue $env:NAV_SERVER_USER -FallbackValue "ubuntu"
$SshKeyPath = Resolve-ReleaseSetting -ExplicitValue $SshKeyPath -LocalValue $LocalSettings.SshKeyPath -EnvValue $env:NAV_SSH_KEY_PATH -FallbackValue ""
$RemoteProjectPath = Resolve-ReleaseSetting -ExplicitValue $RemoteProjectPath -LocalValue $LocalSettings.RemoteProjectPath -EnvValue $env:NAV_REMOTE_PROJECT_PATH -FallbackValue ""
$ComposeProjectName = Resolve-ReleaseSetting -ExplicitValue $ComposeProjectName -LocalValue $LocalSettings.ComposeProjectName -EnvValue $env:NAV_COMPOSE_PROJECT_NAME -FallbackValue "navigationsite"
$HealthEndpoint = Resolve-ReleaseSetting -ExplicitValue $HealthEndpoint -LocalValue $LocalSettings.HealthEndpoint -EnvValue $env:NAV_HEALTH_ENDPOINT -FallbackValue "http://127.0.0.1:8991/api/links"
$DatabaseName = Resolve-ReleaseSetting -ExplicitValue $DatabaseName -LocalValue $LocalSettings.DatabaseName -EnvValue $env:MYSQL_DATABASE -FallbackValue "nav"
$MysqlRootPassword = Resolve-ReleaseSetting -ExplicitValue $MysqlRootPassword -LocalValue $LocalSettings.MysqlRootPassword -EnvValue $env:MYSQL_ROOT_PASSWORD -FallbackValue "root_password"

$Config = New-ReleaseConfig `
    -ServerHost $ServerHost `
    -ServerUser $ServerUser `
    -SshKeyPath $SshKeyPath `
    -RemoteProjectPath $RemoteProjectPath `
    -ComposeProjectName $ComposeProjectName `
    -HealthEndpoint $HealthEndpoint `
    -DatabaseName $DatabaseName `
    -MysqlRootPassword $MysqlRootPassword `
    -KeepReleases 5 `
    -KeepBackups 10

Write-ColorOutput "=====================================" "Cyan"
Write-ColorOutput "  Start rollback" "Cyan"
Write-ColorOutput "=====================================" "Cyan"
Write-ColorOutput "Server: $($Config.ServerUser)@$($Config.ServerHost)" "White"
if ($Version) {
    Write-ColorOutput "Target version: $Version" "White"
}
else {
    Write-ColorOutput "Target version: previous" "White"
}
$restoreLabel = if ($RestoreDatabase.IsPresent) { "yes" } else { "no" }
Write-ColorOutput "Restore database: $restoreLabel`n" "White"

$remoteScriptPath = "/tmp/navigation_rollback_remote.sh"
$target = "$($Config.ServerUser)@$($Config.ServerHost)"
$localScriptPath = Join-Path $PSScriptRoot "scripts\rollback-remote.sh"

& scp -i $Config.SshKeyPath $localScriptPath "${target}:$remoteScriptPath"
if ($LASTEXITCODE -ne 0) {
    throw "Remote script upload failed"
}

try {
    $command = @(
        "bash",
        (Escape-BashArgument -Value $remoteScriptPath),
        "--project-path",
        (Escape-BashArgument -Value $Config.RemoteProjectPath),
        "--database-name",
        (Escape-BashArgument -Value $Config.DatabaseName),
        "--mysql-root-password",
        (Escape-BashArgument -Value $Config.MysqlRootPassword),
        "--compose-project-name",
        (Escape-BashArgument -Value $Config.ComposeProjectName),
        "--health-endpoint",
        (Escape-BashArgument -Value $Config.HealthEndpoint)
    )

    if (-not [string]::IsNullOrWhiteSpace($Version)) {
        $command += @("--version", (Escape-BashArgument -Value $Version))
    }

    if ($RestoreDatabase.IsPresent) {
        $command += "--restore-database"
    }

    if (-not [string]::IsNullOrWhiteSpace($DatabaseBackupFile)) {
        $command += @("--database-backup-file", (Escape-BashArgument -Value $DatabaseBackupFile))
    }

    Invoke-RemoteCommand -Config $Config -Command ($command -join " ")
}
finally {
    Invoke-RemoteCommand -Config $Config -Command ("rm -f " + (Escape-BashArgument -Value $remoteScriptPath))
}
