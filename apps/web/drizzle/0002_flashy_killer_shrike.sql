CREATE TABLE `ad_configs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`display_count` int NOT NULL DEFAULT 2,
	`is_random` boolean NOT NULL DEFAULT false,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ad_configs_id` PRIMARY KEY(`id`)
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
ALTER TABLE `categories` ADD `parent_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `guestbook_messages` ADD `user_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `submissions` ADD `is_included` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `link_stats` ADD CONSTRAINT `link_stats_link_id_links_id_fk` FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `link_stats` ADD CONSTRAINT `link_stats_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `search_engines` ADD CONSTRAINT `search_engines_category_id_search_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `search_categories`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `search_stats` ADD CONSTRAINT `search_stats_engine_id_search_engines_id_fk` FOREIGN KEY (`engine_id`) REFERENCES `search_engines`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `search_stats` ADD CONSTRAINT `search_stats_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `idx_ads_sort` ON `ads` (`sort`);--> statement-breakpoint
CREATE INDEX `idx_ads_active` ON `ads` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_link_stats_date` ON `link_stats` (`date`);--> statement-breakpoint
CREATE INDEX `idx_search_engines_category` ON `search_engines` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_search_stats_date` ON `search_stats` (`date`);--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_categories_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `guestbook_messages` ADD CONSTRAINT `guestbook_messages_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `idx_guestbook_user` ON `guestbook_messages` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_submissions_included` ON `submissions` (`is_included`);