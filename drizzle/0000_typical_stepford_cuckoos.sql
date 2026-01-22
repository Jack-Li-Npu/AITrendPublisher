-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(255),
	`value` varchar(255),
	CONSTRAINT `config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` varchar(255),
	`identifier` varchar(255),
	CONSTRAINT `data_sources_id` PRIMARY KEY(`id`)
);

*/