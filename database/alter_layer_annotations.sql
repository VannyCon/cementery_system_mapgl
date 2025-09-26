-- ALTER TABLE statements to add layer management columns to existing tbl_layer_annotations

-- Add the three new columns to tbl_layer_annotations table
ALTER TABLE `tbl_layer_annotations` 
ADD COLUMN `is_visible` tinyint(1) DEFAULT 1 AFTER `notes`,
ADD COLUMN `is_active` tinyint(1) DEFAULT 1 AFTER `is_visible`,
ADD COLUMN `sort_order` int(11) DEFAULT 0 AFTER `is_active`;
