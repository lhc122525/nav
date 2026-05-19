## 1. Release Metadata

- [x] 1.1 定义发布目录、数据库备份目录和发布清单文件结构
- [x] 1.2 在 PowerShell 中实现版本号生成、manifest 读写和 current/previous 解析

## 2. Deployment Flow

- [x] 2.1 重构 `deploy.ps1`，加入发布前数据库备份
- [x] 2.2 重构 `deploy.ps1`，加入版本目录同步、发布记录和健康检查
- [x] 2.3 为发布失败场景补充失败状态记录与可回滚提示

## 3. Rollback Flow

- [x] 3.1 新增 `rollback.ps1`，支持默认回滚到 previous
- [x] 3.2 为 `rollback.ps1` 增加指定版本回滚与可选数据库恢复

## 4. Verification And Docs

- [x] 4.1 验证发布、查看状态和回滚脚本的基本执行路径
- [x] 4.2 更新 `DOCKER.md`，补充版本化发布、数据库备份和回滚用法
