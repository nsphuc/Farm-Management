-- ==============================================================================
-- FARM SAAS PLATFORM - DATABASE MIGRATION V1.2
-- Migration File: V1_2__create_refresh_tokens.sql
-- Database Engine: MySQL 8.x (InnoDB)
-- Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Target: Quản lý Refresh Token an toàn trong Cơ sở dữ liệu (DEC-05 / D-12)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP NULL,
    replaced_by_token VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_ip VARCHAR(50) NULL,
    user_agent VARCHAR(500) NULL,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_refresh_tokens_user (user_id),
    INDEX idx_refresh_tokens_token (token),
    INDEX idx_refresh_tokens_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
