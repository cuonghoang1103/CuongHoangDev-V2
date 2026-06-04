-- ============================================================
-- Migration: V22__Add_shop_is_hot_is_new.sql
-- Adds is_hot and is_new columns for shop product badges
-- ============================================================
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS is_hot BOOLEAN DEFAULT FALSE NOT NULL,
    ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT FALSE NOT NULL;

COMMENT ON COLUMN products.is_hot IS 'Shows orange Hot badge on product cards';
COMMENT ON COLUMN products.is_new IS 'Shows cyan New badge on product cards';
