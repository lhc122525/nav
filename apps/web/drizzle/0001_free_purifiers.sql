ALTER TABLE `users` ADD `user_alias` varchar(40);
UPDATE `users` SET `user_alias` = `username` WHERE `user_alias` IS NULL OR `user_alias` = '';
ALTER TABLE `users` MODIFY `user_alias` varchar(40) NOT NULL;