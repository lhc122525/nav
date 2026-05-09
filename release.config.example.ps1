$ReleaseLocalSettings = @{
    ServerHost        = "119.91.40.143"
    ServerUser        = "ubuntu"
    SshKeyPath        = "C:\Users\your-name\.ssh\server_key"
    RemoteProjectPath = "/home/ubuntu/navigationSite"
    ComposeProjectName = "navigationsite"
    HealthEndpoint    = "http://127.0.0.1:8991/api/links"
    DatabaseName      = "nav"
    MysqlRootPassword = "root_password"
    KeepReleases      = 5
    KeepBackups       = 10
}
