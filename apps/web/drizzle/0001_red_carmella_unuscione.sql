ALTER TABLE `admin_users` MODIFY COLUMN `is_active` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `guestbook_messages` MODIFY COLUMN `is_visible` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `links` MODIFY COLUMN `is_active` boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE `links` MODIFY COLUMN `is_recommended` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `links` MODIFY COLUMN `is_recommended` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `is_active` boolean NOT NULL DEFAULT true;