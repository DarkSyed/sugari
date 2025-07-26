CREATE TABLE `cgm_readings` (
	`id` text PRIMARY KEY NOT NULL,
	`glucose_lvl` real NOT NULL,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`sensor_id` text,
	`notes` text
);
