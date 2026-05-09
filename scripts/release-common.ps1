function Write-ColorOutput {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,
        [string]$Color = "White"
    )

    Write-Host $Message -ForegroundColor $Color
}

function Assert-RequiredValue {
    param(
        [string]$Name,
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Missing required parameter: $Name"
    }
}

function Test-RequiredCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$CommandName
    )

    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $CommandName"
    }
}

function New-ReleaseConfig {
    param(
        [string]$ServerHost,
        [string]$ServerUser,
        [string]$SshKeyPath,
        [string]$RemoteProjectPath,
        [string]$ComposeProjectName,
        [string]$HealthEndpoint,
        [string]$DatabaseName,
        [string]$MysqlRootPassword,
        [int]$KeepReleases,
        [int]$KeepBackups
    )

    Test-RequiredCommand -CommandName "ssh"
    Test-RequiredCommand -CommandName "scp"

    Assert-RequiredValue -Name "ServerHost" -Value $ServerHost
    Assert-RequiredValue -Name "ServerUser" -Value $ServerUser
    Assert-RequiredValue -Name "SshKeyPath" -Value $SshKeyPath
    Assert-RequiredValue -Name "RemoteProjectPath" -Value $RemoteProjectPath
    Assert-RequiredValue -Name "ComposeProjectName" -Value $ComposeProjectName
    Assert-RequiredValue -Name "HealthEndpoint" -Value $HealthEndpoint
    Assert-RequiredValue -Name "DatabaseName" -Value $DatabaseName
    Assert-RequiredValue -Name "MysqlRootPassword" -Value $MysqlRootPassword

    if (-not (Test-Path -LiteralPath $SshKeyPath)) {
        throw "SSH key not found: $SshKeyPath"
    }

    return [PSCustomObject]@{
        ServerHost        = $ServerHost
        ServerUser        = $ServerUser
        SshKeyPath        = (Resolve-Path -LiteralPath $SshKeyPath).Path
        RemoteProjectPath = $RemoteProjectPath
        ComposeProjectName = $ComposeProjectName
        HealthEndpoint    = $HealthEndpoint
        DatabaseName      = $DatabaseName
        MysqlRootPassword = $MysqlRootPassword
        KeepReleases      = $KeepReleases
        KeepBackups       = $KeepBackups
    }
}

function Import-ReleaseLocalSettings {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectRoot
    )

    $localConfigPath = Join-Path $ProjectRoot "release.config.local.ps1"
    if (-not (Test-Path -LiteralPath $localConfigPath)) {
        return @{}
    }

    $script:ReleaseLocalSettings = @{}
    . $localConfigPath

    $scopedVar = Get-Variable -Name ReleaseLocalSettings -Scope Local -ErrorAction SilentlyContinue
    if ($null -ne $scopedVar -and $scopedVar.Value -is [hashtable]) {
        return $scopedVar.Value
    }

    if ($script:ReleaseLocalSettings -is [hashtable]) {
        return $script:ReleaseLocalSettings
    }

    return @{}
}

function Resolve-ReleaseSetting {
    param(
        [AllowEmptyString()]
        [string]$ExplicitValue,
        [AllowNull()]
        $LocalValue,
        [AllowEmptyString()]
        [string]$EnvValue,
        [AllowNull()]
        $FallbackValue
    )

    if (-not [string]::IsNullOrWhiteSpace($ExplicitValue)) {
        return $ExplicitValue
    }

    if ($null -ne $LocalValue -and (-not ($LocalValue -is [string]) -or -not [string]::IsNullOrWhiteSpace($LocalValue))) {
        return $LocalValue
    }

    if (-not [string]::IsNullOrWhiteSpace($EnvValue)) {
        return $EnvValue
    }

    return $FallbackValue
}

function Escape-BashArgument {
    param(
        [AllowEmptyString()]
        [string]$Value
    )

    if ($null -eq $Value) {
        return "''"
    }

    $replacement = "'" + [char]34 + "'" + [char]34 + "'"
    return "'" + $Value.Replace("'", $replacement) + "'"
}

function Invoke-RemoteCommand {
    param(
        [Parameter(Mandatory = $true)]
        [psobject]$Config,
        [Parameter(Mandatory = $true)]
        [string]$Command
    )

    $target = "$($Config.ServerUser)@$($Config.ServerHost)"
    & ssh -i $Config.SshKeyPath $target $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Remote command failed"
    }
}

function Invoke-RemoteBashScript {
    param(
        [Parameter(Mandatory = $true)]
        [psobject]$Config,
        [Parameter(Mandatory = $true)]
        [string]$ScriptContent,
        [string[]]$Arguments = @()
    )

    $localTempPath = Join-Path $env:TEMP ("navigation_release_" + [guid]::NewGuid().ToString("N") + ".sh")
    $remoteTempPath = "/tmp/" + [IO.Path]::GetFileName($localTempPath)
    $target = "$($Config.ServerUser)@$($Config.ServerHost)"

    try {
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        $normalizedScript = $ScriptContent -replace "`r`n", "`n"
        [System.IO.File]::WriteAllText($localTempPath, $normalizedScript, $utf8NoBom)

        & scp -i $Config.SshKeyPath $localTempPath "${target}:$remoteTempPath"
        if ($LASTEXITCODE -ne 0) {
            throw "Remote script upload failed"
        }

        $escapedArgs = @($Arguments | ForEach-Object { Escape-BashArgument -Value $_ })
        $commandParts = @("bash", (Escape-BashArgument -Value $remoteTempPath))
        if ($escapedArgs.Count -gt 0) {
            $commandParts += $escapedArgs
        }

        Invoke-RemoteCommand -Config $Config -Command ($commandParts -join " ")
    }
    finally {
        try {
            Invoke-RemoteCommand -Config $Config -Command ("rm -f " + (Escape-BashArgument -Value $remoteTempPath))
        }
        catch {
        }

        Remove-Item -LiteralPath $localTempPath -Force -ErrorAction SilentlyContinue
    }
}

function New-ReleaseVersion {
    return Get-Date -Format "yyyyMMdd-HHmmss"
}
