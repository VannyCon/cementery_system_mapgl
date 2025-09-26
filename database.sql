-- Database: cemetery_locator

CREATE DATABASE IF NOT EXISTS `cemetery_locator` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cemetery_locator`;

-- Cemeteries table
CREATE TABLE IF NOT EXISTS `cemeteries` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `latitude` DECIMAL(10,7) NOT NULL,
  `longitude` DECIMAL(10,7) NOT NULL,
  `photo_path` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_cemeteries_lat_lng` (`latitude`, `longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Roads table
CREATE TABLE IF NOT EXISTS `roads` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `road_name` VARCHAR(255) NOT NULL,
  `coordinates` JSON NOT NULL,
  `geometry_type` ENUM('polyline','polygon') NOT NULL DEFAULT 'polyline',
  `cemetery_id` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_roads_cemetery_id` (`cemetery_id`),
  CONSTRAINT `fk_roads_cemetery` FOREIGN KEY (`cemetery_id`) REFERENCES `cemeteries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


