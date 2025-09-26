-- Layer System Migration for Cemetery Management
-- Run this SQL to add layer functionality to your existing database

-- 1. Create annotation layers table
CREATE TABLE `tbl_annotation_layers` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(20) DEFAULT '#FF0000',
  `icon` varchar(50) DEFAULT NULL,
  `is_visible` tinyint(1) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Add layer_id column to existing annotations table
ALTER TABLE `tbl_layer_annotations` 
ADD COLUMN `layer_id` int(10) UNSIGNED DEFAULT NULL AFTER `id`,
ADD KEY `fk_annotation_layer` (`layer_id`);

-- 3. Add foreign key constraint
ALTER TABLE `tbl_layer_annotations` 
ADD CONSTRAINT `fk_annotation_layer` 
FOREIGN KEY (`layer_id`) REFERENCES `tbl_annotation_layers` (`id`) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Insert default layers
INSERT INTO `tbl_annotation_layers` (`name`, `description`, `color`, `icon`, `sort_order`) VALUES
('General', 'General purpose annotations', '#FF0000', 'fas fa-map-marker-alt', 1),
('Graves', 'Grave plot annotations', '#8B4513', 'fas fa-cross', 2),
('Infrastructure', 'Infrastructure and utilities', '#4682B4', 'fas fa-tools', 3),
('Landmarks', 'Important landmarks and monuments', '#32CD32', 'fas fa-monument', 4),
('Maintenance', 'Maintenance areas and notes', '#FFA500', 'fas fa-wrench', 5);

-- 5. Update existing annotations to belong to 'General' layer
UPDATE `tbl_layer_annotations` 
SET `layer_id` = (SELECT id FROM `tbl_annotation_layers` WHERE name = 'General' LIMIT 1)
WHERE `layer_id` IS NULL;

-- 6. Create layer visibility preferences table (for user-specific layer visibility)
CREATE TABLE `tbl_layer_visibility_preferences` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `layer_id` int(10) UNSIGNED NOT NULL,
  `is_visible` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_layer_unique` (`user_id`, `layer_id`),
  KEY `fk_visibility_user` (`user_id`),
  KEY `fk_visibility_layer` (`layer_id`),
  CONSTRAINT `fk_visibility_user` FOREIGN KEY (`user_id`) REFERENCES `tbl_users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_visibility_layer` FOREIGN KEY (`layer_id`) REFERENCES `tbl_annotation_layers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
