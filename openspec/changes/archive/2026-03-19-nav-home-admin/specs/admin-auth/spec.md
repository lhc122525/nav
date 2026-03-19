## ADDED Requirements

### Requirement: 超级管理员初始化账号
系统 MUST 在开发环境初始化一个超级管理员账号：用户名 `nszm`，密码 `nszm123..`，用于首次登录进入后台。

#### Scenario: 初次启动可登录
- **WHEN** 系统在开发环境完成数据库初始化
- **THEN** 使用 `nszm / nszm123..` MUST 能成功登录并进入后台

### Requirement: 管理员密码安全存储
系统 MUST 以不可逆的方式存储管理员密码（例如强哈希 + salt），并 MUST NOT 在任何接口中返回明文密码或密码哈希。

#### Scenario: 登录响应不泄露敏感字段
- **WHEN** 管理员登录成功
- **THEN** 响应内容 MUST NOT 包含密码明文或 `password_hash` 等敏感字段

### Requirement: 管理员登录会话
系统 MUST 支持管理员登录会话，并通过 HttpOnly cookie 维持会话状态；会话 MUST 有过期时间，且可被登出撤销。

#### Scenario: 登录成功设置会话
- **WHEN** 管理员输入正确用户名与密码提交登录
- **THEN** 系统 MUST 创建会话并通过 `Set-Cookie` 写入 HttpOnly cookie，后续请求携带该 cookie 即视为已登录

### Requirement: 管理接口强制鉴权
系统 MUST 对所有 `/api/admin/**` 接口强制鉴权，未登录请求 MUST 返回 401。

#### Scenario: 未登录访问管理接口
- **WHEN** 未登录用户请求任一 `/api/admin/**` 接口
- **THEN** 系统 MUST 返回 401 且不执行任何数据修改

### Requirement: 管理员账号管理
超级管理员 MUST 能创建、禁用管理员账号；被禁用的账号 MUST NOT 能登录或继续使用已存在会话。

#### Scenario: 禁用账号后无法继续操作
- **WHEN** 超级管理员禁用某管理员账号
- **THEN** 该账号 MUST 无法再次登录，且已登录状态下访问 `/api/admin/**` MUST 返回 401

