## ADDED Requirements

### Requirement: 留言板页面入口
系统 MUST 在顶部导航栏提供“留言板”入口，并提供留言板页面用于浏览与提交留言。

#### Scenario: 从首页进入留言板
- **WHEN** 用户点击顶部导航栏的“留言板”
- **THEN** 系统 MUST 跳转到留言板页面并展示留言列表与提交入口

### Requirement: 留言提交
系统 MUST 允许用户提交留言内容（必填），并允许填写昵称（可选）。

#### Scenario: 留言内容校验
- **WHEN** 用户提交留言且内容为空
- **THEN** 系统 MUST 拒绝提交并提示内容必填

### Requirement: 留言展示
系统 MUST 在留言板页面展示公开可见的留言列表，按时间倒序展示最新留言。

#### Scenario: 列表仅展示可见留言
- **WHEN** 用户访问留言板页面
- **THEN** 系统 MUST 仅返回与展示 `is_visible = true` 的留言记录

### Requirement: 基础滥用防护
系统 MUST 对公开留言提交接口提供基础滥用防护能力（例如基于 IP 的简单限流或最短提交间隔）。

#### Scenario: 频繁提交受限
- **WHEN** 同一用户在短时间内频繁提交留言
- **THEN** 系统 MUST 拒绝部分请求并返回可理解的错误信息

