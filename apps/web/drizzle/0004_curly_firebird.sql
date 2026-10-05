CREATE TABLE `share_resources` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(100) NOT NULL,
	`type` varchar(20) NOT NULL DEFAULT 'url',
	`url` varchar(500) NOT NULL,
	`file_name` varchar(255) NOT NULL DEFAULT '',
	`file_size` bigint unsigned NOT NULL DEFAULT 0,
	`description` varchar(500) NOT NULL DEFAULT '',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `share_resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_share_resources_created` ON `share_resources` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_share_resources_type` ON `share_resources` (`type`);