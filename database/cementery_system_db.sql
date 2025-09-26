-- phpMyAdmin SQL Dump
-- version 5.1.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 20, 2025 at 03:42 AM
-- Server version: 10.4.24-MariaDB
-- PHP Version: 7.4.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cementery_system_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `tbl_burial_records`
--

CREATE TABLE `tbl_burial_records` (
  `id` int(10) UNSIGNED NOT NULL,
  `deceased_name` varchar(150) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `date_of_death` date NOT NULL,
  `burial_date` date NOT NULL,
  `grave_number` varchar(50) NOT NULL,
  `cemetery_id` int(10) UNSIGNED NOT NULL,
  `next_of_kin` varchar(150) DEFAULT NULL,
  `contact_info` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `tbl_burial_records`
--

INSERT INTO `tbl_burial_records` (`id`, `deceased_name`, `date_of_birth`, `date_of_death`, `burial_date`, `grave_number`, `cemetery_id`, `next_of_kin`, `contact_info`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'Maria Dela Cruz', '1945-02-14', '2023-09-15', '2023-09-20', 'A-101', 1, 'Juan Dela Cruz', '09171234567', 'Beloved mother and teacher.', '2025-09-20 01:14:53', '2025-09-20 01:14:53'),
(2, 'Pedro Santos', '1958-06-10', '2022-11-08', '2022-11-12', 'B-202', 1, 'Ana Santos', '09179876543', 'Veteran and community volunteer.', '2025-09-20 01:14:53', '2025-09-20 01:14:53'),
(3, 'Rosa Mendoza', '1970-12-25', '2021-05-05', '2021-05-10', 'C-303', 2, 'Carlos Mendoza', '09283456712', 'Loving sister and aunt.', '2025-09-20 01:14:53', '2025-09-20 01:14:53'),
(4, 'Jose Ramirez', '1939-03-03', '2020-01-20', '2020-01-25', 'D-404', 2, 'Maria Ramirez', '09182345678', 'Cherished grandfather.', '2025-09-20 01:14:53', '2025-09-20 01:14:53'),
(5, 'Elena Villanueva', '1985-09-30', '2024-07-02', '2024-07-06', 'E-505', 3, 'Luis Villanueva', '09391239876', 'Always remembered for her kindness.', '2025-09-20 01:14:53', '2025-09-20 01:14:53');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_grave_plots`
--

CREATE TABLE `tbl_grave_plots` (
  `id` int(10) UNSIGNED NOT NULL,
  `cemetery_id` int(10) UNSIGNED NOT NULL,
  `grave_number` varchar(50) NOT NULL,
  `boundary` polygon NOT NULL,
  `status` enum('available','occupied','reserved') DEFAULT 'available',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `tbl_grave_plots`
--

INSERT INTO `tbl_grave_plots` (`id`, `cemetery_id`, `grave_number`, `boundary`, `status`, `notes`, `created_at`) VALUES
(1, 1, 'A-101', 0x00000000010300000001000000050000006dc5feb27bd25e400bb5a679c7e925401ff46c567dd25e400bb5a679c7e925401ff46c567dd25e40992a1895d4e925406dc5feb27bd25e40992a1895d4e925406dc5feb27bd25e400bb5a679c7e92540, 'occupied', 'Belongs to Maria Dela Cruz', '2025-09-20 01:21:45');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_place_cemeteries`
--

CREATE TABLE `tbl_place_cemeteries` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `tbl_place_cemeteries`
--

INSERT INTO `tbl_place_cemeteries` (`id`, `name`, `description`, `latitude`, `longitude`, `photo_path`, `created_at`) VALUES
(1, 'Cementery 1', 'sa,[;e', '10.8874592', '123.4215742', 'uploads/Oasis_1757924149_df8f349e.png', '2025-09-15 08:15:49');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_roads`
--

CREATE TABLE `tbl_roads` (
  `id` int(10) UNSIGNED NOT NULL,
  `road_name` varchar(255) NOT NULL,
  `coordinates` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`coordinates`)),
  `geometry_type` enum('polyline','polygon') NOT NULL DEFAULT 'polyline',
  `cemetery_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `tbl_roads`
--

INSERT INTO `tbl_roads` (`id`, `road_name`, `coordinates`, `geometry_type`, `cemetery_id`, `created_at`) VALUES
(8, 'road 1', '[[10.888046584894381,123.42122822999956],[10.887496094213684,123.42094123363496],[10.887127343906442,123.42160105705263],[10.886906093502992,123.42205435037614]]', 'polyline', 1, '2025-09-15 08:50:01'),
(9, 'road 2', '[[10.886911361371656,123.42205971479419],[10.887098370648673,123.42220187187196],[10.887367031658064,123.42169761657716],[10.88724060297794,123.42162519693376]]', 'polyline', 1, '2025-09-15 08:50:17'),
(10, 'road 3', '[[10.887372299518573,123.42169493436816],[10.887564576363335,123.42183440923692],[10.88732225483999,123.42224210500719]]', 'polyline', 1, '2025-09-15 08:53:22'),
(11, 'Road 4', '[[10.887496094213684,123.42176735401155],[10.887733147741576,123.42132210731508],[10.887914888651869,123.42146694660188],[10.88798337070525,123.42130869627002],[10.88769627276074,123.42113167047503],[10.887588281719172,123.42106997966768],[10.887543504934355,123.42118799686433],[10.887406540609598,123.42110216617586]]', 'polyline', 1, '2025-09-15 08:53:49'),
(12, 'road 5', '[[10.88791496365244,123.42146694660188],[10.887701682374855,123.4218317270279],[10.887325148388541,123.4222447872162],[10.887109233580283,123.42219650745393]]', 'polyline', 1, '2025-09-19 08:23:04'),
(13, 'road 6', '[[10.887618649984661,123.4215420484543],[10.887800334096214,123.42166140675546]]', 'polyline', 1, '2025-09-19 08:57:38');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_users`
--

CREATE TABLE `tbl_users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('staff','admin') DEFAULT 'staff',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `tbl_users`
--

INSERT INTO `tbl_users` (`id`, `username`, `email`, `password_hash`, `role`, `created_at`) VALUES
(4, 'test123', 'test123@gmail.com', '$2y$10$9mz5Pe1aDIpANuIoq.SGzeIA3NdRgCNlD3dH38gkF6fBECVVNMbPm', 'staff', '2025-09-13 04:55:19'),
(5, 'admin123', 'admin001@gmail.com', '$2y$10$jQoAGluBLCSA6YBDMykaHejI.e.1YUVToxk8dwqdLw74Gst.H3OQi', 'admin', '2025-09-13 05:00:55');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_burial_records`
--
ALTER TABLE `tbl_burial_records`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_grave_plots`
--
ALTER TABLE `tbl_grave_plots`
  ADD PRIMARY KEY (`id`),
  ADD SPATIAL KEY `boundary` (`boundary`),
  ADD KEY `fk_graveplots_cemetery` (`cemetery_id`);

--
-- Indexes for table `tbl_place_cemeteries`
--
ALTER TABLE `tbl_place_cemeteries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cemeteries_lat_lng` (`latitude`,`longitude`);

--
-- Indexes for table `tbl_roads`
--
ALTER TABLE `tbl_roads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_roads_cemetery` (`cemetery_id`);

--
-- Indexes for table `tbl_users`
--
ALTER TABLE `tbl_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_burial_records`
--
ALTER TABLE `tbl_burial_records`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tbl_grave_plots`
--
ALTER TABLE `tbl_grave_plots`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbl_place_cemeteries`
--
ALTER TABLE `tbl_place_cemeteries`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbl_roads`
--
ALTER TABLE `tbl_roads`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `tbl_users`
--
ALTER TABLE `tbl_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tbl_grave_plots`
--
ALTER TABLE `tbl_grave_plots`
  ADD CONSTRAINT `fk_graveplots_cemetery` FOREIGN KEY (`cemetery_id`) REFERENCES `tbl_cemeteries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_roads`
--
ALTER TABLE `tbl_roads`
  ADD CONSTRAINT `fk_roads_cemetery` FOREIGN KEY (`cemetery_id`) REFERENCES `tbl_cemeteries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
