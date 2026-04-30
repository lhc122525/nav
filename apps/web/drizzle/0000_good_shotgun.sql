CREATE TABLE `ad_configs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`display_count` int NOT NULL DEFAULT 2,
	`is_random` boolean NOT NULL DEFAULT false,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ad_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_sessions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`admin_user_id` bigint unsigned NOT NULL,
	`token` varchar(128) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_admin_sessions_token` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `admin_users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`username` varchar(50) NOT NULL,
	`password_salt` varchar(64) NOT NULL,
	`password_hash` varchar(128) NOT NULL,
	`role` varchar(20) NOT NULL DEFAULT 'admin',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_admin_users_username` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `ads` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(100) NOT NULL,
	`image_url` varchar(500) NOT NULL,
	`url` varchar(500) NOT NULL,
	`sort` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`parent_id` bigint unsigned,
	`name` varchar(50) NOT NULL,
	`slug` varchar(80) NOT NULL,
	`sort` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_categories_slug` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `guestbook_messages` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned,
	`nickname` varchar(50) NOT NULL DEFAULT '',
	`content` varchar(500) NOT NULL,
	`is_visible` boolean NOT NULL DEFAULT true,
	`ip` varchar(64) NOT NULL DEFAULT '',
	`user_agent` varchar(255) NOT NULL DEFAULT '',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guestbook_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `link_stats` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`link_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned,
	`date` varchar(10) NOT NULL,
	`count` int NOT NULL DEFAULT 1,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `link_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_link_stats` UNIQUE(`link_id`,`user_id`,`date`)
);
--> statement-breakpoint
CREATE TABLE `links` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`category_id` bigint unsigned,
	`title` varchar(100) NOT NULL,
	`url` varchar(500) NOT NULL,
	`description` varchar(255) NOT NULL DEFAULT '',
	`icon_url` varchar(500) NOT NULL DEFAULT '',
	`is_active` boolean NOT NULL DEFAULT true,
	`is_recommended` boolean NOT NULL DEFAULT false,
	`sort` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `links_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_links_url` UNIQUE(`url`)
);
--> statement-breakpoint
CREATE TABLE `search_categories` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`sort` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `search_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `search_engines` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`category_id` bigint unsigned,
	`name` varchar(50) NOT NULL,
	`url` varchar(500) NOT NULL,
	`icon_url` varchar(500) NOT NULL DEFAULT '',
	`sort` int NOT NULL DEFAULT 0,
	`is_default` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `search_engines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `search_stats` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`engine_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned,
	`date` varchar(10) NOT NULL,
	`count` int NOT NULL DEFAULT 1,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `search_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_search_stats` UNIQUE(`engine_id`,`user_id`,`date`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(120) NOT NULL,
	`url` varchar(500) NOT NULL,
	`description` varchar(255) NOT NULL DEFAULT '',
	`contact` varchar(120) NOT NULL DEFAULT '',
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`is_included` boolean NOT NULL DEFAULT false,
	`handled_by` bigint unsigned,
	`handled_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_sessions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`token` varchar(128) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_user_sessions_token` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`username` varchar(50) NOT NULL,
	`password_salt` varchar(64) NOT NULL,
	`password_hash` varchar(128) NOT NULL,
	`role` varchar(20) NOT NULL DEFAULT 'user',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_users_username` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `admin_sessions` ADD CONSTRAINT `admin_sessions_admin_user_id_admin_users_id_fk` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_categories_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `guestbook_messages` ADD CONSTRAINT `guestbook_messages_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `link_stats` ADD CONSTRAINT `link_stats_link_id_links_id_fk` FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `link_stats` ADD CONSTRAINT `link_stats_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `links` ADD CONSTRAINT `links_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `search_engines` ADD CONSTRAINT `search_engines_category_id_search_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `search_categories`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `search_stats` ADD CONSTRAINT `search_stats_engine_id_search_engines_id_fk` FOREIGN KEY (`engine_id`) REFERENCES `search_engines`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `search_stats` ADD CONSTRAINT `search_stats_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_handled_by_admin_users_id_fk` FOREIGN KEY (`handled_by`) REFERENCES `admin_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `idx_admin_sessions_user` ON `admin_sessions` (`admin_user_id`);--> statement-breakpoint
CREATE INDEX `idx_admin_sessions_expires` ON `admin_sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `idx_ads_sort` ON `ads` (`sort`);--> statement-breakpoint
CREATE INDEX `idx_ads_active` ON `ads` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_guestbook_visible` ON `guestbook_messages` (`is_visible`);--> statement-breakpoint
CREATE INDEX `idx_guestbook_created` ON `guestbook_messages` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_guestbook_user` ON `guestbook_messages` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_link_stats_date` ON `link_stats` (`date`);--> statement-breakpoint
CREATE INDEX `idx_links_category` ON `links` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_search_engines_category` ON `search_engines` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_search_stats_date` ON `search_stats` (`date`);--> statement-breakpoint
CREATE INDEX `idx_submissions_url` ON `submissions` (`url`);--> statement-breakpoint
CREATE INDEX `idx_submissions_status` ON `submissions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_submissions_included` ON `submissions` (`is_included`);--> statement-breakpoint
CREATE INDEX `idx_submissions_created` ON `submissions` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_user_sessions_user` ON `user_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_sessions_expires` ON `user_sessions` (`expires_at`);