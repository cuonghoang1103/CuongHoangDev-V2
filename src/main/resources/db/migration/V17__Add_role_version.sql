-- V17: Add role_version column to users table
-- This column tracks the number of times a user's roles have been changed.
-- NextAuth uses it to detect stale sessions and refresh the role from the DB.

ALTER TABLE users ADD COLUMN IF NOT EXISTS role_version BIGINT NOT NULL DEFAULT 0;
