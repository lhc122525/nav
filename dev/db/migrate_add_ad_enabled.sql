-- 为 ad_configs 表添加 enabled 字段
ALTER TABLE ad_configs ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT TRUE AFTER id;
