# ============================================
# Versioned deployment script
# Usage: .\deploy.ps1 [-Action deploy|status|logs] [other parameters]
# ============================================

param(
    [ValidateSet("deploy", "status", "logs")]
    [string]$Action = "deploy",
    [string]$ServerHost = "",
    [string]$ServerUser = "",
    [string]$SshKeyPath = "",
    [string]$RemoteProjectPath = "",
    [string]$ComposeProjectName = "",
    [string]$HealthEndpoint = "",
    [string]$DatabaseName = "",
    [string]$MysqlRootPassword = "",
    [int]$KeepReleases = 0,
    [int]$KeepBackups = 0,
    [switch]$SkipGitPull
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
if ($KeepReleases -le 0) { $KeepReleases = [int](Resolve-ReleaseSetting -ExplicitValue "" -LocalValue $LocalSettings.KeepReleases -EnvValue "" -FallbackValue 5) }
if ($KeepBackups -le 0) { $KeepBackups = [int](Resolve-ReleaseSetting -ExplicitValue "" -LocalValue $LocalSettings.KeepBackups -EnvValue "" -FallbackValue 10) }

$Config = New-ReleaseConfig `
    -ServerHost $ServerHost `
    -ServerUser $ServerUser `
    -SshKeyPath $SshKeyPath `
    -RemoteProjectPath $RemoteProjectPath `
    -ComposeProjectName $ComposeProjectName `
    -HealthEndpoint $HealthEndpoint `
    -DatabaseName $DatabaseName `
    -MysqlRootPassword $MysqlRootPassword `
    -KeepReleases $KeepReleases `
    -KeepBackups $KeepBackups

function Invoke-Deploy {
    $version = New-ReleaseVersion

    Write-ColorOutput "=====================================" "Cyan"
    Write-ColorOutput "  Start release deployment: $version" "Cyan"
    Write-ColorOutput "=====================================" "Cyan"
    Write-ColorOutput "Server: $($Config.ServerUser)@$($Config.ServerHost)" "White"
    Write-ColorOutput "Project path: $($Config.RemoteProjectPath)" "White"
    Write-ColorOutput "Health endpoint: $($Config.HealthEndpoint)`n" "White"

    $remoteScriptPath = "/tmp/navigation_deploy_remote.sh"
    $target = "$($Config.ServerUser)@$($Config.ServerHost)"
    $localScriptPath = Join-Path $PSScriptRoot "scripts\deploy-remote.sh"

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
            "--version",
            (Escape-BashArgument -Value $version),
            "--database-name",
            (Escape-BashArgument -Value $Config.DatabaseName),
            "--mysql-root-password",
            (Escape-BashArgument -Value $Config.MysqlRootPassword),
            "--compose-project-name",
            (Escape-BashArgument -Value $Config.ComposeProjectName),
            "--health-endpoint",
            (Escape-BashArgument -Value $Config.HealthEndpoint),
            "--keep-releases",
            (Escape-BashArgument -Value ([string]$Config.KeepReleases)),
            "--keep-backups",
            (Escape-BashArgument -Value ([string]$Config.KeepBackups))
        )

        if ($SkipGitPull.IsPresent) {
            $command += "--skip-git-pull"
        }

        Invoke-RemoteCommand -Config $Config -Command ($command -join " ")
    }
    finally {
        Invoke-RemoteCommand -Config $Config -Command ("rm -f " + (Escape-BashArgument -Value $remoteScriptPath))
    }
}

function Show-Status {
    $remoteScript = @'
#!/usr/bin/env bash
set -euo pipefail
source "$1/scripts/release-remote-common.sh"
print_release_status "$1/.deploy/manifest.json"
'@

    Invoke-RemoteBashScript -Config $Config -ScriptContent $remoteScript -Arguments @(
        $Config.RemoteProjectPath
    )
}

function Show-Logs {
    Write-ColorOutput "Following remote app logs. Press Ctrl+C to stop." "Yellow"
    Invoke-RemoteCommand -Config $Config -Command "docker logs -f --tail 100 navigation_app"
}

switch ($Action) {
    "deploy" { Invoke-Deploy }
    "status" { Show-Status }
    "logs" { Show-Logs }
}
