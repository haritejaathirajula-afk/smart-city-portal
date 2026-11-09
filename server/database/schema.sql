-- =============================================================================
-- SMART CITY SERVICE PORTAL - RELATIONAL DATABASE SCHEMA (MySQL 8)
-- Version: 2.0.0 (Phase 2 - 16 Normalized Relational Tables)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `smart_city_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `smart_city_db`;

-- Safe table reset for clean migrations and re-initialization
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `feedback`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `emergency_alerts`;
DROP TABLE IF EXISTS `announcements`;
DROP TABLE IF EXISTS `service_requests`;
DROP TABLE IF EXISTS `service_categories`;
DROP TABLE IF EXISTS `tasks`;
DROP TABLE IF EXISTS `complaint_status_history`;
DROP TABLE IF EXISTS `complaints`;
DROP TABLE IF EXISTS `complaint_categories`;
DROP TABLE IF EXISTS `field_workers`;
DROP TABLE IF EXISTS `officers`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `roles`;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. ROLES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. DEPARTMENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `contact_email` VARCHAR(120) NULL,
  `contact_phone` VARCHAR(20) NULL,
  `head_officer_name` VARCHAR(100) NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. USERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NULL,
  `address` VARCHAR(255) NULL,
  `ward_no` VARCHAR(20) NULL,
  `avatar_url` VARCHAR(255) NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role_id`),
  INDEX `idx_users_email` (`email`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. OFFICERS TABLE (Extended profile for municipal officers)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `officers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `department_id` INT NOT NULL,
  `badge_number` VARCHAR(50) NOT NULL UNIQUE,
  `designation` VARCHAR(100) NOT NULL,
  `office_location` VARCHAR(150) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_officers_department` (`department_id`),
  CONSTRAINT `fk_officers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_officers_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. FIELD WORKERS TABLE (Workers assigned to physical execution)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `field_workers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `department_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `skills` VARCHAR(255) NULL,
  `ward_assigned` VARCHAR(20) NULL,
  `is_available` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_workers_dept` (`department_id`),
  CONSTRAINT `fk_workers_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. COMPLAINT CATEGORIES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `complaint_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `department_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `sla_hours` INT NOT NULL DEFAULT 48,
  `default_priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY') DEFAULT 'MEDIUM',
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_categories_dept` (`department_id`),
  CONSTRAINT `fk_categories_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. COMPLAINTS TABLE (Includes REJECTED and rejection_reason)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `complaints` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tracking_code` VARCHAR(50) NOT NULL UNIQUE,
  `citizen_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `department_id` INT NOT NULL,
  `assigned_officer_id` INT NULL,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `location_address` VARCHAR(255) NOT NULL,
  `latitude` DECIMAL(10, 8) NULL,
  `longitude` DECIMAL(11, 8) NULL,
  `ward_no` VARCHAR(20) NULL,
  `photo_url` VARCHAR(255) NULL,
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY') NOT NULL DEFAULT 'MEDIUM',
  `status` ENUM('REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'CLOSED', 'REOPENED', 'REJECTED') NOT NULL DEFAULT 'REPORTED',
  `rejection_reason` TEXT NULL,
  `resolved_at` DATETIME NULL,
  `closed_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_complaints_tracking` (`tracking_code`),
  INDEX `idx_complaints_status` (`status`),
  INDEX `idx_complaints_citizen` (`citizen_id`),
  INDEX `idx_complaints_dept` (`department_id`),
  INDEX `idx_complaints_officer` (`assigned_officer_id`),
  INDEX `idx_complaints_priority` (`priority`),
  INDEX `idx_complaints_coords` (`latitude`, `longitude`),
  INDEX `idx_complaints_created` (`created_at`),
  CONSTRAINT `fk_complaints_citizen` FOREIGN KEY (`citizen_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_complaints_category` FOREIGN KEY (`category_id`) REFERENCES `complaint_categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_complaints_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_complaints_officer` FOREIGN KEY (`assigned_officer_id`) REFERENCES `officers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. COMPLAINT STATUS HISTORY TABLE (Immutable audit trail of transitions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `complaint_status_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` INT NOT NULL,
  `previous_status` ENUM('REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'CLOSED', 'REOPENED', 'REJECTED') NULL,
  `new_status` ENUM('REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'CLOSED', 'REOPENED', 'REJECTED') NOT NULL,
  `changed_by_user_id` INT NOT NULL,
  `remarks` TEXT NULL,
  `photo_proof_url` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_history_complaint` (`complaint_id`),
  INDEX `idx_history_created` (`created_at`),
  CONSTRAINT `fk_history_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_history_user` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. TASKS TABLE (Tasks assigned to field workers by municipal officers)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` INT NOT NULL,
  `field_worker_id` INT NOT NULL,
  `assigned_by_officer_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  `due_date` DATE NULL,
  `completed_at` DATETIME NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_tasks_complaint` (`complaint_id`),
  INDEX `idx_tasks_worker` (`field_worker_id`),
  INDEX `idx_tasks_status` (`status`),
  CONSTRAINT `fk_tasks_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tasks_worker` FOREIGN KEY (`field_worker_id`) REFERENCES `field_workers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_tasks_officer` FOREIGN KEY (`assigned_by_officer_id`) REFERENCES `officers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. SERVICE CATEGORIES TABLE (Municipal Services Catalog)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `service_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `department_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `estimated_days` INT NOT NULL DEFAULT 5,
  `fee` DECIMAL(10, 2) DEFAULT 0.00,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_service_cat_dept` (`department_id`),
  CONSTRAINT `fk_service_cat_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. SERVICE REQUESTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `service_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `request_code` VARCHAR(50) NOT NULL UNIQUE,
  `citizen_id` INT NOT NULL,
  `service_category_id` INT NOT NULL,
  `department_id` INT NOT NULL,
  `assigned_officer_id` INT NULL,
  `details` TEXT NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `ward_no` VARCHAR(20) NULL,
  `preferred_slot` VARCHAR(50) NULL,
  `status` ENUM('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED') DEFAULT 'SUBMITTED',
  `resolution_notes` TEXT NULL,
  `completed_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_service_requests_code` (`request_code`),
  INDEX `idx_service_requests_status` (`status`),
  INDEX `idx_service_requests_citizen` (`citizen_id`),
  CONSTRAINT `fk_service_req_citizen` FOREIGN KEY (`citizen_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_service_req_category` FOREIGN KEY (`service_category_id`) REFERENCES `service_categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_service_req_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_service_req_officer` FOREIGN KEY (`assigned_officer_id`) REFERENCES `officers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. ANNOUNCEMENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `author_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `content` TEXT NOT NULL,
  `category` VARCHAR(50) DEFAULT 'GENERAL',
  `is_published` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_announcements_published` (`is_published`),
  CONSTRAINT `fk_announcements_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 13. EMERGENCY ALERTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `emergency_alerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `author_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `severity` ENUM('INFO', 'WARNING', 'CRITICAL', 'DISASTER') NOT NULL DEFAULT 'WARNING',
  `target_ward` VARCHAR(50) DEFAULT 'ALL',
  `message` TEXT NOT NULL,
  `action_instructions` TEXT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `expires_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_alerts_active` (`is_active`),
  INDEX `idx_alerts_severity` (`severity`),
  CONSTRAINT `fk_alerts_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 14. NOTIFICATIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('INFO', 'SUCCESS', 'WARNING', 'ALERT') DEFAULT 'INFO',
  `entity_type` VARCHAR(50) NULL,
  `entity_id` INT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notifications_user` (`user_id`, `is_read`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 15. FEEDBACK TABLE (Post-resolution ratings and citizen reviews)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `feedback` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` INT NOT NULL UNIQUE,
  `citizen_id` INT NOT NULL,
  `rating` TINYINT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `comments` TEXT NULL,
  `satisfaction_level` ENUM('POOR', 'AVERAGE', 'GOOD', 'EXCELLENT') DEFAULT 'GOOD',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_feedback_complaint` (`complaint_id`),
  INDEX `idx_feedback_rating` (`rating`),
  CONSTRAINT `fk_feedback_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_feedback_citizen` FOREIGN KEY (`citizen_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 16. AUDIT LOGS TABLE (Comprehensive administrative and security audit)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` INT NULL,
  `details` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_entity` (`entity_type`, `entity_id`),
  INDEX `idx_audit_user` (`user_id`),
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_created` (`created_at`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
