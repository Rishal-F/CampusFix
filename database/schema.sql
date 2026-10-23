
CREATE DATABASE IF NOT EXISTS campusfix
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campusfix;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS issues (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reporter_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(80) NOT NULL,
  location VARCHAR(180) NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent')
    NOT NULL DEFAULT 'medium',
  status ENUM(
    'reported',
    'assigned',
    'in_progress',
    'resolved',
    'closed'
  ) NOT NULL DEFAULT 'reported',
  assigned_to BIGINT UNSIGNED NULL,
  image_key VARCHAR(1024) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_issues_reporter (reporter_id),
  KEY idx_issues_status (status),
  KEY idx_issues_assigned_to (assigned_to),
  KEY idx_issues_created_at (created_at),
  CONSTRAINT fk_issues_reporter
    FOREIGN KEY (reporter_id) REFERENCES users(id),
  CONSTRAINT fk_issues_assigned_to
    FOREIGN KEY (assigned_to) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS issue_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  issue_id BIGINT UNSIGNED NOT NULL,
  changed_by BIGINT UNSIGNED NOT NULL,
  old_status VARCHAR(30) NULL,
  new_status VARCHAR(30) NOT NULL,
  note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_history_issue_created (issue_id, created_at),
  CONSTRAINT fk_history_issue
    FOREIGN KEY (issue_id) REFERENCES issues(id),
  CONSTRAINT fk_history_user
    FOREIGN KEY (changed_by) REFERENCES users(id)
) ENGINE=InnoDB;
