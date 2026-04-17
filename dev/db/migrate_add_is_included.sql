-- 添加 is_included 字段到 submissions 表
-- 执行此脚本前请确保已备份数据库

ALTER TABLE submissions ADD COLUMN is_included TINYINT(1) NOT NULL DEFAULT 0 AFTER status;
ALTER TABLE submissions ADD INDEX idx_submissions_included (is_included);
